// src/services/dashboardService.ts
import { supabase } from './supabase';

export interface DashboardStats {
  totalAssets: number;
  totalCategories: number;
  totalNominees: number;
  pendingInvitations: number;
  securityScore: number;
  lastBackup: string | null;
  vaultHealth: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  storageUsed: number;
  storageLimit: number;
  userName: string;
}

export interface AssetBreakdown {
  category: string;
  count: number;
  icon: string;
  color: string;
}

export interface RecentActivity {
  id: string;
  type: string;
  description: string;
  target: string;
  time: string;
  icon: string;
  color: string;
  bgColor: string;
}

export interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  type: string;
  icon: string;
  color: string;
}

export interface SecurityRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
  action: string;
  link: string;
}

export class DashboardService {
  private userId: string | null = null;

  async initialize(userId: string) {
    this.userId = userId;
  }

  // Get all dashboard stats
  async getStats(): Promise<DashboardStats> {
    if (!this.userId) throw new Error('Not initialized');

    try {
      // Get user profile for name
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', this.userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;

      // Get assets count
      const { count: assetsCount, error: assetsError } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('vault_id', this.userId);

      if (assetsError) throw assetsError;

      // Get unique categories
      const { data: categories, error: categoriesError } = await supabase
        .from('assets')
        .select('category')
        .eq('vault_id', this.userId);

      if (categoriesError) throw categoriesError;
      
      const uniqueCategories = new Set(categories?.map(c => c.category)).size;

      // Get nominees stats
      const { count: nomineesCount, error: nomineesError } = await supabase
        .from('nominees')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId);

      if (nomineesError) throw nomineesError;

      const { count: pendingCount, error: pendingError } = await supabase
        .from('nominees')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId)
        .eq('status', 'pending');

      if (pendingError) throw pendingError;

      // Get last backup from audit logs
      const { data: backupLog, error: backupError } = await supabase
        .from('audit_logs')
        .select('created_at')
        .eq('user_id', this.userId)
        .eq('event_type', 'backup_created')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (backupError && backupError.code !== 'PGRST116') throw backupError;

      // Calculate security score
      const securityScore = await this.calculateSecurityScore();

      // Calculate storage used (approximate)
      const storageUsed = (assetsCount || 0) * 5; // Rough estimate: 5MB per asset
      const storageLimit = 1024; // 1GB limit

      // Determine vault health
      const vaultHealth = this.getVaultHealth(securityScore, assetsCount || 0, nomineesCount || 0);

      // Get user's name
      const userName = profile?.full_name || profile?.email?.split('@')[0] || 'User';

