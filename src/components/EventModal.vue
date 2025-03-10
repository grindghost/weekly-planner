<script setup lang="ts">
import { ref, defineProps, defineEmits, onMounted, watch, computed, onUnmounted } from 'vue';
import { useEvents } from '../composables/useEvents';
import { useContacts } from '../composables/useContacts';
import { Contact, Antibiotic } from '../types/Contact'; // Import Antibiotic type
import { useRouter } from 'vue-router';

interface Event {
  id?: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  contactId?: string | null;
  confirmed?: boolean;
}

const props = defineProps<{
  event?: Event | null;
  isOpen: boolean;
  date?: Date;
}>();

const emits = defineEmits(['close', 'save']);
const { getSuggestedEventTime, confirmEvent, updateEvent, addEvent, events } = useEvents();
const { contacts, getContactById, antibiotics, getAntibioticByName } = useContacts(); // Get the antibiotics array
const router = useRouter();

const title = ref('');
const startDate = ref('');
const startTime = ref('');
const endTime = ref('');
const description = ref('');
const selectedContact = ref<Contact | null>(null);

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
    // New event with suggested times for the current date
    updateSuggestedTime(props.date, selectedContact.value?.id || null);
    
    //reset the fields values:
    title.value = "";
    description.value = "";
    selectedContact.value = null;
    startDate.value = props.date.toISOString().split('T')[0];

  } else {
    // Fallback to empty values (no event and no date)
    const today = new Date();
    title.value = '';
    startDate.value = today.toISOString().split('T')[0];
    startTime.value = '08:00';
    endTime.value = '09:00';
    description.value = '';
    selectedContact.value = null;
  }
  //always update the description and the title
  updateDescription();
  updateTitle();
  
};
// Watch for modal open state changes
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      initializeForm();
      // Add event listener for Escape key when modal opens
      window.addEventListener('keydown', handleEscapeKey);
    } else {
      // Remove event listener when modal closes
      window.removeEventListener('keydown', handleEscapeKey);
    }
  }
);

// Initial setup
onMounted(() => {
  if (props.isOpen) {
    initializeForm();
    // Add event listener for Escape key when modal opens
    window.addEventListener('keydown', handleEscapeKey);
  }
});

//Cleanup
onUnmounted(() => {
  // Remove event listener when component unmounts
  window.removeEventListener('keydown', handleEscapeKey);
})

// Handle Escape key press
const handleEscapeKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    emits('close');
  }
};

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
     confirmEvent({...newEvent, id: props.event.id}); // Confirmed the ghost event with the old id
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

// Helper function to update the start and end times
const updateSuggestedTime = (date: Date, contactId: string | null) => {
    const { startTime: suggestedStart, endTime: suggestedEnd } = getSuggestedEventTime(date, contactId);

    startTime.value = suggestedStart.toTimeString().split(' ')[0].slice(0, 5);
    endTime.value = suggestedEnd.toTimeString().split(' ')[0].slice(0, 5);

};

// Helper function to format the next recurrence date
const formatRecurrenceDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' };
    return date.toLocaleDateString('en-US', options);
};

// Helper function to check if a date is valid
const isValidDate = (date: Date): boolean => {
  return !isNaN(date.getTime());
};

// Computed property to get the next recurrence date
const nextRecurrenceDate = computed<string | null>(() => {
  if (!selectedContact.value) return null;

  const { antibioticRecurrenceValue, antibioticRecurrenceUnit } = selectedContact.value;
  if (!antibioticRecurrenceValue) return null;

  // Create a Date object from the form values
  const potentialBaseDate = new Date(`${startDate.value}T${startTime.value}`);

  // Check if the created date is valid
  let baseDate: Date;
  if (isValidDate(potentialBaseDate)) {
    baseDate = potentialBaseDate;
  } else {
    // If it's not valid, get the last day of the month
    const year = parseInt(startDate.value.split('-')[0]);
    const month = parseInt(startDate.value.split('-')[1]) -1; // Months are 0-indexed
    const lastDayOfMonth = new Date(year, month + 1, 0);
    baseDate = new Date(lastDayOfMonth.toISOString().split('T')[0] + `T${startTime.value}`);
  }

  // Calculate the next recurrence date
  const nextStartDate = new Date(baseDate);
  if (antibioticRecurrenceUnit === 'day') {
      nextStartDate.setDate(nextStartDate.getDate() + antibioticRecurrenceValue);
  } else if (antibioticRecurrenceUnit === 'week') {
      nextStartDate.setDate(nextStartDate.getDate() + antibioticRecurrenceValue * 7);
  }

  return formatRecurrenceDate(nextStartDate);
});

// Watcher to update the ghost event date when contact changes
// watch(
//   () => selectedContact.value,
//   () => {
//     // Recompute nextRecurrenceDate when selectedContact changes
//     nextRecurrenceDate.value;
//     // Update title and other fields
//     updateTitle();
//     updateDescription();

