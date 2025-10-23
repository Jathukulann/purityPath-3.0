import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.JOURNAL_ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';

if (!ENCRYPTION_KEY) {
  throw new Error('JOURNAL_ENCRYPTION_KEY environment variable is required for journal encryption');
}

// Ensure the key is 32 bytes (256 bits) for AES-256
// Use a consistent salt for key derivation
const key = crypto.scryptSync(ENCRYPTION_KEY, 'journal-salt-2024', 32);

export function encryptJournalContent(content: string): string {
  try {
    // Use 12 bytes IV for GCM (recommended size)
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Optional: Add additional authenticated data
    cipher.setAAD(Buffer.from('journal-entry'));
    
    // Encrypt the content
    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get the authentication tag for GCM mode
    const authTag = cipher.getAuthTag();
    
    // Store IV, authTag, and encrypted content together
    return JSON.stringify({
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      data: encrypted
    });
  } catch (error) {
    console.error('Failed to encrypt journal content:', error);
    throw new Error('Unable to encrypt journal entry');
  }
}

export function decryptJournalContent(encryptedData: string): string {
  try {
    const { iv, authTag, data } = JSON.parse(encryptedData);
    
    // Convert hex strings back to buffers
    const ivBuffer = Buffer.from(iv, 'hex');
    const authTagBuffer = Buffer.from(authTag, 'hex');
    
    // Create decipher with IV
    const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
    
    // Set additional authenticated data (must match encryption)
    decipher.setAAD(Buffer.from('journal-entry'));
    
    // Set auth tag for verification
    decipher.setAuthTag(authTagBuffer);
    
    // Decrypt the content
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Failed to decrypt journal content:', error);
    throw new Error('Unable to decrypt journal entry - data may be corrupted or key invalid');
  }
}