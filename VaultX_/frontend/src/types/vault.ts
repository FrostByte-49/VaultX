// src/types/vault.ts
export type AssetCategory = 'password' | 'crypto' | 'note' | 'document';

export interface AssetMetadata {
  username?: string;
  url?: string;
  notes?: string;
  tags?: string[];
  [key: string]: string | string[] | undefined;
}

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  encrypted_data: string;
  metadata: AssetMetadata;
  file_ref?: string;
  file_type?: string;
  file_size?: number;
  created_at: string;
  updated_at: string;
}

export interface AssetWithDecrypted extends Asset {
  decryptedValue: string;
}

export interface CreateAssetData {
  name: string;
  category: AssetCategory;
  value: string;
  metadata?: AssetMetadata;
  file?: File;
}

export const categoryConfig: Record<AssetCategory, { icon: string; gradient: string; label: string }> = {
  password: {
    icon: '🔑',
    gradient: 'from-blue-500 to-cyan-500',
    label: 'Password'
  },
  crypto: {
    icon: '₿',
    gradient: 'from-purple-500 to-pink-500',
    label: 'Crypto Wallet'
  },
  note: {
    icon: '📝',
    gradient: 'from-amber-500 to-orange-500',
    label: 'Secure Note'
  },
  document: {
    icon: '📄',
    gradient: 'from-emerald-500 to-teal-500',
    label: 'Document'
  }
};