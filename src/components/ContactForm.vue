<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue';
import { Contact } from '../types/Contact';
import { OhVueIcon, addIcons } from 'oh-vue-icons';
import { IoInformationCircleOutline, IoCloseCircleOutline, IoPersonCircleSharp } from 'oh-vue-icons/icons';

addIcons(IoInformationCircleOutline, IoCloseCircleOutline, IoPersonCircleSharp);

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

// New state for delete confirmation modal
const showDeleteConfirmationModal = ref(false);

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

//Open the delete confirmation modal
const openDeleteConfirmation = () => {
  showDeleteConfirmationModal.value = true;
};

// Close the delete confirmation modal
const closeDeleteConfirmation = () => {
  showDeleteConfirmationModal.value = false;
};

// Handle the delete action
const handleDelete = () => {
  if (props.modelValue?.id) {
    emit('delete-contact', props.modelValue?.id);
  }
  closeDeleteConfirmation();
};
</script>

<template>
  <div class="w-full p-4 relative">
    <form @submit.prevent="handleSave" class="bg-white p-4 rounded-md shadow-md mt-7 space-y-2">

      <div class="flex justify-start items-center gap-1.5 mb-[1rem]">
          <OhVueIcon name="io-person-circle-sharp" fill="#d1d5dc" scale="1.5" />
          <h2 class="text-md font-bold text-gray-300">{{ form.name }}</h2>
        </div>

      <!-- ID and color -->
      <div class="flex flex-row mb-4">
        <div class="form-group flex-grow">
          <label for="name" class="block text-sm font-medium text-gray-700">ID</label>
          <input
            v-model="form.name"
            type="text"
            id="name"
            class="w-full px-3 py-[0.7rem] border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-bold bg-purple-100"
            required
          />
        </div>
        <div class="col-span-2 form-group flex items-en absolute right-[38px] top-[131px] w-10 h-10 rounded">
          <div
            class="w-8 h-8 rounded-[15%] flex items-center justify-center ml-2"
            :style="{ backgroundColor: form.color }"
          >
            <input
              v-model="form.color"
              type="color"
              id="color"
              class="mt-1 block w-10 h-10 rounded-md border-gray-300 shadow-sm relative opacity-0"
              style="cursor: pointer;"
            />
          </div>
        </div>
      </div>

      <!-- Archive section -->
      <div class="border-gray-300 bg-gray-50 border-1 p-2 rounded-md flex items-center space-x-4 mb-4">
        <OhVueIcon name="io-information-circle-outline" class="text-gray-500 opacity-25" scale="1.3" />
        <p class="text-gray-600 flex-grow text-xs">Instead of deleting the client, you can archive them.</p>
        <label class="inline-flex items-center">
          <input v-model="form.isArchived" type="checkbox" class="form-checkbox text-primary" />
          <span class="ml-2 text-sm font-medium text-gray-700 mr-2">Archived</span>
        </label>
      </div>

      <!-- Full Name and birth date -->
      <div class="p-4 border-gray-100 border-2 rounded-md flex flex-col gap-3">
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-8 form-group">
            <label for="fullName" class="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              v-model="form.fullName"
              type="text"
              id="fullName"
              class="w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div class="col-span-4 form-group">
            <label for="birthDate" class="block text-sm font-medium text-gray-700">Birth Date</label>
            <input
              v-model="form.birthDate"
              type="date"
              id="birthDate"
              class="flex-1 px-3 py-2 border border-gray-300 bg-gray-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full"
              required
            />
          </div>
        </div>
    

      <!-- Email and Phone Number -->
        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-6 form-group">
            <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
            <input
              v-model="form.email"
              type="email"
              id="email"
              class="w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div class="col-span-6 form-group">
            <label for="phoneNumber" class="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              v-model="form.phoneNumber"
              type="tel"
              id="phoneNumber"
              class="w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>


        
      </div>

      <!-- Location Type and Address -->
      <div class="p-4 border-gray-100 border-2 rounded-md flex flex-col gap-3">

      <div class="form-group flex items-center gap-4">

        <div class="flex flex-col w-1/4">
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

        <div class="flex-grow">
          <label for="address" class="block text-sm font-medium text-gray-700">Address</label>
          <input
            v-model="form.address"
            type="text"
            id="address"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
            :disabled="form.locationType !== 'home'"
          />
        </div>
      </div>

      </div>

      <!-- Injection Type, Antibiotic, and Recurrence -->
      <div class="p-4 border-gray-100 border-2 rounded-md flex flex-col gap-3">

        <div class="grid grid-cols-12 gap-4">
          <div class="col-span-4 form-group">
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
          <div class="col-span-4 form-group">
            <div class="flex items-center justify-between">
              <label for="antibiotic" class="block text-sm font-medium text-gray-700">Antibiotic</label>
              <button
                type="button"
                @click="openAddAntibioticModal"
                class="text-primary hover:text-primary underline text-xs cursor-pointer"
              >
                Add
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
          <div class="col-span-4 form-group">
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
        </div>
      </div>

      <div class="flex justify-end space-x-2 pt-4">
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
        <button @click="openDeleteConfirmation" class="flex items-center text-red-500 hover:text-red-700 focus:outline-none text-xs cursor-pointer">
          Delete Client
        </button>
      </div>
    </form>
    <!-- Add Antibiotic Modal -->
    <div
      v-if="addAntibioticModalOpen"
      class="fixed inset-0 bg-[rgba(0,0,0,0.7)] overflow-y-auto h-full w-full z-50 flex items-center justify-center"
    >
      <div class="bg-white shadow-[0_3px_6px_rgba(0,0,0,0.16),0_3px_6px_rgba(0,0,0,0.23)] rounded-lg p-8 max-w-md border-t-12 border-purple-500">
        <h2 class="text-lg font-bold mb-4">New Antibiotic</h2>
        <div class="mb-4">
          <label for="newAntibiotic" class="block text-sm font-medium text-gray-700">Name</label>
          <input
            v-model="newAntibiotic"
            type="text"
            id="newAntibiotic"
            class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            required
          />
        </div>

        <div class="flex flex-row gap-2">
          <button
            @click="closeAddAntibioticModal"
            class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded cursor-pointer flex-grow"
          >
            Cancel
          </button>
          <button
            @click="saveNewAntibiotic"
            class="bg-primary hover:bg-primary text-white font-bold py-2 px-4 rounded cursor-pointer"
          >
            Save
          </button>
        </div>
      </div>
    </div>
    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirmationModal"
      class="fixed inset-0 bg-[rgba(0,0,0,0.7)] overflow-y-auto h-full w-full z-50 flex items-center justify-center"
    >
      <div class="bg-white rounded-lg p-8 max-w-md">
        <h2 class="text-lg font-bold mb-4">Confirm Deletion</h2>
        <p class="mb-4">Are you sure you want to delete this client?</p>
        <div class="flex justify-end space-x-2">
          <button
            @click="closeDeleteConfirmation"
            class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
          >
            Cancel
          </button>
          <button @click="handleDelete" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Success overlay -->
    <div
      v-if="showSuccessOverlay"
      class="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-[rgba(0,0,0,0.7)] z-50"
    >
      <div class="bg-white p-8 rounded-lg shadow-md">
        <p class="text-bl font-bold">{{ successMessage }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add your scoped styles here */
</style>

