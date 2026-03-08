// src/services/nomineeService.ts
import { supabase } from './supabase';

export type NomineeStatus = 'pending' | 'accepted' | 'revoked';
export type AccessLevel = 'view' | 'manage' | 'full';
export type Relationship = 'family' | 'friend' | 'lawyer' | 'executor' | 'other';

export interface Nominee {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  relationship: Relationship | null;
  status: NomineeStatus;
  access_level: AccessLevel;
  invite_token: string | null;
  invited_at: string;
  accepted_at: string | null;
  last_notified_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateNomineeDTO {
  email: string;
  name?: string;
  relationship?: Relationship;
  access_level?: AccessLevel;
  notes?: string;
}

export interface NomineeAccess {
  id: string;
  nominee_id: string;
  asset_id: string;
  access_type: 'view' | 'manage';
  expires_at: string | null;
  granted_at: string;
  granted_by: string;
}

// Interface for vaults a user has access to as nominee
export interface AccessibleVault {
  id: string;
  user_id: string;
  owner_email: string;
  owner_name: string | null;
  access_level: AccessLevel;
  relationship: Relationship | null;
  granted_at: string;
  assets: Array<{
    id: string;
    name: string;
    category: string;
    encrypted_data: string;
  }>;
}

// Interface for pending invitations
export interface PendingInvitation {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  relationship: Relationship | null;
  access_level: AccessLevel;
  invited_at: string;
  notes: string | null;
  owner_email: string;
  owner_name: string | null;
}

export class NomineeService {
  private userId: string | null = null;

  async initialize(userId: string) {
    this.userId = userId;
  }

  // Get all nominees (for vault owners)
  async getNominees(): Promise<Nominee[]> {
    if (!this.userId) throw new Error('Not initialized');

    const { data, error } = await supabase
      .from('nominees')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get pending invitations for current user
  async getPendingInvitations(): Promise<PendingInvitation[]> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData.user?.email;
      if (!userEmail) return [];

      const { data: pendingNominees, error } = await supabase
        .from('nominees')
        .select('*')
        .eq('email', userEmail)
        .eq('status', 'pending');

      if (error) throw error;
      if (!pendingNominees?.length) return [];

      const invitations: PendingInvitation[] = [];

      for (const nominee of pendingNominees) {
        // With the fixed profiles RLS, this will now work
        const { data: ownerData } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', nominee.user_id)
          .single();

        invitations.push({
          id: nominee.id,
          user_id: nominee.user_id,
          email: nominee.email,
          name: nominee.name,
          relationship: nominee.relationship,
          access_level: nominee.access_level,
          invited_at: nominee.invited_at,
          notes: nominee.notes,
          owner_email: ownerData?.email || 'Unknown',
          owner_name: ownerData?.full_name || null
        });
      }

      return invitations;
    } catch (error) {
      console.error('Error in getPendingInvitations:', error);
      throw error;
    }
  }

  // Get all vaults where current user is a nominee
  async getAccessibleVaults(): Promise<AccessibleVault[]> {
    try {
      if (!this.userId) throw new Error('Not initialized');

      // Get current user's email
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData.user?.email;
      
      if (!userEmail) return [];

      // First get all nominee records for this user's email
      const { data: nomineeRecords, error: nomineeError } = await supabase
        .from('nominees')
        .select('*')
        .eq('email', userEmail)
        .eq('status', 'accepted');

      if (nomineeError) throw nomineeError;
      if (!nomineeRecords || nomineeRecords.length === 0) return [];

      // For each vault, get owner info from profiles table
      const accessibleVaults: AccessibleVault[] = [];

      for (const record of nomineeRecords) {
        // Get owner info from profiles
        const { data: ownerData, error: ownerError } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', record.user_id)
          .single();

        if (ownerError) {
          console.error('Error fetching owner data:', ownerError);
          continue;
        }

        // Get assets this nominee has access to
        const { data: accessData, error: accessError } = await supabase
          .from('nominee_access')
          .select(`
            asset_id,
            access_type,
            assets:asset_id (
              id,
              name,
              category,
              encrypted_data
            )
          `)
          .eq('nominee_id', record.id);

        if (accessError) {
          console.error('Error fetching access data:', accessError);
          throw accessError;
        }

        // Map the assets correctly
        const assets = (accessData || []).map(item => {
          const assetData = Array.isArray(item.assets) ? item.assets[0] : item.assets;
          return {
            id: assetData?.id || '',
            name: assetData?.name || '',
            category: assetData?.category || '',
            encrypted_data: assetData?.encrypted_data || ''
          };
        }).filter(asset => asset.id);

        accessibleVaults.push({
          id: record.user_id,
          user_id: record.user_id,
          owner_email: ownerData?.email || record.email,
          owner_name: ownerData?.full_name || record.name,
          access_level: record.access_level,
          relationship: record.relationship,
          granted_at: record.accepted_at,
          assets: assets
        });
      }

      return accessibleVaults;
    } catch (error) {
      console.error('Error in getAccessibleVaults:', error);
      throw error;
    }
  }

