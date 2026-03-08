// src/services/deadManSwitchService.ts
import { supabase } from './supabase';
import { emailService } from './emailService';
import { format, addDays } from 'date-fns';

export type SwitchStatus = 'active' | 'triggered' | 'released' | 'paused';
export type VerificationMethod = 'email' | 'sms' | 'both';

// ── These MUST match your dead_man_switch_logs.event_type DB constraint exactly ──
// If your DB uses a different set, update both here and in the DB.
export type LogEventType =
  | 'check_in'
  | 'verification_sent'
  | 'triggered'
  | 'released'
  | 'cancelled'
  | 'updated';

export interface DeadManSwitch {
  id: string;
  user_id: string;
  is_enabled: boolean;
  inactivity_period: number;
  grace_period: number;
  verification_methods: VerificationMethod[];
  secondary_contact: string | null;
  last_check_in: string;
  status: SwitchStatus;
  triggered_at: string | null;
  release_scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SwitchLog {
  id: string;
  switch_id: string;
  event_type: LogEventType;
  details: Record<string, unknown>;
  created_at: string;
}

export interface UpdateSwitchDTO {
  is_enabled?: boolean;
  inactivity_period?: number;
  grace_period?: number;
  verification_methods?: VerificationMethod[];
  secondary_contact?: string | null;
}

// ── Profile helper ─────────────────────────────────────────────────────────────

async function getUserProfile(userId: string): Promise<{ email: string; name: string } | null> {
  try {
    // Try profiles table first
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .maybeSingle();

    if (profile?.email) {
      return {
        email: profile.email,
        name: profile.full_name || profile.email,
      };
    }

    // Fallback: read from auth session (always works for current user)
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (user?.email) {
      return {
        email: user.email,
        name: (user.user_metadata?.full_name as string) || user.email,
      };
    }
  } catch (err) {
    console.error('[DMS] getUserProfile error:', err);
  }
  return null;
}

// ── Service ────────────────────────────────────────────────────────────────────

export class DeadManSwitchService {
  private userId: string | null = null;

  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.ensureSwitchExists();
    // Non-blocking inactivity check
    this.checkAndSendInactivityWarning().catch((err) =>
      console.error('[DMS] inactivity warning check failed:', err)
    );
  }

  // ── Auto-create row ────────────────────────────────────────────────────────

  private async ensureSwitchExists(): Promise<void> {
    if (!this.userId) return;

    const { data, error } = await supabase
      .from('dead_man_switches')
      .select('id')
      .eq('user_id', this.userId)
      .maybeSingle();

    if (error) {
      console.error('[DMS] ensureSwitchExists select error:', error);
      return;
    }

    if (!data) {
      console.log('[DMS] No switch row found — creating default.');
      const { error: insertError } = await supabase
        .from('dead_man_switches')
        .insert({
          user_id: this.userId,
          is_enabled: true,
          inactivity_period: 90,
          grace_period: 14,
          verification_methods: ['email'],
          secondary_contact: null,
          last_check_in: new Date().toISOString(),
          status: 'active',
          triggered_at: null,
          release_scheduled_at: null,
        });

      if (insertError) {
        console.error('[DMS] Failed to create default switch row:', insertError);
      } else {
        console.log('[DMS] Default switch row created.');
      }
    }
  }

  // ── Reads ──────────────────────────────────────────────────────────────────

  async getSwitch(): Promise<DeadManSwitch> {
    if (!this.userId) throw new Error('DeadManSwitchService not initialized');

    const { data, error } = await supabase
      .from('dead_man_switches')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    if (error) {
      console.error('[DMS] getSwitch error:', error);
      throw error;
    }
    return data;
  }

  async getLogs(limit = 20): Promise<SwitchLog[]> {
    if (!this.userId) throw new Error('DeadManSwitchService not initialized');

    const sw = await this.getSwitch();

    const { data, error } = await supabase
      .from('dead_man_switch_logs')
      .select('*')
      .eq('switch_id', sw.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[DMS] getLogs error:', error);
      throw error;
    }
    return (data ?? []) as SwitchLog[];
  }

