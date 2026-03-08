// src/pages/Nominees.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Edit,
  Trash2,
  Send,
  User,
  Briefcase,
  Heart,
  Scale,
  Star,
  ChevronRight,
  Search,
  Copy,
  Check,
  AlertTriangle,
  Sparkles,
  Key,
  FileText,
  Coins,
  StickyNote,
  X,
  Lock,
  Unlock
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { nomineeService, type Nominee, type Relationship, type AccessLevel } from '../services/nomineeService';
import { vaultService } from '../services/vaultService';
import { type Asset } from '../types/vault';

export default function NomineesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedNominee, setSelectedNominee] = useState<Nominee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedNominee, setExpandedNominee] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [grantingAccess, setGrantingAccess] = useState<Record<string, boolean>>({});
  const [grantedAssets, setGrantedAssets] = useState<Record<string, boolean>>({});

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    relationship: 'friend' as Relationship,
    access_level: 'view' as AccessLevel,
    notes: ''
  });

  // Load data
  const loadData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      await nomineeService.initialize(user.id);
      await vaultService.initialize(user.id);
      
      const [nomineesData, assetsData] = await Promise.all([
        nomineeService.getNominees(),
        vaultService.getAssets()
      ]);
      
      setNominees(nomineesData);
      setAssets(assetsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load nominees');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
  }, [user, navigate, loadData]);

  // Check granted assets when expanding a nominee
  const checkGrantedAssets = async (nomineeId: string) => {
    try {
      const access = await nomineeService.getNomineeAccess(nomineeId);
      const grantedMap: Record<string, boolean> = {};
      access.forEach(item => {
        grantedMap[item.asset_id] = true;
      });
      setGrantedAssets(grantedMap);
    } catch (error) {
      console.error('Error checking granted assets:', error);
    }
  };

  useEffect(() => {
    if (expandedNominee) {
      checkGrantedAssets(expandedNominee);
    }
  }, [expandedNominee]);

  // Filter nominees
  const filteredNominees = nominees.filter(nominee => {
    const matchesSearch = 
      nominee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (nominee.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (nominee.notes?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || nominee.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Add nominee
  const handleAddNominee = async () => {
    if (!formData.email) {
      setError('Email is required');
      return;
    }

    try {
      setError('');
      await nomineeService.addNominee({
        email: formData.email,
        name: formData.name || undefined,
        relationship: formData.relationship,
        access_level: formData.access_level,
        notes: formData.notes || undefined
      });

      await loadData();
      setShowAddModal(false);
      setFormData({
        email: '',
        name: '',
        relationship: 'friend',
        access_level: 'view',
        notes: ''
      });
      setSuccess('Nominee added successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Add nominee error:', error);
      setError(error instanceof Error ? error.message : 'Failed to add nominee');
    }
  };

  // Update nominee
  const handleUpdateNominee = async () => {
    if (!selectedNominee) return;

    try {
      setError('');
      await nomineeService.updateNominee(selectedNominee.id, {
        name: formData.name || undefined,
        relationship: formData.relationship,
        access_level: formData.access_level,
        notes: formData.notes || undefined
      });

      await loadData();
      setShowEditModal(false);
      setSelectedNominee(null);
      setSuccess('Nominee updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Update nominee error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update nominee');
    }
  };

  // Resend invitation
  const handleResendInvite = async (nominee: Nominee) => {
    try {
      await nomineeService.resendInvitation(nominee.id);
      setSuccess(`Invitation resent to ${nominee.email}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Resend invitation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to resend invitation');
    }
  };

  // Revoke nominee
  const handleRevoke = async (nominee: Nominee) => {
    try {
      await nomineeService.revokeNominee(nominee.id);
      await loadData();
      setSuccess(`Access revoked for ${nominee.email}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Revoke access error:', error);
      setError(error instanceof Error ? error.message : 'Failed to revoke access');
    }
  };

  // Delete nominee
  const handleDelete = async () => {
    if (!selectedNominee) return;

    try {
      await nomineeService.deleteNominee(selectedNominee.id);
      await loadData();
      setShowDeleteModal(false);
      setSelectedNominee(null);
      setSuccess('Nominee deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Delete nominee error:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete nominee');
    }
  };

  // Grant access to a specific asset
  const handleGrantAccess = async (nomineeId: string, assetId: string) => {
    setGrantingAccess(prev => ({ ...prev, [`${nomineeId}-${assetId}`]: true }));
    
    try {
      await nomineeService.grantAccess(nomineeId, assetId, 'view');
      await checkGrantedAssets(nomineeId);
      setSuccess('Access granted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Grant access error:', error);
      setError(error instanceof Error ? error.message : 'Failed to grant access');
    } finally {
      setGrantingAccess(prev => ({ ...prev, [`${nomineeId}-${assetId}`]: false }));
    }
  };

  // Grant access to all assets
  const handleGrantAllAccess = async (nomineeId: string) => {
    if (!confirm(`Grant access to all ${assets.length} assets?`)) return;
    
    setGrantingAccess(prev => ({ ...prev, [`all-${nomineeId}`]: true }));
    
    try {
      for (const asset of assets) {
        await nomineeService.grantAccess(nomineeId, asset.id, 'view');
      }
      await checkGrantedAssets(nomineeId);
      setSuccess(`Access granted to all ${assets.length} assets`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Grant all access error:', error);
      setError(error instanceof Error ? error.message : 'Failed to grant access to all assets');
    } finally {
      setGrantingAccess(prev => ({ ...prev, [`all-${nomineeId}`]: false }));
    }
  };

  // Copy invite link
  const copyInviteLink = async (nominee: Nominee) => {
    const link = `${window.location.origin}/nominee-access?token=${nominee.invite_token}`;
    await navigator.clipboard.writeText(link);
    setCopiedId(nominee.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending':
        return (
          <span className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'accepted':
        return (
          <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-medium flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Accepted
          </span>
        );
      case 'revoked':
        return (
          <span className="px-2 py-1 bg-red-500/10 text-red-500 rounded-full text-xs font-medium flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Revoked
          </span>
        );
      default:
        return null;
    }
  };

  // Get relationship icon
  const getRelationshipIcon = (relationship: Relationship | null) => {
    switch(relationship) {
      case 'family':
        return <Heart className="w-4 h-4 text-rose-500" />;
      case 'friend':
        return <Star className="w-4 h-4 text-amber-500" />;
      case 'lawyer':
        return <Scale className="w-4 h-4 text-purple-500" />;
      case 'executor':
        return <Briefcase className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // Get access level badge
  const getAccessBadge = (level: AccessLevel) => {
    switch(level) {
      case 'view':
        return <span className="text-xs text-muted-foreground">View only</span>;
      case 'manage':
        return <span className="text-xs text-blue-500">Can manage</span>;
      case 'full':
        return <span className="text-xs text-purple-500">Full access</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Users className="w-6 h-6 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative max-w-7xl mx-auto mt-24 px-4 sm:px-6 lg:px-8 pb-20">
        {/* Header */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-3xl blur-2xl" />
          <div className="relative bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                    Trusted Nominees
                  </h1>
                  <p className="text-muted-foreground mt-1 capitalize">
                    Manage who can access your digital legacy
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="group relative px-6 py-3 bg-gradient-to-br from-primary to-purple-600 text-white rounded-xl hover:opacity-90 transition-all hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Add Nominee
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-500 flex-1">{error}</p>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="text-green-500 flex-1">{success}</p>
            <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{nominees.length}</p>
                <p className="text-xs text-muted-foreground">Total Nominees</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {nominees.filter(n => n.status === 'pending').length}
                </p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {nominees.filter(n => n.status === 'accepted').length}
                </p>
                <p className="text-xs text-muted-foreground">Accepted</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {nominees.filter(n => n.access_level === 'full').length}
                </p>
                <p className="text-xs text-muted-foreground">Full Access</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>

        {/* Nominees List */}
        {filteredNominees.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border rounded-2xl">
            <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
              {searchQuery || statusFilter !== 'all' ? (
                <Search className="w-10 h-10 text-muted-foreground" />
              ) : (
                <Users className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2 capitalize">
              {searchQuery || statusFilter !== 'all' ? 'No matching nominees' : 'No nominees yet'}
            </h3>
            <p className="text-muted-foreground mb-6 capitalize">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start adding trusted people who can access your digital legacy'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all"
              >
                Add Your First Nominee
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNominees.map((nominee) => (
              <div
                key={nominee.id}
                className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all"
              >
                {/* Main Row */}
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left Section - Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="relative">
                        <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                          <span className="text-xl font-bold text-white">
                            {nominee.name?.[0] || nominee.email[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="absolute -bottom-1 -right-1">
                          {getStatusBadge(nominee.status)}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-semibold text-foreground">
                            {nominee.name || 'Unnamed'}
                          </h3>
                          {getRelationshipIcon(nominee.relationship)}
                          <span className="text-xs text-muted-foreground">
                            {nominee.relationship}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="w-4 h-4" />
                            {nominee.email}
                          </span>
                          <span className="flex items-center gap-1">
                            {getAccessBadge(nominee.access_level)}
                          </span>
                        </div>

                        {nominee.notes && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                            📝 {nominee.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className="flex items-center gap-2">
                      {nominee.status === 'pending' && (
                        <>
                          <button
                            onClick={() => copyInviteLink(nominee)}
                            className="p-2 hover:bg-accent rounded-lg transition-colors relative group"
                            title="Copy invite link"
                          >
                            {copiedId === nominee.id ? (
                              <Check className="w-5 h-5 text-green-500" />
                            ) : (
                              <Copy className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
                            )}
                          </button>
                          <button
                            onClick={() => handleResendInvite(nominee)}
                            className="p-2 hover:bg-accent rounded-lg transition-colors"
                            title="Resend invitation"
                          >
                            <Send className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                          </button>
                        </>
                      )}
                      
                      <button
                        onClick={() => {
                          setSelectedNominee(nominee);
                          setFormData({
                            email: nominee.email,
                            name: nominee.name || '',
                            relationship: nominee.relationship || 'friend',
                            access_level: nominee.access_level,
                            notes: nominee.notes || ''
                          });
                          setShowEditModal(true);
                        }}
                        className="p-2 hover:bg-accent rounded-lg transition-colors"
                        title="Edit nominee"
                      >
                        <Edit className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                      </button>

                      {nominee.status !== 'revoked' && (
                        <button
                          onClick={() => handleRevoke(nominee)}
                          className="p-2 hover:bg-amber-500/10 rounded-lg transition-colors"
                          title="Revoke access"
                        >
                          <Lock className="w-5 h-5 text-amber-500" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setSelectedNominee(nominee);
                          setShowDeleteModal(true);
                        }}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete nominee"
                      >
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </button>

                      <button
                        onClick={() => setExpandedNominee(expandedNominee === nominee.id ? null : nominee.id)}
                        className="p-2 hover:bg-accent rounded-lg transition-colors"
                      >
                        <ChevronRight className={`w-5 h-5 transition-transform ${expandedNominee === nominee.id ? 'rotate-90' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Section - Grant Access */}
                  {expandedNominee === nominee.id && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Grant Asset Access to {nominee.name || nominee.email}
                        </h4>
                        
                        {assets.length > 0 && nominee.status === 'accepted' && (
                          <button
                            onClick={() => handleGrantAllAccess(nominee.id)}
                            disabled={grantingAccess[`all-${nominee.id}`]}
                            className="px-3 py-1.5 bg-primary/10 text-primary text-xs rounded-lg hover:bg-primary/20 transition-all flex items-center gap-1 disabled:opacity-50"
                          >
                            {grantingAccess[`all-${nominee.id}`] ? (
                              <>
                                <Clock className="w-3 h-3 animate-spin" />
                                Granting...
                              </>
                            ) : (
                              <>
                                <Unlock className="w-3 h-3" />
                                Grant All
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      {nominee.status !== 'accepted' ? (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                          <p className="text-sm text-amber-600 dark:text-amber-400">
                            Nominee must accept the invitation before you can grant asset access.
                          </p>
                        </div>
                      ) : assets.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
                          No assets available to grant access. Add assets to your vault first.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs text-muted-foreground mb-3">
                            Select which assets {nominee.name || nominee.email} can access:
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {assets.map((asset) => {
                              const isGranted = grantedAssets[asset.id];
                              return (
                                <div key={asset.id} className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                                  isGranted ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/30 hover:bg-muted/50'
                                }`}>
                                  <div className="flex items-center gap-3">
                                    {asset.category === 'password' && <Key className="w-4 h-4 text-blue-500" />}
                                    {asset.category === 'crypto' && <Coins className="w-4 h-4 text-purple-500" />}
                                    {asset.category === 'note' && <StickyNote className="w-4 h-4 text-amber-500" />}
                                    {asset.category === 'document' && <FileText className="w-4 h-4 text-emerald-500" />}
                                    <div>
                                      <span className="text-sm text-foreground block">{asset.name}</span>
                                      <span className="text-xs text-muted-foreground capitalize">{asset.category}</span>
                                    </div>
                                  </div>
                                  {isGranted ? (
                                    <span className="px-3 py-1.5 bg-green-500/20 text-green-600 dark:text-green-400 text-xs rounded-lg flex items-center gap-1">
                                      <Check className="w-3 h-3" />
                                      Granted
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleGrantAccess(nominee.id, asset.id)}
                                      disabled={grantingAccess[`${nominee.id}-${asset.id}`]}
                                      className="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-lg hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-1"
                                    >
                                      {grantingAccess[`${nominee.id}-${asset.id}`] ? (
                                        <>
                                          <Clock className="w-3 h-3 animate-spin" />
                                          Granting...
                                        </>
                                      ) : (
                                        'Grant Access'
                                      )}
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Nominee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Add New Nominee</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-accent rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="sarah@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    autoFocus
                  />
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Sarah Chen"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Relationship */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Relationship
                </label>
                <select
                  value={formData.relationship}
                  onChange={(e) => setFormData({ ...formData, relationship: e.target.value as Relationship })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="family">Family Member</option>
                  <option value="friend">Friend</option>
                  <option value="lawyer">Lawyer</option>
                  <option value="executor">Executor</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Access Level */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Access Level
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-accent">
                    <input
                      type="radio"
                      name="access_level"
                      value="view"
                      checked={formData.access_level === 'view'}
                      onChange={(e) => setFormData({ ...formData, access_level: e.target.value as AccessLevel })}
                      className="w-4 h-4 text-primary"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">View Only</p>
                      <p className="text-xs text-muted-foreground">Can view assets but cannot modify</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-accent">
                    <input
                      type="radio"
                      name="access_level"
                      value="manage"
                      checked={formData.access_level === 'manage'}
                      onChange={(e) => setFormData({ ...formData, access_level: e.target.value as AccessLevel })}
                      className="w-4 h-4 text-primary"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Can Manage</p>
                      <p className="text-xs text-muted-foreground">Can view and manage selected assets</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-border rounded-xl cursor-pointer hover:bg-accent">
                    <input
                      type="radio"
                      name="access_level"
                      value="full"
                      checked={formData.access_level === 'full'}
                      onChange={(e) => setFormData({ ...formData, access_level: e.target.value as AccessLevel })}
                      className="w-4 h-4 text-primary"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Full Access</p>
                      <p className="text-xs text-muted-foreground">Full control over the vault after inheritance</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional information about this nominee..."
                  rows={3}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-3 border border-border rounded-xl hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNominee}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:opacity-90 transition-all"
              >
                Add Nominee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Nominee Modal */}
      {showEditModal && selectedNominee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Edit Nominee</h2>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-accent rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full pl-10 pr-4 py-3 bg-muted border border-border rounded-xl text-muted-foreground cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Relationship */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Relationship
                </label>
                <select
                  value={formData.relationship}
                  onChange={(e) => setFormData({ ...formData, relationship: e.target.value as Relationship })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="family">Family Member</option>
                  <option value="friend">Friend</option>
                  <option value="lawyer">Lawyer</option>
                  <option value="executor">Executor</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Access Level */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Access Level
                </label>
                <select
                  value={formData.access_level}
                  onChange={(e) => setFormData({ ...formData, access_level: e.target.value as AccessLevel })}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="view">View Only</option>
                  <option value="manage">Can Manage</option>
                  <option value="full">Full Access</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-3 border border-border rounded-xl hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateNominee}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:opacity-90 transition-all"
              >
                Update Nominee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedNominee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-foreground text-center mb-2">
              Delete Nominee?
            </h2>
            
            <p className="text-muted-foreground text-center mb-6">
              Are you sure you want to delete <span className="font-medium text-foreground">{selectedNominee.name || selectedNominee.email}</span>? 
              This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 border border-border rounded-xl hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}