// server/src/utils/crypto.js
const crypto = require('crypto');

// .env varsa onu kullan, yoksa dev için sabit bir key
const RAW_KEY = process.env.COUNSELOR_MSG_KEY || 'dev-fallback-counselor-key';

// AES-256 için 32 byte key
const KEY = crypto.createHash('sha256').update(RAW_KEY).digest(); // 32 byte
const ALGO = 'aes-256-cbc';
const IV_LENGTH = 16; // 16 byte

// Şifrele: düz metin -> { iv: Buffer(16), data: base64 string }
function encrypt(plainText) {
  if (plainText == null) plainText = '';

  const iv = crypto.randomBytes(IV_LENGTH); // Buffer(16)
  const cipher = crypto.createCipheriv(ALGO, KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(String(plainText), 'utf8'),
    cipher.final(),
  ]);

  return {
    iv,                          // Buffer olarak döndürüyoruz
    data: encrypted.toString('base64'), // cipher metin string
  };
}

// Çöz: iv (Buffer veya string) + base64 cipher -> düz metin
function decrypt(iv, dataB64) {
  if (!iv || !dataB64) return '';

  const enc = Buffer.from(dataB64, 'base64');

  // mysql2 genelde Buffer döndürür ama garanti olsun:
  const ivBuf = Buffer.isBuffer(iv) ? iv : Buffer.from(iv);

  const decipher = crypto.createDecipheriv(ALGO, KEY, ivBuf);
  const decrypted = Buffer.concat([
    decipher.update(enc),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

module.exports = { encrypt, decrypt };