  async getDaysUntilNextCheckIn(): Promise<number | null> {
    const sw = await this.getSwitch();
    if (!sw.is_enabled || sw.status !== 'active') return null;

    const nextCheckIn = addDays(new Date(sw.last_check_in), sw.inactivity_period);
    const diffDays = Math.ceil((nextCheckIn.getTime() - Date.now()) / 86_400_000);
    return diffDays > 0 ? diffDays : 0;
  }

  async isInGracePeriod(): Promise<boolean> {
    const sw = await this.getSwitch();
    if (!sw.triggered_at) return false;
    return new Date() < addDays(new Date(sw.triggered_at), sw.grace_period);
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async checkIn(): Promise<void> {
    if (!this.userId) throw new Error('DeadManSwitchService not initialized');

    const sw = await this.getSwitch();
    const now = new Date().toISOString();

    // 1. Update the switch row
    const { error: updateError } = await supabase
      .from('dead_man_switches')
      .update({
        last_check_in: now,
        status: 'active',
        triggered_at: null,
        release_scheduled_at: null,
        updated_at: now,
      })
      .eq('id', sw.id);

    if (updateError) {
      console.error('[DMS] checkIn update error:', updateError);
      throw updateError;
    }

    // 2. Write log row — AWAITED so page refresh always sees it
    await this.logEvent(sw.id, 'check_in', {
      checked_in_at: now,
      previous_last_check_in: sw.last_check_in,
    });

    // 3. Send confirmation email — fire-and-forget (don't block UI)
    this.sendCheckInEmail(sw, now).catch((err) =>
      console.error('[DMS] sendCheckInEmail error:', err)
    );
  }

  async updateSwitch(updates: UpdateSwitchDTO): Promise<DeadManSwitch> {
    if (!this.userId) throw new Error('DeadManSwitchService not initialized');

    const sw = await this.getSwitch();
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.is_enabled !== undefined)          updateData.is_enabled = updates.is_enabled;
    if (updates.inactivity_period !== undefined)   updateData.inactivity_period = updates.inactivity_period;
    if (updates.grace_period !== undefined)        updateData.grace_period = updates.grace_period;
    if (updates.verification_methods !== undefined) updateData.verification_methods = updates.verification_methods;
    if (updates.secondary_contact !== undefined)   updateData.secondary_contact = updates.secondary_contact || null;

    const { data, error } = await supabase
      .from('dead_man_switches')
      .update(updateData)
      .eq('id', sw.id)
      .select()
      .single();

    if (error) {
      console.error('[DMS] updateSwitch error:', error);
      throw error;
    }

    await this.logEvent(sw.id, 'updated', { changes: updates });
    return data;
  }

  async pauseSwitch(): Promise<void> {
    if (!this.userId) throw new Error('DeadManSwitchService not initialized');
    const sw = await this.getSwitch();
    const { error } = await supabase
      .from('dead_man_switches')
      .update({ status: 'paused', updated_at: new Date().toISOString() })
      .eq('id', sw.id);
    if (error) { console.error('[DMS] pauseSwitch error:', error); throw error; }
    await this.logEvent(sw.id, 'updated', { action: 'paused' });
  }

  async resumeSwitch(): Promise<void> {
    if (!this.userId) throw new Error('DeadManSwitchService not initialized');
    const sw = await this.getSwitch();
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('dead_man_switches')
      .update({ status: 'active', last_check_in: now, updated_at: now })
      .eq('id', sw.id);
    if (error) { console.error('[DMS] resumeSwitch error:', error); throw error; }
    await this.logEvent(sw.id, 'updated', { action: 'resumed' });
  }

  async cancelTrigger(): Promise<void> {
    if (!this.userId) throw new Error('DeadManSwitchService not initialized');
    const sw = await this.getSwitch();
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('dead_man_switches')
      .update({
        status: 'active',
        triggered_at: null,
        release_scheduled_at: null,
        last_check_in: now,
        updated_at: now,
      })
      .eq('id', sw.id);
    if (error) { console.error('[DMS] cancelTrigger error:', error); throw error; }
    await this.logEvent(sw.id, 'cancelled', { cancelled_at: now });
  }

  // ── Background polling ─────────────────────────────────────────────────────

