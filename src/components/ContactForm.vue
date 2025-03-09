<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed } from 'vue';
import { Contact } from '../types/Contact';
import { useContacts } from '../composables/useContacts';
import { OhVueIcon, addIcons } from 'oh-vue-icons';
import { IoInformationCircleOutline, IoCloseCircleOutline, IoPersonCircleSharp, BiPencil, MdDelete } from 'oh-vue-icons/icons';

addIcons(IoInformationCircleOutline, IoCloseCircleOutline, IoPersonCircleSharp, BiPencil, MdDelete);

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

const { antibiotics, addAntibiotic, updateAntibiotic, deleteAntibiotic, getAntibioticById } = useContacts();

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

// const antibiotics = ref<string[]>(['Penicillin', 'Amoxicillin', 'Ceftriaxone']);

const addAntibioticModalOpen = ref(false);
const newAntibiotic = reactive({ // Reactive object for new antibiotic
  name: '',
  duration: 0, // Default duration
});
const editingAntibiotic = ref<string | null>(null);

// State for the success overlay
const showSuccessOverlay = ref(false);
const successMessage = ref('');

// New state for delete confirmation modal
const showDeleteConfirmationModal = ref(false);

const openAddAntibioticModal = () => {
  addAntibioticModalOpen.value = true;
  newAntibiotic.name = '';
  newAntibiotic.duration = 0;
  editingAntibiotic.value = null;
};

const closeAddAntibioticModal = () => {
  addAntibioticModalOpen.value = false;
  newAntibiotic.name = '';
  newAntibiotic.duration = 0;
  editingAntibiotic.value = null;
};

const saveNewAntibiotic = () => {
  if (newAntibiotic.name.trim().length > 0 && newAntibiotic.duration > 0) {
    if (editingAntibiotic.value) {
      updateAntibiotic(editingAntibiotic.value, { ...newAntibiotic });
    } else {
      addAntibiotic({ ...newAntibiotic });
    }
  }
  closeAddAntibioticModal();
};

const deleteExistingAntibiotic = (id: string) => {
    deleteAntibiotic(id);
};

const editAntibiotic = (id: string) => {
    const antibiotic = getAntibioticById(id);
    if (antibiotic) {
        editingAntibiotic.value = id;
        newAntibiotic.name = antibiotic.name;
        newAntibiotic.duration = antibiotic.duration;
        addAntibioticModalOpen.value = true;
    }
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

const modalTitle = computed(() => {
    return editingAntibiotic.value ? 'Edit Antibiotic' : 'Add Antibiotic';
});
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
              <option v-for="antibiotic in antibiotics" :key="antibiotic.id" :value="antibiotic.name">
                {{ antibiotic.name }}
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

      <div class="flex justify-end flex-col items-end space-y-2 pt-4">
        <div class="flex justify-end space-x-2">
          <button type="button" @click="handleCancel" class="px-4 py-2 bg-gray-200 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-300">
            Cancel
          </button>
          <button type="submit" class="px-4 py-2 bg-primary text-white border border-transparent rounded-md hover:bg-primary-dark">
            Save
          </button>
        </div>
        <button v-if="props.isEditing" type="button" @click="openDeleteConfirmation" class="text-red-500 hover:text-red-700 text-sm">
          Delete this client
        </button>
      </div>

    </form>

    <!-- Antibiotic Add/Edit Modal -->
    <div v-if="addAntibioticModalOpen" class="fixed top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.7)] flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-md shadow-md w-[800px] max-w-[90%] max-h-[80vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
            <h2 class="font-bold text-xl">{{ modalTitle }}</h2>
            <button @click="closeAddAntibioticModal" class="text-gray-500 hover:text-gray-700">
                <OhVueIcon name="io-close-circle-outline" scale="1.5" />
            </button>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <!-- Form for adding/editing antibiotic -->
          <div>
            <label for="antibioticName" class="block text-sm font-medium text-gray-700">Antibiotic Name</label>
            <input v-model="newAntibiotic.name" type="text" id="antibioticName" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" required />
            <label for="antibioticDuration" class="block mt-2 text-sm font-medium text-gray-700">Duration (hours)</label>
            <input v-model.number="newAntibiotic.duration" type="number" id="antibioticDuration" min="0" step="0.1" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" required />
            <div class="flex justify-end mt-4">
              <button @click="saveNewAntibiotic" class="px-4 py-2 bg-primary text-white border border-transparent rounded-md hover:bg-primary-dark">
                Save
              </button>
            </div>
          </div>
          <!-- List of existing antibiotics -->
          <div>
            <h3 class="font-medium text-lg mb-2">Existing Antibiotics</h3>
            <div v-if="antibiotics.length > 0" class="space-y-2">
              <div v-for="antibiotic in antibiotics" :key="antibiotic.id" class="bg-gray-100 p-2 rounded-md flex items-center justify-between">
                <div>
                  <p class="font-medium">{{ antibiotic.name }}</p>
                  <p class="text-sm text-gray-600">Duration: {{ antibiotic.duration }} hours</p>
                </div>
                <div class="space-x-2">
                  <button @click="editAntibiotic(antibiotic.id)" class="text-blue-500 hover:text-blue-700">
                    <OhVueIcon name="bi-pencil" />
                  </button>
                  <button @click="deleteExistingAntibiotic(antibiotic.id)" class="text-red-500 hover:text-red-700">
                    <OhVueIcon name="md-delete" />
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="text-gray-500">No antibiotics added yet.</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirmationModal" class="fixed top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.7)] flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-md shadow-md">
        <h3 class="text-lg font-medium mb-4">Confirm Delete</h3>
        <p>Are you sure you want to delete this contact?</p>
        <div class="flex justify-end space-x-2 mt-4">
          <button @click="closeDeleteConfirmation" class="px-4 py-2 bg-gray-200 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-300">
            Cancel
          </button>
          <button @click="handleDelete" class="px-4 py-2 bg-red-500 text-white border border-transparent rounded-md hover:bg-red-600">
            Delete
          </button>
        </div>
      </div>
    </div>
    <div v-if="showSuccessOverlay" class="fixed top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.7)] flex items-center justify-center z-50">
        <div class="bg-white px-10 py-3 rounded-md shadow-md text-center">
            <!-- <OhVueIcon name="io-information-circle-outline" fill="#0f766e" scale="3" /> -->
            <h3 class="text-lg font-medium mb-4 mt-4 text-gray-700">{{ successMessage }}</h3>
        </div>
    </div>
  </div>
</template>

<style scoped>
/* No specific styles needed here, using Tailwind CSS classes */
</style>


