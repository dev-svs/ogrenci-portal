const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    // SMTP yoksa no-op
    return null;
  }
  transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user, pass }
  });
  return transporter;
}

async function notifyCounselor(toEmail, subject, plainText) {
  if (!toEmail) return;
  const t = getTransporter();
  if (!t) {
    console.log('[MAIL] skipped (no SMTP configured):', subject);
    return;
  }
  try {
    await t.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject,
      text: plainText
    });
  } catch (e) {
    console.log('[MAIL] send failed:', e.message);
  }
}

module.exports = { notifyCounselor };
