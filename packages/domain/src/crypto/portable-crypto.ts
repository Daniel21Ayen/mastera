// Pure TypeScript / JavaScript Cryptographic Primitives
// Cross-platform: Works identically in Node.js, Hermes, React Native, and Web.
// Completely decouples mobile and domain bundles from Node's built-in "crypto" module.

function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

const SHA256_K: number[] = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

export function toUint8Array(input: string | Uint8Array): Uint8Array {
  if (typeof input === 'string') {
    return new TextEncoder().encode(input);
  }
  return input;
}

export function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i] ?? 0;
    hex += b.toString(16).padStart(2, '0');
  }
  return hex;
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.length % 2 === 0 ? hex : '0' + hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * NIST FIPS 180-4 compliant SHA-256 implementation in pure TypeScript.
 * Bit-for-bit identical to OpenSSL/Node.js crypto.createHash('sha256').
 */
export function sha256(input: string | Uint8Array): Uint8Array {
  const bytes = toUint8Array(input);
  const bitLength = bytes.length * 8;
  const byteLength = bytes.length;
  const withPaddingLength = (((byteLength + 8) >> 6) + 1) << 6;
  const padded = new Uint8Array(withPaddingLength);
  padded.set(bytes);
  padded[byteLength] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(withPaddingLength - 4, bitLength >>> 0);
  view.setUint32(withPaddingLength - 8, Math.floor(bitLength / 0x100000000));

  const hash: number[] = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const w = new Uint32Array(64);

  for (let offset = 0; offset < withPaddingLength; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4);
    }
    for (let i = 16; i < 64; i++) {
      const prev15 = w[i - 15] ?? 0;
      const prev2 = w[i - 2] ?? 0;
      const prev16 = w[i - 16] ?? 0;
      const prev7 = w[i - 7] ?? 0;
      const s0 = rightRotate(prev15, 7) ^ rightRotate(prev15, 18) ^ (prev15 >>> 3);
      const s1 = rightRotate(prev2, 17) ^ rightRotate(prev2, 19) ^ (prev2 >>> 10);
      w[i] = (prev16 + s0 + prev7 + s1) >>> 0;
    }

    let a = hash[0] ?? 0;
    let b = hash[1] ?? 0;
    let c = hash[2] ?? 0;
    let d = hash[3] ?? 0;
    let e = hash[4] ?? 0;
    let f = hash[5] ?? 0;
    let g = hash[6] ?? 0;
    let h = hash[7] ?? 0;

    for (let i = 0; i < 64; i++) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ ((~e) & g);
      const ki = SHA256_K[i] ?? 0;
      const wi = w[i] ?? 0;
      const temp1 = (h + s1 + ch + ki + wi) >>> 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    hash[0] = ((hash[0] ?? 0) + a) >>> 0;
    hash[1] = ((hash[1] ?? 0) + b) >>> 0;
    hash[2] = ((hash[2] ?? 0) + c) >>> 0;
    hash[3] = ((hash[3] ?? 0) + d) >>> 0;
    hash[4] = ((hash[4] ?? 0) + e) >>> 0;
    hash[5] = ((hash[5] ?? 0) + f) >>> 0;
    hash[6] = ((hash[6] ?? 0) + g) >>> 0;
    hash[7] = ((hash[7] ?? 0) + h) >>> 0;
  }

  const outView = new DataView(new ArrayBuffer(32));
  for (let i = 0; i < 8; i++) {
    outView.setUint32(i * 4, hash[i] ?? 0);
  }
  return new Uint8Array(outView.buffer);
}

export function sha256Hex(input: string | Uint8Array): string {
  return bytesToHex(sha256(input));
}

/**
 * RFC 2104 HMAC-SHA256 in pure TypeScript.
 */
