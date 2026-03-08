// src/services/settingsService.ts
import { supabase } from './supabase';
import { auditService } from './auditService';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  email_notifications: boolean;
  sms_notifications: boolean;
  login_alerts: boolean;
  nominee_alerts: boolean;
  deadman_alerts: boolean;
  marketing_emails: boolean;
}

export interface SecuritySettings {
  two_factor_enabled: boolean;
  last_password_change: string | null;
  trusted_devices: TrustedDevice[];
  session_timeout: number; // minutes
}

export interface TrustedDevice {
  id: string;
  device_name: string;
  last_used: string;
  ip_address: string;
  is_current: boolean;
}

export interface BackupSettings {
  auto_backup: boolean;
  backup_frequency: 'daily' | 'weekly' | 'monthly';
  last_backup: string | null;
  backup_location: 'cloud' | 'local' | 'both';
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  created_at: string;
  last_used: string | null;
  permissions: string[];
}

export class SettingsService {
  private userId: string | null = null;

  async initialize(userId: string) {
    this.userId = userId;
  }

  // Profile Management
  async getProfile(): Promise<UserProfile> {
    if (!this.userId) throw new Error('Not initialized');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', this.userId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    if (!this.userId) throw new Error('Not initialized');

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', this.userId)
      .select()
      .single();

    if (error) throw error;

    await auditService.logEvent(
      'settings_updated',
      'Profile information updated',
      { updates: Object.keys(updates) }
    );

    return data;
  }

  // Notification Settings
  async getNotificationSettings(): Promise<NotificationSettings> {
    if (!this.userId) throw new Error('Not initialized');

    const { data, error } = await supabase
      .from('user_settings')
      .select('notification_settings')
      .eq('user_id', this.userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No settings found, return defaults
      return {
        email_notifications: true,
        sms_notifications: false,
        login_alerts: true,
        nominee_alerts: true,
        deadman_alerts: true,
        marketing_emails: false
      };
    }

    if (error) throw error;
    return data.notification_settings;
  }

  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    if (!this.userId) throw new Error('Not initialized');

    // Check if settings exist
    const { data: existing } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', this.userId)
      .single();

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('user_settings')
        .update({
          notification_settings: settings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', this.userId)
        .select('notification_settings')
        .single();

      if (error) throw error;
      result = data.notification_settings;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('user_settings')
        .insert({
          user_id: this.userId,
          notification_settings: settings
        })
        .select('notification_settings')
        .single();

      if (error) throw error;
      result = data.notification_settings;
    }

    await auditService.logEvent(
      'settings_updated',
      'Notification settings updated',
      { settings: Object.keys(settings) }
    );

    return result;
  }

  // Security Settings
  async getSecuritySettings(): Promise<SecuritySettings> {
    if (!this.userId) throw new Error('Not initialized');

    // Get trusted devices
    const { data: devices, error: deviceError } = await supabase
      .from('trusted_devices')
      .select('*')
      .eq('user_id', this.userId)
      .order('last_used', { ascending: false });

    if (deviceError) throw deviceError;

    // Get user metadata for 2FA status
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    return {
      two_factor_enabled: userData.user?.factors?.some(f => f.status === 'verified') || false,
      last_password_change: userData.user?.updated_at || null,
      trusted_devices: devices || [],
      session_timeout: 30 // Default 30 minutes
    };
  }

  async enableTwoFactor(): Promise<{ qrCode: string; secret: string }> {
    if (!this.userId) throw new Error('Not initialized');

    // This would integrate with a 2FA service
    // For now, return mock data
    return {
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/VaultX:test?secret=JBSWY3DPEHPK3PXP&issuer=VaultX',
      secret: 'JBSWY3DPEHPK3PXP'
    };
  }

