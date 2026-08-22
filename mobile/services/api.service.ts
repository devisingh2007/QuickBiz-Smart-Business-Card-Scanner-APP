import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_PORT = 5000;

// Resolve the correct API base URL depending on the running environment
const getBaseUrl = (): string => {
  // Check if we are running in Expo Dev mode
  if (__DEV__) {
    // Dynamically retrieve the dev host IP (crucial for physical Expo Go debugging)
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      return `http://${ip}:${API_PORT}/api`;
    }
    // Android emulator loopback fallback
    if (Platform.OS === 'android') {
      return `http://10.0.2.2:${API_PORT}/api`;
    }
    // iOS simulator and Web loopback
    return `http://127.0.0.1:${API_PORT}/api`;
  }
  // Production URL placeholder
  return 'https://api.quickbiz.dev/api';
};

export const BASE_URL = getBaseUrl();

export interface UserProfile {
  id: string;
  name: string;
  email: string;
}

const AUTH_STORAGE_KEY = '@quickbiz_auth_session';

class ApiService {
  private token: string | null = null;
  private user: UserProfile | null = null;
  private listeners: (() => void)[] = [];

  // Set the JWT token and user info — persists to AsyncStorage
  public async setSession(token: string | null, user: UserProfile | null) {
    this.token = token;
    this.user = user;
    try {
      if (token && user) {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token, user }));
      } else {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (err) {
      console.warn('[AUTH] Failed to persist session:', err);
    }
    this.notifyListeners();
  }

  // Restore session from AsyncStorage on app startup
  public async restoreSession(): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const { token, user } = JSON.parse(stored);
        this.token = token;
        this.user = user;
        console.log('[AUTH] Session restored from storage');
        this.notifyListeners();
        return true;
      }
    } catch (err) {
      console.warn('[AUTH] Failed to restore session:', err);
    }
    return false;
  }

  // Get current user profile
  public getUser(): UserProfile | null {
    return this.user;
  }

  // Check if authenticated
  public isAuthenticated(): boolean {
    return this.token !== null;
  }

  // Subscribe to auth state changes
  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener());
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

  // Auth: Register
  public async register(name: string, email: string, password: string) {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    if (data.token && data.user) {
      this.setSession(data.token, data.user);
    }
    return data;
  }

  // Auth: Login
  public async login(email: string, password: string) {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    if (data.token && data.user) {
      this.setSession(data.token, data.user);
    }
    return data;
  }

  // Auth: Logout
  public async logout() {
    await this.setSession(null, null);
  }

  // Contacts: Create
  public async createContact(contactData: any, forceSave = false) {
    const response = await fetch(`${BASE_URL}/contacts`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ ...contactData, forceSave }),
    });

    const data = await response.json();
    if (response.status === 409 && data.duplicate) {
      // Return duplicate response directly so UI can handle prompt
      return data;
    }

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create contact');
    }

    return data;
  }

  // Contacts: Get All
  public async getContacts(category?: string, query?: string) {
    let url = `${BASE_URL}/contacts`;
    const params = new URLSearchParams();
    if (category && category !== 'All') {
      params.append('category', category);
    }
    if (query) {
      params.append('q', query);
    }

    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch contacts');
    }

    return data.contacts || [];
  }

  // Contacts: Update
  public async updateContact(id: string, contactData: any) {
    const response = await fetch(`${BASE_URL}/contacts/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(contactData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update contact');
    }

    return data.contact;
  }

  // Contacts: Delete
  public async deleteContact(id: string) {
    const response = await fetch(`${BASE_URL}/contacts/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete contact');
    }

    return data;
  }

  // OCR: Scan business card
  public async performOcr(base64Image: string) {
    const tokenPresent = this.token !== null;
    console.log(`[AUTH] Token exists: ${tokenPresent}`);
    console.log(`[AUTH] Token length: ${this.token?.length ?? 0}`);
    console.log(`[AUTH] OCR request authenticated: ${tokenPresent}`);

    const url = `${BASE_URL}/ocr/business-card`;
    console.log(`[OCR] Upload URL: ${url}`);
    console.log('[OCR] Request started');

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ image: base64Image }),
    });

    console.log(`[OCR] Response status: ${response.status}`);
    const data = await response.json();

    if (response.status === 401) {
      throw new Error('SESSION_EXPIRED');
    }
    if (response.status === 403) {
      throw new Error('OCR_FORBIDDEN');
    }
    if (response.status === 503) {
      throw new Error('OCR_UNAVAILABLE');
    }
    if (!response.ok) {
      throw new Error(data.error?.message || data.message || 'OCR extraction failed');
    }
    console.log('[OCR] OCR response received');
    return data.ocr; // returns { rawText, blocks, lines, confidence }
  }

  // OCR: Check config/credentials status
  public async checkOcrHealth() {
    const url = `${BASE_URL}/ocr/health`;
    console.log(`[OCR] Health check URL: ${url}`);
    console.log('[OCR] Health check started...');
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      console.log(`[OCR] HTTP status: ${response.status}`);
      const data = await response.json();
      console.log(`[OCR] Response body: ${JSON.stringify(data)}`);
      return data; // returns { success, provider, configured, code }
    } catch (err: any) {
      console.log(`[OCR] Network error: ${err.message || err}`);
      console.log('[OCR] Error message: Unable to connect to backend server');
      return { success: false, configured: false, code: 'NETWORK_ERROR' };
    }
  }
}

export const apiService = new ApiService();
