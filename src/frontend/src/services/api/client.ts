import { create } from 'axios';
import { API_BASE_URL } from '../api-config';
import { clearStoredToken, getStoredToken } from '../storage';
import { logError } from '../log-error';

let authToken: string | null = null;
let onUnauthorized: (() => Promise<void> | void) | null = null;

export const api = create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = authToken ?? (await getStoredToken());

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    logError('api.response', error);

    if (error.response?.status === 401) {
      authToken = null;
      await clearStoredToken();
      await onUnauthorized?.();
    }

    return Promise.reject(error);
  },
);

export function setApiToken(token: string | null) {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => Promise<void> | void) | null) {
  onUnauthorized = handler;
}
