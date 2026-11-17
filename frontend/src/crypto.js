// Decrypts the payload from GET /api/logs/encrypted using the browser's Web Crypto API.
// Must mirror LogCryptoService.java: PBKDF2-HMAC-SHA256 -> AES-256-GCM (tag appended to ciphertext).

const fromBase64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function decryptLogs(payload, passphrase) {
  const enc = new TextEncoder();

  const baseKey = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: fromBase64(payload.salt), iterations: payload.iterations, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  );

  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(payload.iv) },
    key,
    fromBase64(payload.ciphertext),
  );
  return JSON.parse(new TextDecoder().decode(plain));
}
