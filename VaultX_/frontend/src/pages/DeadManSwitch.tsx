// src/pages/DeadManSwitch.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Power, Clock, Mail, CheckCircle, AlertCircle, XCircle,
  AlertTriangle, Calendar, History, Settings, Info, Activity,
  CalendarDays, MailCheck, Smartphone, Pause, X, Play, Zap, Sparkles,
  RefreshCw, Timer, HeartPulse, Send, FlaskConical
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {
  deadManSwitchService,
  type DeadManSwitch,
  type SwitchLog,
  type VerificationMethod,
} from '../services/deadManSwitchService';
import { emailService } from '../services/emailService';
import { format, formatDistanceToNow, } from 'date-fns';

export default function DeadManSwitchPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [switchConfig, setSwitchConfig] = useState<DeadManSwitch | null>(null);
  const [logs, setLogs] = useState<SwitchLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [daysUntilNext, setDaysUntilNext] = useState<number | null>(null);
  const [isInGrace, setIsInGrace] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'pause' | 'resume' | 'cancel' | 'checkin' | null>(null);
  const [testEmailState, setTestEmailState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  const [editingConfig, setEditingConfig] = useState({
    is_enabled: true,
    inactivity_period: 90,
    grace_period: 14,
    verification_methods: ['email'] as VerificationMethod[],
    secondary_contact: '',
  });

  // ── Data loading ─────────────────────────────────────────────────────────

  const refreshData = useCallback(async (showLoader = false) => {
    if (!user) return;
    if (showLoader) setLoading(true);
    try {
      setError('');
      const [switchData, logsData, days, grace] = await Promise.all([
        deadManSwitchService.getSwitch(),
        deadManSwitchService.getLogs(15),
        deadManSwitchService.getDaysUntilNextCheckIn(),
        deadManSwitchService.isInGracePeriod(),
      ]);
      setSwitchConfig(switchData);
      setLogs(logsData);
      setDaysUntilNext(days);
      setIsInGrace(grace);
      setEditingConfig({
        is_enabled: switchData.is_enabled,
        inactivity_period: switchData.inactivity_period,
        grace_period: switchData.grace_period,
        verification_methods: switchData.verification_methods as VerificationMethod[],
        secondary_contact: switchData.secondary_contact || '',
      });
    } catch (err) {
      console.error('[Page] refreshData error:', err);
      setError('Failed to load configuration. Please refresh the page.');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }

    const init = async () => {
      setLoading(true);
      await deadManSwitchService.initialize(user.id);
      await refreshData();
      setLoading(false);
    };

    init();

    const interval = setInterval(async () => {
      try {
        const released = await deadManSwitchService.checkAndReleaseAssets();
        if (released) await refreshData();
        else {
          // Just refresh logs / days in the background
          const [days, grace, newLogs] = await Promise.all([
            deadManSwitchService.getDaysUntilNextCheckIn(),
            deadManSwitchService.isInGracePeriod(),
            deadManSwitchService.getLogs(15),
          ]);
          setDaysUntilNext(days);
          setIsInGrace(grace);
          setLogs(newLogs);
        }
      } catch (err) {
        console.error('[Page] interval refresh error:', err);
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [user, navigate, refreshData]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleCheckIn = async () => {
    try {
      setCheckingIn(true);
      setError('');
      await deadManSwitchService.checkIn();
      // Fetch fresh data — the log row is guaranteed written before this runs
      await refreshData();
      setSuccess('✅ Check-in successful! Timer reset and confirmation email sent.');
      setConfirmAction(null);
      setShowConfirmModal(false);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('[Page] handleCheckIn error:', err);
      setError('Failed to check in. Please try again.');
    } finally {
      setCheckingIn(false);
    }
  };

  const handlePause = async () => {
    try {
      setError('');
      await deadManSwitchService.pauseSwitch();
      await refreshData();
      setSuccess('Switch paused.');
      setConfirmAction(null);
      setShowConfirmModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to pause switch.');
    }
  };

  const handleResume = async () => {
    try {
      setError('');
      await deadManSwitchService.resumeSwitch();
      await refreshData();
      setSuccess('Switch resumed.');
      setConfirmAction(null);
      setShowConfirmModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to resume switch.');
    }
  };

  const handleCancelTrigger = async () => {
    try {
      setError('');
      await deadManSwitchService.cancelTrigger();
      await refreshData();
      setSuccess('Release cancelled. Switch is active again.');
      setConfirmAction(null);
      setShowConfirmModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to cancel trigger.');
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setError('');
      await deadManSwitchService.updateSwitch(editingConfig);
      await refreshData();
      setShowSettings(false);
      setSuccess('Settings saved.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!user?.email) return;
    setTestEmailState('sending');
    try {
      const result = await emailService.sendTestEmail({
        to_email: user.email,
        to_name: user.user_metadata?.full_name || user.email,
      });
      setTestEmailState(result.success ? 'sent' : 'failed');
      setTimeout(() => setTestEmailState('idle'), 4000);
    } catch {
      setTestEmailState('failed');
      setTimeout(() => setTestEmailState('idle'), 4000);
    }
  };

  // ── Display helpers ──────────────────────────────────────────────────────

  const getStatusInfo = () => {
    if (!switchConfig) return { label: 'Unknown', color: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/20', dot: 'bg-gray-400' };
    switch (switchConfig.status) {
      case 'active':    return { label: 'Active',    color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-400' };
      case 'paused':    return { label: 'Paused',    color: 'text-amber-500',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   dot: 'bg-amber-400'  };
      case 'triggered': return { label: 'Triggered', color: 'text-red-500',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     dot: 'bg-red-400'    };
      case 'released':  return { label: 'Released',  color: 'text-purple-500',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20',  dot: 'bg-purple-400' };
      default:          return { label: switchConfig.status, color: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/20', dot: 'bg-gray-400' };
    }
  };

  const getLogMeta = (type: string): { label: string; icon: React.ElementType; color: string; bg: string } => {
    switch (type) {
      case 'check_in':          return { label: 'Checked in',             icon: CheckCircle,  color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
      case 'triggered':         return { label: 'Switch triggered',       icon: AlertTriangle,color: 'text-red-500',     bg: 'bg-red-500/10'     };
      case 'released':          return { label: 'Assets released',        icon: Shield,       color: 'text-purple-500',  bg: 'bg-purple-500/10'  };
      case 'cancelled':         return { label: 'Release cancelled',      icon: XCircle,      color: 'text-blue-500',    bg: 'bg-blue-500/10'    };
      case 'updated':           return { label: 'Settings updated',       icon: Settings,     color: 'text-muted-foreground', bg: 'bg-muted'     };
      case 'verification_sent': return { label: 'Notification sent',      icon: Mail,         color: 'text-amber-500',   bg: 'bg-amber-500/10'   };
      default:                  return { label: type.replace(/_/g, ' '), icon: Activity,     color: 'text-muted-foreground', bg: 'bg-muted'      };
    }
  };

  const getLogDetail = (log: SwitchLog): string => {
    const d = log.details;
    switch (log.event_type) {
      case 'check_in':
        return d.checked_in_at ? `at ${format(new Date(d.checked_in_at as string), 'h:mm a')}` : '';
      case 'verification_sent':
        if (d.type === 'checkin_confirmed')    return `Check-in confirmation → ${d.to}`;
        if (d.type === 'inactivity_warning')   return `Inactivity warning → ${d.to} (${d.days_remaining}d left)`;
        if (d.type === 'grace_period_started') return `Grace period alert → ${d.to}`;
        if (d.type === 'assets_released')      return `Release notice → ${d.to}`;
        return `Email sent → ${d.to ?? ''}`;
      case 'released':
        return `${d.nominee_count ?? '?'} nominees · ${d.asset_count ?? '?'} assets`;
      case 'triggered':
        return d.scheduled_release ? `Release scheduled ${format(new Date(d.scheduled_release as string), 'MMM d')}` : '';
      case 'updated': {
        const action = d.action as string | undefined;
        if (action) return action.charAt(0).toUpperCase() + action.slice(1);
        return '';
      }
      default:
        return '';
    }
  };

  const progressPercent = (() => {
    if (!switchConfig || daysUntilNext === null) return 0;
    const used = switchConfig.inactivity_period - daysUntilNext;
    return Math.min(100, Math.max(0, (used / switchConfig.inactivity_period) * 100));
  })();

  const progressColor = progressPercent > 80 ? 'bg-red-500' : progressPercent > 55 ? 'bg-amber-500' : 'bg-emerald-500';

  // ── Loading screen ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <HeartPulse className="w-6 h-6 text-primary animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo();

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Decorative blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-red-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto mt-24 px-4 sm:px-6 lg:px-8 pb-20">

        {/* ── Page Header ── */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-primary/10 rounded-3xl blur-2xl" />
          <div className="relative bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <HeartPulse className="w-7 h-7 md:w-8 md:h-8 text-white" />
                  </div>
                  {switchConfig?.status === 'active' && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dead Man Switch</h1>
                  <p className="text-muted-foreground text-sm mt-1 capitalize">
                    Automatically transfer your digital legacy if you become inactive
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl hover:bg-accent transition-all text-sm font-medium flex-shrink-0"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* ── Flash messages ── */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-500 text-sm flex-1">{error}</p>
            <button onClick={() => setError('')}><X className="w-4 h-4 text-red-400 hover:text-red-500" /></button>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <p className="text-emerald-500 text-sm flex-1">{success}</p>
            <button onClick={() => setSuccess('')}><X className="w-4 h-4 text-emerald-400 hover:text-emerald-500" /></button>
          </div>
        )}

        {/* ── Grace Period Banner ── */}
        {isInGrace && switchConfig?.status === 'triggered' && (
          <div className="mb-6 p-5 bg-red-500/10 border border-red-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="font-semibold text-red-500 mb-1">⚠ Grace Period Active</p>
                <p className="text-sm text-red-400">
                  Your inactivity period expired. You have {daysUntilNext} day{daysUntilNext !== 1 ? 's' : ''} left
                  to cancel before assets are released to your nominees.
                </p>
              </div>
            </div>
            <button
              onClick={() => { setConfirmAction('cancel'); setShowConfirmModal(true); }}
              className="px-5 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all flex-shrink-0"
            >
              Cancel Release
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* ── Status Card ── */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusInfo.bg} ${statusInfo.border}`}>
                  <div className={`w-2 h-2 rounded-full ${statusInfo.dot} ${switchConfig?.status === 'active' ? 'animate-pulse' : ''}`} />
                  <span className={`text-sm font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
                </div>
                {!switchConfig?.is_enabled && (
                  <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-full">Disabled</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {switchConfig?.status === 'active' && (
                  <button
                    onClick={() => { setConfirmAction('pause'); setShowConfirmModal(true); }}
                    className="p-2 hover:bg-amber-500/10 text-muted-foreground hover:text-amber-500 rounded-lg transition-all"
                    title="Pause switch"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                )}
                {switchConfig?.status === 'paused' && (
                  <button
                    onClick={() => { setConfirmAction('resume'); setShowConfirmModal(true); }}
                    className="p-2 hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-500 rounded-lg transition-all"
                    title="Resume switch"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            {switchConfig?.status === 'active' && daysUntilNext !== null && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Inactivity Progress</span>
                  <span className="text-xs font-medium text-foreground">
                    {switchConfig.inactivity_period - daysUntilNext} / {switchConfig.inactivity_period} Days Used
                  </span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${progressColor}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2 capitalize">
                  {daysUntilNext > 0 ? `${daysUntilNext} days remaining before trigger` : 'Check-in overdue'}
                </p>
              </div>
            )}

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="p-3 bg-muted/30 rounded-xl">
                <CalendarDays className="w-4 h-4 text-muted-foreground mb-2" />
                <p className="text-2xl font-bold text-foreground">{switchConfig?.inactivity_period}</p>
                <p className="text-xs text-muted-foreground">Inactivity Days</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-xl">
                <Timer className="w-4 h-4 text-muted-foreground mb-2" />
                <p className="text-2xl font-bold text-foreground">{switchConfig?.grace_period}</p>
                <p className="text-xs text-muted-foreground">Grace Period</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-xl">
                <History className="w-4 h-4 text-muted-foreground mb-2" />
                <p className="text-xl font-semibold text-foreground leading-tight mt-1 capitalize">
                  {switchConfig?.last_check_in
                    ? formatDistanceToNow(new Date(switchConfig.last_check_in), { addSuffix: true })
                    : 'Never'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">Last Check-In</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-xl">
                <Calendar className="w-4 h-4 text-muted-foreground mb-2" />
                <p className="text-2xl font-bold text-foreground">
                  {daysUntilNext !== null ? daysUntilNext : '∞'}
                </p>
                <p className="text-xs text-muted-foreground">Days Left</p>
              </div>
            </div>

            {/* CTA */}
            {switchConfig?.status === 'active' && (
              <button
                onClick={() => { setConfirmAction('checkin'); setShowConfirmModal(true); }}
                disabled={checkingIn}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:opacity-90 hover:scale-[1.01] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {checkingIn
                  ? <><RefreshCw className="w-4 h-4 animate-spin" />Checking In…</>
                  : <><Zap className="w-4 h-4" />Check In Now</>
                }
              </button>
            )}

            {switchConfig?.status === 'paused' && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <Pause className="w-4 h-4 flex-shrink-0" />
                Switch is paused — no automatic actions will be taken.
              </div>
            )}
            {switchConfig?.status === 'released' && (
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl text-sm text-purple-600 dark:text-purple-400 flex items-center gap-2">
                <Shield className="w-4 h-4 flex-shrink-0" />
                Assets have been transferred to your nominees.
              </div>
            )}
          </div>

          {/* ── How It Works ── */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold text-foreground mb-5 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Info className="w-4 h-4" />
              How It Works
            </h3>
            <div className="space-y-5">
              {[
                { num: '1', text: `Set an inactivity period (${switchConfig?.inactivity_period} days)`, color: 'bg-primary/10 text-primary' },
                { num: '2', text: `A ${switchConfig?.grace_period}-day grace period email is sent`, color: 'bg-amber-500/10 text-amber-500' },
                { num: '3', text: 'If no response, assets transfer to nominees', color: 'bg-red-500/10 text-red-500' },
              ].map(step => (
                <div key={step.num} className="flex gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${step.color}`}>
                    {step.num}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 p-3 bg-muted/30 rounded-xl">
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
                {switchConfig?.is_enabled
                  ? 'Switch is active and monitoring your account.'
                  : 'Switch is disabled — no automatic actions will occur.'}
              </p>
            </div>

            {/* Email notifications summary */}
            <div className="mt-4 p-3 border border-border rounded-xl">
              <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                Email notifications
              </p>
              <div className="space-y-1.5">
                {[
                  'Inactivity warning (7 days out)',
                  'Grace period alert (with cancel link)',
                  'Check-in confirmation',
                  'Asset release notice',
                ].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {switchConfig?.verification_methods.map(method => (
                  <span key={method} className="flex items-center gap-1 text-xs px-2 py-1 bg-muted rounded-lg text-muted-foreground">
                    {method === 'email' ? <MailCheck className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Activity Log ── */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              Activity Log
            </h2>
            <span className="text-xs text-muted-foreground">{logs.length} entries</span>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm capitalize">No activity recorded yet</p>
              <p className="text-muted-foreground/60 text-xs mt-1 capitalize">Actions like check-ins will appear here</p>
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((log, i) => {
                const meta = getLogMeta(log.event_type);
                const detail = getLogDetail(log);
                const LogIcon = meta.icon;
                return (
                  <div
                    key={log.id}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/30 transition-colors group"
                    style={{ opacity: Math.max(0.4, 1 - i * 0.05) }}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bg} group-hover:scale-110 transition-transform`}>
                      <LogIcon className={`w-4 h-4 ${meta.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground capitalize">{meta.label}</p>
                      {detail && (
                        <p className="text-xs text-muted-foreground truncate">{detail}</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground flex-shrink-0 tabular-nums">
                      {format(new Date(log.created_at), 'MMM d · h:mm a')}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══════════ SETTINGS MODAL ══════════ */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Switch Settings</h2>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-accent rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5">

              {/* Enable toggle */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <Power className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Enable Switch</p>
                    <p className="text-xs text-muted-foreground">Activate automatic monitoring</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingConfig.is_enabled}
                    onChange={e => setEditingConfig({ ...editingConfig, is_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5 after:shadow-sm" />
                </label>
              </div>

              {/* Inactivity period */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Inactivity Period
                  <span className="text-xs text-muted-foreground font-normal ml-2">How long before the switch triggers</span>
                </label>
                <select
                  value={editingConfig.inactivity_period}
                  onChange={e => setEditingConfig({ ...editingConfig, inactivity_period: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  {[30, 60, 90, 180, 365].map(d => <option key={d} value={d}>{d} days</option>)}
                </select>
              </div>

              {/* Grace period */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Grace Period
                  <span className="text-xs text-muted-foreground font-normal ml-2">Time to cancel after trigger</span>
                </label>
                <select
                  value={editingConfig.grace_period}
                  onChange={e => setEditingConfig({ ...editingConfig, grace_period: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  {[7, 14, 21, 30].map(d => <option key={d} value={d}>{d} days</option>)}
                </select>
              </div>

              {/* Verification methods */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">Verification Methods</label>
                <div className="space-y-2">
                  {[
                    { value: 'email', label: 'Email', icon: MailCheck, desc: user?.email || 'Your account email' },
                    { value: 'sms',   label: 'SMS',   icon: Smartphone, desc: 'Receive alerts via text' },
                  ].map(({ value, label, icon: Icon, desc }) => (
                    <label key={value} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                      editingConfig.verification_methods.includes(value as VerificationMethod)
                        ? 'bg-primary/5 border-primary/30'
                        : 'bg-muted/20 border-transparent hover:bg-muted/40'
                    }`}>
                      <input
                        type="checkbox"
                        checked={editingConfig.verification_methods.includes(value as VerificationMethod)}
                        onChange={e => {
                          const methods = e.target.checked
                            ? [...editingConfig.verification_methods, value as VerificationMethod]
                            : editingConfig.verification_methods.filter(m => m !== value);
                          setEditingConfig({ ...editingConfig, verification_methods: methods });
                        }}
                        className="rounded border-border text-primary w-4 h-4"
                      />
                      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Phone field */}
              {editingConfig.verification_methods.includes('sms') && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={editingConfig.secondary_contact}
                    onChange={e => setEditingConfig({ ...editingConfig, secondary_contact: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full px-4 py-3 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              )}

              {/* Test email */}
              <div className="p-4 bg-muted/20 border border-border rounded-xl">
                <div className="flex items-start gap-3">
                  <FlaskConical className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground mb-0.5">Test Email Notifications</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Send a test email to <span className="font-medium text-foreground">{user?.email}</span> to verify notifications are working.
                    </p>
                    <button
                      onClick={handleSendTestEmail}
                      disabled={testEmailState === 'sending'}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
                        testEmailState === 'sent'   ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                        testEmailState === 'failed' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' :
                        'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'
                      }`}
                    >
                      {testEmailState === 'sending' && <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Sending…</>}
                      {testEmailState === 'sent'    && <><CheckCircle className="w-3.5 h-3.5" />Email sent!</>}
                      {testEmailState === 'failed'  && <><AlertCircle className="w-3.5 h-3.5" />Failed to send</>}
                      {testEmailState === 'idle'    && <><Send className="w-3.5 h-3.5" />Send test email</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 px-4 py-3 border border-border rounded-xl text-sm font-medium hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <><RefreshCw className="w-4 h-4 animate-spin" />Saving…</> : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ CONFIRMATION MODAL ══════════ */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              confirmAction === 'checkin' ? 'bg-emerald-500/10' :
              confirmAction === 'pause'   ? 'bg-amber-500/10' :
              confirmAction === 'resume'  ? 'bg-primary/10' :
              'bg-red-500/10'
            }`}>
              {confirmAction === 'checkin' && <Zap className="w-7 h-7 text-emerald-500" />}
              {confirmAction === 'pause'   && <Pause className="w-7 h-7 text-amber-500" />}
              {confirmAction === 'resume'  && <Play className="w-7 h-7 text-primary" />}
              {confirmAction === 'cancel'  && <XCircle className="w-7 h-7 text-red-500" />}
            </div>

            <h3 className="text-lg font-bold text-foreground text-center mb-2">
              {confirmAction === 'checkin' && 'Confirm Check-in'}
              {confirmAction === 'pause'   && 'Pause Switch?'}
              {confirmAction === 'resume'  && 'Resume Switch?'}
              {confirmAction === 'cancel'  && 'Cancel Release?'}
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-2">
              {confirmAction === 'checkin' && 'This will reset your inactivity timer to zero.'}
              {confirmAction === 'pause'   && 'The switch will be temporarily disabled.'}
              {confirmAction === 'resume'  && 'The switch will be reactivated.'}
              {confirmAction === 'cancel'  && 'This will stop the asset release process.'}
            </p>
            {confirmAction === 'checkin' && (
              <p className="text-xs text-muted-foreground text-center mb-4 flex items-center justify-center gap-1">
                <Mail className="w-3 h-3" />
                A confirmation email will be sent to {user?.email}
              </p>
            )}
            {confirmAction !== 'checkin' && <div className="mb-4" />}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowConfirmModal(false); setConfirmAction(null); }}
                className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction === 'checkin') handleCheckIn();
                  if (confirmAction === 'pause')   handlePause();
                  if (confirmAction === 'resume')  handleResume();
                  if (confirmAction === 'cancel')  handleCancelTrigger();
                }}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all ${
                  confirmAction === 'checkin' ? 'bg-emerald-500 hover:bg-emerald-600' :
                  confirmAction === 'pause'   ? 'bg-amber-500 hover:bg-amber-600' :
                  confirmAction === 'resume'  ? 'bg-primary hover:opacity-90' :
                  'bg-red-500 hover:bg-red-600'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}