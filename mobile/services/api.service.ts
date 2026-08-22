import { Platform } from 'react-native';

const API_PORT = 5000;

// Resolve the correct API base URL depending on the running environment
const getBaseUrl = (): string => {
  // Check if we are running in Expo Dev mode
  if (__DEV__) {
    // Android emulator loopback address is 10.0.2.2
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

class ApiService {
  private token: string | null = null;
  private user: UserProfile | null = null;
  private listeners: (() => void)[] = [];

  // Set the JWT token and user info
  public setSession(token: string | null, user: UserProfile | null) {
    this.token = token;
    this.user = user;
    this.notifyListeners();
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
  public logout() {
    this.setSession(null, null);
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
}

export const apiService = new ApiService();
