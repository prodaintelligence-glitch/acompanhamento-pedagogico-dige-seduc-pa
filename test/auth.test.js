import test from 'node:test';
import assert from 'node:assert/strict';

import { accessUsers, findAccessUser, hashAccessPassword, hashAccessValue } from '../src/auth/accessUsers.js';

test('localiza credencial individual somente pelo hash do identificador', async () => {
  const identifier = 'usuario@seduc.pa.gov.br';
  const identifierHash = await hashAccessValue(identifier);
  const users = [{ id: 'teste', identifierHashes: [identifierHash] }];
  const candidateHash = await hashAccessValue(identifier);
  assert.equal(users.find((user) => user.identifierHashes.includes(candidateHash))?.id, 'teste');
  assert.equal(await findAccessUser('nao-cadastrado'), null);
  assert.equal(accessUsers.length, 2);
  assert.equal(accessUsers.some((user) => user.identifierHashes.every((hash) => /^[a-f0-9]{64}$/.test(hash))), true);
});

test('gera hash deterministico sem armazenar a senha em texto aberto', async () => {
  const first = await hashAccessPassword('123', 'senha-de-teste');
  const second = await hashAccessPassword('123', 'senha-de-teste');
  assert.equal(first, second);
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.notEqual(first, 'senha-de-teste');
});
