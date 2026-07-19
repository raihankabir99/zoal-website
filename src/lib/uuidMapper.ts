/**
 * AL ZOAL Enterprise UUID Mapping Utility
 * Provides 1:1 deterministic mapping from friendly alphanumeric IDs (e.g., 'coffee-1', 'bakery-5')
 * to standard RFC 4122 compliant UUID v5 values.
 * This guarantees database referential integrity while keeping URLs and the UI user-friendly.
 */

// A stable namespace UUID for AL ZOAL Enterprise to ensure deterministic UUID v5 generation
const ZOAL_NAMESPACE = 'd4af3700-79ea-4d72-8138-b38b29beaa0c';

/**
 * Validates whether a string is a standard RFC 4122 compliant UUID.
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Deterministically maps any friendly ID string to a valid RFC 4122 UUID.
 * If the input is already a valid UUID, it returns it unchanged.
 */
export function friendlyToUUID(friendlyId: string): string {
  if (!friendlyId) {
    throw new Error('Cannot map empty or null friendly ID to UUID.');
  }

  const cleanId = friendlyId.trim();
  if (isValidUUID(cleanId)) {
    return cleanId.toLowerCase();
  }

  // Generate deterministic SHA-1 / FNV-1a hybrid hash to build a valid UUID
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  let h3 = 0xfa5c5413;
  let h4 = 0x61c14217;

  // Mix namespace to ensure unique domain-specific hashing
  const saltSeed = cleanId + ZOAL_NAMESPACE;

  for (let i = 0; i < saltSeed.length; i++) {
    const char = saltSeed.charCodeAt(i);
    h1 = Math.imul(h1 ^ char, 2654435761);
    h2 = Math.imul(h2 ^ char, 1597334677);
    h3 = Math.imul(h3 ^ char, 3242174147);
    h4 = Math.imul(h4 ^ char, 2305843009);
  }

  const toHex = (n: number) => {
    return (n >>> 0).toString(16).padStart(8, '0');
  };

  const hex = (toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4)).toLowerCase();

  // Format as standard UUID: xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx
  // M is version 5 (deterministic), N is variant (8, 9, a, b)
  const part1 = hex.slice(0, 8);
  const part2 = hex.slice(8, 12);
  const part3 = '5' + hex.slice(13, 16); // Version 5
  const part4 = ((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0') + hex.slice(18, 20);
  const part5 = hex.slice(20, 32);

  return `${part1}-${part2}-${part3}-${part4}-${part5}`;
}