      return {
        totalAssets: assetsCount || 0,
        totalCategories: uniqueCategories,
        totalNominees: nomineesCount || 0,
        pendingInvitations: pendingCount || 0,
        securityScore,
        lastBackup: backupLog?.created_at || null,
        vaultHealth,
        storageUsed,
        storageLimit,
        userName
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  // Get asset breakdown by category
  async getAssetBreakdown(): Promise<AssetBreakdown[]> {
    if (!this.userId) throw new Error('Not initialized');

    try {
      const { data, error } = await supabase
        .from('assets')
        .select('category')
        .eq('vault_id', this.userId);

      if (error) throw error;

      const categoryColors: Record<string, string> = {
        password: 'from-blue-500 to-cyan-500',
        crypto: 'from-purple-500 to-pink-500',
        note: 'from-amber-500 to-orange-500',
        document: 'from-emerald-500 to-teal-500'
      };

      const categoryIcons: Record<string, string> = {
        password: '🔑',
        crypto: '₿',
        note: '📝',
        document: '📄'
      };

      const breakdown: Record<string, number> = {};
      data?.forEach(item => {
        breakdown[item.category] = (breakdown[item.category] || 0) + 1;
      });

      return Object.entries(breakdown).map(([category, count]) => ({
        category,
        count,
        icon: categoryIcons[category] || '📦',
        color: categoryColors[category] || 'from-gray-500 to-gray-600'
      }));
    } catch (error) {
      console.error('Error getting asset breakdown:', error);
      throw error;
    }
  }

  // Get recent activity
  async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    if (!this.userId) throw new Error('Not initialized');

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const activityColors: Record<string, { color: string; bgColor: string; icon: string }> = {
        login: { color: 'text-blue-500', bgColor: 'bg-blue-500/10', icon: 'LogIn' },
        logout: { color: 'text-amber-500', bgColor: 'bg-amber-500/10', icon: 'LogOut' },
        asset_added: { color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', icon: 'Key' },
        asset_updated: { color: 'text-amber-500', bgColor: 'bg-amber-500/10', icon: 'FileText' },
        asset_deleted: { color: 'text-red-500', bgColor: 'bg-red-500/10', icon: 'Trash2' },
        asset_decrypted: { color: 'text-purple-500', bgColor: 'bg-purple-500/10', icon: 'Eye' },
        nominee_added: { color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', icon: 'UserPlus' },
        nominee_accepted: { color: 'text-green-500', bgColor: 'bg-green-500/10', icon: 'UserCheck' },
        nominee_revoked: { color: 'text-red-500', bgColor: 'bg-red-500/10', icon: 'UserX' },
        deadman_checkin: { color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', icon: 'HeartPulse' },
        deadman_triggered: { color: 'text-red-500', bgColor: 'bg-red-500/10', icon: 'AlertTriangle' },
        settings_updated: { color: 'text-muted-foreground', bgColor: 'bg-muted', icon: 'Settings' }
      };

      return (data || []).map(log => {
        const activity = activityColors[log.event_type] || { color: 'text-muted-foreground', bgColor: 'bg-muted', icon: 'Activity' };
        return {
          id: log.id,
          type: log.event_type,
          description: log.description,
          target: log.metadata?.asset_name || log.metadata?.nominee_email || 'System',
          time: log.created_at,
          icon: activity.icon,
          color: activity.color,
          bgColor: activity.bgColor
        };
      });
    } catch (error) {
      console.error('Error getting recent activity:', error);
      throw error;
    }
  }

  // Get upcoming events
  async getUpcomingEvents(): Promise<UpcomingEvent[]> {
    if (!this.userId) throw new Error('Not initialized');

    try {
      const events: UpcomingEvent[] = [];

      // Check dead man switch next check-in
      const { data: deadman, error: deadmanError } = await supabase
        .from('dead_man_switches')
        .select('*')
        .eq('user_id', this.userId)
        .maybeSingle();

      if (!deadmanError && deadman && deadman.is_enabled) {
        const lastCheckIn = new Date(deadman.last_check_in);
        const nextCheckIn = new Date(lastCheckIn);
        nextCheckIn.setDate(nextCheckIn.getDate() + deadman.inactivity_period);
        
        const daysUntil = Math.ceil((nextCheckIn.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        if (daysUntil > 0 && daysUntil <= 7) {
          events.push({
            id: 'deadman-next',
            title: 'Dead Man Switch Check-in',
            date: nextCheckIn.toISOString(),
            type: 'deadman',
            icon: 'HeartPulse',
            color: daysUntil <= 3 ? 'text-red-500' : 'text-amber-500'
          });
        }
      }

      // Check pending nominee invitations
      const { count: pendingCount, error: pendingError } = await supabase
        .from('nominees')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId)
        .eq('status', 'pending');

      if (!pendingError && pendingCount && pendingCount > 0) {
        events.push({
          id: 'pending-nominees',
          title: `${pendingCount} Pending Nominee Invitation${pendingCount > 1 ? 's' : ''}`,
          date: new Date().toISOString(),
          type: 'nominee',
          icon: 'Users',
          color: 'text-amber-500'
        });
      }

      return events;
    } catch (error) {
      console.error('Error getting upcoming events:', error);
      return [];
    }
  }

  // Get security recommendations
  async getSecurityRecommendations(): Promise<SecurityRecommendation[]> {
    if (!this.userId) throw new Error('Not initialized');

    try {
      const recommendations: SecurityRecommendation[] = [];

      // Check if 2FA is enabled
      const { data: userData } = await supabase.auth.getUser();
      const has2FA = userData.user?.factors?.some(f => f.status === 'verified') || false;

      if (!has2FA) {
        recommendations.push({
          id: '2fa',
          title: 'Enable Two-Factor Authentication',
          description: 'Add an extra layer of security to your account',
          priority: 'high',
          icon: 'Fingerprint',
          action: 'Enable Now',
          link: '/settings?tab=security'
        });
      }

      // Check for pending nominee invitations
      const { count: pendingCount } = await supabase
        .from('nominees')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId)
        .eq('status', 'pending');

      if (pendingCount && pendingCount > 0) {
        recommendations.push({
          id: 'pending-nominees',
          title: 'Review Nominee Invitations',
          description: `${pendingCount} nominee invitation${pendingCount > 1 ? 's' : ''} pending your review`,
          priority: 'medium',
          icon: 'Users',
          action: 'Review',
          link: '/nominees'
        });
      }

      // Check last backup
      const { data: backupLog } = await supabase
        .from('audit_logs')
        .select('created_at')
        .eq('user_id', this.userId)
        .eq('event_type', 'backup_created')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (backupLog) {
        const lastBackup = new Date(backupLog.created_at);
        const daysSinceBackup = Math.ceil((Date.now() - lastBackup.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceBackup > 7) {
          recommendations.push({
            id: 'backup',
            title: 'Create a Backup',
            description: `Your last backup was ${daysSinceBackup} days ago`,
            priority: daysSinceBackup > 30 ? 'high' : 'medium',
            icon: 'DownloadCloud',
            action: 'Backup Now',
            link: '/settings?tab=backup'
          });
        }
      }

      return recommendations;
    } catch (error) {
      console.error('Error getting security recommendations:', error);
      return [];
    }
  }

  // Calculate security score
  private async calculateSecurityScore(): Promise<number> {
    if (!this.userId) return 0;

    let score = 0;
    const maxScore = 100;

    try {
      // Factor 1: Has vault password (20 points)
      const { data: vault } = await supabase
        .from('vaults')
        .select('vault_password_hash')
        .eq('user_id', this.userId)
        .maybeSingle();

      if (vault?.vault_password_hash) score += 20;

      // Factor 2: Has 2FA enabled (25 points)
      const { data: userData } = await supabase.auth.getUser();
      const has2FA = userData.user?.factors?.some(f => f.status === 'verified') || false;
      if (has2FA) score += 25;

      // Factor 3: Has active nominees (15 points)
      const { count: nomineesCount } = await supabase
        .from('nominees')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId)
        .eq('status', 'accepted');

      if (nomineesCount && nomineesCount > 0) score += 15;

      // Factor 4: Dead man switch enabled (20 points)
      const { data: deadman } = await supabase
        .from('dead_man_switches')
        .select('is_enabled')
        .eq('user_id', this.userId)
        .maybeSingle();

      if (deadman?.is_enabled) score += 20;

      // Factor 5: Regular check-ins (20 points)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: checkins } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId)
        .eq('event_type', 'deadman_checkin')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (checkins && checkins >= 3) score += 20;
      else if (checkins && checkins >= 1) score += 10;

      return Math.min(score, maxScore);
    } catch (error) {
      console.error('Error calculating security score:', error);
      return 0;
    }
  }

  // Determine vault health
  private getVaultHealth(score: number, assets: number, nominees: number): 'Excellent' | 'Good' | 'Fair' | 'Poor' {
    if (score >= 80 && assets > 0 && nominees > 0) return 'Excellent';
    if (score >= 60 && assets > 0) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  }
}

export const dashboardService = new DashboardService();