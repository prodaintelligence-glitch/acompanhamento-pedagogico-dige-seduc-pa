import { appConfig } from '../config/appConfig.js';

export function isAuthenticated() {
  return localStorage.getItem(appConfig.storageKey) === 'true';
}

export function login(username, password) {
  if (!appConfig.accessConfigured) return false;
  const valid = username === appConfig.defaultCredentials.username && password === appConfig.defaultCredentials.password;
  if (valid) {
    localStorage.setItem(appConfig.storageKey, 'true');
  }
  return valid;
}

export function logout() {
  localStorage.removeItem(appConfig.storageKey);
}
