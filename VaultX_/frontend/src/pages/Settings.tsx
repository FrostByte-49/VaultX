// src/pages/Settings.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Bell,
  Shield,
  Key,
  Smartphone,
  Laptop,
  Download,
  Trash2,
  Edit,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Settings as SettingsIcon,
  Settings2,
  Camera,
  Copy,
  RefreshCw,
  Fingerprint,
  LogIn,
  Users,
  Clock,
  Plus,
  Sparkles,
  HeartPulse,
  DownloadCloud,
  MailOpen,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../services/supabase'; // Added missing import
import { settingsService, type UserProfile, type NotificationSettings, type SecuritySettings, type BackupSettings, type ApiKey } from '../services/settingsService';
import { format } from 'date-fns';

type SettingsTab = 'profile' | 'notifications' | 'security' | 'backup' | 'api' | 'advanced';

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorQR, setTwoFactorQR] = useState('');
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [newApiKeyName, setNewApiKeyName] = useState('');
  const [newApiKeyPermissions, setNewApiKeyPermissions] = useState<string[]>(['read']);
  const [newApiKey, setNewApiKey] = useState<ApiKey | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    avatar_url: ''
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true,
    sms_notifications: false,
    login_alerts: true,
    nominee_alerts: true,
    deadman_alerts: true,
    marketing_emails: false
  });

  // Security settings
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    two_factor_enabled: false,
    last_password_change: null,
    trusted_devices: [],
    session_timeout: 30
  });

  // Backup settings
  const [backupSettings, setBackupSettings] = useState<BackupSettings>({
    auto_backup: true,
    backup_frequency: 'weekly',
    last_backup: null,
    backup_location: 'cloud'
  });
  const [creatingBackup, setCreatingBackup] = useState(false);

  // API keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);

  // Load all settings
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadSettings = async () => {
      try {
        setLoading(true);
        await settingsService.initialize(user.id);

        const [
          profileData,
          notificationData,
          securityData,
          backupData,
          apiKeysData
        ] = await Promise.all([
          settingsService.getProfile(),
          settingsService.getNotificationSettings(),
          settingsService.getSecuritySettings(),
          settingsService.getBackupSettings(),
          settingsService.getApiKeys()
        ]);

        setProfile(profileData);
        setProfileForm({
          full_name: profileData.full_name || '',
          avatar_url: profileData.avatar_url || ''
        });
        setNotificationSettings(notificationData);
        setSecuritySettings(securityData);
        setBackupSettings(backupData);
        setApiKeys(apiKeysData);
      } catch (err) {
        console.error('Failed to load settings:', err);
        setError('Failed to load settings. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user, navigate]);

  // Save profile
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError('');

      const updated = await settingsService.updateProfile(profileForm);
      setProfile(updated);
      setEditingProfile(false);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Save notification settings
  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      setError('');

      const updated = await settingsService.updateNotificationSettings(notificationSettings);
      setNotificationSettings(updated);
      setSuccess('Notification settings updated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to update notifications:', err);
      setError('Failed to update notification settings');
    } finally {
      setSaving(false);
    }
  };

  // Enable 2FA
  const handleEnable2FA = async () => {
    try {
      setError('');
      const { qrCode, secret } = await settingsService.enableTwoFactor();
      setTwoFactorQR(qrCode);
      setTwoFactorSecret(secret);
      setShow2FAModal(true);
    } catch (err) {
      console.error('Failed to enable 2FA:', err);
      setError('Failed to enable two-factor authentication');
    }
  };

  // Verify 2FA
  const handleVerify2FA = async () => {
    try {
      setSaving(true);
      setError('');

      const isValid = await settingsService.verifyTwoFactor(twoFactorCode);
      if (isValid) {
        setSecuritySettings(prev => ({ ...prev, two_factor_enabled: true }));
        setShow2FAModal(false);
        setTwoFactorCode('');
        setSuccess('Two-factor authentication enabled');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Invalid verification code');
      }
    } catch (err) {
      console.error('Failed to verify 2FA:', err);
      setError('Failed to verify code');
    } finally {
      setSaving(false);
    }
  };

  // Disable 2FA
  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication?')) return;

    try {
      setSaving(true);
      setError('');

      await settingsService.disableTwoFactor();
      setSecuritySettings(prev => ({ ...prev, two_factor_enabled: false }));
      setSuccess('Two-factor authentication disabled');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to disable 2FA:', err);
      setError('Failed to disable two-factor authentication');
    } finally {
      setSaving(false);
    }
  };

  // Remove trusted device
  const handleRemoveDevice = async (deviceId: string) => {
    if (!confirm('Remove this trusted device?')) return;

    try {
      await settingsService.removeTrustedDevice(deviceId);
      setSecuritySettings(prev => ({
        ...prev,
        trusted_devices: prev.trusted_devices.filter(d => d.id !== deviceId)
      }));
      setSuccess('Device removed');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to remove device:', err);
      setError('Failed to remove device');
    }
  };

  // Save backup settings
  const handleSaveBackup = async () => {
    try {
      setSaving(true);
      setError('');

      const updated = await settingsService.updateBackupSettings(backupSettings);
      setBackupSettings(updated);
      setSuccess('Backup settings updated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to update backup settings:', err);
      setError('Failed to update backup settings');
    } finally {
      setSaving(false);
    }
  };

  // Create backup
  const handleCreateBackup = async () => {
    try {
      setCreatingBackup(true);
      setError('');

      const backupId = await settingsService.createBackup();
      setBackupSettings(prev => ({
        ...prev,
        last_backup: new Date().toISOString()
      }));
      setSuccess(`Backup created successfully (ID: ${backupId})`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Failed to create backup:', err);
      setError('Failed to create backup');
    } finally {
      setCreatingBackup(false);
    }
  };

  // Create API key
  const handleCreateApiKey = async () => {
    if (!newApiKeyName) {
      setError('API key name is required');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const key = await settingsService.createApiKey(newApiKeyName, newApiKeyPermissions);
      setNewApiKey(key);
      setNewApiKeyName('');
      setNewApiKeyPermissions(['read']);
      
      // Refresh list
      const keys = await settingsService.getApiKeys();
      setApiKeys(keys);
    } catch (err) {
      console.error('Failed to create API key:', err);
      setError('Failed to create API key');
    } finally {
      setSaving(false);
    }
  };

  // Revoke API key
  const handleRevokeApiKey = async (keyId: string) => {
    if (!confirm('Revoke this API key? This action cannot be undone.')) return;

    try {
      await settingsService.revokeApiKey(keyId);
      setApiKeys(prev => prev.filter(k => k.id !== keyId));
      setSuccess('API key revoked');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to revoke API key:', err);
      setError('Failed to revoke API key');
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password changed successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to change password:', err);
      setError('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setError('Password is required');
      return;
    }

    try {
      setSaving(true);
      setError('');

      await settingsService.deleteAccount(deletePassword);
      await signOut();
      navigate('/');
    } catch (err) {
      console.error('Failed to delete account:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setSaving(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard');
    setTimeout(() => setSuccess(''), 2000);
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'backup', label: 'Backup', icon: DownloadCloud },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'advanced', label: 'Advanced', icon: Settings2 }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-primary animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary/5 rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto mt-24 px-4 sm:px-6 lg:px-8 pb-20">

        {/* Header */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-3xl blur-2xl" />
          <div className="relative bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <SettingsIcon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground text-sm mt-1 capitalize">
                  Manage your account, security & preferences
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-500 text-sm flex-1">{error}</p>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-500">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <p className="text-emerald-500 text-sm flex-1">{success}</p>
            <button onClick={() => setSuccess('')} className="text-emerald-400 hover:text-emerald-500">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-hide">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg'
                    : 'bg-card border border-border hover:bg-accent'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Profile Information
              </h2>
              {!editingProfile ? (
                <button
                  onClick={() => setEditingProfile(true)}
                  className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-lg hover:bg-accent transition-colors text-sm"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingProfile(false);
                      setProfileForm({
                        full_name: profile?.full_name || '',
                        avatar_url: profile?.avatar_url || ''
                      });
                    }}
                    className="px-3 py-1.5 border border-border rounded-lg hover:bg-accent transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg hover:opacity-90 transition-colors text-sm disabled:opacity-50"
                  >
                    {saving ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" />Saving…</>
                    ) : (
                      <><Save className="w-4 h-4" />Save</>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                    {profile?.full_name?.[0] || profile?.email[0].toUpperCase()}
                  </div>
                  {editingProfile && (
                    <button className="absolute bottom-0 right-0 p-1.5 bg-gradient-to-r from-primary to-purple-600 rounded-full text-white hover:opacity-90 transition-colors">
                      <Camera className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="text-foreground font-medium">
                    {profile?.created_at ? format(new Date(profile.created_at), 'MMMM d, yyyy') : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Name
                </label>
                {editingProfile ? (
                  <input
                    type="text"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="text-foreground">{profile?.full_name || 'Not set'}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <p className="text-foreground">{profile?.email}</p>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full text-xs">
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notification Preferences
            </h2>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive updates via email</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.email_notifications}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, email_notifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-primary peer-checked:to-purple-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">SMS Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive text messages for alerts</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.sms_notifications}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, sms_notifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-primary peer-checked:to-purple-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <LogIn className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Login Alerts</p>
                    <p className="text-xs text-muted-foreground">Get notified of new logins</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.login_alerts}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, login_alerts: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-primary peer-checked:to-purple-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Nominee Alerts</p>
                    <p className="text-xs text-muted-foreground">Updates about nominee activity</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.nominee_alerts}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, nominee_alerts: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-primary peer-checked:to-purple-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <HeartPulse className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Dead Man Switch Alerts</p>
                    <p className="text-xs text-muted-foreground">Important switch notifications</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.deadman_alerts}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, deadman_alerts: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-primary peer-checked:to-purple-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <MailOpen className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Marketing Emails</p>
                    <p className="text-xs text-muted-foreground">Product updates and offers</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.marketing_emails}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, marketing_emails: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-primary peer-checked:to-purple-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>
            </div>

            <button
              onClick={handleSaveNotifications}
              disabled={saving}
              className="px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg hover:opacity-90 transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <><RefreshCw className="w-4 h-4 animate-spin" />Saving…</> : 'Save Changes'}
            </button>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* 2FA Section */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-primary" />
                Two-Factor Authentication
              </h2>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground font-medium">Status: {
                    securitySettings.two_factor_enabled ? (
                      <span className="text-emerald-500">Enabled</span>
                    ) : (
                      <span className="text-amber-500">Disabled</span>
                    )
                  }</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add an extra layer of security to your account
                  </p>
                </div>
                {securitySettings.two_factor_enabled ? (
                  <button
                    onClick={handleDisable2FA}
                    disabled={saving}
                    className="px-4 py-2 border border-red-500/30 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors text-sm"
                  >
                    Disable 2FA
                  </button>
                ) : (
                  <button
                    onClick={handleEnable2FA}
                    className="px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg hover:opacity-90 transition-colors text-sm"
                  >
                    Enable 2FA
                  </button>
                )}
              </div>
            </div>

            {/* Password Section */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                Password
              </h2>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-foreground">••••••••</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Last changed: {securitySettings.last_password_change 
                      ? format(new Date(securitySettings.last_password_change), 'MMMM d, yyyy')
                      : 'Never'}
                  </p>
                </div>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-sm"
                >
                  Change Password
                </button>
              </div>
            </div>

            {/* Trusted Devices */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Laptop className="w-5 h-5 text-primary" />
                Trusted Devices
              </h2>

              {securitySettings.trusted_devices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No trusted devices</p>
              ) : (
                <div className="space-y-3">
                  {securitySettings.trusted_devices.map(device => (
                    <div key={device.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Laptop className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{device.device_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Last used: {format(new Date(device.last_used), 'MMM d, yyyy')} • {device.ip_address}
                            {device.is_current && ' (Current)'}
                          </p>
                        </div>
                      </div>
                      {!device.is_current && (
                        <button
                          onClick={() => handleRemoveDevice(device.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Session Timeout */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Session Timeout
              </h2>

              <div className="flex items-center gap-4">
                <select
                  value={securitySettings.session_timeout}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, session_timeout: Number(e.target.value) })}
                  className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={240}>4 hours</option>
                  <option value={480}>8 hours</option>
                </select>
                <span className="text-sm text-muted-foreground">
                  Automatically log out after inactivity
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Backup Tab */}
        {activeTab === 'backup' && (
          <div className="space-y-6">
            {/* Backup Settings */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <DownloadCloud className="w-5 h-5 text-primary" />
                Backup Settings
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Automatic Backups</p>
                      <p className="text-xs text-muted-foreground">Regularly backup your vault</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={backupSettings.auto_backup}
                      onChange={(e) => setBackupSettings({ ...backupSettings, auto_backup: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-primary peer-checked:to-purple-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                  </label>
                </div>

                {backupSettings.auto_backup && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Backup Frequency
                      </label>
                      <select
                        value={backupSettings.backup_frequency}
                        onChange={(e) => setBackupSettings({ ...backupSettings, backup_frequency: e.target.value as 'daily' | 'weekly' | 'monthly' })}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Backup Location
                      </label>
                      <select
                        value={backupSettings.backup_location}
                        onChange={(e) => setBackupSettings({ ...backupSettings, backup_location: e.target.value as 'cloud' | 'local' | 'both' })}
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value="cloud">Cloud Storage</option>
                        <option value="local">Local Download</option>
                        <option value="both">Both</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleSaveBackup}
                disabled={saving}
                className="px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg hover:opacity-90 transition-colors text-sm disabled:opacity-50"
              >
                Save Backup Settings
              </button>
            </div>

            {/* Manual Backup */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                Manual Backup
              </h2>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Last backup: {backupSettings.last_backup 
                      ? format(new Date(backupSettings.last_backup), 'MMMM d, yyyy h:mm a')
                      : 'Never'}
                  </p>
                </div>
                <button
                  onClick={handleCreateBackup}
                  disabled={creatingBackup}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg hover:opacity-90 transition-colors text-sm disabled:opacity-50"
                >
                  {creatingBackup ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" />Creating…</>
                  ) : (
                    <><Download className="w-4 h-4" />Create Backup</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === 'api' && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                API Keys
              </h2>
              <button
                onClick={() => setShowApiKeyModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg hover:opacity-90 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                New Key
              </button>
            </div>

            {apiKeys.length === 0 ? (
              <div className="text-center py-12">
                <Key className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No API keys created yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map(key => (
                  <div key={key.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                    <div>
                      <p className="font-medium text-foreground">{key.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created: {format(new Date(key.created_at), 'MMM d, yyyy')}
                        {key.last_used && ` • Last used: ${format(new Date(key.last_used), 'MMM d, yyyy')}`}
                      </p>
                      <div className="flex gap-1 mt-2">
                        {key.permissions.map(perm => (
                          <span key={perm} className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevokeApiKey(key.id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Revoke key"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Advanced Tab */}
        {activeTab === 'advanced' && (
          <div className="space-y-6">
            {/* Export Data */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <DownloadCloud className="w-5 h-5 text-primary" />
                Export Data
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Download all your data including assets, nominees, and settings
              </p>
              <button className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors text-sm">
                Export All Data
              </button>
            </div>

            {/* Delete Account */}
            <div className="bg-card border border-red-500/20 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-red-500 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
              >
                Delete Account
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Change Password</h2>
              <button onClick={() => setShowPasswordModal(false)} className="p-2 hover:bg-accent rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Setup Two-Factor Authentication</h2>
              <button onClick={() => setShow2FAModal(false)} className="p-2 hover:bg-accent rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <img src={twoFactorQR} alt="2FA QR Code" className="mx-auto w-48 h-48" />
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Secret Key</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-muted rounded-lg text-xs font-mono">
                    {twoFactorSecret}
                  </code>
                  <button
                    onClick={() => copyToClipboard(twoFactorSecret)}
                    className="p-2 hover:bg-accent rounded-lg"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Verification Code</label>
                <input
                  type="text"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShow2FAModal(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVerify2FA}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Verifying...' : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Create API Key</h2>
              <button onClick={() => setShowApiKeyModal(false)} className="p-2 hover:bg-accent rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            {newApiKey ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <p className="text-emerald-500 text-sm font-medium mb-2">Your API Key</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-muted rounded-lg text-xs font-mono break-all">
                      {newApiKey.key}
                    </code>
                    <button
                      onClick={() => copyToClipboard(newApiKey.key)}
                      className="p-2 hover:bg-accent rounded-lg"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Make sure to copy this key now. You won't be able to see it again.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowApiKeyModal(false);
                    setNewApiKey(null);
                  }}
                  className="w-full px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg hover:opacity-90"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Key Name</label>
                    <input
                      type="text"
                      value={newApiKeyName}
                      onChange={(e) => setNewApiKeyName(e.target.value)}
                      placeholder="e.g., Development, Production"
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Permissions</label>
                    <div className="space-y-2">
                      {['read', 'write', 'delete'].map(perm => (
                        <label key={perm} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={newApiKeyPermissions.includes(perm)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewApiKeyPermissions([...newApiKeyPermissions, perm]);
                              } else {
                                setNewApiKeyPermissions(newApiKeyPermissions.filter(p => p !== perm));
                              }
                            }}
                            className="rounded border-border text-primary"
                          />
                          <span className="text-sm text-foreground capitalize">{perm}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowApiKeyModal(false)}
                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateApiKey}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Creating...' : 'Create Key'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Delete Account</h2>
              <p className="text-sm text-muted-foreground mt-2">
                This action is permanent and cannot be undone. All your data will be deleted.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Enter your password to confirm</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {saving ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}