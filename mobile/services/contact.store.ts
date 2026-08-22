import AsyncStorage from '@react-native-async-storage/async-storage';
import { ContactData } from '@/components/ui/ContactCard';
import { apiService } from './api.service';

const STORAGE_KEY = '@quickbiz_contacts';

class ContactStore {
  private contacts: ContactData[] = [];
  private listeners: (() => void)[] = [];
  private initialized = false;

  // Initialize store and load contacts from AsyncStorage
  public async initialize() {
    if (this.initialized) return;
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.contacts = JSON.parse(stored);
      } else {
        this.contacts = [];
      }
      this.initialized = true;
      
      // Auto-trigger sync check on start
      this.syncPendingContacts();
      
      this.notifyListeners();
    } catch (err) {
      console.warn('Failed to load contacts from storage:', err);
      this.contacts = [];
      this.initialized = true;
    }
  }

  // Get current contact list (cached in-memory)
  public getContacts(): ContactData[] {
    return this.contacts;
  }

  // Subscribe to changes in the contact list
  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }

  // Save the in-memory contacts array to AsyncStorage
  private async persistLocal() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.contacts));
      this.notifyListeners();
    } catch (err) {
      console.warn('Failed to persist contacts locally:', err);
    }
  }

  // Save/Create a new contact
  public async saveContact(contact: ContactData, forceSync = false): Promise<{ success: boolean; duplicate?: boolean; message?: string }> {
    await this.initialize();

    // Create a local ID if not present
    const id = contact.id || `local_${Date.now()}`;
    const newContact: ContactData = {
      ...contact,
      id,
      syncStatus: 'pending',
    };

    // Add to local array
    this.contacts = [newContact, ...this.contacts];
    await this.persistLocal();

    // Attempt to sync to MongoDB
    if (apiService.isAuthenticated()) {
      try {
        const response = await apiService.createContact(contact, forceSync);
        if (response.duplicate) {
          // Remove from local array if it's a duplicate and not forced
          if (!forceSync) {
            this.contacts = this.contacts.filter((c) => c.id !== id);
            await this.persistLocal();
          }
          return { success: false, duplicate: true, message: response.message };
        }

        // Successfully synced
        if (response.success && response.contact) {
          this.updateLocalSyncStatus(id, 'synced', response.contact._id);
        }
      } catch (err) {
        console.warn('API sync failed during save, marked as pending:', err);
        this.updateLocalSyncStatus(id, 'failed');
      }
    }

    return { success: true };
  }

  // Update an existing contact
  public async updateContact(id: string, updatedData: Partial<ContactData>) {
    await this.initialize();

    this.contacts = this.contacts.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          ...updatedData,
          syncStatus: 'pending',
        };
      }
      return c;
    });
    await this.persistLocal();

    // Sync update to MongoDB if possible
    const contact = this.contacts.find((c) => c.id === id);
    if (contact && apiService.isAuthenticated() && !id.startsWith('local_')) {
      try {
        await apiService.updateContact(id, updatedData);
        this.updateLocalSyncStatus(id, 'synced');
      } catch (err) {
        console.warn('API update sync failed, marked as pending:', err);
        this.updateLocalSyncStatus(id, 'failed');
      }
    }
  }

  // Delete a contact
  public async deleteContact(id: string) {
    await this.initialize();

    this.contacts = this.contacts.filter((c) => c.id !== id);
    await this.persistLocal();

    // Sync delete to MongoDB
    if (apiService.isAuthenticated() && !id.startsWith('local_')) {
      try {
        await apiService.deleteContact(id);
      } catch (err) {
        console.warn('API delete sync failed:', err);
      }
    }
  }

  // Helper to update sync state of a local contact
  private async updateLocalSyncStatus(localId: string, status: 'synced' | 'pending' | 'failed', newId?: string) {
    this.contacts = this.contacts.map((c) => {
      if (c.id === localId) {
        return {
          ...c,
          id: newId || c.id, // Update local ID to MongoDB ObjectId if returned
          syncStatus: status,
        };
      }
      return c;
    });
    await this.persistLocal();
  }

  // Automatically attempt to sync any unsynced contacts (pending/failed)
  public async syncPendingContacts() {
    if (!apiService.isAuthenticated()) return;

    const unsynced = this.contacts.filter((c) => c.syncStatus === 'pending' || c.syncStatus === 'failed');
    if (unsynced.length === 0) return;

    console.log(`Syncing ${unsynced.length} pending contacts to MongoDB...`);
    for (const contact of unsynced) {
      try {
        // Exclude the temp local ID prefix when sending to API
        const cleanContact = { ...contact };
        if (cleanContact.id?.startsWith('local_')) {
          delete cleanContact.id;
        }

        const response = await apiService.createContact(cleanContact, true);
        if (response.success && response.contact) {
          await this.updateLocalSyncStatus(contact.id!, 'synced', response.contact._id);
        }
      } catch (err) {
        console.warn(`Failed to sync contact ${contact.name}:`, err);
      }
    }
  }

  // Sync state after successful login/registration
  public async handleLoginSync() {
    await this.initialize();
    
    try {
      // 1. Fetch remote contacts from backend
      const remoteContacts = await apiService.getContacts();
      
      // 2. Merge remote contacts with local contacts (avoiding duplicates)
      const merged = [...this.contacts];
      
      for (const rc of remoteContacts) {
        const exists = merged.some((c) => c.email === rc.email || c.phone === rc.phone || c.name === rc.name);
        if (!exists) {
          merged.push({
            id: rc._id,
            name: rc.name,
            phone: rc.phone,
            email: rc.email,
            company: rc.company,
            designation: rc.designation,
            officeAddress: rc.officeAddress,
            category: rc.category,
            nativeContactId: rc.nativeContactId,
            syncStatus: 'synced',
          });
        }
      }

      this.contacts = merged;
      await this.persistLocal();

      // 3. Upload any local-only pending contacts to backend
      await this.syncPendingContacts();
    } catch (err) {
      console.warn('Sync on login failed:', err);
    }
  }

  // Clear all data on logout
  public async clearAll() {
    this.contacts = [];
    await this.persistLocal();
  }
}

export const contactStore = new ContactStore();
export default contactStore;
