// src/pages/Vault.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Key, 
  Coins, 
  FileText, 
  StickyNote,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  CheckCircle,
  AlertCircle,
  Lock,
  Unlock,
  Shield,
  KeyRound,
  HelpCircle,
  Search,
  Filter,
  ArrowUpDown,
  Grid3x3,
  List,
  X,
  ChevronDown,
  FolderLock,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { vaultService } from '../services/vaultService';
import { encryptionService } from '../services/encryption';
import { supabase } from '../services/supabase';
import { type Asset, type AssetCategory, categoryConfig } from '../types/vault';

type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'category';
type ViewMode = 'grid' | 'list';

export default function VaultPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasVaultPassword, setHasVaultPassword] = useState<boolean | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [ , ] = useState<string | null>(null);
  const [decryptedValues, setDecryptedValues] = useState<Record<string, string>>({});
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [reauthPassword, setReauthPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Form state for new asset
  const [formData, setFormData] = useState({
    name: '',
    category: 'password' as AssetCategory,
    value: '',
    username: '',
    url: '',
    notes: ''
  });

  // Categories for filter
  const categories = [
    { value: 'all', label: 'All Categories', icon: FolderLock },
    { value: 'password', label: 'Passwords', icon: Key },
    { value: 'crypto', label: 'Crypto Wallets', icon: Coins },
    { value: 'note', label: 'Secure Notes', icon: StickyNote },
    { value: 'document', label: 'Documents', icon: FileText },
  ];

  // Apply filters and sorting
  useEffect(() => {
    let result = [...assets];

    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(asset => asset.category === selectedCategory);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(asset => 
        asset.name.toLowerCase().includes(query) ||
        asset.metadata?.username?.toLowerCase().includes(query) ||
        asset.metadata?.notes?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    setFilteredAssets(result);
  }, [assets, selectedCategory, searchQuery, sortBy]);

  // Check if vault has password and load assets
  const initializeVault = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      await vaultService.initialize(user.id);
      
      // Check if vault password exists
      const hasPassword = await vaultService.hasVaultPasswordSet(user.id);
      setHasVaultPassword(hasPassword);
      
      if (hasPassword) {
        // Load assets but keep them encrypted - assets are loaded but not displayed until unlocked
        const data = await vaultService.getAssets();
        setAssets(data);
      }
    } catch (err) {
      console.error('Failed to initialize vault:', err);
      setError('Failed to load vault');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    initializeVault();
  }, [user, navigate, initializeVault]);

  // Check if encryption is already initialized
  useEffect(() => {
    if (encryptionService.isInitialized()) {
      setIsUnlocked(true);
    } else {
      setIsUnlocked(false);
    }
  }, []);

  // Show setup modal if no vault password
  useEffect(() => {
    if (hasVaultPassword === false && !showSetupModal) {
      setShowSetupModal(true);
    }
  }, [hasVaultPassword, showSetupModal]);

  // Set up initial vault password
  const handleSetupVault = async () => {
    if (!password) {
      setError('Please enter a password');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setError('');
      await vaultService.setVaultPassword(user!.id, password);
      
      // Initialize encryption
      const salt = await vaultService.getSaltForUser(user!.id);
      await encryptionService.initialize(password, salt);
      
      setHasVaultPassword(true);
      setIsUnlocked(true);
      setShowSetupModal(false);
      setPassword('');
      setConfirmPassword('');
      setSuccess('Vault password set successfully');
      
      // Reload assets
      const data = await vaultService.getAssets();
      setAssets(data);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Setup error:', err);
      setError('Failed to set vault password');
    }
  };

  // Unlock vault with password and optionally decrypt selected asset
  const handleUnlock = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }
  
    try {
      setError('');
      console.log('Attempting to unlock vault with password');
      
      // Verify password
      const isValid = await vaultService.verifyVaultPassword(user!.id, password);
      console.log('Password verification result:', isValid);
      
      if (!isValid) {
        setError('Invalid password');
        setPassword('');
        return;
      }
  
      // Initialize encryption
      console.log('Password verified, initializing encryption');
      const salt = await vaultService.getSaltForUser(user!.id);
      await encryptionService.initialize(password, salt);
      
      setIsUnlocked(true);
      console.log('Encryption initialized successfully');
      
      setShowUnlockModal(false);
      setPassword('');
      setSuccess('Vault unlocked successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Unlock error details:', err);
      setError(`Failed to unlock vault: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Handle re-authentication for changing password
  const handleReauth = async () => {
    if (!reauthPassword) {
      setError('Please enter your password');
      return;
    }

    try {
      setError('');
      
      // Verify password
      const isValid = await vaultService.verifyVaultPassword(user!.id, reauthPassword);
      
      if (!isValid) {
        setError('Invalid password');
        setReauthPassword('');
        return;
      }

      // Close reauth modal and open change password modal
      setShowReauthModal(false);
      setShowChangePasswordModal(true);
      
    } catch (err) {
      console.error('Reauth error:', err);
      setError('Failed to verify password');
    }
  };

  // Handle forgot password - reset vault (all assets will be lost)
  const handleForgotPassword = async () => {
    if (!confirm('WARNING: This will delete ALL your encrypted assets. You will lose access to all stored passwords, crypto keys, and notes. Are you ABSOLUTELY sure?')) {
      return;
    }

    try {
      setError('');
      
      // Delete all assets
      const assetsList = await vaultService.getAssets();
      for (const asset of assetsList) {
        await vaultService.deleteAsset(asset.id);
      }
      
      // Remove vault password hash
      await supabase
        .from('vaults')
        .update({ vault_password_hash: null })
        .eq('user_id', user!.id);
      
      setHasVaultPassword(false);
      setIsUnlocked(false);
      setAssets([]);
      setShowForgotModal(false);
      setShowSetupModal(true); // Prompt to set new password
      
      setSuccess('Vault has been reset. Please set a new password.');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Reset error:', err);
      setError('Failed to reset vault');
    }
  };

  // Change vault password
  const handleChangePassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      setError('');
      await vaultService.changeVaultPassword(user!.id, reauthPassword, newPassword);
      
      setShowChangePasswordModal(false);
      setReauthPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setSuccess('Vault password changed successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Change password error:', err);
      setError('Failed to change password');
    }
  };

  // Decrypt a single asset
  const decryptAsset = async (asset: Asset) => {
    console.log('Attempting to decrypt asset:', asset.id, 'Category:', asset.category);
  
    if (isUnlocked && encryptionService.isInitialized()) {
      try {
        console.log('Vault is unlocked, decrypting directly');
        const decrypted = await encryptionService.decrypt(asset.encrypted_data);
        console.log('Decryption successful');
        setDecryptedValues(prev => ({ ...prev, [asset.id]: decrypted }));
      } catch (err) {
        console.error('Decrypt error details:', err);
        setError(`Failed to decrypt: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
      return;
    }
  
    // Show unlock modal
    setShowUnlockModal(true);
  };

  // Toggle password visibility
  const toggleVisibility = (assetId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [assetId]: !prev[assetId]
    }));
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard');
    setTimeout(() => setSuccess(''), 2000);
  };

  // Add new asset
  const handleAddAsset = async () => {
    if (!formData.name || !formData.value) {
      setError('Name and value are required');
      return;
    }

    if (!isUnlocked) {
      setShowUnlockModal(true);
      return;
    }

    try {
      setError('');
      await vaultService.createAsset({
        name: formData.name,
        category: formData.category,
        value: formData.value,
        metadata: {
          username: formData.username,
          url: formData.url,
          notes: formData.notes
        }
      });

      await initializeVault(); // Reload assets
      setShowAddModal(false);
      setFormData({
        name: '',
        category: 'password',
        value: '',
        username: '',
        url: '',
        notes: ''
      });
      setSuccess('Asset added successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Add asset error:', err);
      setError('Failed to add asset');
    }
  };

  // Delete asset
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      setError('');
      await vaultService.deleteAsset(id);
      setAssets(prev => prev.filter(a => a.id !== id));
      setDecryptedValues(prev => {
        const newValues = { ...prev };
        delete newValues[id];
        return newValues;
      });
      setSuccess('Asset deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete asset');
    }
  };

  // Get icon for category
  const getCategoryIcon = (category: AssetCategory) => {
    switch(category) {
      case 'password': return <Key className="w-5 h-5" />;
      case 'crypto': return <Coins className="w-5 h-5" />;
      case 'document': return <FileText className="w-5 h-5" />;
      case 'note': return <StickyNote className="w-5 h-5" />;
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortBy('newest');
  };

  if (loading || hasVaultPassword === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto mt-28    px-4 sm:px-6 lg:px-8 pb-12">
        {/* Header Section with Gradient */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-3xl -z-10" />
          <div className="relative bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                    Your Digital Vault
                  </h1>
                  <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <Lock className="w-4 h-4" />
                    {isUnlocked ? (
                      <span className="text-green-500">Vault Unlocked</span>
                    ) : (
                      <span className="text-amber-500">Vault Locked</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {!isUnlocked ? (
                  <button
                    onClick={() => setShowUnlockModal(true)}
                    className="group relative px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-primary-foreground rounded-xl hover:opacity-90 transition-all hover:scale-105 overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Unlock className="w-5 h-5" />
                      Unlock Vault
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setShowReauthModal(true)}
                      className="flex items-center gap-2 px-4 py-3 border border-border rounded-xl hover:bg-accent transition-all"
                      title="Change vault password"
                    >
                      <KeyRound className="w-5 h-5" />
                      <span className="hidden sm:inline">Change Password</span>
                    </button>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="group relative px-6 py-3 bg-gradient-to-r from-primary to-purple-600 text-primary-foreground rounded-xl hover:opacity-90 transition-all hover:scale-105 overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Add Asset
                      </span>
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-shake">
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

        {/* Filter Bar - Only show when vault is unlocked */}
        {isUnlocked && (
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, username, or notes..."
                  className="w-full pl-10 pr-10 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                {/* Filter Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-3 border rounded-xl flex items-center gap-2 transition-all ${
                    showFilters || selectedCategory !== 'all'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  <Filter className="w-5 h-5" />
                  <span className="hidden sm:inline">Filters</span>
                  {(selectedCategory !== 'all' || searchQuery) && (
                    <span className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </button>

                {/* Sort Button */}
                <div className="relative">
                  <button
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    className="px-4 py-3 border border-border rounded-xl flex items-center gap-2 hover:bg-accent transition-all"
                  >
                    <ArrowUpDown className="w-5 h-5" />
                    <span className="hidden sm:inline">Sort</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Sort Menu */}
                  {showSortMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
                      <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                        {[
                          { value: 'newest', label: 'Newest First' },
                          { value: 'oldest', label: 'Oldest First' },
                          { value: 'name-asc', label: 'Name (A-Z)' },
                          { value: 'name-desc', label: 'Name (Z-A)' },
                          { value: 'category', label: 'Category' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setSortBy(option.value as SortOption);
                              setShowSortMenu(false);
                            }}
                            className={`w-full px-4 py-3 text-left hover:bg-accent transition-colors flex items-center gap-2 ${
                              sortBy === option.value ? 'bg-primary/10 text-primary' : ''
                            }`}
                          >
                            <ArrowUpDown className="w-4 h-4" />
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* View Toggle */}
                <div className="flex border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-3 transition-colors ${
                      viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                    }`}
                  >
                    <Grid3x3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-3 transition-colors ${
                      viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                    }`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Category Filters */}
            {showFilters && (
              <div className="p-4 bg-card border border-border rounded-xl animate-slideDown">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filter by Category
                  </h3>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    const isActive = selectedCategory === category.value;
                    return (
                      <button
                        key={category.value}
                        onClick={() => setSelectedCategory(category.value as typeof selectedCategory)}
                        className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg scale-105'
                            : 'border border-border hover:bg-accent'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {category.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Locked State - Assets Hidden */}
        {!isUnlocked ? (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background pointer-events-none" />
            <div className="text-center py-20 bg-card/50 border border-border rounded-2xl backdrop-blur-sm">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Lock className="w-12 h-12 text-primary/50" />
                </div>
                <div className="absolute inset-0 animate-pulse">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-3xl mx-auto" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Vault is Locked</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto capitalize">
                Your digital assets are encrypted & secure. <br /> Unlock the vault to view & manage your assets.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowUnlockModal(true)}
                  className="group relative px-8 py-4 bg-gradient-to-r from-primary to-purple-600 text-primary-foreground rounded-xl hover:opacity-90 transition-all hover:scale-105 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Unlock className="w-5 h-5" />
                    Unlock Vault
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                </button>
                <button
                  onClick={() => setShowForgotModal(true)}
                  className="px-8 py-4 border border-border bg-card text-foreground rounded-xl hover:bg-accent transition-all"
                >
                  Forgot Password?
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Assets Grid/List - Only shown when unlocked */
          <>
            {/* Results Info */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Showing {filteredAssets.length} of {assets.length} assets
              </p>
              {filteredAssets.length === 0 && assets.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* Assets Display */}
            {filteredAssets.length === 0 ? (
              <div className="text-center py-20 bg-card border border-border rounded-2xl">
                <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {searchQuery || selectedCategory !== 'all' ? (
                    <Search className="w-10 h-10 text-muted-foreground" />
                  ) : (
                    <FolderLock className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {searchQuery || selectedCategory !== 'all' ? 'No matching assets' : 'No assets yet'}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || selectedCategory !== 'all' 
                    ? 'Try adjusting your filters or search query'
                    : 'Start adding your digital assets to the vault'}
                </p>
                {(searchQuery || selectedCategory !== 'all') && (
                  <button
                    onClick={clearFilters}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="group bg-card border border-border rounded-xl p-5 hover:shadow-xl transition-all hover:-translate-y-1"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryConfig[asset.category].gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                          {getCategoryIcon(asset.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{asset.name}</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {getCategoryIcon(asset.category)}
                            {categoryConfig[asset.category].label}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(asset.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete asset"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>

                    {/* Value */}
                    <div className="mb-4">
                      {decryptedValues[asset.id] ? (
                        <div className="relative">
                          <div className="p-3 bg-muted rounded-lg font-mono text-sm break-all">
                            {asset.category === 'password' && !visiblePasswords[asset.id] 
                              ? '••••••••••••' 
                              : decryptedValues[asset.id]}
                          </div>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                            {asset.category === 'password' && (
                              <button
                                onClick={() => toggleVisibility(asset.id)}
                                className="p-1.5 hover:bg-background rounded-lg transition-colors"
                                title={visiblePasswords[asset.id] ? "Hide password" : "Show password"}
                              >
                                {visiblePasswords[asset.id] 
                                  ? <EyeOff className="w-4 h-4" /> 
                                  : <Eye className="w-4 h-4" />}
                              </button>
                            )}
                            <button
                              onClick={() => copyToClipboard(decryptedValues[asset.id])}
                              className="p-1.5 hover:bg-background rounded-lg transition-colors"
                              title="Copy to clipboard"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => decryptAsset(asset)}
                          className="w-full p-3 bg-muted rounded-lg text-muted-foreground hover:bg-accent transition-colors text-left flex items-center justify-between group/btn"
                        >
                          <span>Click to decrypt</span>
                          <Lock className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        </button>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="space-y-1 text-sm">
                      {asset.metadata?.username && (
                        <div className="text-muted-foreground truncate" title={asset.metadata.username}>
                          <span className="text-xs font-medium text-foreground">Username:</span> {asset.metadata.username}
                        </div>
                      )}
                      {asset.metadata?.url && (
                        <div className="text-muted-foreground truncate" title={asset.metadata.url}>
                          <span className="text-xs font-medium text-foreground">URL:</span> {asset.metadata.url}
                        </div>
                      )}
                    </div>

                    {/* Date */}
                    <div className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
                      <span>Added {new Date(asset.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="divide-y divide-border">
                  {filteredAssets.map((asset) => (
                    <div key={asset.id} className="p-4 hover:bg-accent/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${categoryConfig[asset.category].gradient} flex items-center justify-center flex-shrink-0`}>
                          {getCategoryIcon(asset.category)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-foreground">{asset.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {new Date(asset.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            {/* Decrypted Value */}
                            <div>
                              {decryptedValues[asset.id] ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-foreground">Value:</span>
                                  <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                                    {asset.category === 'password' && !visiblePasswords[asset.id] 
                                      ? '••••••••••••' 
                                      : decryptedValues[asset.id]}
                                  </code>
                                  <div className="flex gap-1">
                                    {asset.category === 'password' && (
                                      <button
                                        onClick={() => toggleVisibility(asset.id)}
                                        className="p-1 hover:bg-background rounded"
                                      >
                                        {visiblePasswords[asset.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                      </button>
                                    )}
                                    <button
                                      onClick={() => copyToClipboard(decryptedValues[asset.id])}
                                      className="p-1 hover:bg-background rounded"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => decryptAsset(asset)}
                                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                                >
                                  <Lock className="w-3 h-3" />
                                  Click to decrypt
                                </button>
                              )}
                            </div>

                            {/* Username */}
                            {asset.metadata?.username && (
                              <div className="text-sm text-muted-foreground truncate">
                                <span className="text-xs font-medium text-foreground">Username:</span> {asset.metadata.username}
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Delete asset"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* All Modals remain the same as before... */}
      {/* Setup Vault Password Modal */}
      {showSetupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Set Vault Password</h2>
            <p className="text-muted-foreground mb-6 text-center">
              This password will be used to encrypt all your assets. It is separate from your login password.
            </p>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter vault password"
              className="w-full p-3 bg-background border border-border rounded-xl mb-4"
              autoFocus
            />

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm vault password"
              className="w-full p-3 bg-background border border-border rounded-xl mb-6"
              onKeyDown={(e) => e.key === 'Enter' && handleSetupVault()}
            />

            <div className="text-xs text-muted-foreground mb-6 p-3 bg-amber-500/10 rounded-lg">
              <p className="font-medium text-amber-500 mb-1">⚠️ Important:</p>
              <p>This password cannot be recovered. If you forget it, all your encrypted data will be permanently lost.</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSetupVault}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all"
              >
                Set Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlock Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-foreground mb-4">Unlock Vault</h2>
            <p className="text-muted-foreground mb-6">
              Enter your vault password to access your assets
            </p>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter vault password"
              className="w-full p-3 bg-background border border-border rounded-xl mb-4"
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              autoFocus
            />

            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowForgotModal(true)}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <HelpCircle className="w-4 h-4" />
                Forgot password?
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowUnlockModal(false);
                  setPassword('');
                  setError('');
                }}
                className="flex-1 px-4 py-3 border border-border rounded-xl hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUnlock}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Re-authentication Modal */}
      {showReauthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full">
            <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Verify Identity</h2>
            <p className="text-muted-foreground mb-6 text-center">
              For security, please enter your current password
            </p>

            <input
              type="password"
              value={reauthPassword}
              onChange={(e) => setReauthPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full p-3 bg-background border border-border rounded-xl mb-6"
              onKeyDown={(e) => e.key === 'Enter' && handleReauth()}
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowReauthModal(false);
                  setReauthPassword('');
                  setError('');
                }}
                className="flex-1 px-4 py-3 border border-border rounded-xl hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReauth}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Change Vault Password</h2>
            <p className="text-muted-foreground mb-6 text-center">
              Enter your new vault password
            </p>

            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              className="w-full p-3 bg-background border border-border rounded-xl mb-4"
              autoFocus
            />

            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full p-3 bg-background border border-border rounded-xl mb-6"
              onKeyDown={(e) => e.key === 'Enter' && handleChangePassword()}
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setNewPassword('');
                  setConfirmNewPassword('');
                  setError('');
                }}
                className="flex-1 px-4 py-3 border border-border rounded-xl hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Reset Vault?</h2>
            <p className="text-muted-foreground mb-4 text-center">
              If you've forgotten your vault password, the only way to regain access is to reset your vault.
            </p>
            
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-red-500 text-sm font-medium mb-2">⚠️ This action CANNOT be undone!</p>
              <p className="text-red-500/80 text-sm">
                All your stored passwords, crypto keys, and notes will be permanently deleted. You will lose access to ALL your digital assets.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowForgotModal(false)}
                className="flex-1 px-4 py-3 border border-border rounded-xl hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleForgotPassword}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all"
              >
                Reset Vault
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-foreground mb-6">Add New Asset</h2>

            <div className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as AssetCategory })}
                  className="w-full p-3 bg-background border border-border rounded-xl"
                >
                  <option value="password">Password</option>
                  <option value="crypto">Crypto Wallet</option>
                  <option value="note">Secure Note</option>
                  <option value="document">Document</option>
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Gmail, MetaMask, etc."
                  className="w-full p-3 bg-background border border-border rounded-xl"
                />
              </div>

              {/* Value */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {formData.category === 'password' ? 'Password' :
                   formData.category === 'crypto' ? 'Private Key / Seed Phrase' :
                   formData.category === 'note' ? 'Note Content' : 'Document'}
                </label>
                {formData.category === 'note' ? (
                  <textarea
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    rows={4}
                    className="w-full p-3 bg-background border border-border rounded-xl"
                    placeholder="Enter your secure note..."
                  />
                ) : (
                  <input
                    type={formData.category === 'password' ? 'password' : 'text'}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder={formData.category === 'password' ? 'Enter password' : 'Enter private key/seed phrase'}
                    className="w-full p-3 bg-background border border-border rounded-xl"
                  />
                )}
              </div>

              {/* Username (for passwords) */}
              {formData.category === 'password' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Username / Email
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g., user@example.com"
                    className="w-full p-3 bg-background border border-border rounded-xl"
                  />
                </div>
              )}

              {/* URL (for passwords/crypto) */}
              {(formData.category === 'password' || formData.category === 'crypto') && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    URL (optional)
                  </label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://example.com"
                    className="w-full p-3 bg-background border border-border rounded-xl"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full p-3 bg-background border border-border rounded-xl"
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({
                    name: '',
                    category: 'password',
                    value: '',
                    username: '',
                    url: '',
                    notes: ''
                  });
                }}
                className="flex-1 px-4 py-3 border border-border rounded-xl hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAsset}
                className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all"
              >
                Add Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  ); 
}