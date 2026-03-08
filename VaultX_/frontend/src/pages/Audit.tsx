// src/pages/Audit.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Shield,
  Clock,
  Calendar,
  Download,
  Filter,
  X,
  XCircle,
  Search,
  ChevronLeft,
  Eye,
  Copy,
  Sparkles,
  Check,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Key,
  FileText,
  Settings,
  RefreshCw,
  LogIn,
  LogOut,
  Lock,
  Unlock,
  UserPlus,
  UserCheck,
  UserX,
  PieChart,
  TrendingUp,
  HeartPulse,
  Trash2,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { auditService, type AuditLog, type AuditEventType, type AuditFilter } from '../services/auditService';
import { format, formatDistanceToNow, subDays } from 'date-fns';

export default function AuditPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pageSize] = useState(20);
  const [exporting, setExporting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    totalEvents: number;
    byType: Record<string, number>;
    last7Days: number;
    last30Days: number;
  } | null>(null);

  // Filter state
  const [filters, setFilters] = useState<AuditFilter>({
    event_type: [],
    start_date: subDays(new Date(), 30),
    end_date: new Date(),
    search: ''
  });

  // Available event types for filtering
  const eventTypes: { value: AuditEventType; label: string; icon: React.ElementType; color: string }[] = [
    { value: 'vault_created', label: 'Vault Created', icon: Shield, color: 'text-blue-500' },
    { value: 'vault_accessed', label: 'Vault Accessed', icon: Eye, color: 'text-blue-500' },
    { value: 'asset_added', label: 'Asset Added', icon: Key, color: 'text-emerald-500' },
    { value: 'asset_updated', label: 'Asset Updated', icon: FileText, color: 'text-amber-500' },
    { value: 'asset_deleted', label: 'Asset Deleted', icon: Trash2, color: 'text-red-500' },
    { value: 'asset_decrypted', label: 'Asset Decrypted', icon: Unlock, color: 'text-purple-500' },
    { value: 'nominee_added', label: 'Nominee Added', icon: UserPlus, color: 'text-emerald-500' },
    { value: 'nominee_accepted', label: 'Nominee Accepted', icon: UserCheck, color: 'text-green-500' },
    { value: 'nominee_revoked', label: 'Nominee Revoked', icon: UserX, color: 'text-red-500' },
    { value: 'access_granted', label: 'Access Granted', icon: Unlock, color: 'text-emerald-500' },
    { value: 'access_revoked', label: 'Access Revoked', icon: Lock, color: 'text-red-500' },
    { value: 'deadman_checkin', label: 'Dead Man Check-in', icon: HeartPulse, color: 'text-emerald-500' },
    { value: 'deadman_triggered', label: 'Dead Man Triggered', icon: AlertTriangle, color: 'text-red-500' },
    { value: 'deadman_released', label: 'Dead Man Released', icon: Unlock, color: 'text-purple-500' },
    { value: 'deadman_cancelled', label: 'Dead Man Cancelled', icon: XCircle, color: 'text-blue-500' },
    { value: 'settings_updated', label: 'Settings Updated', icon: Settings, color: 'text-muted-foreground' },
    { value: 'login', label: 'Login', icon: LogIn, color: 'text-blue-500' },
    { value: 'logout', label: 'Logout', icon: LogOut, color: 'text-amber-500' }
  ];

  // Load audit logs
  const loadLogs = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError('');
      await auditService.initialize(user.id);

      const { logs: data, total } = await auditService.getLogs(currentPage, pageSize, filters);
      setLogs(data);
      setTotalItems(total);
      setTotalPages(Math.ceil(total / pageSize));

      // Load summary
      const summaryData = await auditService.getSummary();
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      setError('Failed to load audit logs. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, pageSize, filters]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadLogs();
  }, [user, navigate, loadLogs]);

  // Handle filter changes
  const handleFilterChange = (key: keyof AuditFilter, value: unknown) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Toggle event type filter
  const toggleEventType = (type: AuditEventType) => {
    setFilters(prev => ({
      ...prev,
      event_type: prev.event_type?.includes(type)
        ? prev.event_type.filter(t => t !== type)
        : [...(prev.event_type || []), type]
    }));
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      event_type: [],
      start_date: subDays(new Date(), 30),
      end_date: new Date(),
      search: ''
    });
    setCurrentPage(1);
  };

  // Export logs as CSV
  const handleExport = async () => {
    try {
      setExporting(true);
      setError('');
      
      const csv = await auditService.exportLogs(filters);
      
      // Create download link
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vaultx-audit-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      setSuccess('Audit log exported successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Export error:', err);
      setError('Failed to export audit logs');
    } finally {
      setExporting(false);
    }
  };

  // Copy log ID to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Get icon for event type
  const getEventIcon = (type: string) => {
    const event = eventTypes.find(e => e.value === type);
    const Icon = event?.icon || Activity;
    const color = event?.color || 'text-muted-foreground';
    return { Icon, color };
  };

  // Format metadata for display
  const formatMetadata = (metadata: Record<string, unknown>) => {
    if (!metadata || Object.keys(metadata).length === 0) return null;
    
    return Object.entries(metadata).map(([key, value]) => (
      <div key={key} className="flex items-start gap-2 text-xs">
        <span className="text-muted-foreground font-mono">{key}:</span>
        <span className="text-foreground font-mono break-all">
          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
        </span>
      </div>
    ));
  };

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary animate-pulse" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm animate-pulse">Loading audit logs…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Decorative background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary/5 rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto mt-24 px-4 sm:px-6 lg:px-8 pb-20">

        {/* ── Header ── */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-primary/10 rounded-3xl blur-2xl" />
          <div className="relative bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Activity className="w-7 h-7 md:w-8 md:h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">Audit Logs</h1>
                  <p className="text-muted-foreground text-sm mt-1 capitalize">
                    Track all activities & changes in your vault
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl transition-all text-sm font-medium ${
                    showFilters || filters.event_type?.length || filters.search
                      ? 'bg-primary/10 border-primary/30 text-primary'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {(filters.event_type?.length || filters.search) && (
                    <span className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </button>
                <button
                  onClick={handleExport}
                  disabled={exporting || logs.length === 0}
                  className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl hover:bg-accent transition-all text-sm font-medium disabled:opacity-50"
                >
                  {exporting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Messages ── */}
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

        {/* ── Summary Cards ── */}
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{summary.totalEvents}</p>
                  <p className="text-xs text-muted-foreground">Total Events (30d)</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{summary.last7Days}</p>
                  <p className="text-xs text-muted-foreground">Last 7 Days</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Calendar className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{summary.last30Days}</p>
                  <p className="text-xs text-muted-foreground">Last 30 Days</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <PieChart className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {Object.keys(summary.byType).length}
                  </p>
                  <p className="text-xs text-muted-foreground">Event Types</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Filters Panel ── */}
        {showFilters && (
          <div className="mb-6 p-6 bg-card border border-border rounded-xl animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter Events
              </h3>
              <button
                onClick={clearFilters}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear all
              </button>
            </div>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search by description..."
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                {filters.search && (
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">From</label>
                <input
                  type="date"
                  value={filters.start_date ? format(filters.start_date, 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleFilterChange('start_date', e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">To</label>
                <input
                  type="date"
                  value={filters.end_date ? format(filters.end_date, 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleFilterChange('end_date', e.target.value ? new Date(e.target.value) : undefined)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* Event Types */}
            <div>
              <label className="block text-xs text-muted-foreground mb-2">Event Types</label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-1">
                {eventTypes.map(({ value, label, icon: Icon, color }) => {
                  const isSelected = filters.event_type?.includes(value);
                  return (
                    <button
                      key={value}
                      onClick={() => toggleEventType(value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                        isSelected
                          ? 'bg-primary/10 text-primary border border-primary/30'
                          : 'bg-muted/30 hover:bg-muted/50 border border-transparent'
                      }`}
                    >
                      <Icon className={`w-3 h-3 ${color}`} />
                      <span className="truncate">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Results Info ── */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {logs.length} of {totalItems} events
          </p>
          {logs.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
          )}
        </div>

        {/* ── Audit Log List ── */}
        {logs.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border rounded-2xl">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <Activity className="w-20 h-20 text-muted-foreground/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Search className="w-8 h-8 text-muted-foreground/40" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No events found</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              {filters.event_type?.length || filters.search || filters.start_date !== subDays(new Date(), 30)
                ? 'Try adjusting your filters to see more results'
                : 'Your audit log will appear here as you use VaultX'}
            </p>
            {(filters.event_type?.length || filters.search || filters.start_date !== subDays(new Date(), 30)) && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-all"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const { Icon, color } = getEventIcon(log.event_type);
              const isExpanded = expandedLog === log.id;
              
              return (
                <div
                  key={log.id}
                  className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-all"
                >
                  {/* Main row */}
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${color.replace('text', 'bg')}/10 flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground">
                            {eventTypes.find(e => e.value === log.event_type)?.label || log.event_type}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                            {log.event_type}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">{log.description}</p>
                        
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </span>
                          <span className="text-muted-foreground">
                            {format(new Date(log.created_at), 'MMM d, yyyy • h:mm a')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(log.id, log.id)}
                          className="p-2 hover:bg-accent rounded-lg transition-colors"
                          title="Copy event ID"
                        >
                          {copiedId === log.id ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                        <button
                          onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                          className="p-2 hover:bg-accent rounded-lg transition-colors"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded metadata */}
                  {isExpanded && log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/20">
                      <p className="text-xs font-medium text-foreground mb-2">Additional Details</p>
                      <div className="space-y-1">
                        {formatMetadata(log.metadata)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ChevronRight component
const ChevronRight = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);