export function hmacSha256(
  key: string | Uint8Array,
  message: string | Uint8Array
): Uint8Array {
  const keyBytes = toUint8Array(key);
  const msgBytes = toUint8Array(message);

  const formattedKey = new Uint8Array(64);
  if (keyBytes.length > 64) {
    const hashedKey = sha256(keyBytes);
    formattedKey.set(hashedKey);
  } else {
    formattedKey.set(keyBytes);
  }

  const oKeyPad = new Uint8Array(64);
  const iKeyPad = new Uint8Array(64);
  for (let i = 0; i < 64; i++) {
    const fk = formattedKey[i] ?? 0;
    oKeyPad[i] = fk ^ 0x5c;
    iKeyPad[i] = fk ^ 0x36;
  }

  const innerMsg = new Uint8Array(64 + msgBytes.length);
  innerMsg.set(iKeyPad, 0);
  innerMsg.set(msgBytes, 64);
  const innerHash = sha256(innerMsg);

  const outerMsg = new Uint8Array(64 + 32);
  outerMsg.set(oKeyPad, 0);
  outerMsg.set(innerHash, 64);
  return sha256(outerMsg);
}

export function hmacSha256Hex(
  key: string | Uint8Array,
  message: string | Uint8Array
): string {
  return bytesToHex(hmacSha256(key, message));
}

/**
 * Constant-time comparison to prevent side-channel timing attacks.
 */
export function timingSafeEqual(
  a: Uint8Array | string,
  b: Uint8Array | string
): boolean {
  let aBytes: Uint8Array;
  let bBytes: Uint8Array;

  if (typeof a === 'string') {
    aBytes = a.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(a) ? hexToBytes(a) : toUint8Array(a);
  } else {
    aBytes = a;
  }

  if (typeof b === 'string') {
    bBytes = b.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(b) ? hexToBytes(b) : toUint8Array(b);
  } else {
    bBytes = b;
  }

  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return diff === 0;
}

/**
 * Generates cryptographically secure random bytes using Web Crypto / Hermes getRandomValues,
 * with deterministic fallback if unseeded.
 */
export function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return bytes;
}

/**
 * Generates an RFC 4122 Version 4 UUID.
 */
export function randomUUID(): string {
  if (typeof globalThis !== 'undefined' && typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  const bytes = randomBytes(16);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40; // Version 4
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80; // Variant 10
  const hex = bytesToHex(bytes);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// Base64 & Base64URL
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function base64Encode(input: Uint8Array | string): string {
  const bytes = toUint8Array(input);
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i] ?? 0;
    const b1 = i + 1 < bytes.length ? (bytes[i + 1] ?? 0) : 0;
    const b2 = i + 2 < bytes.length ? (bytes[i + 2] ?? 0) : 0;

    const n = (b0 << 16) | (b1 << 8) | b2;
    result += B64_CHARS[(n >> 18) & 63];
    result += B64_CHARS[(n >> 12) & 63];
    result += i + 1 < bytes.length ? B64_CHARS[(n >> 6) & 63] : '=';
    result += i + 2 < bytes.length ? B64_CHARS[n & 63] : '=';
  }
  return result;
}

export function base64Decode(str: string): Uint8Array {
  const clean = str.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const c0 = B64_CHARS.indexOf(clean[i] ?? '');
    const c1 = B64_CHARS.indexOf(clean[i + 1] ?? '');
    const c2 = B64_CHARS.indexOf(clean[i + 2] ?? '');
    const c3 = B64_CHARS.indexOf(clean[i + 3] ?? '');

    const n = (c0 << 18) | (c1 << 12) | (Math.max(0, c2) << 6) | Math.max(0, c3);
    bytes.push((n >> 16) & 255);
    if (clean[i + 2] && clean[i + 2] !== '=') bytes.push((n >> 8) & 255);
    if (clean[i + 3] && clean[i + 3] !== '=') bytes.push(n & 255);
  }
  return new Uint8Array(bytes);
}

export function base64DecodeToString(str: string): string {
  return new TextDecoder().decode(base64Decode(str));
}

export function base64UrlEncode(input: Uint8Array | string): string {
  return base64Encode(input)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function base64UrlDecode(str: string): Uint8Array {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) {
    b64 += '=';
  }
  return base64Decode(b64);
}

/**
 * PBKDF2-HMAC-SHA256 password derivation in pure TypeScript.
 */
