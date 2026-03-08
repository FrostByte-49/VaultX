// src/services/encryption.ts
export class EncryptionService {
  private masterKey: CryptoKey | null = null;

  async initialize(password: string, salt: string) {
    try {
      console.log('Initializing encryption with salt:', salt);
      const encoder = new TextEncoder();
      const passwordBuffer = encoder.encode(password);
      
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveKey']
      );
      
      this.masterKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode(salt),
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      
      console.log('Encryption initialized successfully');
    } catch (err) {
      console.error('Encryption initialization failed:', err);
      throw err;
    }
  }

  async encrypt(data: string): Promise<string> {
    if (!this.masterKey) {
      console.error('Encryption not initialized');
      throw new Error('Encryption not initialized');
    }

    try {
      const encoder = new TextEncoder();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        this.masterKey,
        encoder.encode(data)
      );

      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);
      
      const result = btoa(String.fromCharCode(...combined));
      console.log('Encryption successful, output length:', result.length);
      return result;
    } catch (err) {
      console.error('Encryption failed:', err);
      throw err;
    }
  }

  async decrypt(encryptedData: string): Promise<string> {
    if (!this.masterKey) {
      console.error('Decryption not initialized');
      throw new Error('Encryption not initialized');
    }

    try {
      console.log('Decrypting data, length:', encryptedData.length);
      
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(c => c.charCodeAt(0))
      );
      
      console.log('Combined buffer length:', combined.length);
      
      if (combined.length < 12) {
        throw new Error('Invalid encrypted data: too short');
      }
      
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);
      
      console.log('IV length:', iv.length, 'Data length:', data.length);
      
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        this.masterKey,
        data
      );
      
      const decoder = new TextDecoder();
      const result = decoder.decode(decryptedBuffer);
      console.log('Decryption successful, result length:', result.length);
      return result;
    } catch (err) {
      console.error('Decryption failed details:', err);
      throw new Error(`Decryption failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  async hashPassword(password: string, salt: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const passwordBuffer = encoder.encode(password);
      const saltBuffer = encoder.encode(salt);
      
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits']
      );
      
      const hashBuffer = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: saltBuffer,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        256 // 256 bits
      );
      
      return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
    } catch (err) {
      console.error('Hash password failed:', err);
      throw err;
    }
  }

  isInitialized(): boolean {
    return this.masterKey !== null;
  }

  clear() {
    this.masterKey = null;
    console.log('Encryption cleared');
  }
}

export const encryptionService = new EncryptionService();