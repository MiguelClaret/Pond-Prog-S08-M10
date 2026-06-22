import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'entresessoes_token';
let memoryToken: string | null = null;

function readWebStorage() {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

function writeWebStorage(token: string) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(TOKEN_KEY, token);
}

function clearWebStorage() {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
}

export async function getStoredToken() {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return readWebStorage() ?? memoryToken;
  }
}

export async function setStoredToken(token: string) {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch {
    memoryToken = token;
    writeWebStorage(token);
  }
}

export async function clearStoredToken() {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    memoryToken = null;
    clearWebStorage();
  }
}
