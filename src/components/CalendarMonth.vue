<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCalendar } from '../composables/useCalendar';
import { useEvents } from '../composables/useEvents';
import { useContacts } from '../composables/useContacts';
import EventCard from './EventCard.vue';
import EventModal from './EventModal.vue';

const { monthDays, currentDate, goToPrevMonth, goToNextMonth } = useCalendar();
const { events, addEvent, updateEvent, deleteEvent, getEventsByDate, confirmEvent, calculateDayTotalDuration, getConfirmedEventsCountByDay } = useEvents();
const { getContactById } = useContacts();

const selectedEvent = ref(null);
const selectedDate = ref(null);
const isModalOpen = ref(false);

const openModal = (event?: any, date?: Date) => {
  selectedEvent.value = event || null;
  selectedDate.value = date || null;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedEvent.value = null;
  selectedDate.value = null;
};


const handleDeleteEvent = (eventId: string) => {
  deleteEvent(eventId);
};

// Format the month and year for display
const monthYear = () => {
  return currentDate.value.toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });
};

// Computed property to get the contact name for an event
const getEventContactName = (event: any) => {
  if (event.contactId) {
    const contact = getContactById(event.contactId);
    return contact ? contact.name : 'No Contact';
  } else if (event.title) {
    return event.title;
  } else {
    return "No name";
  }
};

// Add a computed property to get the contact's color for an event
const getEventContactColor = (event: any) => {
  if (event.contactId) {
    const contact = getContactById(event.contactId);
    return contact ? contact.color : null; // Return the color, or null if no contact/color
  }
  return null; // Return null if no contactId
};

const getConfirmationStatus = (event: any) => {
  return event.confirmed ? true : false;
}

const handleSaveEvent = (eventData: any) => {

// If it's a ghost event that we're confirming
if (!eventData.confirmed && eventData.id) {
  confirmEvent(eventData); // confirm the ghost event
} 
// If it's an existing event (either confirmed or being edited)
else if (eventData.id) {
  updateEvent(eventData.id, eventData);
} 
// If it's a new event (no ID)
else {
  addEvent({ ...eventData, confirmed: true }); 
}
closeModal();
};

// Function to check if a date is today
const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

</script>

<template>
  <div class="max-w-full bg-gray-100 rounded-lg overflow-hidden shadow-md">
    <div class="flex justify-between items-center p-4 bg-primary text-white">
      <button
        class="opacity-30 bg-opacity-20 bg-transparent text-white border-2 border-white px-3 py-2 rounded-md cursor-pointer hover:opacity-90"
        @click="goToPrevMonth"
      >
        ←
      </button>
      <h2 class="m-0 font-bold text-xl">{{ monthYear() }}</h2>
      <button
        class="opacity-30 bg-opacity-20 bg-transparent border-2 border-white text-white px-3 py-2 rounded-md cursor-pointer hover:opacity-90"
        @click="goToNextMonth"
      >
        →
      </button>
    </div>

    <div class="grid">
      <div class="grid grid-cols-7 text-center font-bold bg-gray-200 p-2">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      <div class="grid grid-cols-7 gap-0.5 p-0.5">
        <div
          v-for="day in monthDays"
          :key="day.date.toISOString()"
          :class="[
            'min-h-[100px] border border-gray-300 p-1.5 cursor-pointer transition-colors flex flex-col rounded-md',
            { 'bg-white': day.isCurrentMonth & !isToday(day.date) },
            { 'bg-gray-300 opacity-60' : !day.isCurrentMonth }, // Add this line
            { 'bg-blue-100': getEventsByDate(day.date).length > 0 && day.isCurrentMonth },
            { 'hover:bg-gray-100': day.isCurrentMonth },
            { 'border-primary border-1 bg-purple-50 hover:bg-purple-100': isToday(day.date) },
          ]"
          @click="openModal(null, day.date)"
        >
        <div class="font-bold mb-1 relative">
            <span v-if="isToday(day.date)" class="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs z-10 absolute top-[-6px] left-[-6px]">
              {{ day.date.getDate() }}
            </span>
            <span v-else>{{ day.date.getDate() }}</span>
            <!-- Display confirmed events count and duration -->
            <div v-if="getConfirmedEventsCountByDay(day.date) > 0" class="absolute top-1 right-1 text-[0.6rem] text-gray-600">
              {{ getConfirmedEventsCountByDay(day.date) }} {{ getConfirmedEventsCountByDay(day.date) === 1 ? 'client' : 'clients' }} ({{ calculateDayTotalDuration(day.date) }})
            </div>
          </div>

          <div class="overflow-y-auto flex-grow">
            <div
              v-for="event in getEventsByDate(day.date)"
              :key="event.id"
              class="p-0.5 rounded text-xs mb-0.5 cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis hover:brightness-110 text-white"
              :style="{ backgroundColor: getEventContactColor(event), opacity: getConfirmationStatus(event) ? 1 : 0.5 }"
              @click.stop="openModal(event)"
            >
              {{ getEventContactName(event) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <EventModal
      :is-open="isModalOpen"
      :event="selectedEvent"
      :date="selectedDate"
      @close="closeModal"
      @save="handleSaveEvent"
    />
  </div>
</template>

<style scoped>
/* Removed all the original CSS code */
</style>
