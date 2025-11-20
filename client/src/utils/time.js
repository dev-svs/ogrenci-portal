// client/src/utils/time.js

// Artık elle +3 saat eklemiyoruz. DB UTC tutuyor, tarayıcı zaten yerel saate çeviriyor.

/** "YYYY-MM-DD HH:MM:SS", ISO-Z veya +offset → Date */
export function parseUtcLike(dt) {
  if (!dt) return null;

  if (typeof dt === 'string') {
    // ISO-Z / +offset ise
    if (/\dT\d/.test(dt) && (dt.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dt))) {
      const d = new Date(dt);
      return isNaN(d) ? null : d;
    }

    // Zoneless: "YYYY-MM-DD HH:MM:SS" / "YYYY-MM-DDTHH:MM[:SS]"
    const m = dt.match(
      /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/
    );
    if (m) {
      const [, y, mo, d, h, mi, s = '0'] = m;
      // UTC kabul et
      return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
    }
  }

  const d = new Date(dt);
  return isNaN(d) ? null : d;
}

/** DB’deki UTC tarih → ekranda yerel (TR) tarih-saat */
export function toLocal(dt) {
  const d = parseUtcLike(dt);
  if (!d) return '-';
  // Tarayıcı zaten timezone’u (TR) biliyor, ekstra +3 yok
  return d.toLocaleString('tr-TR', { hour12: false });
}

/** Sadece HH:MM formatı */
export function toLocalHM(dt) {
  const d = parseUtcLike(dt);
  if (!d) return '-';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Bazı yerlerde saat etiketi üretmek için */
export function pad(n) {
  return String(n).padStart(2, '0');
}
