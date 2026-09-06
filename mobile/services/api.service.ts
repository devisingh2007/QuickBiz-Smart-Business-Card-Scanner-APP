import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const isProduction = process.env.NODE_ENV === 'production';
export const BASE_URL = isProduction
  ? (process.env.EXPO_PUBLIC_API_URL || '')
  : (process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000/api');

export interface UserProfile {
  id: string;
  name: string;
  email: string;
}

class ApiService {
  private token: string | null = null;
  private user: UserProfile | null = null;
  private initialized = false;
  private onLogoutCallback: (() => Promise<void>) | null = null;

  public registerOnLogout(callback: () => Promise<void>) {
    this.onLogoutCallback = callback;
  }

  // Restore session from SecureStore (native) or AsyncStorage (web)
  public async restoreSession() {
    if (this.initialized) return;

    try {
      let savedToken: string | null = null;
      let savedUserStr: string | null = null;

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

  public async setSession(token: string | null, user: UserProfile | null) {
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

  public getUser(): UserProfile | null {
    return this.user;
  }

  public isAuthenticated(): boolean {
    return this.token !== null;
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  private async request(url: string, options: RequestInit, timeoutMs = 10000): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      let response: Response;
      try {
        response = await fetch(url, { ...options, signal: controller.signal });
      } catch (err) {
        // Fallback for iOS simulator if 10.0.2.2 Android loopback fails
        if (!isProduction && url.includes('10.0.2.2')) {
          const fallbackUrl = url.replace('10.0.2.2', 'localhost');
          response = await fetch(fallbackUrl, { ...options, signal: controller.signal });
        } else {
          throw err;
        }
      }

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type');
      let data: any = {};
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok) {
        if (response.status === 401) {
          await this.setSession(null, null);
          throw new Error('Your session has expired. Please sign in again.');
        }
        if (response.status === 409) {
          const err: any = new Error(data.message || 'A duplicate contact already exists.');
          err.status = 409;
          err.duplicate = true;
          err.existingContact = data.existingContact;
          throw err;
        }
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Request timed out. Please check your network and try again.');
      }
      throw err;
    }
  }

  public async register(name: string, email: string, password: string) {
    const data = await this.request(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ name, email, password }),
    });

    if (data.token && data.user) {
      await this.setSession(data.token, data.user);
    }
    return data;
  }

  public async login(email: string, password: string) {
    const data = await this.request(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });

    if (data.token && data.user) {
      await this.setSession(data.token, data.user);
    }
    return data;
  }

  public async logout() {
    await this.setSession(null, null);
  }

  public async createContact(contactData: any, forceSave = false) {
    return this.request(`${BASE_URL}/contacts`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...contactData, forceSave }),
    });
  }

  public async getContacts(category?: string, query?: string, page?: number, limit?: number) {
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
      headers: this.getHeaders(),
    });

    return data.contacts || [];
  }

  public async updateContact(id: string, contactData: any) {
    const data = await this.request(`${BASE_URL}/contacts/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(contactData),
    });
    return data.contact;
  }

  public async deleteContact(id: string) {
    return this.request(`${BASE_URL}/contacts/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }

  public async deleteAccount() {
    return this.request(`${BASE_URL}/auth/account`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }
}

export const apiService = new ApiService();
export default apiService;