  async checkAndReleaseAssets(): Promise<boolean> {
    if (!this.userId) return false;

    try {
      const sw = await this.getSwitch();
      if (!sw.is_enabled) return false;

      // Active but overdue → trigger
      if (sw.status === 'active') {
        const daysLeft = await this.getDaysUntilNextCheckIn();
        if (daysLeft !== null && daysLeft <= 0) {
          await this.triggerSwitch(sw);
        }
        return false;
      }

      // Triggered + grace expired → release
      if (sw.status === 'triggered' && sw.triggered_at) {
        if (new Date() >= addDays(new Date(sw.triggered_at), sw.grace_period)) {
          await this.releaseAssetsToNominees(sw);
          return true;
        }
      }
    } catch (err) {
      console.error('[DMS] checkAndReleaseAssets error:', err);
    }
    return false;
  }

  private async triggerSwitch(sw: DeadManSwitch): Promise<void> {
    const now = new Date();
    const releaseDate = addDays(now, sw.grace_period);

    const { error } = await supabase
      .from('dead_man_switches')
      .update({
        status: 'triggered',
        triggered_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', sw.id);

    if (error) { console.error('[DMS] triggerSwitch error:', error); return; }

    await this.logEvent(sw.id, 'triggered', {
      triggered_at: now.toISOString(),
      scheduled_release: releaseDate.toISOString(),
    });

    const profile = await getUserProfile(this.userId!);
    if (profile?.email) {
      emailService
        .sendGracePeriodStarted({
          to_email: profile.email,
          to_name: profile.name,
          gracePeriodDays: sw.grace_period,
          releaseDate: format(releaseDate, 'MMMM d, yyyy'),
        })
        .then(async (result) => {
          if (result.success) {
            await this.logEvent(sw.id, 'verification_sent', {
              type: 'grace_period_started',
              to: profile.email,
            });
          } else {
            console.warn('[DMS] Grace period email failed:', result.error);
          }
        })
        .catch(console.error);
    }
  }

  private async releaseAssetsToNominees(sw: DeadManSwitch): Promise<void> {
    if (!this.userId) return;

    try {
      const { data: nominees, error: nomErr } = await supabase
        .from('nominees')
        .select('id, access_level, email')
        .eq('user_id', this.userId)
        .eq('status', 'accepted');

      if (nomErr) throw nomErr;
      if (!nominees?.length) return;

      const { data: vault } = await supabase
        .from('vaults')
        .select('id')
        .eq('user_id', this.userId)
        .single();

      if (!vault) return;

      const { data: assets, error: assetErr } = await supabase
        .from('assets')
        .select('id')
        .eq('vault_id', vault.id);

      if (assetErr) throw assetErr;
      if (!assets?.length) return;

      for (const nominee of nominees) {
        for (const asset of assets) {
          const { data: existing } = await supabase
            .from('nominee_access')
            .select('id')
            .eq('nominee_id', nominee.id)
            .eq('asset_id', asset.id)
            .maybeSingle();

          if (!existing) {
            await supabase.from('nominee_access').insert({
              nominee_id: nominee.id,
              asset_id: asset.id,
              access_type: nominee.access_level === 'full' ? 'manage' : 'view',
              granted_by: this.userId,
              granted_at: new Date().toISOString(),
            });
          }
        }
      }

      await supabase
        .from('dead_man_switches')
        .update({
          status: 'released',
          release_scheduled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', sw.id);

      await this.logEvent(sw.id, 'released', {
        nominee_count: nominees.length,
        asset_count: assets.length,
        released_at: new Date().toISOString(),
      });

      const profile = await getUserProfile(this.userId);
      if (profile?.email) {
        emailService
          .sendAssetsReleased({
            to_email: profile.email,
            to_name: profile.name,
            nomineeCount: nominees.length,
          })
          .then(async (result) => {
            if (result.success) {
              await this.logEvent(sw.id, 'verification_sent', {
                type: 'assets_released',
                to: profile.email,
              });
            }
          })
          .catch(console.error);
      }
    } catch (err) {
      console.error('[DMS] releaseAssetsToNominees error:', err);
    }
  }

  // ── Email helpers ──────────────────────────────────────────────────────────

  private async sendCheckInEmail(sw: DeadManSwitch, checkedInAt: string): Promise<void> {
    const profile = await getUserProfile(this.userId!);
    if (!profile?.email) {
      console.warn('[DMS] sendCheckInEmail: no profile email found, skipping.');
      return;
    }

    const nextDue = format(
      addDays(new Date(checkedInAt), sw.inactivity_period),
      'MMMM d, yyyy'
    );

    const result = await emailService.sendCheckInConfirmation({
      to_email: profile.email,
      to_name: profile.name,
      nextCheckInDue: nextDue,
    });

    if (result.success) {
      await this.logEvent(sw.id, 'verification_sent', {
        type: 'checkin_confirmed',
        to: profile.email,
        next_check_in_due: nextDue,
      });
    } else {
      console.warn('[DMS] Check-in confirmation email failed:', result.error);
    }
  }

  private async checkAndSendInactivityWarning(): Promise<void> {
    if (!this.userId) return;

    const sw = await this.getSwitch();
    if (!sw.is_enabled || sw.status !== 'active') return;

    const daysLeft = await this.getDaysUntilNextCheckIn();
    if (daysLeft === null || daysLeft > 7) return;

    // Throttle: skip if already sent in the last 24 h
    const { data: recent } = await supabase
      .from('dead_man_switch_logs')
      .select('created_at')
      .eq('switch_id', sw.id)
      .eq('event_type', 'verification_sent')
      .filter('details->>type', 'eq', 'inactivity_warning')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recent) {
      const hoursSince =
        (Date.now() - new Date(recent.created_at).getTime()) / 3_600_000;
      if (hoursSince < 24) return;
    }

    const profile = await getUserProfile(this.userId);
    if (!profile?.email) return;

    const result = await emailService.sendInactivityWarning({
      to_email: profile.email,
      to_name: profile.name,
      daysRemaining: daysLeft,
      inactivityPeriod: sw.inactivity_period,
    });

    if (result.success) {
      await this.logEvent(sw.id, 'verification_sent', {
        type: 'inactivity_warning',
        to: profile.email,
        days_remaining: daysLeft,
      });
    }
  }

  // ── Core log writer ────────────────────────────────────────────────────────
  //
  // IMPORTANT: event_type must match your Supabase DB constraint.
  // Run this SQL if 'updated' is not in your constraint:
  //
  //   ALTER TABLE dead_man_switch_logs
  //     DROP CONSTRAINT IF EXISTS dead_man_switch_logs_event_type_check;
  //
  //   ALTER TABLE dead_man_switch_logs
  //     ADD CONSTRAINT dead_man_switch_logs_event_type_check
  //     CHECK (event_type IN (
  //       'check_in', 'verification_sent', 'triggered',
  //       'released', 'cancelled', 'updated'
  //     ));
  //
  // Also ensure RLS allows inserts for authenticated users:
  //
  //   CREATE POLICY "users_insert_own_logs" ON dead_man_switch_logs
  //     FOR INSERT WITH CHECK (
  //       EXISTS (
  //         SELECT 1 FROM dead_man_switches
  //         WHERE dead_man_switches.id = dead_man_switch_logs.switch_id
  //         AND dead_man_switches.user_id = auth.uid()
  //       )
  //     );
  //
  //   CREATE POLICY "users_select_own_logs" ON dead_man_switch_logs
  //     FOR SELECT USING (
  //       EXISTS (
  //         SELECT 1 FROM dead_man_switches
  //         WHERE dead_man_switches.id = dead_man_switch_logs.switch_id
  //         AND dead_man_switches.user_id = auth.uid()
  //       )
  //     );

  private async logEvent(
    switchId: string,
    event_type: LogEventType,
    details: Record<string, unknown>
  ): Promise<void> {
    const payload = { switch_id: switchId, event_type, details };
    console.log('[DMS] logEvent inserting:', payload);

    const { data, error } = await supabase
      .from('dead_man_switch_logs')
      .insert(payload)
      .select('id');   // selecting back confirms the row was actually written

    if (error) {
      console.error('[DMS] ❌ logEvent INSERT failed:', error.message, error.details, error.hint);
      console.error('[DMS]    payload was:', payload);
    } else {
      console.log(`[DMS] ✅ logEvent "${event_type}" written, id=${data?.[0]?.id}`);
    }
  }
}

export const deadManSwitchService = new DeadManSwitchService();