// src/services/vaultService.ts
import { supabase } from './supabase';
import { encryptionService } from './encryption';
import { type Asset, type AssetCategory, type AssetMetadata, type CreateAssetData } from '../types/vault';

export class VaultService {
  private vaultId: string | null = null;
  private salt: string | null = null;

  async initialize(userId: string) {
    const { data: vault, error } = await supabase
      .from('vaults')
      .select('id, salt, vault_password_hash')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    if (!vault) throw new Error('Vault not found');

    this.vaultId = vault.id;
    this.salt = vault.salt;
  }

  async getSaltForUser(userId: string): Promise<string> {
    const { data, error } = await supabase
      .from('vaults')
      .select('salt')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data.salt;
  }

  // Check if vault has a password set
  async hasVaultPasswordSet(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('vaults')
      .select('vault_password_hash')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return !!data?.vault_password_hash;
  }

  // Set initial vault password
  async setVaultPassword(userId: string, password: string): Promise<void> {
    const salt = await this.getSaltForUser(userId);
    const hash = await encryptionService.hashPassword(password, salt);
    
    const { error } = await supabase
      .from('vaults')
      .update({ vault_password_hash: hash })
      .eq('user_id', userId);

    if (error) throw error;
  }

  // Verify vault password
  async verifyVaultPassword(userId: string, password: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('vaults')
      .select('salt, vault_password_hash')
      .eq('user_id', userId)
      .single();

    if (error || !data?.vault_password_hash) return false;

    const hash = await encryptionService.hashPassword(password, data.salt);
    return hash === data.vault_password_hash;
  }

  // Change vault password (re-encrypt all assets with new password)
  async changeVaultPassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    // First verify old password
    const isValid = await this.verifyVaultPassword(userId, oldPassword);
    if (!isValid) throw new Error('Invalid current password');

    // Initialize with old password to decrypt assets
    const salt = await this.getSaltForUser(userId);
    await encryptionService.initialize(oldPassword, salt);

    // Get all assets
    const assets = await this.getAssets();

    // Re-encrypt each asset with new password
    for (const asset of assets) {
      const decrypted = await encryptionService.decrypt(asset.encrypted_data);
      
      // Initialize with new password for encryption
      await encryptionService.initialize(newPassword, salt);
      const newEncrypted = await encryptionService.encrypt(decrypted);
      
      // Update asset
      await supabase
        .from('assets')
        .update({ encrypted_data: newEncrypted })
        .eq('id', asset.id);
      
      // Switch back to old password for next iteration
      await encryptionService.initialize(oldPassword, salt);
    }

    // Update vault password hash
    const newHash = await encryptionService.hashPassword(newPassword, salt);
    const { error } = await supabase
      .from('vaults')
      .update({ vault_password_hash: newHash })
      .eq('user_id', userId);

    if (error) throw error;

    // Initialize with new password
    await encryptionService.initialize(newPassword, salt);
  }

  async initEncryption(password: string) {
    if (!this.salt) throw new Error('Vault not initialized');
    await encryptionService.initialize(password, this.salt);
  }

  async createAsset(dto: CreateAssetData): Promise<Asset> {
    if (!this.vaultId) throw new Error('Vault not initialized');
    if (!encryptionService.isInitialized()) throw new Error('Encryption not initialized');

    const encryptedData = await encryptionService.encrypt(dto.value);

    const { data, error } = await supabase
      .from('assets')
      .insert({
        vault_id: this.vaultId,
        name: dto.name,
        category: dto.category,
        encrypted_data: encryptedData,
        metadata: dto.metadata || {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getAssets(category?: AssetCategory): Promise<Asset[]> {
    if (!this.vaultId) throw new Error('Vault not initialized');

    let query = supabase
      .from('assets')
      .select('*')
      .eq('vault_id', this.vaultId)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  async getAsset(id: string): Promise<Asset> {
    if (!this.vaultId) throw new Error('Vault not initialized');

    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .eq('vault_id', this.vaultId)
      .single();

    if (error) throw error;
    return data;
  }

  async updateAsset(id: string, updates: Partial<CreateAssetData>): Promise<Asset> {
    if (!this.vaultId) throw new Error('Vault not initialized');
    if (!encryptionService.isInitialized()) throw new Error('Encryption not initialized');

    const updateData: {
      name?: string;
      metadata?: AssetMetadata;
      encrypted_data?: string;
    } = {};

    if (updates.name) updateData.name = updates.name;
    if (updates.metadata) updateData.metadata = updates.metadata;
    
    if (updates.value) {
      updateData.encrypted_data = await encryptionService.encrypt(updates.value);
    }

    const { data, error } = await supabase
      .from('assets')
      .update(updateData)
      .eq('id', id)
      .eq('vault_id', this.vaultId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteAsset(id: string): Promise<void> {
    if (!this.vaultId) throw new Error('Vault not initialized');

    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id)
      .eq('vault_id', this.vaultId);

    if (error) throw error;
  }

  clear() {
    this.vaultId = null;
    this.salt = null;
    encryptionService.clear();
  }
}

export const vaultService = new VaultService();