// client/src/utils/time.js

/* DB UTC tutuyor, ekranda UTC+3 (Türkiye) istiyoruz. */
const FIX_OFFSET_MINUTES = 3 * 60;

/** "YYYY-MM-DD HH:MM:SS" (zoneless), ISO-Z veya +offset → Date(UTC kabul) */
export function parseUtcLike(dt) {
  if (!dt) return null;
  if (typeof dt === 'string') {
    // ISO-Z / +offset ise tarayıcı doğru okur
    if (/\dT\d/.test(dt) && (dt.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dt))) {
      const d = new Date(dt);
      return isNaN(d) ? null : d;
    }
    // Zoneless: "YYYY-MM-DD HH:MM:SS" / "YYYY-MM-DDTHH:MM[:SS]"
    const m = dt.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (m) {
      const [, y, mo, d, h, mi, s = '0'] = m;
      return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
    }
  }
  const d = new Date(dt);
  return isNaN(d) ? null : d;
}

/** DB UTC → ekranda UTC+3 (TR saati) string */
export function toLocal(dt) {
  const d = parseUtcLike(dt);
  if (!d) return '-';
  const shifted = new Date(d.getTime() + FIX_OFFSET_MINUTES * 60000);
  return shifted.toLocaleString('tr-TR', { hour12: false });
}

/** Bazı yerlerde saat-etiket üretirken işine yarar */
export function pad(n) { return String(n).padStart(2, '0'); }