  async verifyTwoFactor(code: string): Promise<boolean> {
    if (!this.userId) throw new Error('Not initialized');

    // Verify 2FA code
    // This would validate the code
    const isValid = code.length === 6 && /^\d+$/.test(code);

    if (isValid) {
      await auditService.logEvent(
        'settings_updated',
        'Two-factor authentication enabled',
        {}
      );
    }

    return isValid;
  }

  async disableTwoFactor(): Promise<void> {
    if (!this.userId) throw new Error('Not initialized');

    await auditService.logEvent(
      'settings_updated',
      'Two-factor authentication disabled',
      {}
    );
  }

  async removeTrustedDevice(deviceId: string): Promise<void> {
    if (!this.userId) throw new Error('Not initialized');

    const { error } = await supabase
      .from('trusted_devices')
      .delete()
      .eq('id', deviceId)
      .eq('user_id', this.userId);

    if (error) throw error;

    await auditService.logEvent(
      'settings_updated',
      'Trusted device removed',
      { device_id: deviceId }
    );
  }

  // Backup Settings
  async getBackupSettings(): Promise<BackupSettings> {
    if (!this.userId) throw new Error('Not initialized');

    const { data, error } = await supabase
      .from('user_settings')
      .select('backup_settings')
      .eq('user_id', this.userId)
      .single();

    if (error && error.code === 'PGRST116') {
      return {
        auto_backup: true,
        backup_frequency: 'weekly',
        last_backup: null,
        backup_location: 'cloud'
      };
    }

    if (error) throw error;
    return data.backup_settings;
  }

  async updateBackupSettings(settings: Partial<BackupSettings>): Promise<BackupSettings> {
    if (!this.userId) throw new Error('Not initialized');

    const { data: existing } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', this.userId)
      .single();

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('user_settings')
        .update({
          backup_settings: settings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', this.userId)
        .select('backup_settings')
        .single();

      if (error) throw error;
      result = data.backup_settings;
    } else {
      const { data, error } = await supabase
        .from('user_settings')
        .insert({
          user_id: this.userId,
          backup_settings: settings
        })
        .select('backup_settings')
        .single();

      if (error) throw error;
      result = data.backup_settings;
    }

    return result;
  }

  async createBackup(): Promise<string> {
    if (!this.userId) throw new Error('Not initialized');

    // Simulate backup creation
    await new Promise(resolve => setTimeout(resolve, 2000));

    const backupId = `backup-${Date.now()}`;

    await auditService.logEvent(
      'settings_updated',
      'Manual backup created',
      { backup_id: backupId }
    );

    return backupId;
  }

  // API Keys
  async getApiKeys(): Promise<ApiKey[]> {
    if (!this.userId) throw new Error('Not initialized');

    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createApiKey(name: string, permissions: string[]): Promise<ApiKey> {
    if (!this.userId) throw new Error('Not initialized');

    const newKey = {
      user_id: this.userId,
      name,
      key: `vaultx_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      permissions,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('api_keys')
      .insert(newKey)
      .select()
      .single();

    if (error) throw error;

    await auditService.logEvent(
      'settings_updated',
      'API key created',
      { key_name: name }
    );

    return data;
  }

  async revokeApiKey(keyId: string): Promise<void> {
    if (!this.userId) throw new Error('Not initialized');

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', this.userId);

    if (error) throw error;

    await auditService.logEvent(
      'settings_updated',
      'API key revoked',
      { key_id: keyId }
    );
  }

  // Delete Account
  async deleteAccount(password: string): Promise<void> {
    if (!this.userId) throw new Error('Not initialized');

    // Verify password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: (await supabase.auth.getUser()).data.user?.email || '',
      password
    });

    if (signInError) throw new Error('Invalid password');

    // Log before deletion
    await auditService.logEvent(
      'settings_updated',
      'Account deleted',
      {}
    );

    // Delete account (this would need to be done with proper cascade)
    const { error } = await supabase.auth.admin.deleteUser(this.userId);
    if (error) throw error;
  }
}

export const settingsService = new SettingsService();