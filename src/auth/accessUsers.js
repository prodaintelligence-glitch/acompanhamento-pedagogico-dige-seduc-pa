export const accessUsers = [
  {
    id: 'user-01',
    identifierHashes: [
      'cbe2ec6c4da8744a9e091a8b71f3e22b649057f99a513bd7a1c9bd8341ae70a0',
      '6eb2aebe0498c15fd2a1dd3c7b3a9d875613c9fed6e2e0e253d2d51e4ecf915d'
    ],
    passwordSalt: '8f3d2c1b7a694e50b6d8f92a1c4e7b30',
    passwordHash: 'de6b6f54fe23836f55fef0be9aeed4cc1f4beec481769759407e6abc243e969c'
  },
  {
    id: 'user-02',
    identifierHashes: [
      'c92a1ce6e463c1b9d5e8cc64c65decc2de505315466c3a19d125ea0f924fa64a',
      '29ea30f203312be8a0ea50c6cf96397daad3681626f53f755cc7e2998342570c'
    ],
    passwordSalt: '4c9a61e07b3f45d8a2ec906f13b78d54',
    passwordHash: '2f5ad508664e71e8ab01f1b6684100460b25f07d6281db97f72cee818a2d16fe'
  }
];

export function normalizeIdentifier(value) {
  return String(value ?? '').trim().toLocaleLowerCase('pt-BR');
}

export async function hashAccessValue(value) {
  const encoded = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function findAccessUser(identifier) {
  const identifierHash = await hashAccessValue(normalizeIdentifier(identifier));
  return accessUsers.find((user) => user.identifierHashes.includes(identifierHash)) ?? null;
}

export async function hashAccessPassword(passwordSalt, password) {
  const value = new TextEncoder().encode(`${passwordSalt}:${password}`);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', value);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function verifyAccessUser(identifier, password) {
  const user = await findAccessUser(identifier);
  if (!user) return null;
  const passwordHash = await hashAccessPassword(user.passwordSalt, password);
  return passwordHash === user.passwordHash ? user : null;
}
