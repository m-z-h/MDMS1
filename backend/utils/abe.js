const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);

exports.encryptData = (data) => {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      iv: iv.toString('hex'),
      encryptedData: encrypted
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Encryption failed: ' + error.message);
  }
};

exports.decryptData = (encryptedData, iv) => {
  try {
    // Validate inputs
    if (!encryptedData || !iv) {
      throw new Error('Missing encryptedData or IV');
    }

    // Convert IV from hex string to Buffer
    let ivBuffer;
    try {
      ivBuffer = Buffer.from(iv, 'hex');
    } catch (error) {
      throw new Error('Invalid IV format');
    }

    // Validate IV length
    if (ivBuffer.length !== 16) {
      throw new Error('Invalid IV length');
    }

    const decipher = crypto.createDecipheriv(algorithm, key, ivBuffer);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    try {
      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error('Failed to parse decrypted data');
    }
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Decryption failed: ' + error.message);
  }
};