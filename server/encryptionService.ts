import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';

if (!ENCRYPTION_KEY) {
  console.warn('⚠️ ENCRYPTION_KEY not set - integration secrets will be stored unencrypted');
  console.warn('⚠️ To enable encryption, set ENCRYPTION_KEY environment variable (64-char hex string)');
  console.warn('⚠️ Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
}

export class EncryptionService {
  static encrypt(text: string): string {
    if (!text) return '';
    
    // If no encryption key is set, warn and store in plaintext
    if (!ENCRYPTION_KEY) {
      return text;
    }
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex'),
      iv
    );
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  static decrypt(encryptedText: string): string {
    if (!encryptedText) return '';
    
    // If no encryption key is set, assume plaintext storage
    if (!ENCRYPTION_KEY) {
      return encryptedText;
    }
    
    try {
      const parts = encryptedText.split(':');
      
      // If not in encrypted format, return as-is (backward compatibility)
      if (parts.length !== 3) {
        return encryptedText;
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      const decipher = crypto.createDecipheriv(
        ALGORITHM,
        Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex'),
        iv
      );
      
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return '';
    }
  }
}
