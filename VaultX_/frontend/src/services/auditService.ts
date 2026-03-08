// src/services/auditService.ts
import { supabase } from './supabase';

export type AuditEventType = 
  | 'vault_created'
  | 'vault_accessed'
  | 'asset_added'
  | 'asset_updated'
  | 'asset_deleted'
  | 'asset_decrypted'
  | 'nominee_added'
  | 'nominee_updated'
  | 'nominee_accepted'
  | 'nominee_revoked'
  | 'nominee_deleted'
  | 'access_granted'
  | 'access_revoked'
  | 'deadman_configured'
  | 'deadman_checkin'
  | 'deadman_triggered'
  | 'deadman_released'
  | 'deadman_cancelled'
  | 'deadman_paused'
  | 'deadman_resumed'
  | 'settings_updated'
  | 'login'
  | 'logout';

export interface AuditLog {
  id: string;
  user_id: string;
  event_type: AuditEventType;
  description: string;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditFilter {
  event_type?: AuditEventType[];
  start_date?: Date;
  end_date?: Date;
  search?: string;
}

export class AuditService {
  private userId: string | null = null;

  async initialize(userId: string) {
    this.userId = userId;
  }

  // Get audit logs for the current user
  async getLogs(
    page: number = 1,
    pageSize: number = 20,
    filters?: AuditFilter
  ): Promise<{ logs: AuditLog[]; total: number }> {
    if (!this.userId) throw new Error('Not initialized');

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.event_type && filters.event_type.length > 0) {
      query = query.in('event_type', filters.event_type);
    }

    if (filters?.start_date) {
      query = query.gte('created_at', filters.start_date.toISOString());
    }

    if (filters?.end_date) {
      query = query.lte('created_at', filters.end_date.toISOString());
    }

    if (filters?.search) {
      query = query.ilike('description', `%${filters.search}%`);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .range(from, to);

    if (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }

    return {
      logs: data || [],
      total: count || 0
    };
  }

  // Get logs for a specific asset
  async getAssetLogs(assetId: string): Promise<AuditLog[]> {
    if (!this.userId) throw new Error('Not initialized');

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', this.userId)
      .filter('metadata->asset_id', 'eq', assetId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get logs for a specific nominee
  async getNomineeLogs(nomineeId: string): Promise<AuditLog[]> {
    if (!this.userId) throw new Error('Not initialized');

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', this.userId)
      .filter('metadata->nominee_id', 'eq', nomineeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get logs summary statistics
  async getSummary(): Promise<{
    totalEvents: number;
    byType: Record<AuditEventType, number>;
    last7Days: number;
    last30Days: number;
  }> {
    if (!this.userId) throw new Error('Not initialized');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get all logs for stats
    const { data, error } = await supabase
      .from('audit_logs')
      .select('event_type, created_at')
      .eq('user_id', this.userId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (error) throw error;

    const byType = {} as Record<AuditEventType, number>;
    let last7Days = 0;

    data?.forEach(log => {
      // Count by type - fix the indexing issue
      const eventType = log.event_type as AuditEventType;
      byType[eventType] = (byType[eventType] || 0) + 1;

      // Count last 7 days
      const logDate = new Date(log.created_at);
      if (logDate >= sevenDaysAgo) {
        last7Days++;
      }
    });

    return {
      totalEvents: data?.length || 0,
      byType,
      last7Days,
      last30Days: data?.length || 0
    };
  }

  // Log an event (called by other services)
  async logEvent(
    event_type: AuditEventType,
    description: string,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    if (!this.userId) throw new Error('Not initialized');

    // Get IP and user agent (if available)
    const ip_address = null;
    const user_agent = typeof window !== 'undefined' ? window.navigator.userAgent : null;

    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: this.userId,
        event_type,
        description,
        metadata,
        ip_address,
        user_agent,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error logging audit event:', error);
    }
  }

  // Export logs as CSV
  async exportLogs(filters?: AuditFilter): Promise<string> {
    if (!this.userId) throw new Error('Not initialized');

    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false });

    if (filters?.event_type && filters.event_type.length > 0) {
      query = query.in('event_type', filters.event_type);
    }

    if (filters?.start_date) {
      query = query.gte('created_at', filters.start_date.toISOString());
    }

    if (filters?.end_date) {
      query = query.lte('created_at', filters.end_date.toISOString());
    }

    if (filters?.search) {
      query = query.ilike('description', `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Convert to CSV
    const headers = ['Date', 'Event Type', 'Description', 'IP Address', 'Metadata'];
    const rows = (data || []).map(log => [
      new Date(log.created_at).toLocaleString(),
      log.event_type,
      log.description,
      log.ip_address || '-',
      JSON.stringify(log.metadata)
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csv;
  }
}

export const auditService = new AuditService();