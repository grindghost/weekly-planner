<script setup lang="ts">
import { ref, defineProps, defineEmits, onMounted, watch, computed } from 'vue';
import { useEvents } from '../composables/useEvents';
import { useContacts } from '../composables/useContacts'; // Import useContacts
import { Contact } from '../types/Contact';
import { useRouter } from 'vue-router'; // Import useRouter

interface Event {
  id?: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  contactId?: string | null; // Add contactId
  confirmed?: boolean;
}

const props = defineProps<{
  event?: Event | null;
  isOpen: boolean;
  date?: Date;
}>();

const emits = defineEmits(['close', 'save']);
const { getSuggestedEventTime, confirmEvent, updateEvent, addEvent } = useEvents();
const { contacts, getContactById } = useContacts(); // Get the contact list and getContactById
const router = useRouter(); // Get the router instance

const title = ref('');
const startDate = ref('');
const startTime = ref('');
const endTime = ref('');
const description = ref('');
const selectedContact = ref<Contact | null>(null); // Selected contact

// Initialize form with default values or event data
const initializeForm = () => {
  if (props.event) {
    // Edit existing event
    title.value = props.event.title || '';
    startDate.value = props.event.start.toISOString().split('T')[0];
    startTime.value = props.event.start.toTimeString().split(' ')[0].slice(0, 5);
    endTime.value = props.event.end.toTimeString().split(' ')[0].slice(0, 5);
    description.value = props.event.description || '';
    // Preselect the contact
    selectedContact.value = contacts.value.find(contact => contact.id === props.event?.contactId) || null;
  } else if (props.date) {
    // New event with suggested times
    const { startTime: suggestedStart, endTime: suggestedEnd } = getSuggestedEventTime(props.date);

    title.value = '';
    startDate.value = props.date.toISOString().split('T')[0];
    startTime.value = suggestedStart.toTimeString().split(' ')[0].slice(0, 5);
    endTime.value = suggestedEnd.toTimeString().split(' ')[0].slice(0, 5);
    description.value = '';
    selectedContact.value = null;
  } else {
    // Fallback to empty values
    const today = new Date();
    title.value = '';
    startDate.value = today.toISOString().split('T')[0];
    startTime.value = '08:00';
    endTime.value = '09:00';
    description.value = '';
    selectedContact.value = null;
  }
};

// Watch for modal open state changes
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      initializeForm();
    }
  }
);

// Initial setup
onMounted(() => {
  if (props.isOpen) {
    initializeForm();
  }
});

const isConfirmingGhost = computed(() => props.event?.confirmed === false);

const saveEvent = () => {
  let newEvent: Event;
  newEvent = {
      id: props.event?.id,
      start: new Date(`${startDate.value}T${startTime.value}`),
      end: new Date(`${startDate.value}T${endTime.value}`), // Same date as start
      contactId: selectedContact.value?.id || null, // Save the contactId
      title: title.value,
      description: description.value,
      confirmed: props.event?.confirmed || false
    };
  if(!selectedContact.value){
      newEvent.contactId = null;
  }
  if (props.event?.confirmed === false) {
    // confirmEvent({...newEvent, id: props.event.id}); // Confirmed the ghost event with the old id
    // addEvent({...newEvent, id: undefined, confirmed: true}) // create a new one
  } else {
     updateEvent(newEvent.id as string, newEvent); // Update the old event
  }
  emits('save', newEvent);
};

const handleEditContact = () => {
    if(selectedContact.value){
        router.push(`/contact/${selectedContact.value.id}`); // Push the contactId as parameter
    }
}

const getContactPhoneNumber = computed<string | null>(() => {
  if (props.event && props.event.contactId) {
    const contact = getContactById(props.event.contactId);
    return contact ? contact.phoneNumber : null;
  }
  return null;
});

const isEventConfirmed = computed<boolean>(() => {
  return props.event?.confirmed === true;
});

const modalTitle = computed(() => {
    if (isConfirmingGhost.value) {
        return 'Confirm Event';
    } else if (props.event) {
        return 'Edit Event';
    } else {
        return 'Add New Event';
    }
});

</script>

<template>
  <div v-if="isOpen" class="fixed top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.7)] flex justify-center items-center z-50">
    <div class="bg-white p-6 rounded-lg w-[450px] max-w-[90%] shadow-lg border-t-12 border-primary relative">
        <!-- Confirmed Indicator -->
        <div v-if="isEventConfirmed" class="absolute top-2 right-2 w-4 h-4 bg-green-500 rounded-full"></div>
        <div v-else class="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full"></div>
      
      <!--  -->

      <h2 class="font-bold text-xl mb-3">{{ modalTitle }}</h2>
       <!-- Contact Phone Number (only if not confirmed) -->
        <div v-if="!isEventConfirmed && getContactPhoneNumber" class="text-sm mb-2 text-gray-600">
          Contact Phone: <span class="font-bold underline">{{ getContactPhoneNumber }}</span>
        </div>
      <form @submit.prevent="saveEvent">

        <!-- Contact Selection -->
        <div class="mb-4">
          <label for="contact" class="block mb-2 font-medium text-gray-700">Contact</label>
          <select id="contact" v-model="selectedContact" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-bold bg-purple-100 disabled:cur" :disabled="isConfirmingGhost">
            <option :value="null">No Contact</option>
            <option v-for="contact in contacts" :key="contact.id" :value="contact">
              {{ contact.name }}
            </option>
          </select>
          <div v-if="selectedContact" class="mt-1">
            <a href="#" @click.prevent="handleEditContact()" class="text-primary text-sm hover:underline">Edit contact</a>
          </div>
        </div>

        <div class="mb-4">
          <label class="block mb-2 font-medium text-gray-700">Date</label>
          <div class="flex gap-2">
            <input
              v-model="startDate"
              type="date"
              required
              class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />

          </div>
        </div>

        <div class="mb-4 flex gap-2 w-full">
          
            <div class="flex flex-col items-start flex-grow">
              <label class="block mb-2 font-medium text-gray-700">Start Time</label>
              <input
                v-model="startTime"
                type="time"
                required
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full"
              />
            </div>

            <div class="flex flex-col items-start flex-grow">
              <label class="block mb-2 font-medium text-gray-700">End Time</label>

              <input
                v-model="endTime"
                type="time"
                required
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full"
              />
          </div>
        </div>
        <div class="mb-4">
          <label for="title" class="block mb-2 font-medium text-gray-700">Title (Optonial)</label>
          <input
            id="title"
            v-model="title"
            type="text"
            
            autofocus
            class="w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div class="mb-4">
          <label for="description" class="block mb-2 font-medium text-gray-700">Notes (Optional)</label>
          <textarea
            id="description"
            v-model="description"
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 bg-gray-100 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          ></textarea>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button
            type="button"
            class="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-200"
            @click="emits('close')"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-primary text-white border border-transparent rounded-md cursor-pointer hover:bg-primary-dark"
          >
            {{ isConfirmingGhost ? 'Confirm' : 'Save' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* All CSS code has been replaced by tailwind */
</style>