  // Get nominee by id
  async getNominee(id: string): Promise<Nominee> {
    if (!this.userId) throw new Error('Not initialized');

    const { data, error } = await supabase
      .from('nominees')
      .select('*')
      .eq('id', id)
      .eq('user_id', this.userId)
      .single();

    if (error) throw error;
    return data;
  }

  // Get nominee by invite token (keeping for backward compatibility)
  async getNomineeByToken(token: string): Promise<Nominee | null> {
    const { data, error } = await supabase
      .from('nominees')
      .select('*')
      .eq('invite_token', token)
      .single();

    if (error) return null;
    return data;
  }

  // Accept invitation
  async acceptInvitation(nomineeId: string): Promise<void> {
    // Update nominee status
    const { error } = await supabase
      .from('nominees')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', nomineeId);

    if (error) throw error;
  }

  // Decline/Reject invitation
  async declineInvitation(nomineeId: string): Promise<void> {
    // Delete the nominee record
    const { error } = await supabase
      .from('nominees')
      .delete()
      .eq('id', nomineeId);

    if (error) throw error;
  }

  // Add new nominee
  async addNominee(dto: CreateNomineeDTO): Promise<Nominee> {
    if (!this.userId) throw new Error('Not initialized');

    // Generate a simple token
    const tokenData = Math.random().toString(36).substring(2, 15) + 
                      Math.random().toString(36).substring(2, 15);

    const updateData: {
      user_id: string;
      email: string;
      invite_token: string;
      status: string;
      name?: string;
      relationship?: Relationship;
      access_level?: AccessLevel;
      notes?: string;
    } = {
      user_id: this.userId,
      email: dto.email.toLowerCase(),
      invite_token: tokenData,
      status: 'pending'
    };

    if (dto.name) updateData.name = dto.name;
    if (dto.relationship) updateData.relationship = dto.relationship;
    if (dto.access_level) updateData.access_level = dto.access_level;
    if (dto.notes) updateData.notes = dto.notes;

    const { data, error } = await supabase
      .from('nominees')
      .insert(updateData)
      .select()
      .single();

    if (error) throw error;
    
    return data;
  }

  // Update nominee
  async updateNominee(id: string, updates: Partial<CreateNomineeDTO>): Promise<Nominee> {
    if (!this.userId) throw new Error('Not initialized');

    const updateData: {
      name?: string;
      relationship?: Relationship;
      access_level?: AccessLevel;
      notes?: string;
    } = {};

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.relationship !== undefined) updateData.relationship = updates.relationship;
    if (updates.access_level !== undefined) updateData.access_level = updates.access_level;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { data, error } = await supabase
      .from('nominees')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', this.userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Resend invitation (now just updates notification time)
  async resendInvitation(id: string): Promise<void> {
    if (!this.userId) throw new Error('Not initialized');

    const { error } = await supabase
      .from('nominees')
      .update({ 
        last_notified_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', this.userId);

    if (error) throw error;
  }

  // Revoke nominee access
  async revokeNominee(id: string): Promise<void> {
    if (!this.userId) throw new Error('Not initialized');

    const { error } = await supabase
      .from('nominees')
      .update({ 
        status: 'revoked',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', this.userId);

    if (error) throw error;
  }

  // Delete nominee
  async deleteNominee(id: string): Promise<void> {
    if (!this.userId) throw new Error('Not initialized');

    const { error } = await supabase
      .from('nominees')
      .delete()
      .eq('id', id)
      .eq('user_id', this.userId);

    if (error) throw error;
  }

  // Get access permissions for a nominee
  async getNomineeAccess(nomineeId: string): Promise<NomineeAccess[]> {
    if (!this.userId) throw new Error('Not initialized');

    const { data, error } = await supabase
      .from('nominee_access')
      .select('*')
      .eq('nominee_id', nomineeId);

    if (error) throw error;
    return data || [];
  }

  // Grant asset access to nominee
  async grantAccess(nomineeId: string, assetId: string, accessType: 'view' | 'manage' = 'view'): Promise<void> {
    if (!this.userId) throw new Error('Not initialized');

    // Check if access already exists
    const { data: existing } = await supabase
      .from('nominee_access')
      .select('id')
      .eq('nominee_id', nomineeId)
      .eq('asset_id', assetId)
      .single();

    if (existing) {
      console.log('Access already exists');
      return;
    }

    const { error } = await supabase
      .from('nominee_access')
      .insert({
        nominee_id: nomineeId,
        asset_id: assetId,
        access_type: accessType,
        granted_by: this.userId,
        granted_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  // Remove asset access from nominee
  async revokeAccess(nomineeId: string, assetId: string): Promise<void> {
    if (!this.userId) throw new Error('Not initialized');

    const { error } = await supabase
      .from('nominee_access')
      .delete()
      .eq('nominee_id', nomineeId)
      .eq('asset_id', assetId);

    if (error) throw error;
  }
}

export const nomineeService = new NomineeService();