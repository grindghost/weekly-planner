<script setup lang="ts">
import { computed } from 'vue';
import { Contact } from '../types/Contact';
import { OhVueIcon, addIcons } from 'oh-vue-icons';
import { FaPumpMedical, RiSyringeFill } from 'oh-vue-icons/icons';

// Add icons to the list of available icon in the app
addIcons(FaPumpMedical, RiSyringeFill);

interface Props {
  contacts: Contact[];
  selectedContact?: Contact | null;
}
const props = defineProps<Props>();

interface Emits {
  (event: 'select-contact', contact: Contact): void;
  (event: 'delete-contact', contactId: string): void;
}
const emit = defineEmits<Emits>();

const handleSelectContact = (contact: Contact) => {
  emit('select-contact', contact);
};

const sortedContacts = computed(() => {
  return [...props.contacts].sort((a, b) => a.name.localeCompare(b.name));
});
</script>

<template>
  <div class="w-1/3 p-4 bg-gray-100">
    <h2 class="text-lg font-bold mb-4">Clients</h2>
    <ul class="space-y-2">
      <li
        v-for="contact in sortedContacts"
        :key="contact.id"
        class="bg-white p-3 rounded-md shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer"
        :class="{
          'bg-primary': props.selectedContact?.id === contact.id,
          'border-2 border-primary': props.selectedContact?.id === contact.id,
        }"
        :style="contact.color ? { borderLeft: `6px solid ${contact.color}` } : {}"
        @click="handleSelectContact(contact)"
      >
        <div class="flex justify-between items-center">
          <div class="cursor-pointer">
            <h3 class="font-bold" :class="{'text-black': props.selectedContact?.id === contact.id}">{{ contact.name }}</h3>
            <!-- Display the phone number instead of the birth date -->
            <p v-if="contact.phoneNumber" class="text-sm">
              {{ contact.phoneNumber }}
            </p>
            <p v-if="contact.antibiotic" class="text-xs mt-1 bg-gray-200 rounded-lg p-1 w-fit pl-2 pr-2">
              {{ contact.antibiotic }}
            </p>
          </div>
          <div
            v-if="contact.injectionType"
            class="w-8 h-8 rounded-[50%] flex items-center justify-center"
            :class="
              contact.injectionType === 'intravenous' ? 'bg-red-400' : 'bg-amber-400'
            "
          >
            <OhVueIcon
              :name="
                contact.injectionType === 'intravenous' ? 'ri-syringe-fill' : 'ri-syringe-fill'
              "
              :scale="0.9"
            />
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
/* Add scoped styles here if needed */
</style>
