import { ref, computed } from 'vue';
import { Contact } from '../types/Contact';
import { loadFromLocalStorage, saveToLocalStorage } from '../utils/localStorage';
import { v4 as uuidv4 } from 'uuid';

const CONTACTS_KEY = 'contacts';
const ANTIBIOTICS_KEY = 'antibiotics'; // New key for antibiotics

interface Antibiotic {
  id: string;
  name: string;
  duration: number; // Duration in hours (decimal)
}

const contacts = ref<Contact[]>(loadFromLocalStorage<Contact[]>(CONTACTS_KEY, []));
const antibiotics = ref<Antibiotic[]>(loadFromLocalStorage<Antibiotic[]>(ANTIBIOTICS_KEY, [])); // Load antibiotics

export const useContacts = () => {
  const saveContacts = () => {
    saveToLocalStorage(CONTACTS_KEY, contacts.value);
  };

  const saveAntibiotics = () => { // Function to save antibiotics
    saveToLocalStorage(ANTIBIOTICS_KEY, antibiotics.value);
  };

  const addContact = (contact: Omit<Contact, 'id'>) => {
    const newContact: Contact = { ...contact, id: uuidv4() };
    contacts.value.push(newContact);
    saveContacts();
  };

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
  };

  // Antibiotic management functions
  const addAntibiotic = (antibiotic: Omit<Antibiotic, 'id'>) => {
    const newAntibiotic: Antibiotic = { ...antibiotic, id: uuidv4() };
    antibiotics.value.push(newAntibiotic);
    saveAntibiotics();
  };

  const updateAntibiotic = (id: string, updatedAntibiotic: Partial<Omit<Antibiotic, 'id'>>) => {
    const index = antibiotics.value.findIndex((a) => a.id === id);
    if (index !== -1) {
        const oldAntibiotic = antibiotics.value[index];
        antibiotics.value[index] = {
          ...oldAntibiotic,
          ...updatedAntibiotic,
          duration: updatedAntibiotic.duration ?? oldAntibiotic.duration,
          name: updatedAntibiotic.name ?? oldAntibiotic.name
        } as Antibiotic;
      saveAntibiotics();
    }
  };

  const deleteAntibiotic = (id: string) => {
    antibiotics.value = antibiotics.value.filter((a) => a.id !== id);
    saveAntibiotics();
  };

  const getAntibioticById = (id:string) => {
    return antibiotics.value.find((a) => a.id === id);
  }

  const allAntibiotics = computed(() => antibiotics.value);
  const allContacts = computed(() => contacts.value);

  return {
    contacts: allContacts,
    addContact,
    updateContact,
    deleteContact,
    getContactById,
    antibiotics: allAntibiotics,
    addAntibiotic,
    updateAntibiotic,
    deleteAntibiotic,
    getAntibioticById,
  };
};
