const crypto = require('crypto');

const algorithm = 'aes-256-cbc';

exports.encryptData = async (data, patientId, hospital, department) => {
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return { encryptedData: encrypted, iv: iv.toString('base64') };
};

exports.decryptData = async (encryptedData, iv, patientId, hospital, department) => {
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'base64'));
  let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
};