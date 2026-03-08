// src/pages/NomineeAccess.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Users,
  CheckCircle,
  AlertCircle,
  User,
  Briefcase,
  Heart,
  Scale,
  Star,
  Key,
  FileText,
  Coins,
  StickyNote,
  Sparkles,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  Clock,
  Mail,
  X,
  AlertTriangle,
  Inbox,
  RefreshCw,
  ChevronRight,
  Check
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { nomineeService, type AccessibleVault, type PendingInvitation } from '../services/nomineeService';
import { vaultService } from '../services/vaultService';
import { encryptionService } from '../services/encryption';
import { type Asset } from '../types/vault';
import { supabase } from '../services/supabase';

export default function NomineeAccessPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ─── State ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'pending' | 'vaults'>('pending');
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [accessibleVaults, setAccessibleVaults] = useState<AccessibleVault[]>([]);
  const [selectedVault, setSelectedVault] = useState<AccessibleVault | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<PendingInvitation | null>(null);
  const [currentVaultId, setCurrentVaultId] = useState<string | null>(null);

  // Vault/decryption state
  const [unlockedVaults, setUnlockedVaults] = useState<Record<string, boolean>>({});
  const [decryptedValues, setDecryptedValues] = useState<Record<string, string>>({});
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [vaultPasswords, setVaultPasswords] = useState<Record<string, string>>({});
  const [decryptingAsset, setDecryptingAsset] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ─── Data Loading ──────────────────────────────────────────────────────────
  const loadData = useCallback(async (showRefreshIndicator = false) => {
    if (!user) return;
    if (showRefreshIndicator) setRefreshing(true);
    else setLoading(true);

    try {
      await nomineeService.initialize(user.id);

      const [pending, vaults] = await Promise.all([
        nomineeService.getPendingInvitations(),
        nomineeService.getAccessibleVaults()
      ]);

      setPendingInvitations(pending);
      setAccessibleVaults(vaults);

      // Auto-switch tab logic
      if (pending.length > 0) {
        setActiveTab('pending');
      } else if (vaults.length > 0) {
        setActiveTab('vaults');
      }
    } catch (err) {
      console.error('Failed to load nominee data:', err);
      setError('Failed to load nominee data. Please try refreshing.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Initial load
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
  }, [user, navigate, loadData]);

  // Real-time subscription for new invitations
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('nominee-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'nominees' },
        async (payload) => {
          const { data: userData } = await supabase.auth.getUser();
          const userEmail = userData.user?.email;
          if (payload.new.email === userEmail) {
            loadData(true);
            setSuccess('New invitation received!');
            setTimeout(() => setSuccess(''), 3000);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'nominees' },
        async (payload) => {
          const { data: userData } = await supabase.auth.getUser();
          const userEmail = userData.user?.email;
          if (payload.new.email === userEmail) {
            loadData(true);
          }
        }
      )
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, [user, loadData]);

  // ─── Invitation Handlers ───────────────────────────────────────────────────
  const handleAcceptInvitation = async () => {
    if (!selectedInvitation) return;
    try {
      setError('');
      await nomineeService.acceptInvitation(selectedInvitation.id);
      await loadData(true);
      setShowAcceptModal(false);
      setSelectedInvitation(null);
      setSuccess('Invitation accepted! You can now access their vault.');
      setActiveTab('vaults');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error('Accept error:', err);
      setError('Failed to accept invitation. Please try again.');
    }
  };

  const handleDeclineInvitation = async () => {
    if (!selectedInvitation) return;
    try {
      setError('');
      await nomineeService.declineInvitation(selectedInvitation.id);
      await loadData(true);
      setShowDeclineModal(false);
      setSelectedInvitation(null);
      setSuccess('Invitation declined.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Decline error:', err);
      setError('Failed to decline invitation. Please try again.');
    }
  };

  // ─── Vault Handlers ────────────────────────────────────────────────────────
  // In handleSelectVault — store the vault for reference
  const handleSelectVault = (vault: AccessibleVault) => {
    setSelectedVault(vault);
    setAssets(vault.assets as unknown as Asset[]);
  };

  // In handleUnlockVault — make sure we pass user_id (owner's userId)
  const handleUnlockVault = (vaultId: string) => {
    setCurrentVaultId(vaultId); // vaultId here must be vault.user_id
    setError('');
    setShowUnlockModal(true);
  };

  const handleVerifyPassword = async () => {
    if (!currentVaultId || !vaultPasswords[currentVaultId]) {
      setError('Please enter the vault password.');
      return;
    }
    setUnlocking(true);
    setError('');
    try {
      // Initialize vault service with the OWNER's userId
      await vaultService.initialize(currentVaultId);

      const isValid = await vaultService.verifyVaultPassword(
        currentVaultId,
        vaultPasswords[currentVaultId]
      );

      if (!isValid) {
        setError('Incorrect vault password. Please try again.');
        setUnlocking(false);
        return;
      }

      // Initialize encryption with owner's salt
      const salt = await vaultService.getSaltForUser(currentVaultId);
      await encryptionService.initialize(vaultPasswords[currentVaultId], salt);

      setUnlockedVaults(prev => ({ ...prev, [currentVaultId]: true }));
      setShowUnlockModal(false);
      setSuccess('Vault unlocked! You can now decrypt assets.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Unlock error:', err);
      setError('Failed to unlock vault. Please check your password.');
    } finally {
      setUnlocking(false);
    }
  };

  const handleDecryptAsset = async (asset: Asset) => {
    if (!selectedVault) return;

    if (!unlockedVaults[selectedVault.user_id]) {
      handleUnlockVault(selectedVault.user_id);
      return;
    }

    if (decryptedValues[asset.id]) return; // already decrypted

    setDecryptingAsset(asset.id);
    try {
      const decrypted = await encryptionService.decrypt(asset.encrypted_data);
      setDecryptedValues(prev => ({ ...prev, [asset.id]: decrypted }));
    } catch (err) {
      console.error('Decrypt error:', err);
      setError('Failed to decrypt this asset. The vault may need to be unlocked again.');
    } finally {
      setDecryptingAsset(null);
    }
  };

  const togglePasswordVisibility = (assetId: string) => {
    setVisiblePasswords(prev => ({ ...prev, [assetId]: !prev[assetId] }));
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setSuccess('Copied to clipboard!');
    setTimeout(() => {
      setCopiedId(null);
      setSuccess('');
    }, 2000);
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const getRelationshipIcon = (relationship: string | null) => {
    switch (relationship) {
      case 'family':   return <Heart className="w-4 h-4 text-rose-500" />;
      case 'friend':   return <Star className="w-4 h-4 text-amber-500" />;
      case 'lawyer':   return <Scale className="w-4 h-4 text-purple-500" />;
      case 'executor': return <Briefcase className="w-4 h-4 text-blue-500" />;
      default:         return <User className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRelationshipLabel = (relationship: string | null) => {
    if (!relationship) return 'Other';
    return relationship.charAt(0).toUpperCase() + relationship.slice(1);
  };

  const getAccessLevelLabel = (level: string) => {
    switch (level) {
      case 'view':   return 'View Only';
      case 'manage': return 'Can Manage';
      case 'full':   return 'Full Access';
      default:       return level;
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'view':   return 'text-sky-500 bg-sky-500/10';
      case 'manage': return 'text-blue-500 bg-blue-500/10';
      case 'full':   return 'text-purple-500 bg-purple-500/10';
      default:       return 'text-muted-foreground bg-muted';
    }
  };

  const getAssetIcon = (category: string) => {
    switch (category) {
      case 'password': return <Key className="w-5 h-5 text-blue-500" />;
      case 'crypto':   return <Coins className="w-5 h-5 text-purple-500" />;
      case 'note':     return <StickyNote className="w-5 h-5 text-amber-500" />;
      case 'document': return <FileText className="w-5 h-5 text-emerald-500" />;
      default:         return <FileText className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getAssetCategoryColor = (category: string) => {
    switch (category) {
      case 'password': return 'bg-blue-500/10 border-blue-500/20';
      case 'crypto':   return 'bg-purple-500/10 border-purple-500/20';
      case 'note':     return 'bg-amber-500/10 border-amber-500/20';
      case 'document': return 'bg-emerald-500/10 border-emerald-500/20';
      default:         return 'bg-muted/50 border-border';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const getInitial = (name: string | null, email: string) => {
    return (name?.[0] || email[0]).toUpperCase();
  };

  // ─── Loading State ─────────────────────────────────────────────────────────
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

  // ─── Main Render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative max-w-7xl mx-auto mt-24 px-4 sm:px-6 lg:px-8 pb-20">

        {/* ── Header ── */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-3xl blur-2xl" />
          <div className="relative bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Users className="w-7 h-7 md:w-8 md:h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
                    Nominee Access
                  </h1>
                  <p className="text-muted-foreground text-sm md:text-base mt-1 capitalize">
                    Manage your invitations & access trusted vaults
                  </p>
                </div>
              </div>

              <button
                onClick={() => loadData(true)}
                disabled={refreshing}
                className="p-3 rounded-xl border border-border hover:bg-accent transition-all disabled:opacity-50 flex-shrink-0"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
              </button>
            </div>

            {/* Stats Strip */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-background/60 rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Inbox className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{pendingInvitations.length}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
              <div className="bg-background/60 rounded-xl p-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{accessibleVaults.length}</p>
                  <p className="text-xs text-muted-foreground">Vaults</p>
                </div>
              </div>
              <div className="bg-background/60 rounded-xl p-3 items-center gap-3 hidden md:flex">
                <div className="w-9 h-9 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Key className="w-4 h-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">
                    {accessibleVaults.reduce((acc, v) => acc + v.assets.length, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Assets</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Messages ── */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-500 text-sm flex-1">{error}</p>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-500 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-green-500 text-sm flex-1">{success}</p>
            <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-500 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-1 mb-8 bg-muted/50 p-1 rounded-xl border border-border w-fit">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'pending'
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Inbox className="w-4 h-4" />
            Invitations
            {pendingInvitations.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === 'pending'
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : 'bg-amber-500/10 text-amber-500 animate-pulse'
              }`}>
                {pendingInvitations.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('vaults')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'vaults'
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Shield className="w-4 h-4" />
            My Vaults
            {accessibleVaults.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeTab === 'vaults'
                  ? 'bg-primary/15 text-primary'
                  : 'bg-primary/10 text-primary'
              }`}>
                {accessibleVaults.length}
              </span>
            )}
          </button>
        </div>

        {/* ════════════════════════════════════════
            TAB: PENDING INVITATIONS
        ════════════════════════════════════════ */}
        {activeTab === 'pending' && (
          <div>
            {pendingInvitations.length === 0 ? (
              <div className="text-center py-20 bg-card border border-border rounded-2xl">
                <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Inbox className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No Pending Invitations</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto capitalize">
                  When someone adds you as a nominee to their vault, you'll see their invitation here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-all hover:border-primary/30"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
                      {/* Left: Inviter info */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                            <span className="text-xl font-bold text-white">
                              {getInitial(invitation.owner_name, invitation.owner_email)}
                            </span>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                            <Clock className="w-3 h-3 text-white" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-foreground truncate">
                              {invitation.owner_name || 'Someone'} invited you
                            </h3>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getAccessLevelColor(invitation.access_level)}`}>
                              {getAccessLevelLabel(invitation.access_level)}
                            </span>
                          </div>

                          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-3">
                            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{invitation.owner_email}</span>
                          </p>

                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              {getRelationshipIcon(invitation.relationship)}
                              <span>{getRelationshipLabel(invitation.relationship)}</span>
                            </div>
                            <span className="w-1 h-1 bg-border rounded-full hidden sm:block" />
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              Invited {formatDate(invitation.invited_at)}
                            </span>
                          </div>

                          {invitation.notes && (
                            <div className="mt-3 p-3 bg-muted/40 border border-border rounded-xl">
                              <p className="text-sm text-muted-foreground">
                                <span className="font-medium text-foreground">Note: </span>
                                {invitation.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex gap-2.5 w-full md:w-auto flex-shrink-0">
                        <button
                          onClick={() => {
                            setSelectedInvitation(invitation);
                            setShowDeclineModal(true);
                          }}
                          className="flex-1 md:flex-none px-5 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-accent hover:border-red-500/30 hover:text-red-500 transition-all"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => {
                            setSelectedInvitation(invitation);
                            setShowAcceptModal(true);
                          }}
                          className="flex-1 md:flex-none px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-medium hover:opacity-90 hover:scale-105 transition-all shadow-sm"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB: ACCESSIBLE VAULTS
        ════════════════════════════════════════ */}
        {activeTab === 'vaults' && (
          <div>
            {accessibleVaults.length === 0 ? (
              <div className="text-center py-20 bg-card border border-border rounded-2xl">
                <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No Vaults Available</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6 capitalize">
                  Accept invitations to gain access to trusted vaults
                </p>
                {pendingInvitations.length > 0 && (
                  <button
                    onClick={() => setActiveTab('pending')}
                    className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-all inline-flex items-center gap-2"
                  >
                    <Inbox className="w-4 h-4" />
                    View Pending Invitations ({pendingInvitations.length})
                  </button>
                )}
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-6">
                {/* ── Vault List (sidebar) ── */}
                <div className="lg:col-span-1 space-y-3">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-4">
                    Your Vaults ({accessibleVaults.length})
                  </h2>
                  {accessibleVaults.map((vault) => (
                    <button
                      key={vault.id}
                      onClick={() => handleSelectVault(vault)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        selectedVault?.id === vault.id
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:border-primary/40 hover:bg-accent'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                          <span className="text-sm font-bold text-white">
                            {getInitial(vault.owner_name, vault.owner_email)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate text-sm">
                            {vault.owner_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {vault.owner_email}
                          </p>
                        </div>
                        <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${
                          selectedVault?.id === vault.id ? 'text-primary rotate-90' : 'text-muted-foreground'
                        }`} />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {getRelationshipIcon(vault.relationship)}
                          <span className="capitalize">{vault.relationship || 'Other'}</span>
                        </div>
                        <span className="w-1 h-1 bg-border rounded-full" />
                        <span className="text-xs text-primary font-medium">
                          {vault.assets.length} asset{vault.assets.length !== 1 ? 's' : ''}
                        </span>
                        {unlockedVaults[vault.user_id] && (
                          <>
                            <span className="w-1 h-1 bg-border rounded-full" />
                            <span className="text-xs text-green-500 flex items-center gap-1">
                              <Unlock className="w-3 h-3" />
                              Unlocked
                            </span>
                          </>
                        )}
                      </div>

                      <div className="mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getAccessLevelColor(vault.access_level)}`}>
                          {getAccessLevelLabel(vault.access_level)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* ── Asset Panel ── */}
                <div className="lg:col-span-2">
                  {!selectedVault ? (
                    <div className="h-full min-h-[400px] bg-card border border-dashed border-border rounded-2xl flex items-center justify-center p-8">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Shield className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Select A Vault</h3>
                        <p className="text-muted-foreground text-sm capitalize">
                          Choose a vault from the list to view and access its assets.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Vault Header */}
                      <div className="flex items-center justify-between mb-5 gap-4">
                        <div>
                          <h2 className="text-lg font-semibold text-foreground">
                            {selectedVault.owner_name || selectedVault.owner_email}'s Vault
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            {assets.length} asset{assets.length !== 1 ? 's' : ''} available
                          </p>
                        </div>

                        {unlockedVaults[selectedVault.user_id] ? (
                          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-sm text-green-600 dark:text-green-400">
                            <Unlock className="w-4 h-4" />
                            Vault Unlocked
                          </div>
                        ) : (
                          <button
                            onClick={() => handleUnlockVault(selectedVault.user_id)}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
                          >
                            <Lock className="w-4 h-4" />
                            Unlock Vault
                          </button>
                        )}
                      </div>

                      {/* Locked Notice */}
                      {!unlockedVaults[selectedVault.user_id] && assets.length > 0 && (
                        <div className="mb-5 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3">
                          <Lock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                              Vault Is Locked
                            </p>
                            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5 capitalize">
                              Enter the vault password to decrypt & view asset contents
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Assets Grid */}
                      {assets.length === 0 ? (
                        <div className="text-center py-16 bg-card border border-border rounded-2xl">
                          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground text-sm">
                            No assets have been shared with you in this vault yet.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {assets.map((asset) => {
                            const isDecrypted = !!decryptedValues[asset.id];
                            const isDecrypting = decryptingAsset === asset.id;
                            const isCopied = copiedId === asset.id;

                            return (
                              <div
                                key={asset.id}
                                className={`border rounded-xl p-4 transition-all hover:shadow-md ${
                                  isDecrypted
                                    ? getAssetCategoryColor(asset.category)
                                    : 'bg-card border-border'
                                }`}
                              >
                                {/* Asset Header */}
                                <div className="flex items-start justify-between mb-3 gap-2">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                                      {getAssetIcon(asset.category)}
                                    </div>
                                    <div className="min-w-0">
                                      <h3 className="font-semibold text-foreground text-sm truncate">{asset.name}</h3>
                                      <p className="text-xs text-muted-foreground capitalize">{asset.category}</p>
                                    </div>
                                  </div>

                                  {isDecrypted && (
                                    <button
                                      onClick={() => copyToClipboard(decryptedValues[asset.id], asset.id)}
                                      className="p-1.5 hover:bg-background/80 rounded-lg transition-colors flex-shrink-0"
                                      title="Copy to clipboard"
                                    >
                                      {isCopied
                                        ? <Check className="w-4 h-4 text-green-500" />
                                        : <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                      }
                                    </button>
                                  )}
                                </div>

                                {/* Decrypted Value or Decrypt Button */}
                                {isDecrypted ? (
                                  <div className="relative">
                                    <div className="p-3 bg-background/80 rounded-lg font-mono text-sm break-all leading-relaxed border border-border/50">
                                      {asset.category === 'password' && !visiblePasswords[asset.id]
                                        ? '••••••••••••••••'
                                        : decryptedValues[asset.id]}
                                    </div>
                                    {asset.category === 'password' && (
                                      <button
                                        onClick={() => togglePasswordVisibility(asset.id)}
                                        className="absolute right-2 top-2.5 p-1 hover:bg-muted rounded transition-colors"
                                      >
                                        {visiblePasswords[asset.id]
                                          ? <EyeOff className="w-4 h-4 text-muted-foreground" />
                                          : <Eye className="w-4 h-4 text-muted-foreground" />
                                        }
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleDecryptAsset(asset)}
                                    disabled={isDecrypting}
                                    className={`w-full p-3 rounded-lg text-sm flex items-center justify-between transition-all ${
                                      unlockedVaults[selectedVault.user_id]
                                        ? 'bg-muted hover:bg-accent text-muted-foreground hover:text-foreground cursor-pointer'
                                        : 'bg-muted/40 text-muted-foreground/60 cursor-not-allowed'
                                    }`}
                                  >
                                    <span>
                                      {isDecrypting
                                        ? 'Decrypting…'
                                        : unlockedVaults[selectedVault.user_id]
                                          ? 'Click to reveal'
                                          : 'Unlock vault to view'
                                      }
                                    </span>
                                    {isDecrypting ? (
                                      <RefreshCw className="w-4 h-4 animate-spin" />
                                    ) : unlockedVaults[selectedVault.user_id] ? (
                                      <Eye className="w-4 h-4" />
                                    ) : (
                                      <Lock className="w-4 h-4" />
                                    )}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════
          MODAL: ACCEPT INVITATION
      ════════════════════════════════════════ */}
      {showAcceptModal && selectedInvitation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>

            <h2 className="text-2xl font-bold text-foreground text-center mb-2">
              Accept Invitation?
            </h2>
            <p className="text-muted-foreground text-center text-sm mb-2">
              You'll be added as a nominee to
            </p>
            <p className="text-center font-semibold text-foreground mb-1">
              {selectedInvitation.owner_name || selectedInvitation.owner_email}'s vault
            </p>
            <p className="text-center mb-6">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getAccessLevelColor(selectedInvitation.access_level)}`}>
                {getAccessLevelLabel(selectedInvitation.access_level)}
              </span>
            </p>

            <div className="p-3 bg-muted/50 rounded-xl text-xs text-muted-foreground text-center mb-6">
              You'll be able to access the assets they've chosen to share with you.
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowAcceptModal(false); setSelectedInvitation(null); }}
                className="flex-1 px-4 py-3 border border-border rounded-xl text-sm font-medium hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptInvitation}
                className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 transition-all shadow-sm"
              >
                Accept Invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          MODAL: DECLINE INVITATION
      ════════════════════════════════════════ */}
      {showDeclineModal && selectedInvitation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>

            <h2 className="text-2xl font-bold text-foreground text-center mb-2">
              Decline Invitation?
            </h2>
            <p className="text-muted-foreground text-center text-sm mb-6">
              Are you sure you want to decline the invitation from{' '}
              <span className="font-medium text-foreground">
                {selectedInvitation.owner_name || selectedInvitation.owner_email}
              </span>?
              This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeclineModal(false); setSelectedInvitation(null); }}
                className="flex-1 px-4 py-3 border border-border rounded-xl text-sm font-medium hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeclineInvitation}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all shadow-sm"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          MODAL: UNLOCK VAULT
      ════════════════════════════════════════ */}
      {showUnlockModal && currentVaultId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Lock className="w-8 h-8 text-primary" />
            </div>

            <h2 className="text-2xl font-bold text-foreground text-center mb-2">
              Unlock Vault
            </h2>
            <p className="text-muted-foreground text-center text-sm mb-6">
              Enter the vault password provided by the owner to decrypt and view assets.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            <div className="relative mb-6">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={vaultPasswords[currentVaultId] || ''}
                onChange={(e) => setVaultPasswords(prev => ({
                  ...prev,
                  [currentVaultId]: e.target.value
                }))}
                onKeyDown={(e) => e.key === 'Enter' && !unlocking && handleVerifyPassword()}
                placeholder="Enter vault password"
                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                autoFocus
                disabled={unlocking}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowUnlockModal(false);
                  setCurrentVaultId(null);
                  setError('');
                }}
                className="flex-1 px-4 py-3 border border-border rounded-xl text-sm font-medium hover:bg-accent transition-colors"
                disabled={unlocking}
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyPassword}
                disabled={unlocking || !vaultPasswords[currentVaultId]}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {unlocking ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Unlocking…
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    Unlock
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}