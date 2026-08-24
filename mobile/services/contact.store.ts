import AsyncStorage from '@react-native-async-storage/async-storage';
import { ContactData } from '@/components/ui/ContactCard';
import { apiService } from './api.service';
import { normalizeEmail, normalizePhone } from '../utils/normalize';
import * as Contacts from 'expo-contacts';
import { Platform } from 'react-native';

const STORAGE_KEY = '@quickbiz_contacts';

class ContactStore {
  private contacts: ContactData[] = [];
  private initialized = false;
  private lastSyncAttemptTime = 0;

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

  // Save the in-memory contacts array to AsyncStorage
  private async persistLocal() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.contacts));
    } catch (err) {
      console.warn('Failed to persist contacts locally:', err);
    }
  }

  // Save/Create a new contact
  public async saveContact(contact: ContactData, forceSync = false): Promise<{ success: boolean; duplicate?: boolean; message?: string }> {
    await this.initialize();

    // Create a local ID if not present
    const id = contact.id || `local_${Date.now()}`;
    const timestamp = new Date().toISOString();
    const newContact: ContactData = {
      ...contact,
      id,
      syncStatus: 'pending',
      syncOperation: 'create',
      localUpdatedAt: timestamp,
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
          await this.updateLocalSyncStatus(id, 'synced', response.contact._id, response.contact.updatedAt);
        }
      } catch (err) {
        console.warn('API sync failed during save, marked as pending:', err);
        await this.updateLocalSyncStatus(id, 'failed');
      }
    }

    return { success: true };
  }

  // Update an existing contact
  public async updateContact(id: string, updatedData: Partial<ContactData>) {
    await this.initialize();

    const timestamp = new Date().toISOString();
    this.contacts = this.contacts.map((c) => {
      if (c.id === id) {
        const isCreate = c.syncOperation === 'create' || id.startsWith('local_');
        return {
          ...c,
          ...updatedData,
          syncStatus: 'pending',
          syncOperation: isCreate ? 'create' : 'update',
          localUpdatedAt: timestamp,
        };
      }
      return c;
    });
    await this.persistLocal();

    // Sync update to MongoDB if possible
    const contact = this.contacts.find((c) => c.id === id);
    if (contact && apiService.isAuthenticated() && !id.startsWith('local_')) {
      try {
        const response = await apiService.updateContact(id, updatedData);
        await this.updateLocalSyncStatus(id, 'synced', undefined, response.updatedAt);
      } catch (err) {
        console.warn('API update sync failed, marked as pending:', err);
        await this.updateLocalSyncStatus(id, 'failed');
      }
    }
  }

  // Delete a contact
  public async deleteContact(id: string) {
    await this.initialize();

    const contact = this.contacts.find((c) => c.id === id);
    const nativeId = contact?.nativeContactId;

    this.contacts = this.contacts.filter((c) => c.id !== id);
    await this.persistLocal();

    // Try to delete linked native contact
    if (nativeId && Platform.OS !== 'web') {
      try {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status === 'granted') {
          await Contacts.removeContactAsync(nativeId);
          console.log('[CONTACT LIFE] Removed linked native contact:', nativeId);
        }
      } catch (err: any) {
        console.warn('[CONTACT LIFE] Failed to delete linked native contact:', err.message || err);
      }
    }

    // Sync delete to MongoDB
    if (!id.startsWith('local_')) {
      // Add to pending deletions in AsyncStorage
      try {
        const storedDeletions = await AsyncStorage.getItem('@quickbiz_pending_deletions');
        const deletions = storedDeletions ? JSON.parse(storedDeletions) : [];
        if (!deletions.includes(id)) {
          deletions.push(id);
          await AsyncStorage.setItem('@quickbiz_pending_deletions', JSON.stringify(deletions));
        }
      } catch (e) {
        console.warn('Failed to store pending deletion:', e);
      }

      if (apiService.isAuthenticated()) {
        try {
          await apiService.deleteContact(id);
          // Remove from pending deletions
          const storedDeletions = await AsyncStorage.getItem('@quickbiz_pending_deletions');
          if (storedDeletions) {
            const deletions = JSON.parse(storedDeletions).filter((dId: string) => dId !== id);
            await AsyncStorage.setItem('@quickbiz_pending_deletions', JSON.stringify(deletions));
          }
        } catch (err) {
          console.warn('API delete sync failed:', err);
        }
      }
    }
  }

  // Helper to update sync state of a local contact
  private async updateLocalSyncStatus(
    localId: string,
    status: 'synced' | 'pending' | 'failed',
    newId?: string,
    newUpdatedAt?: string
  ) {
    this.contacts = this.contacts.map((c) => {
      if (c.id === localId) {
        return {
          ...c,
          id: newId || c.id, // Update local ID to MongoDB ObjectId if returned
          syncStatus: status,
          syncOperation: status === 'synced' ? undefined : c.syncOperation,
          localUpdatedAt: newUpdatedAt || c.localUpdatedAt,
          serverUpdatedAt: newUpdatedAt || c.serverUpdatedAt,
        };
      }
      return c;
    });
    await this.persistLocal();
  }

  // Automatically attempt to sync any unsynced contacts (pending/failed)
  public async syncPendingContacts(force = false) {
    if (!apiService.isAuthenticated()) return;

    const now = Date.now();
    if (!force && (now - this.lastSyncAttemptTime < 30000)) {
      console.log('[CONTACT LIFE] Skipping sync pending: rate limited (< 30s since last run)');
      return;
    }
    this.lastSyncAttemptTime = now;

    // 1. Process pending deletions first
    try {
      const storedDeletions = await AsyncStorage.getItem('@quickbiz_pending_deletions');
      if (storedDeletions) {
        const deletions = JSON.parse(storedDeletions);
        if (deletions.length > 0) {
          console.log(`Processing ${deletions.length} pending contact deletions...`);
          const remainingDeletions = [...deletions];
          for (const id of deletions) {
            try {
              await apiService.deleteContact(id);
              const index = remainingDeletions.indexOf(id);
              if (index > -1) remainingDeletions.splice(index, 1);
            } catch (err) {
              console.warn(`Failed to sync deletion of contact ${id}:`, err);
            }
          }
          await AsyncStorage.setItem('@quickbiz_pending_deletions', JSON.stringify(remainingDeletions));
        }
      }
    } catch (e) {
      console.warn('Error processing pending deletions:', e);
    }

    // 2. Process pending creates and updates
    const unsynced = this.contacts.filter((c) => c.syncStatus === 'pending' || c.syncStatus === 'failed');
    if (unsynced.length === 0) return;

    console.log(`Syncing ${unsynced.length} pending contacts to MongoDB...`);
    for (const contact of unsynced) {
      try {
        const cleanContact = { ...contact };
        if (cleanContact.id?.startsWith('local_')) {
          delete cleanContact.id;
        }

        const isCreate = contact.syncOperation === 'create' || contact.id?.startsWith('local_');

        if (isCreate) {
          const response = await apiService.createContact(cleanContact, true);
          if (response.success && response.contact) {
            await this.updateLocalSyncStatus(contact.id!, 'synced', response.contact._id, response.contact.updatedAt);
          }
        } else {
          const response = await apiService.updateContact(contact.id!, cleanContact);
          await this.updateLocalSyncStatus(contact.id!, 'synced', undefined, response.updatedAt);
        }
      } catch (err) {
        console.warn(`Failed to sync contact ${contact.name}:`, err);
        await this.updateLocalSyncStatus(contact.id!, 'failed');
      }
    }
  }

  // Sync state after successful login/registration
  public async handleLoginSync() {
    await this.initialize();
    
    try {
      // 1. Fetch remote contacts from backend
      const remoteContacts = await apiService.getContacts();
      
      // 2. Merge remote contacts with local contacts (avoiding duplicates and resolving conflicts)
      const localContacts = [...this.contacts];
      const merged: ContactData[] = [];
      const mergedRemoteIds = new Set<string>();

      for (const local of localContacts) {
        if (local.id?.startsWith('local_')) {
          merged.push(local);
          continue;
        }

        // Find matching remote contact by ID
        const remote = remoteContacts.find((rc: any) => rc._id === local.id);

        if (remote) {
          mergedRemoteIds.add(remote._id);

          // Conflict resolution: Check who has the latest edit
          const localTime = local.localUpdatedAt ? new Date(local.localUpdatedAt).getTime() : 0;
          const remoteTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;

          if (local.syncStatus === 'pending' || local.syncStatus === 'failed') {
            if (localTime > remoteTime) {
              // Local is newer, keep local version
              merged.push(local);
            } else {
              // Server is newer, overwrite local with server version
              merged.push({
                id: remote._id,
                name: remote.name,
                phones: remote.phones || [],
                emails: remote.emails || [],
                websites: remote.websites || [],
                company: remote.company,
                designation: remote.designation,
                officeAddress: remote.officeAddress,
                category: remote.category,
                nativeContactId: remote.nativeContactId,
                syncStatus: 'synced',
                localUpdatedAt: remote.updatedAt,
                serverUpdatedAt: remote.updatedAt,
                extractionQualityScore: remote.extractionQualityScore,
              });
            }
          } else {
            // Local is clean, overwrite with server version to get latest remote changes
            merged.push({
              id: remote._id,
              name: remote.name,
              phones: remote.phones || [],
              emails: remote.emails || [],
              websites: remote.websites || [],
              company: remote.company,
              designation: remote.designation,
              officeAddress: remote.officeAddress,
              category: remote.category,
              nativeContactId: remote.nativeContactId,
              syncStatus: 'synced',
              localUpdatedAt: remote.updatedAt,
              serverUpdatedAt: remote.updatedAt,
              extractionQualityScore: remote.extractionQualityScore,
            });
          }
        } else {
          // Local has server ID, but not returned by server (could be deleted on server).
          // If clean, drop it. If dirty, keep it so it can sync.
          if (local.syncStatus === 'pending' || local.syncStatus === 'failed') {
            merged.push(local);
          }
        }
      }

      // Add remaining remote contacts not in local
      for (const remote of remoteContacts) {
        if (!mergedRemoteIds.has(remote._id)) {
          // Check for duplicate name/email/phone to prevent duplicate cards
          const rcName = remote.name.trim().toLowerCase();
          const rcPhones = (remote.phones || []).map((p: any) => normalizePhone(p.value)).filter(Boolean);
          const rcEmails = (remote.emails || []).map((e: any) => normalizeEmail(e.value)).filter(Boolean);

          const isDup = merged.some(c => {
            const hasSameName = c.name.trim().toLowerCase() === rcName;
            const hasSamePhone = (c.phones || []).some(p => rcPhones.includes(normalizePhone(p.value)));
            const hasSameEmail = (c.emails || []).some(e => rcEmails.includes(normalizeEmail(e.value)));
            return hasSameName || hasSamePhone || hasSameEmail;
          });

          if (!isDup) {
            merged.push({
              id: remote._id,
              name: remote.name,
              phones: remote.phones || [],
              emails: remote.emails || [],
              websites: remote.websites || [],
              company: remote.company,
              designation: remote.designation,
              officeAddress: remote.officeAddress,
              category: remote.category,
              nativeContactId: remote.nativeContactId,
              syncStatus: 'synced',
              localUpdatedAt: remote.updatedAt,
              serverUpdatedAt: remote.updatedAt,
              extractionQualityScore: remote.extractionQualityScore,
            });
          }
        }
      }

      this.contacts = merged;
      await this.persistLocal();

      // 3. Upload any local-only pending contacts to backend
      await this.syncPendingContacts(true);
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
