const crypto = require('crypto');
// 32 baytlık bir key bekliyoruz (AES-256-GCM)
const KEY = Buffer.from(process.env.COUNSELOR_MSG_KEY || '', 'hex');
// Kolay başlamak için: openssl rand -hex 32  (64 hex char) üret ve .env'ye koy

function encrypt(text) {
  if (!KEY || KEY.length !== 32) throw new Error('Invalid COUNSELOR_MSG_KEY');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return { iv, data: Buffer.concat([enc, tag]) }; // tag sonuna ekledik (16 bayt)
}

function decrypt(iv, dataAndTag) {
  if (!KEY || KEY.length !== 32) throw new Error('Invalid COUNSELOR_MSG_KEY');
  const data = dataAndTag.slice(0, dataAndTag.length - 16);
  const tag = dataAndTag.slice(dataAndTag.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString('utf8');
}

module.exports = { encrypt, decrypt };
