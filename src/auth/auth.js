import { appConfig } from '../config/appConfig.js';
import { verifyAccessUser } from './accessUsers.js';

export function isAuthenticated() {
  const session = localStorage.getItem(appConfig.storageKey);
  if (session === 'true') return true;
  try {
    return JSON.parse(session)?.authenticated === true;
  } catch {
    return false;
  }
}

export async function login(username, password) {
  const defaultCredentialValid = appConfig.accessConfigured
    && username === appConfig.defaultCredentials.username
    && password === appConfig.defaultCredentials.password;
  const accessUser = defaultCredentialValid ? null : await verifyAccessUser(username, password);

  if (!defaultCredentialValid && !accessUser) return false;

  localStorage.setItem(appConfig.storageKey, JSON.stringify({
    authenticated: true,
    userId: accessUser?.id ?? 'admin'
  }));
  return true;
}

export function logout() {
  localStorage.removeItem(appConfig.storageKey);
}