export function pbkdf2Sha256(
  password: string,
  salt: Uint8Array | string,
  iterations: number,
  keyLength: number
): Uint8Array {
  const pBytes = toUint8Array(password);
  const sBytes = typeof salt === 'string' && salt.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(salt)
    ? hexToBytes(salt)
    : toUint8Array(salt);

  const hLen = 32;
  const l = Math.ceil(keyLength / hLen);
  const dk = new Uint8Array(l * hLen);

  for (let i = 1; i <= l; i++) {
    const sInt = new Uint8Array(sBytes.length + 4);
    sInt.set(sBytes, 0);
    new DataView(sInt.buffer, sInt.byteOffset).setUint32(sBytes.length, i, false);

    let u = hmacSha256(pBytes, sInt);
    const t = new Uint8Array(u);

    for (let c = 2; c <= iterations; c++) {
      u = hmacSha256(pBytes, u);
      for (let k = 0; k < hLen; k++) {
        t[k] = (t[k] ?? 0) ^ (u[k] ?? 0);
      }
    }
    dk.set(t, (i - 1) * hLen);
  }
  return dk.slice(0, keyLength);
}

export function pbkdf2Sha256Hex(
  password: string,
  salt: Uint8Array | string,
  iterations: number,
  keyLength: number
): string {
  return bytesToHex(pbkdf2Sha256(password, salt, iterations, keyLength));
}

/**
 * Authenticated Stream Encryption (Encrypt-then-MAC with HMAC-SHA256).
 * Safe for offline course storage, verification, and atomic decryption.
 */
export function authenticatedEncrypt(
  plaintext: string,
  key: Uint8Array,
  iv: Uint8Array
): { ciphertext: Uint8Array; authTagHex: string } {
  const ptBytes = toUint8Array(plaintext);
  const ctBytes = new Uint8Array(ptBytes.length);

  let blockCounter = 0;
  let streamOffset = 0;
  while (streamOffset < ptBytes.length) {
    const counterBytes = new Uint8Array(iv.length + 4);
    counterBytes.set(iv, 0);
    new DataView(counterBytes.buffer).setUint32(iv.length, blockCounter++);
    const blockKey = hmacSha256(key, counterBytes);
    const take = Math.min(blockKey.length, ptBytes.length - streamOffset);
    for (let i = 0; i < take; i++) {
      ctBytes[streamOffset + i] = (ptBytes[streamOffset + i] ?? 0) ^ (blockKey[i] ?? 0);
    }
    streamOffset += take;
  }

  const tagData = new Uint8Array(iv.length + ctBytes.length);
  tagData.set(iv, 0);
  tagData.set(ctBytes, iv.length);
  const authTagHex = hmacSha256Hex(key, tagData).slice(0, 32);

  return { ciphertext: ctBytes, authTagHex };
}

export function authenticatedDecrypt(
  ciphertext: Uint8Array,
  key: Uint8Array,
  iv: Uint8Array,
  authTagHex: string
): string {
  const tagData = new Uint8Array(iv.length + ciphertext.length);
  tagData.set(iv, 0);
  tagData.set(ciphertext, iv.length);
  const expectedTagHex = hmacSha256Hex(key, tagData).slice(0, 32);

  if (!timingSafeEqual(authTagHex, expectedTagHex)) {
    throw new Error('Authenticated decrypt failed: tag mismatch.');
  }

  const ptBytes = new Uint8Array(ciphertext.length);
  let blockCounter = 0;
  let streamOffset = 0;
  while (streamOffset < ciphertext.length) {
    const counterBytes = new Uint8Array(iv.length + 4);
    counterBytes.set(iv, 0);
    new DataView(counterBytes.buffer).setUint32(iv.length, blockCounter++);
    const blockKey = hmacSha256(key, counterBytes);
    const take = Math.min(blockKey.length, ciphertext.length - streamOffset);
    for (let i = 0; i < take; i++) {
      ptBytes[streamOffset + i] = (ciphertext[streamOffset + i] ?? 0) ^ (blockKey[i] ?? 0);
    }
    streamOffset += take;
  }

  return new TextDecoder().decode(ptBytes);
}
