// server/src/utils/crypto.js
const crypto = require('crypto');

// .env varsa kullan, yoksa dev ortam için fallback bir key üret
const RAW_KEY = process.env.COUNSELOR_MSG_KEY || 'dev-fallback-counselor-key';

// AES-256 için 32 byte key gerekiyor; gerekirse hash’le / kes
const KEY = crypto.createHash('sha256').update(RAW_KEY).digest(); // 32 byte
const IV_LENGTH = 12; // GCM için 12 byte IV

function encrypt(plainText) {
  if (plainText == null) plainText = '';
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const enc = Buffer.concat([
    cipher.update(String(plainText), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // iv + tag + data -> base64
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

function decrypt(payload) {
  if (!payload) return '';
  const buf = Buffer.from(payload, 'base64');

  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + 16);
  const data = buf.subarray(IV_LENGTH + 16);

  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString('utf8');
}

module.exports = { encrypt, decrypt };
