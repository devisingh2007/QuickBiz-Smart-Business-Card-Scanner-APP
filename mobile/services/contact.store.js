import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Contacts from 'expo-contacts';
import { Platform, } from 'react-native';
import { apiService, } from './api.service';
import { normalizeEmail, normalizePhone, } from '../utils/normalize';
class ContactStore {
  contacts = [];
  initialized = false;
  currentUserId = null;
  lastSyncTime = 0;
  constructor() {
    apiService.registerOnLogout(async () => {
      await this.clearAll();
    });
  }
  async initialize(force = false) {
    const user = apiService.getUser();
    const userId = user?.id || 'guest';
    if (this.initialized && this.currentUserId === userId && !force) return;
    try {
      this.currentUserId = userId;
      const key = `@quickbiz_contacts_${userId}`;
      const stored = await AsyncStorage.getItem(key);
      this.contacts = stored ? JSON.parse(stored) : [];
      this.initialized = true;

      // Automatically attempt to sync any pending offline items
      this.syncPendingContacts();
    } catch {
      this.contacts = [];
      this.initialized = true;
    }
  }
  getContacts() {
    return this.contacts;
  }
  async persistLocal() {
    try {
      const userId = this.currentUserId || 'guest';
      const key = `@quickbiz_contacts_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(this.contacts));
    } catch (err) {
      console.warn('Failed to save contacts locally:', err);
    }
  }
  async saveContact(contact, forceSync = false) {
    await this.initialize();
    const id = contact.id || `local_${Date.now()}`;
    const timestamp = new Date().toISOString();
    const newContact = {
      ...contact,
      id,
      syncStatus: 'pending',
      syncOperation: 'create',
      localUpdatedAt: timestamp
    };
    this.contacts = [newContact, ...this.contacts];
    await this.persistLocal();
    if (apiService.isAuthenticated()) {
      try {
        const response = await apiService.createContact(contact, forceSync);
        if (response.duplicate) {
          if (!forceSync) {
            this.contacts = this.contacts.filter(c => c.id !== id);
            await this.persistLocal();
          }
          return {
            success: false,
            duplicate: true,
            message: response.message
          };
        }
        if (response.success && response.contact) {
          await this.updateLocalSyncStatus(id, 'synced', response.contact._id, response.contact.updatedAt);
        }
      } catch {
        await this.updateLocalSyncStatus(id, 'failed');
      }
    }
    return {
      success: true
    };
  }
  async updateContact(id, updatedData) {
    await this.initialize();
    const timestamp = new Date().toISOString();
    this.contacts = this.contacts.map(c => {
      if (c.id === id) {
        const isCreate = c.syncOperation === 'create' || id.startsWith('local_');
        return {
          ...c,
          ...updatedData,
          syncStatus: 'pending',
          syncOperation: isCreate ? 'create' : 'update',
          localUpdatedAt: timestamp
        };
      }
      return c;
    });
    await this.persistLocal();
    const contact = this.contacts.find(c => c.id === id);
    if (contact && apiService.isAuthenticated() && !id.startsWith('local_')) {
      try {
        const response = await apiService.updateContact(id, updatedData);
        await this.updateLocalSyncStatus(id, 'synced', undefined, response.updatedAt);
      } catch {
        await this.updateLocalSyncStatus(id, 'failed');
      }
    }
  }
  async deleteContact(id) {
    await this.initialize();
    const contact = this.contacts.find(c => c.id === id);
    const nativeId = contact?.nativeContactId;
    this.contacts = this.contacts.filter(c => c.id !== id);
    await this.persistLocal();

    // Remove linked contact from phone's native address book if present
    if (nativeId && Platform.OS !== 'web') {
      try {
        const {
          status
        } = await Contacts.requestPermissionsAsync();
        if (status === 'granted') {
          await Contacts.removeContactAsync(nativeId);
        }
      } catch (err) {
        console.warn('Could not remove native phone contact:', err);
      }
    }
    if (!id.startsWith('local_')) {
      const userId = this.currentUserId || 'guest';
      const deletionsKey = `@quickbiz_pending_deletions_${userId}`;
      try {
        const storedDeletions = await AsyncStorage.getItem(deletionsKey);
        const deletions = storedDeletions ? JSON.parse(storedDeletions) : [];
        if (!deletions.includes(id)) {
          deletions.push(id);
          await AsyncStorage.setItem(deletionsKey, JSON.stringify(deletions));
        }
      } catch {
        // Ignore storage error
      }
      if (apiService.isAuthenticated()) {
        try {
          await apiService.deleteContact(id);
          const storedDeletions = await AsyncStorage.getItem(deletionsKey);
          if (storedDeletions) {
            const deletions = JSON.parse(storedDeletions).filter(dId => dId !== id);
            await AsyncStorage.setItem(deletionsKey, JSON.stringify(deletions));
          }
        } catch (err) {
          console.warn('Failed to sync contact deletion to server:', err);
        }
      }
    }
  }
  async updateLocalSyncStatus(localId, status, newId, newUpdatedAt) {
    this.contacts = this.contacts.map(c => {
      if (c.id === localId) {
        return {
          ...c,
          id: newId || c.id,
          syncStatus: status,
          syncOperation: status === 'synced' ? undefined : c.syncOperation,
          localUpdatedAt: newUpdatedAt || c.localUpdatedAt,
          serverUpdatedAt: newUpdatedAt || c.serverUpdatedAt
        };
      }
      return c;
    });
    await this.persistLocal();
  }
  async syncPendingContacts(force = false) {
    if (!apiService.isAuthenticated()) return;
    const now = Date.now();
    if (!force && now - this.lastSyncTime < 30000) {
      return;
    }
    this.lastSyncTime = now;
    const userId = this.currentUserId || 'guest';
    const deletionsKey = `@quickbiz_pending_deletions_${userId}`;

    // 1. Process queued deletions
    try {
      const storedDeletions = await AsyncStorage.getItem(deletionsKey);
      if (storedDeletions) {
        const deletions = JSON.parse(storedDeletions);
        const remaining = [...deletions];
        for (const id of deletions) {
          try {
            await apiService.deleteContact(id);
            const idx = remaining.indexOf(id);
            if (idx > -1) remaining.splice(idx, 1);
          } catch {
            // Keep in queue for next sync
          }
        }
        await AsyncStorage.setItem(deletionsKey, JSON.stringify(remaining));
      }
    } catch {
      // Ignore
    }

    // 2. Process pending creates and updates
    const unsynced = this.contacts.filter(c => c.syncStatus === 'pending' || c.syncStatus === 'failed');
    if (unsynced.length === 0) return;
    for (const contact of unsynced) {
      try {
        const cleanContact = {
          ...contact
        };
        if (cleanContact.id?.startsWith('local_')) {
          delete cleanContact.id;
        }
        const isCreate = contact.syncOperation === 'create' || contact.id?.startsWith('local_');
        if (isCreate) {
          const response = await apiService.createContact(cleanContact, true);
          if (response.success && response.contact) {
            await this.updateLocalSyncStatus(contact.id, 'synced', response.contact._id, response.contact.updatedAt);
          }
        } else {
          const response = await apiService.updateContact(contact.id, cleanContact);
          await this.updateLocalSyncStatus(contact.id, 'synced', undefined, response.updatedAt);
        }
      } catch {
        await this.updateLocalSyncStatus(contact.id, 'failed');
      }
    }
  }
  async handleLoginSync() {
    await this.initialize(true);
    try {
      const remoteContacts = await apiService.getContacts(undefined, undefined, 1, 1000);
      const localContacts = [...this.contacts];
      const merged = [];
      const remoteIdsHandled = new Set();
      for (const local of localContacts) {
        if (local.id?.startsWith('local_')) {
          merged.push(local);
          continue;
        }
        const remote = remoteContacts.find(rc => rc._id === local.id);
        if (remote) {
          remoteIdsHandled.add(remote._id);
          const localTime = local.localUpdatedAt ? new Date(local.localUpdatedAt).getTime() : 0;
          const remoteTime = remote.updatedAt ? new Date(remote.updatedAt).getTime() : 0;
          if (local.syncStatus === 'pending' || local.syncStatus === 'failed') {
            if (localTime > remoteTime) {
              merged.push(local);
            } else {
              merged.push(this.formatRemoteContact(remote));
            }
          } else {
            merged.push(this.formatRemoteContact(remote));
          }
        } else {
          if (local.syncStatus === 'pending' || local.syncStatus === 'failed') {
            merged.push(local);
          }
        }
      }
      for (const remote of remoteContacts) {
        if (!remoteIdsHandled.has(remote._id)) {
          const rcName = (remote.name || '').trim().toLowerCase();
          const rcPhones = (remote.phones || []).map(p => normalizePhone(p.value)).filter(Boolean);
          const rcEmails = (remote.emails || []).map(e => normalizeEmail(e.value)).filter(Boolean);
          const isDuplicate = merged.some(c => {
            const sameName = c.name.trim().toLowerCase() === rcName;
            const samePhone = (c.phones || []).some(p => rcPhones.includes(normalizePhone(p.value)));
            const sameEmail = (c.emails || []).some(e => rcEmails.includes(normalizeEmail(e.value)));
            return sameName || samePhone || sameEmail;
          });
          if (!isDuplicate) {
            merged.push(this.formatRemoteContact(remote));
          }
        }
      }
      this.contacts = merged;
      await this.persistLocal();
      await this.syncPendingContacts(true);
    } catch (err) {
      console.warn('Initial cloud sync after login failed:', err);
    }
  }
  formatRemoteContact(remote) {
    return {
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
      extractionQualityScore: remote.extractionQualityScore
    };
  }
  async clearAll() {
    const userId = this.currentUserId || 'guest';
    this.contacts = [];
    this.initialized = false;
    try {
      await AsyncStorage.removeItem(`@quickbiz_contacts_${userId}`);
      await AsyncStorage.removeItem(`@quickbiz_pending_deletions_${userId}`);
    } catch {
      // Ignore
    }
    this.currentUserId = null;
  }
}
export const contactStore = new ContactStore();
export default contactStore;