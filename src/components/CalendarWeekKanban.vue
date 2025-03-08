<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCalendar } from '../composables/useCalendar';
import { useEvents } from '../composables/useEvents';
import EventCard from './EventCard.vue';
import GhostEventCard from './GhostEventCard.vue';
import EventModal from './EventModal.vue';

const { monthWeeks, currentDate, goToPrevMonth, goToNextMonth } = useCalendar();
const {
  events,
  addEvent,
  updateEvent,
  deleteEvent,
  getEventsByDate,
  getEventsByWeek,
  calculateWeekTotalDuration,
  confirmEvent,
} = useEvents();

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
// Filter confirmed events
const getConfirmedEventsByDate = (date: Date) => {
  return getEventsByDate(date).filter((event) => event.confirmed);
};

const getConfirmedClientEventsByDate = (date: Date) => {
  return getEventsByDate(date).filter((event) => event.confirmed && event.contactId);
};

// Filter ghost events
const getGhostEventsByDate = (date: Date) => {
  return getEventsByDate(date).filter((event) => !event.confirmed);
};

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

const handleDeleteEvent = (eventId: string) => {
  deleteEvent(eventId);
};

const handleUpdateEvent = (updatedEvent: any) => {
      updateEvent(updatedEvent.id, updatedEvent)
    }

// Format the week header in a more readable format
const formatWeekHeader = (week: any[]) => {
  const firstDay = week[0].date;
  const lastDay = week[4].date; // Using Friday as the last day of work week

  // Format like: "mar. 1, 2025 - mar. 5, 2025"
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };

  return `${firstDay.toLocaleDateString(undefined, options)} - ${lastDay.toLocaleDateString(
    undefined,
    options
  )}`;
};

// Format day header with day of week and date
const formatDayHeader = (date: Date) => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };

  return date.toLocaleDateString(undefined, options);
};

// Create work week array (Monday-Friday)
const getWorkWeekDays = (week: any[]) => {
  // Return Monday (index 1) through Friday (index 5)
  return week.slice(1, 6);
};

//New computed property
const getConfirmedEventsCountByWeek = computed(() => {
  const counts: number[] = [];
  monthWeeks.value.forEach((week) => {
    let count = 0;
    getWorkWeekDays(week).forEach(day => {
      count += getConfirmedClientEventsByDate(day.date).length;
    });
    counts.push(count);
  });
  return counts;
});

//New computed property to check if the day is today.
const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
};
</script>

<template>
  <div class="week-kanban w-full flex flex-col min-h-screen p-4 bg-gray-100">
    <div class="flex items-center justify-between mb-4">
      <div class="text-xl font-bold">
        {{ currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }) }}
      </div>
      <div class="flex space-x-2">
        <button
          @click="goToPrevMonth"
          class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center"
        >
          ←
        </button>
        <button
          @click="goToNextMonth"
          class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center"
        >
          →
        </button>
      </div>
    </div>

    <div class="flex gap-4">
      <div
        v-for="(week, weekIndex) in monthWeeks"
        :key="weekIndex"
        class="kanban-column w-full border border-gray-300 rounded-lg bg-gray-50 shadow-md flex flex-col"
      >
        <div class="week-header text-center font-bold p-3 bg-primary text-white rounded-t-lg flex flex-col min-w-[180px]">
          Week #{{ weekIndex + 1 }}
          <div class="text-xs light">
            {{ formatWeekHeader(week) }}
          </div>
        </div>

        <div class="week-days flex-1 p-2 overflow-y-auto">
          <div
            v-for="day in getWorkWeekDays(week)"
            :key="day.date.toISOString()"
            :class="[
              'day-container',
              'mb-4',
              'border-b',
              'border-gray-200',
              'pb-4',
              'last:border-b-0',
              'last:pb-0',
              isToday(day.date) ? 'border-1 border-primary rounded-md p-2 bg-purple-50 last:border-b-1 last:pb-4' : '', // Add border for today
            ]"
          >
            <h3 class="day-header text-gray-500 uppercase text-xs tracking-wider mb-1" :class="isToday(day.date) ? 'text-primary font-extrabold' : 'font-semibold'">
              {{ formatDayHeader(day.date) }}
            </h3>

            <div class="day-events p-1">
              <GhostEventCard
                v-for="event in getGhostEventsByDate(day.date)"
                :key="event.id"
                :event="event"
                @click="openModal(event)"
                class="event-in-list mb-2 cursor-pointer transition transform hover:-translate-y-1 hover:shadow-md"
              />
              <EventCard
                v-for="event in getConfirmedEventsByDate(day.date)"
                :key="event.id"
                :event="event"
                @edit="openModal(event)"
                @click.stop="openModal(event)"
                @delete="handleDeleteEvent"
                @update="handleUpdateEvent"
                class="event-in-list mb-2 cursor-pointer transition transform hover:-translate-y-1 hover:shadow-md"
              />

              <button
                class="add-event-btn w-full border-2 border-dashed border-gray-300 rounded-md mt-2 cursor-pointer text-gray-600 hover:bg-gray-200 hover:text-gray-800"
                @click="openModal(null, day.date)"
              >
                +
              </button>
            </div>
          </div>
        </div>
        <div class="sticky bottom-0 flex flex-col">
          <div class="h-10 bg-gradient-to-b from-transparent to-white"></div>
          <div class="week-footer text-center font-bold p-3 bg-gray-200 rounded-b-lg mt-auto">
            <!-- Total Duration:  -->
            <div>
              {{ calculateWeekTotalDuration(week[1].date, week[5].date) }}
            </div>
            <div class="text-xs font-light">
              ({{ getConfirmedEventsCountByWeek[weekIndex] }} clients confirmed)
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
/* All styles are replaced by tailwind classes */
</style>
