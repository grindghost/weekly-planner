<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue';
import { Contact } from '../types/Contact';

interface Props {
  modelValue?: Contact | null;
  isEditing: boolean;
}
const props = defineProps<Props>();

interface Emits {
  (event: 'update:modelValue', value: Contact | null): void;
  (event: 'save-contact', value: Omit<Contact, 'id'>): void;
  (event: 'cancel'): void;
  (event: 'delete-contact', value: string): void;
}

const emit = defineEmits<Emits>();

const form = reactive<Omit<Contact, 'id'> & {
  birthDate: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  isArchived?: boolean;
  antibioticRecurrenceValue?: number; // New field
  antibioticRecurrenceUnit?: 'day' | 'week'; // New field
}>({
  name: '',
  fullName: '',
  email: '',
  phoneNumber: '',
  birthDate: '',
  locationType: 'home',
  address: '',
  injectionType: 'intravenous',
  antibiotic: '',
  color: '#461e96',
  isArchived: false,
  antibioticRecurrenceValue: undefined,
  antibioticRecurrenceUnit: 'week',
});

const antibiotics = ref<string[]>(['Penicillin', 'Amoxicillin', 'Ceftriaxone']);

const addAntibioticModalOpen = ref(false);
const newAntibiotic = ref('');
const antibioticRecurrence = ref('');

// State for the success overlay
const showSuccessOverlay = ref(false);
const successMessage = ref('');

const openAddAntibioticModal = () => {
  addAntibioticModalOpen.value = true;
};

const closeAddAntibioticModal = () => {
  addAntibioticModalOpen.value = false;
  newAntibiotic.value = '';
  antibioticRecurrence.value = '';
};

const saveNewAntibiotic = () => {
  if (newAntibiotic.value.trim().length > 0) {
    antibiotics.value.push(newAntibiotic.value);
  }
  closeAddAntibioticModal();
};