//   },
//   {deep: true}
// );

// Watch for date changes
watch(() => props.date, (newDate) => {
  if (newDate && !props.event) {
    updateSuggestedTime(newDate, selectedContact.value?.id || null);
  }
});

// Watcher to update the ghost event date when contact changes
watch(
  () => selectedContact.value,
  () => {
    // Recompute nextRecurrenceDate when selectedContact changes
    nextRecurrenceDate.value;
    // Update the start and end time when the contact changes
     if (props.date) {
        updateSuggestedTime(props.date, selectedContact.value?.id || null);
      }
    // Update title and other fields
    updateTitle();
    updateDescription();
  },
  {deep: true}
);

// Watcher to update the ghost event date when date or time changes
watch(
    () => [startDate.value, startTime.value],
    () => {
      // Recompute nextRecurrenceDate when selectedContact changes
      nextRecurrenceDate.value;
    },
    {deep: true}
  );

// New computed property for displaying the antibiotic name and duration
const antibioticInfo = computed<string | null>(() => {
  if (!selectedContact.value || !selectedContact.value.antibiotic) return null;

  // find the antibiotic by his id in the antibiotics list in the useContact composable.
  const antibiotic = antibiotics.value.find((a) => a.name === selectedContact.value.antibiotic);

  if (!antibiotic) return null;
  return `${antibiotic.name} (${antibiotic.duration}h)`;
});

const contactFullName = computed<string | null>(() => {
  if(!selectedContact.value) return null;
  return selectedContact.value.fullName;
})
const updateTitle = () => {
  if (isConfirmingGhost.value && selectedContact.value) {
    // If it's a ghost event and we have a contact, use the contact's full name.
    title.value = `${contactFullName.value}`;
  } else if (!props.event && selectedContact.value){
    title.value = `${contactFullName.value}`;
  } else if (props.event){
    title.value = props.event.title;
  }
   else {
      title.value = '';
  }
};

const updateDescription = () => {
    if (isConfirmingGhost.value && selectedContact.value && antibioticInfo.value) {
      // If it's a ghost event and we have antibiotic info, use it.
      description.value = `Antibiotic: ${antibioticInfo.value}`;
    }
     else if (!props.event && antibioticInfo.value && selectedContact.value) {
      // if the user is creating a new event.
        description.value = `Antibiotic: ${antibioticInfo.value}`;
    } else if (props.event) {
        // If it's an existing event, use the event's description.
        description.value = props.event.description || '';
    } else {
        // Default to empty if none of the above apply.
        description.value = "";
    }
};
</script>

<template>
  <div v-if="isOpen" class="fixed top-0 left-0 w-full h-full bg-[rgba(0,0,0,0.7)] flex justify-center items-center z-50">
    <div class="bg-white p-6 rounded-lg w-[450px] max-w-[90%] shadow-lg border-t-12 border-purple-600 relative">
        <!-- Confirmed Indicator -->
        <div v-if="isEventConfirmed" class="absolute top-2 right-2 w-4 h-4 bg-green-500 rounded-full"></div>
        <div v-else class="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full"></div>
      
      <!--  -->

      <h2 class="font-bold text-xl mb-3">{{ modalTitle }}</h2>

         <!-- Next Recurrence Date Display -->
        <div v-if="nextRecurrenceDate" class="text-sm mb-2 text-gray-600">
            Next Recurrence: <span class="font-bold">{{ nextRecurrenceDate }}</span>
        </div>
       <!-- Contact Phone Number (only if not confirmed) -->
        <div v-if="!isEventConfirmed && getContactPhoneNumber" class="text-sm mb-2 text-gray-600">
          Contact Phone: <span class="font-bold underline">{{ getContactPhoneNumber }}</span>
        </div>
          <!-- Antibiotic Info -->
         <!-- <div v-if="antibioticInfo" class="text-sm mb-2 text-gray-600">
            Antibiotic: <span class="font-bold">{{ antibioticInfo }}</span>
        </div> -->
      <form @submit.prevent="saveEvent">

        <!-- Contact Selection -->
        <div class="mb-4">
          <label for="contact" class="block mb-2 font-medium text-gray-700">Client</label>
          <select id="contact" v-model="selectedContact" class="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-bold bg-purple-100 disabled:cursor-not-allowed" :disabled="isConfirmingGhost">
            <option :value="null">No Contact</option>
            <option v-for="contact in contacts" :key="contact.id" :value="contact">
              {{ contact.name }}
            </option>
          </select>
          <div v-if="selectedContact" class="mt-1">
            <a href="#" @click.prevent="handleEditContact()" class="text-primary text-sm hover:underline">Edit client</a>
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
