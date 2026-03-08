import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Users,
  Clock,
  Activity,
  Key,
  FileText,
  ArrowRight,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  UserCheck,
  Sparkles,
  PieChart,
  Globe,
  Zap,
  Layers,
  ChevronRight,
  Calendar,
  HardDrive,
  AlertTriangle,
  Fingerprint,
  Eye,
  LogIn,
  LogOut,
  UserPlus,
  UserX,
  HeartPulse,
  Settings,
  DownloadCloud,
  CircleX
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { dashboardService, type DashboardStats, type AssetBreakdown, type RecentActivity, type UpcomingEvent, type SecurityRecommendation } from '../services/dashboardService';
import { format, formatDistanceToNow } from 'date-fns';

// Type for icon mapping
type IconComponent = React.FC<React.SVGProps<SVGSVGElement>>;

// Icon mapping with proper typing
const IconMap: Record<string, IconComponent> = {
  LogIn,
  LogOut,
  Key,
  FileText,
  Eye,
  UserPlus,
  UserCheck,
  UserX,
  HeartPulse,
  AlertTriangle,
  Settings,
  Activity,
  Users,
  Fingerprint,
  DownloadCloud,
  Trash2: (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 4V2h8v2" />
    </svg>
  )
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Dashboard data
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [assetBreakdown, setAssetBreakdown] = useState<AssetBreakdown[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [recommendations, setRecommendations] = useState<SecurityRecommendation[]>([]);

  // Update greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Load dashboard data
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError('');
        await dashboardService.initialize(user.id);

        const [
          statsData,
          breakdownData,
          activityData,
          eventsData,
          recommendationsData
        ] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getAssetBreakdown(),
          dashboardService.getRecentActivity(8),
          dashboardService.getUpcomingEvents(),
          dashboardService.getSecurityRecommendations()
        ]);

        setStats(statsData);
        setAssetBreakdown(breakdownData);
        setRecentActivity(activityData);
        setUpcomingEvents(eventsData);
        setRecommendations(recommendationsData);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
        setError('Failed to load dashboard data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user, navigate]);

  // Get icon component with proper typing - FIXED: using React.ReactElement instead of JSX.Element
  const getIcon = (iconName: string, className: string = 'w-5 h-5'): React.ReactElement => {
    const Icon = IconMap[iconName];
    if (Icon) {
      return <Icon className={className} />;
    }
    return <Activity className={className} />;
  };

  // Format bytes to MB/GB
  const formatStorage = (mb: number): string => {
    if (mb < 1024) return `${mb} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  // Get security score color
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
  };

  // Get health color
  const getHealthColor = (health: string): string => {
    switch (health) {
      case 'Excellent': return 'text-emerald-500';
      case 'Good': return 'text-blue-500';
      case 'Fair': return 'text-amber-500';
      case 'Poor': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary animate-pulse" />
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

        {/* Header with Welcome Section */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-3xl blur-2xl" />
          <div className="relative bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                    <Shield className="w-8 h-8 md:w-10 md:h-10 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
                    {greeting}, <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                      {stats?.userName || 'User'}
                    </span>
                  </h1>
                  <p className="text-muted-foreground flex items-center gap-2 mt-2">
                    <Clock className="w-4 h-4" />
                    {format(currentTime, 'EEEE, MMMM do, yyyy • h:mm a')}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/vault')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all text-sm font-medium"
                >
                  <Key className="w-4 h-4" />
                  Go to Vault
                </button>
                <button
                  onClick={() => navigate('/dead-man-switch')}
                  className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl hover:bg-accent transition-all text-sm font-medium"
                >
                  <HeartPulse className="w-4 h-4" />
                  Check In
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-500 text-sm flex-1">{error}</p>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-500">
              <CircleX className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card border border-border rounded-xl p-4 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Key className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalAssets}</p>
                  <p className="text-xs text-muted-foreground">Total Assets</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Layers className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalCategories}</p>
                  <p className="text-xs text-muted-foreground">Categories</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalNominees}</p>
                  <p className="text-xs text-muted-foreground">Nominees</p>
                </div>
              </div>
              {stats.pendingInvitations > 0 && (
                <div className="mt-2 text-xs text-amber-500 flex items-center gap-1">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  {stats.pendingInvitations} pending
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-4 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Shield className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${getScoreColor(stats.securityScore)}`}>
                    {stats.securityScore}%
                  </p>
                  <p className="text-xs text-muted-foreground">Security Score</p>
                </div>
              </div>
              <div className="mt-2 text-xs flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${getHealthColor(stats.vaultHealth)}`} />
                {stats.vaultHealth}
              </div>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Asset Breakdown & Storage */}
          <div className="lg:col-span-2 space-y-6">
            {/* Asset Breakdown */}
            {assetBreakdown.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-primary" />
                    Asset Breakdown
                  </h2>
                  <button 
                    onClick={() => navigate('/vault')}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    View All
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {assetBreakdown.map((item, index) => {
                    const percentage = (item.count / (stats?.totalAssets || 1)) * 100;
                    return (
                      <div key={index} className="relative">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                              <span className="text-sm">{item.icon}</span>
                            </div>
                            <span className="text-sm font-medium text-foreground capitalize">{item.category}</span>
                          </div>
                          <span className="text-sm text-foreground">{item.count} items</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Storage Usage */}
                {stats && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Storage Usage</span>
                      <span className="text-sm font-medium text-foreground">
                        {formatStorage(stats.storageUsed)} / {formatStorage(stats.storageLimit)}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-purple-600 rounded-full"
                        style={{ width: `${(stats.storageUsed / stats.storageLimit) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Recent Activity
                  </h2>
                  <button 
                    onClick={() => navigate('/audit')}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    View All
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors group">
                      <div className={`w-10 h-10 rounded-xl ${activity.bgColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        {getIcon(activity.icon, `w-5 h-5 ${activity.color}`)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.target} • {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Security & Events */}
          <div className="space-y-6">
            {/* Security Score Card */}
            {stats && (
              <div className="bg-gradient-to-br from-primary/10 via-card to-purple-500/10 border border-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Security Overview
                  </h2>
                  <span className={`text-3xl font-bold ${getScoreColor(stats.securityScore)}`}>
                    {stats.securityScore}%
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Vault Health</span>
                    <span className={getHealthColor(stats.vaultHealth)}>{stats.vaultHealth}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Backup</span>
                    <span className="text-foreground">
                      {stats.lastBackup 
                        ? formatDistanceToNow(new Date(stats.lastBackup), { addSuffix: true })
                        : 'Never'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">2FA Status</span>
                    <span className="text-emerald-500 font-medium">Not Enabled</span>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/settings?tab=security')}
                  className="w-full py-3 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Improve Security
                </button>
              </div>
            )}

            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Upcoming Events
                </h2>

                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors group">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ${
                        event.color === 'text-red-500' ? 'bg-red-500/10' :
                        event.color === 'text-amber-500' ? 'bg-amber-500/10' :
                        'bg-primary/10'
                      }`}>
                        {getIcon(event.icon, `w-5 h-5 ${event.color}`)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{event.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(event.date), { addSuffix: true })}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Recommendations */}
            {recommendations.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Recommendations
                </h2>

                <div className="space-y-4">
                  {recommendations.map((rec) => {
                    const priorityColor = 
                      rec.priority === 'high' ? 'text-red-500' :
                      rec.priority === 'medium' ? 'text-amber-500' : 'text-blue-500';
                    
                    return (
                      <div key={rec.id} className="p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors group">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${priorityColor.replace('text', 'bg')}/10 group-hover:scale-110 transition-transform`}>
                            {getIcon(rec.icon, `w-4 h-4 ${priorityColor}`)}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-sm font-medium text-foreground">{rec.title}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                            <button
                              onClick={() => navigate(rec.link)}
                              className="text-xs text-primary hover:underline mt-2 flex items-center gap-1"
                            >
                              {rec.action}
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-primary/5 to-purple-500/5 border border-border rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Quick Actions
              </h2>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate('/vault')}
                  className="p-4 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-lg transition-all text-center group"
                >
                  <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Key className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-medium text-foreground">Add Asset</p>
                </button>

                <button
                  onClick={() => navigate('/nominees')}
                  className="p-4 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-lg transition-all text-center group"
                >
                  <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-medium text-foreground">Add Nominee</p>
                </button>

                <button
                  onClick={() => navigate('/dead-man-switch')}
                  className="p-4 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-lg transition-all text-center group"
                >
                  <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <HeartPulse className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-medium text-foreground">Check In</p>
                </button>

                <button
                  onClick={() => navigate('/settings')}
                  className="p-4 bg-card border border-border rounded-xl hover:border-primary/30 hover:shadow-lg transition-all text-center group"
                >
                  <div className="w-10 h-10 mx-auto mb-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-medium text-foreground">Settings</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Stats */}
        {stats && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-card/30 border border-border rounded-xl text-center hover:bg-card/50 transition-colors">
              <HardDrive className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Storage Used</p>
              <p className="text-sm font-medium text-foreground">{formatStorage(stats.storageUsed)}</p>
            </div>
            <div className="p-4 bg-card/30 border border-border rounded-xl text-center hover:bg-card/50 transition-colors">
              <Globe className="w-5 h-5 text-purple-500 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Last Sync</p>
              <p className="text-sm font-medium text-foreground">Just now</p>
            </div>
            <div className="p-4 bg-card/30 border border-border rounded-xl text-center hover:bg-card/50 transition-colors">
              <Users className="w-5 h-5 text-amber-500 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Active Nominees</p>
              <p className="text-sm font-medium text-foreground">{stats.totalNominees}</p>
            </div>
            <div className="p-4 bg-card/30 border border-border rounded-xl text-center hover:bg-card/50 transition-colors">
              <TrendingUp className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Weekly Activity</p>
              <p className="text-sm font-medium text-foreground">
                {recentActivity.length} events
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}