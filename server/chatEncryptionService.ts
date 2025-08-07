import crypto from 'crypto';
import { gzipSync, gunzipSync } from 'zlib';

/**
 * Simple LinkedIn-style Chat Encryption & Compression Service
 * Provides AES-256 encryption with compression for chat messages
 */
class ChatEncryptionService {
  private readonly encryptionKey: string;
  private readonly algorithm = 'aes-256-gcm';

  constructor() {
    // Use environment key or generate a secure default for development
    this.encryptionKey = process.env.CHAT_ENCRYPTION_KEY || this.generateSecureKey();
  }

  private generateSecureKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Compress text content using gzip
   */
  private compressContent(content: string): Buffer {
    return gzipSync(Buffer.from(content, 'utf-8'));
  }

  /**
   * Decompress gzipped content
   */
  private decompressContent(compressed: Buffer): string {
    return gunzipSync(compressed).toString('utf-8');
  }

  /**
   * Encrypt and compress a message
   */
  encryptMessage(plaintext: string): {
    encryptedContent: string;
    messageHash: string;
    compressionType: string;
  } {
    try {
      // Compress the message first
      const compressed = this.compressContent(plaintext);
      
      // Create cipher
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
      cipher.setAAD(iv);
      
      // Encrypt compressed content
      let encrypted = cipher.update(compressed);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      // Get auth tag
      const authTag = cipher.getAuthTag();
      
      // Combine iv, authTag, and encrypted data
      const combined = Buffer.concat([iv, authTag, encrypted]);
      const encryptedContent = combined.toString('base64');
      
      // Generate message hash for integrity
      const messageHash = crypto
        .createHash('sha256')
        .update(plaintext)
        .digest('hex');

      return {
        encryptedContent,
        messageHash,
        compressionType: 'gzip'
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  /**
   * Decrypt and decompress a message
   */
  decryptMessage(encryptedContent: string, messageHash: string): string {
    try {
      // Decode from base64
      const combined = Buffer.from(encryptedContent, 'base64');
      
      // Extract components
      const iv = combined.slice(0, 16);
      const authTag = combined.slice(16, 32);
      const encrypted = combined.slice(32);
      
      // Create decipher with IV
      const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
      if (this.algorithm.includes('gcm')) {
        decipher.setAuthTag(authTag);
      }
      
      // Decrypt
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      // Decompress
      const plaintext = this.decompressContent(decrypted);
      
      // Verify hash integrity
      const verifyHash = crypto
        .createHash('sha256')
        .update(plaintext)
        .digest('hex');
      
      if (verifyHash !== messageHash) {
        throw new Error('Message integrity check failed');
      }
      
      return plaintext;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  /**
   * Create a preview of encrypted message (for conversation list)
   */
  createPreview(plaintext: string, maxLength: number = 50): string {
    const preview = plaintext.length > maxLength 
      ? plaintext.substring(0, maxLength) + '...'
      : plaintext;
    
    // Encrypt the preview
    const { encryptedContent } = this.encryptMessage(preview);
    return encryptedContent;
  }

  /**
   * Decrypt a preview
   */
  decryptPreview(encryptedPreview: string): string {
    try {
      // For preview, we'll create a simple hash since we don't store the original hash
      const combined = Buffer.from(encryptedPreview, 'base64');
      const iv = combined.slice(0, 16);
      const authTag = combined.slice(16, 32);
      const encrypted = combined.slice(32);
      
      const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
      if (this.algorithm.includes('gcm')) {
        decipher.setAuthTag(authTag);
      }
      
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      return this.decompressContent(decrypted);
    } catch (error) {
      return 'Message preview unavailable';
    }
  }
}

export const chatEncryptionService = new ChatEncryptionService();