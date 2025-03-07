
import { ref, computed } from 'vue';
import { Contact } from '../types/Contact';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/localStorage';
import { v4 as uuidv4 } from 'uuid';

const CONTACTS_KEY = 'contacts';

const contacts = ref<Contact[]>(loadFromLocalStorage<Contact[]>(CONTACTS_KEY, []));

export const useContacts = () => {
  const saveContacts = () => {
    saveToLocalStorage(CONTACTS_KEY, contacts.value);
  };

  const addContact = (contact: Omit<Contact, 'id'>) => {
    const newContact: Contact = { ...contact, id: uuidv4() };
    contacts.value.push(newContact);
    saveContacts();
  };

  // const updateContact = (id: string, updatedContact: Partial<Omit<Contact, 'id'>>) => {
  //   const index = contacts.value.findIndex((c) => c.id === id);
  //   if (index !== -1) {
  //     contacts.value[index] = { ...contacts.value[index], ...updatedContact } as Contact;
  //     saveContacts();
  //   }
  // };

  const updateContact = (id: string, updatedContact: Partial<Omit<Contact, 'id'>>) => {
    const index = contacts.value.findIndex((c) => c.id === id);
    if (index !== -1) {
      const oldContact = contacts.value[index];
      contacts.value[index] = {
        ...oldContact,
        ...updatedContact,
        antibioticRecurrenceValue: updatedContact.antibioticRecurrenceValue ?? oldContact.antibioticRecurrenceValue,
        antibioticRecurrenceUnit: updatedContact.antibioticRecurrenceUnit ?? oldContact.antibioticRecurrenceUnit,
        
      } as Contact;
      saveContacts();
    }
};

  const deleteContact = (id: string) => {
    contacts.value = contacts.value.filter((c) => c.id !== id);
    saveContacts();
  };

  const getContactById = (id: string) => {
     return contacts.value.find((c) => c.id === id);
  }

  const allContacts = computed(() => contacts.value);

  return {
    contacts: allContacts,
    addContact,
    updateContact,
    deleteContact,
    getContactById,
  };
};

