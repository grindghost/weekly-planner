<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import ContactList from '../components/ContactList.vue';
import ContactForm from '../components/ContactForm.vue';
import { useContacts } from '../composables/useContacts';
import { Contact } from '../types/Contact';
import { useRoute, useRouter } from 'vue-router';

import { OhVueIcon, addIcons } from 'oh-vue-icons';
import { IoPersonCircleSharp } from 'oh-vue-icons/icons';

addIcons(IoPersonCircleSharp);

const { contacts, addContact, updateContact, deleteContact, getContactById } = useContacts();
const selectedContact = ref<Contact | null>(null);
const isEditing = ref(false);
const route = useRoute();
const router = useRouter();
const isCreatingNewContact = ref(false); // New ref for creating new contacts

const handleSelectContact = (contact: Contact) => {
  selectedContact.value = contact;
  isEditing.value = true;
  isCreatingNewContact.value = false; // We are editing, not creating
  router.push({ name: 'contact', params: { contactId: contact.id } });
};

const handleDeleteContact = (contactId: string) => {
  deleteContact(contactId);
  if (selectedContact.value?.id === contactId) {
    selectedContact.value = null;
    isEditing.value = false;
    isCreatingNewContact.value = false; // No contact selected
    router.push({ name: 'contact' });
  }
};

const handleSaveContact = (contactData: Omit<Contact, 'id'>) => {
  if (isEditing.value && selectedContact.value) {
    updateContact(selectedContact.value.id, contactData);
    // Retrieve the updated contact from the list
    const updatedContact = getContactById(selectedContact.value.id);
    if (updatedContact) {
      selectedContact.value = updatedContact;
    }
  } else {
    const newContact = addContact(contactData);
    selectedContact.value = newContact;
    router.push({ name: 'contact', params: { contactId: newContact.id } });
    isEditing.value = true;
    isCreatingNewContact.value = false; // Contact is created, so set to false
  }
};

const handleCancel = () => {
  selectedContact.value = null;
  isEditing.value = false;
  isCreatingNewContact.value = false; // No contact created or showed
  router.push({ name: 'contact' });
};

const handleCreateNewContact = () => {
  selectedContact.value = null;
  isEditing.value = false;
  isCreatingNewContact.value = true; // Set this to true
  router.push({ name: 'contact' });
};

// Watch for route parameter changes
watch(
  () => route.params.contactId,
  (contactId) => {
    if (contactId) {
      const contact = getContactById(contactId as string);
      if (contact) {
        selectedContact.value = contact;
        isEditing.value = true;
        isCreatingNewContact.value = false; // We are not creating a new one.
      }
    } else {
      selectedContact.value = null;
      isEditing.value = false;
      isCreatingNewContact.value = false; // No contact to show
    }
  },
  { immediate: true }
);

const showForm = computed(() => selectedContact.value !== null || isCreatingNewContact.value);

const formTitle = computed(() => {
  if (selectedContact.value) {
    return selectedContact.value.name;
  } else if (isCreatingNewContact.value) {
    return 'New Client';
  } else {
    return 'Client Info';
  }
});
</script>

<template>
  <div class="flex w-full min-h-screen bg-gray-100">
    <ContactList
      :contacts="contacts"
      :selectedContact="selectedContact"
      @select-contact="handleSelectContact"
    />
    <div v-if="showForm" class="w-2/3 p-4">
      <div class="flex justify-between items-center">
        <div class="flex justify-center items-center gap-1.5 pl-4 mb-[-1rem]">
          <!-- <OhVueIcon name="io-person-circle-sharp" fill="#99a1af" scale="1.5" />
          <h2 class="text-xl font-bold text-gray-400">{{ formTitle }}</h2> -->
        </div>

        <button
          @click="handleCreateNewContact"
          class="bg-primary text-white font-bold py-2 px-4 rounded hidden"
        >
          New client
        </button>
      </div>
      <ContactForm
        v-model="selectedContact"
        :isEditing="isEditing"
        @save-contact="handleSaveContact"
        @cancel="handleCancel"
        @delete-contact="handleDeleteContact"
      />
    </div>
    <div v-else class="w-2/3 p-4 bg-gray-100 flex justify-center items-center">
      <button
        @click="handleCreateNewContact"
        class="bg-primary hover:bg-primary text-white font-bold py-2 px-4 rounded"
      >
        New Client
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Add scoped styles if needed */
</style>
