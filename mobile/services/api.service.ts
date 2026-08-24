import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5000/api'; // Android Emulator loopback
// Fallback for iOS simulator or other networks
export const DEFAULT_URL = 'http://localhost:5000/api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
}

class ApiService {
  private token: string | null = null;
  private user: UserProfile | null = null;
  private initialized = false;

  // Restore session from Secure Store (mobile) or AsyncStorage (web)
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
        console.log('[API AUTH] Session successfully restored for user:', this.user?.email);
      }
    } catch (err: any) {
      console.warn('[API AUTH] Session restoration failed:', err.message || err);
      // Clean up corrupt session data
      await this.setSession(null, null);
    } finally {
      this.initialized = true;
    }
  }

  // Save session state helper
  public async setSession(token: string | null, user: UserProfile | null) {
    this.token = token;
    this.user = user;

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
    } catch (err: any) {
      console.error('[API AUTH] Failed to persist session data:', err.message || err);
    }
  }

  // Get current user profile
  public getUser(): UserProfile | null {
    return this.user;
  }

  // Check if authenticated
  public isAuthenticated(): boolean {
    return this.token !== null;
  }

  // Helper for auth headers
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // Private request client supporting timeout and standardized error handling
  private async request(url: string, options: RequestInit, timeoutMs = 10000): Promise<any> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Direct request using loopback URL with fallback on fetch errors
      let response;
      try {
        response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
      } catch (err: any) {
        // Fallback for iOS Simulator if localhost is preferred over android loopback IP
        if (url.includes('10.0.2.2')) {
          const fallbackUrl = url.replace('10.0.2.2', 'localhost');
          response = await fetch(fallbackUrl, {
            ...options,
            signal: controller.signal,
          });
        } else {
          throw err;
        }
      }

      clearTimeout(id);

      const contentType = response.headers.get('content-type');
      let data: any = {};
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      }

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid — clear session automatically
          await this.setSession(null, null);
          throw new Error('Your session has expired. Please sign in again.');
        }
        if (response.status === 403) {
          throw new Error('You do not have permission to perform this action.');
        }
        if (response.status === 409) {
          // Duplicate contact validation error
          const err: any = new Error(data.message || 'Duplicate contact found');
          err.status = 409;
          err.duplicate = true;
          err.existingContact = data.existingContact;
          throw err;
        }
        if (response.status >= 500) {
          throw new Error('The QuickBiz server is currently experiencing issues. Please try again later.');
        }
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err: any) {
      clearTimeout(id);
      if (err.name === 'AbortError') {
        throw new Error('Request timed out. Please check your network and try again.');
      }
      if (err.message && err.message.toLowerCase().includes('network')) {
        throw new Error('Network request failed. You may be offline or the server is unreachable.');
      }
      throw err;
    }
  }

  // Auth: Register
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

  // Auth: Login
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

  // Auth: Logout
  public async logout() {
    await this.setSession(null, null);
  }

  // Contacts: Create
  public async createContact(contactData: any, forceSave = false) {
    return this.request(`${BASE_URL}/contacts`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...contactData, forceSave }),
    });
  }

  // Contacts: Get All (paginated)
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

  // Contacts: Update
  public async updateContact(id: string, contactData: any) {
    const data = await this.request(`${BASE_URL}/contacts/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(contactData),
    });
    return data.contact;
  }

  // Contacts: Delete
  public async deleteContact(id: string) {
    return this.request(`${BASE_URL}/contacts/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }

  // Auth: Delete Account
  public async deleteAccount() {
    return this.request(`${BASE_URL}/auth/account`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }
}

export const apiService = new ApiService();
export default apiService;
