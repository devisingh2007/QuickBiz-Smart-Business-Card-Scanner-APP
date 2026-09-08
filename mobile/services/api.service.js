import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform, } from 'react-native';
const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  const defaultUrl = 'https://quickbiz-smart-business-card-scanner-app.onrender.com';
  const target = envUrl || defaultUrl;
  let normalized = target.replace(/\/+$/, '');
  if (!normalized.endsWith('/api')) {
    normalized = `${normalized}/api`;
  }
  return normalized;
};
export const BASE_URL = getBaseUrl();
class ApiService {
  token = null;
  user = null;
  initialized = false;
  onLogoutCallback = null;
  registerOnLogout(callback) {
    this.onLogoutCallback = callback;
  }

  // Restore session from SecureStore (native) or AsyncStorage (web)
  async restoreSession() {
    if (this.initialized) return;
    try {
      let savedToken = null;
      let savedUserStr = null;
      if (Platform.OS === 'web') {
        savedToken = await AsyncStorage.getItem('@quickbiz_jwt_token');
        savedUserStr = await AsyncStorage.getItem('@quickbiz_user_profile');
      } else {
        savedToken = await SecureStore.getItemAsync('quickbiz_jwt_token');
        savedUserStr = await SecureStore.getItemAsync('quickbiz_user_profile');
      }
      if (savedToken && savedUserStr) {
        this.token = savedToken;
        this.user = JSON.parse(savedUserStr);
      }
    } catch {
      await this.setSession(null, null);
    } finally {
      this.initialized = true;
    }
  }
  async setSession(token, user) {
    this.token = token;
    this.user = user;
    if (!token && !user && this.onLogoutCallback) {
      try {
        await this.onLogoutCallback();
      } catch (err) {
        console.warn('Logout cleanup failed:', err);
      }
    }
    try {
      if (token && user) {
        if (Platform.OS === 'web') {
          await AsyncStorage.setItem('@quickbiz_jwt_token', token);
          await AsyncStorage.setItem('@quickbiz_user_profile', JSON.stringify(user));
        } else {
          await SecureStore.setItemAsync('quickbiz_jwt_token', token);
          await SecureStore.setItemAsync('quickbiz_user_profile', JSON.stringify(user));
        }
      } else {
        if (Platform.OS === 'web') {
          await AsyncStorage.removeItem('@quickbiz_jwt_token');
          await AsyncStorage.removeItem('@quickbiz_user_profile');
        } else {
          await SecureStore.deleteItemAsync('quickbiz_jwt_token');
          await SecureStore.deleteItemAsync('quickbiz_user_profile');
        }
      }
    } catch (err) {
      console.warn('Failed to persist session:', err);
    }
  }
  getUser() {
    return this.user;
  }
  isAuthenticated() {
    return this.token !== null;
  }
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }
  async ping() {
    try {
      const rootUrl = BASE_URL.replace(/\/api$/, '');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(`${rootUrl}/`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }
  async request(url, options, timeoutMs = 30000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      let response;
      try {
        response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
      } catch (err) {
        // Fallback for iOS simulator if 10.0.2.2 Android loopback fails during local dev testing
        if (url.includes('10.0.2.2')) {
          const fallbackUrl = url.replace('10.0.2.2', 'localhost');
          response = await fetch(fallbackUrl, {
            ...options,
            signal: controller.signal
          });
        } else {
          throw err;
        }
      }
      clearTimeout(timeoutId);
      const contentType = response.headers.get('content-type');
      let data = {};
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }
      if (!response.ok) {
        if (response.status === 401) {
          await this.setSession(null, null);
          throw new Error('Your session has expired. Please sign in again.');
        }
        if (response.status === 409) {
          const err = new Error(data.message || 'A duplicate contact already exists.');
          err.status = 409;
          err.duplicate = true;
          err.existingContact = data.existingContact;
          throw err;
        }
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }
      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Request timed out. The server may be waking up (Render cold start) or your connection is slow. Please try again.');
      }
      throw err;
    }
  }
  async register(name, email, password) {
    const data = await this.request(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        name,
        email,
        password
      })
    });
    if (data.token && data.user) {
      await this.setSession(data.token, data.user);
    }
    return data;
  }
  async login(email, password) {
    const data = await this.request(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        email,
        password
      })
    });
    if (data.token && data.user) {
      await this.setSession(data.token, data.user);
    }
    return data;
  }
  async logout() {
    await this.setSession(null, null);
  }
  async createContact(contactData, forceSave = false) {
    return this.request(`${BASE_URL}/contacts`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        ...contactData,
        forceSave
      })
    });
  }
  async getContacts(category, query, page, limit) {
    let url = `${BASE_URL}/contacts`;
    const params = new URLSearchParams();
    if (category && category !== 'All') {
      params.append('category', category);
    }
    if (query) {
      params.append('q', query);
    }
    if (page) {
      params.append('page', String(page));
    }
    if (limit) {
      params.append('limit', String(limit));
    }
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    const data = await this.request(url, {
      method: 'GET',
      headers: this.getHeaders()
    });
    return data.contacts || [];
  }
  async updateContact(id, contactData) {
    const data = await this.request(`${BASE_URL}/contacts/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(contactData)
    });
    return data.contact;
  }
  async deleteContact(id) {
    return this.request(`${BASE_URL}/contacts/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
  }
  async deleteAccount() {
    return this.request(`${BASE_URL}/auth/account`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
  }
}
export const apiService = new ApiService();
export default apiService;