// Function to format date to yyyy-MM-dd
const formatDate = (date: Date | string): string => {
  if (typeof date === 'string') {
    if (date && date.includes('Z')) {
      return date.split('T')[0];
    }
    return date;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const resetForm = () => {
  form.name = '';
  form.fullName = '';
  form.email = '';
  form.phoneNumber = '';
  form.birthDate = '';
  form.locationType = 'home';
  form.address = '';
  form.injectionType = 'intravenous';
  form.antibiotic = '';
  form.color = '#461e96';
  form.isArchived = false;
  form.antibioticRecurrenceValue = undefined;
  form.antibioticRecurrenceUnit = 'week';
};

watch(
  () => props.modelValue,
  (newContact) => {
    if (newContact) {
      form.fullName = newContact.fullName || '';
      form.email = newContact.email || '';
      form.phoneNumber = newContact.phoneNumber || '';
      form.isArchived = newContact.isArchived || false;
      form.antibioticRecurrenceValue = newContact.antibioticRecurrenceValue || undefined;
      form.antibioticRecurrenceUnit = newContact.antibioticRecurrenceUnit || 'week';

      Object.assign(form, { ...newContact, birthDate: formatDate(newContact.birthDate) });
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

const handleSave = () => {
  emit('save-contact', { ...form, birthDate: new Date(form.birthDate) });

  // Display the success overlay
  successMessage.value = 'Changes saved successfully';
  showSuccessOverlay.value = true;

  // Hide the overlay after a few seconds
  setTimeout(() => {
    showSuccessOverlay.value = false;
    successMessage.value = '';
  }, 3000);
};

const handleCancel = () => {
  emit('update:modelValue', null);
  emit('cancel');
};
const handleDelete = () => {
  if (props.modelValue?.id) {
    emit('delete-contact', props.modelValue?.id);
  }
};
</script>

<template>
  <div class="w-full p-4 relative">
    <form @submit.prevent="handleSave" class="bg-white p-4 rounded-md shadow-md space-y-4">
      <div class="form-group">
        <label for="name" class="block text-sm font-medium text-gray-700">ID</label>
        <input
          v-model="form.name"
          type="text"
          id="name"
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-bold bg-purple-100"
          required
        />
      </div>
      <div class="form-group">
        <label for="fullName" class="block text-sm font-medium text-gray-700">Full Name</label>
        <input
          v-model="form.fullName"
          type="text"
          id="fullName"
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <div class="form-group">
        <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
        <input
          v-model="form.email"
          type="email"
          id="email"
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <div class="form-group">
        <label for="phoneNumber" class="block text-sm font-medium text-gray-700">Phone Number</label>
        <input
          v-model="form.phoneNumber"
          type="tel"
          id="phoneNumber"
          class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <div class="form-group">
        <label for="birthDate" class="block text-sm font-medium text-gray-700">Birth Date</label>
        <input
          v-model="form.birthDate"
          type="date"
          id="birthDate"
          class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full"
          required
        />
      </div>

      <div class="form-group">
        <label class="block text-sm font-medium text-gray-700">Location</label>
        <div class="mt-1 flex items-center space-x-4">
          <label class="inline-flex items-center">
            <input v-model="form.locationType" type="radio" value="home" class="form-radio text-primary" />
            <span class="ml-2">Home</span>
          </label>
          <label class="inline-flex items-center">
            <input v-model="form.locationType" type="radio" value="clinic" class="form-radio text-primary" />
            <span class="ml-2">Clinic</span>
          </label>
        </div>
      </div>

      <div v-if="form.locationType === 'home'" class="form-group">
        <label for="address" class="block text-sm font-medium text-gray-700">Address</label>
        <input
          v-model="form.address"
          type="text"
          id="address"
          class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full"
        />
      </div>

      <div class="form-group">
        <label for="injectionType" class="block text-sm font-medium text-gray-700">Injection Type</label>
        <select
          v-model="form.injectionType"
          id="injectionType"
          class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full"
          required
        >
          <option value="intravenous">Intravenous</option>
          <option value="subcutaneous">Subcutaneous</option>
        </select>
      </div>

      <div class="form-group">
        <div class="flex items-center justify-between">
          <label for="antibiotic" class="block text-sm font-medium text-gray-700">Antibiotic</label>
          <button
            type="button"
            @click="openAddAntibioticModal"
            class="text-blue-500 hover:text-blue-700 underline text-xs cursor-pointer"
          >
            Add a new antibiotic
          </button>
        </div>
        <select
          v-model="form.antibiotic"
          id="antibiotic"
          class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full"
          required
        >
          <option v-for="antibiotic in antibiotics" :key="antibiotic" :value="antibiotic">
            {{ antibiotic }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label class="block text-sm font-medium text-gray-700">Recurrence</label>
        <div class="flex items-center">
          <input
            v-model.number="form.antibioticRecurrenceValue"
            type="number"
            class="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <select
            v-model="form.antibioticRecurrenceUnit"
            class="ml-2 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="day">Day(s)</option>
            <option value="week">Week(s)</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label for="color" class="block text-sm font-medium text-gray-700">Color</label>
        <div class="w-10 h-10 rounded-[50%] flex items-center justify-center" :style="{ backgroundColor: form.color }">
          <input
            v-model="form.color"
            type="color"
            id="color"
            class="mt-1 block w-10 h-10 rounded-md border-gray-300 shadow-sm relative opacity-0"
            style="cursor: pointer;"
          />
        </div>
      </div>
      <div class="form-group">
        <label class="inline-flex items-center">
          <input v-model="form.isArchived" type="checkbox" class="form-checkbox text-primary" />
          <span class="ml-2 text-sm font-medium text-gray-700">Archived</span>
        </label>
      </div>

      <div class="flex justify-end space-x-2">
        <button
          type="button"
          @click="handleCancel"
          class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded cursor-pointer"
        >
          Cancel
        </button>
        <button type="submit" class="bg-primary hover:bg-primary text-white font-bold py-2 px-4 rounded cursor-pointer">
          {{ props.isEditing ? 'Update' : 'Save' }}
        </button>
      </div>
      <!-- Delete Button as a link under the other button -->
      <div v-if="isEditing" class="mt-4 flex justify-end">
        <button
          @click="handleDelete"
          class="flex items-center text-red-500 hover:text-red-700 focus:outline-none text-xs cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Delete Client
        </button>
      </div>
    </form>
    <!-- Add Antibiotic Modal -->
    <div
      v-if="addAntibioticModalOpen"
      class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center"
    >
      <div class="bg-white rounded-lg p-8 max-w-md">
        <h2 class="text-lg font-bold mb-4">Add New Antibiotic</h2>
        <div class="mb-4">
          <label for="newAntibiotic" class="block text-sm font-medium text-gray-700">Name</label>
          <input
            v-model="newAntibiotic"
            type="text"
            id="newAntibiotic"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <div class="mb-4">
          <label for="recurrence" class="block text-sm font-medium text-gray-700">Recurrence</label>
          <input
            v-model="antibioticRecurrence"
            type="text"
            id="recurrence"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
        <div class="flex justify-end space-x-2">
          <button
            @click="closeAddAntibioticModal"
            class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
          >
            Cancel
          </button>
          <button @click="saveNewAntibiotic" class="bg-primary hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
            Save
          </button>
        </div>
      </div>
    </div>
    <!-- Success Overlay -->
    <div
      v-if="showSuccessOverlay"
      class="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-md border border-gray-200 z-50"
    >
      {{ successMessage }}
    </div>
  </div>
</template>

<style scoped>
/* Add scoped styles here if needed */
</style>
