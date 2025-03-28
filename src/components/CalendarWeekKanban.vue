<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
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
  getConfirmedEventsFromLocalStorageByDate,
} = useEvents();

// New: State for compact view
const compactView = ref(false);

// New: Function to toggle compact view
const toggleCompactView = () => {
  compactView.value = !compactView.value;
};

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

// **New: Combined and sorted events**
const getSortedEventsByDate = (date: Date) => {
  const confirmedEvents = getConfirmedEventsFromLocalStorageByDate(date);
  const ghostEvents = getGhostEventsByDate(date);

  // Combine events
  const allEvents = [...ghostEvents, ...confirmedEvents];

  // Sort by start time
  return allEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
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

// New: Computed property to find the current week index
const currentWeekIndex = computed(() => {
  const today = new Date();
  return monthWeeks.value.findIndex(week => {
    return week.some(day => isToday(day.date));
  });
});

// New: Function to check if it's the current week
const isCurrentWeek = (weekIndex: number) => {
  return weekIndex === currentWeekIndex.value;
};

//New : Smooth scroll to current day
const scrollToCurrentDay = async () => {
  await nextTick(); 
  const todayElement = document.querySelector('.is-today');
  if (todayElement) {
    todayElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

onMounted(() => {
  scrollToCurrentDay();
});
</script>

<template>
  <div class="week-kanban w-full flex flex-col min-h-screen p-4 bg-gray-100">
    <!-- **New: Fixed Header Container ...** -->
    <div class="fixed top-16 sm:top-18 left-0 w-full bg-gray-100 z-5 p-4">
      <div class="flex items-center justify-between h-14">
        <div class="text-xl font-bold">
          {{ currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }) }}
        </div>
        <div class="flex space-x-2 items-center ml-auto">
          <span class="mr-2 text-sm hidden sm:block">Collapse cards</span>
          <!-- New: Compact View Toggle -->
          <label class="switch mr-5">
              <input type="checkbox" v-model="compactView" id="">
              <span class="slider round"></span>
          </label>
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
    </div>
    <!-- **New: Margin to compensate for fixed header** -->
    <div class="">
      <div class="flex gap-4 flex-col sm:flex-row">
        
        <div
          v-for="(week, weekIndex) in monthWeeks"
          :key="weekIndex"
          class="kanban-column w-full sm:flex-1 rounded-lg flex flex-col relative"
          
        >

          <div class="week-header sticky top-38 flex flex-col min-w-[180px] z-4 sm:z-5 bg-gray-100">
            <div class="rounded-t-lg text-center font-bold p-3 bg-primary text-white">
                Week #{{ weekIndex + 1 }}
              
              <div class="text-xs light">
                {{ formatWeekHeader(week) }}
              </div>
          </div>

          </div>

          <div class="content-container shadow-md flex-1 overflow-y-auto relative bg-gray-50" :class="{ 'current-week': isCurrentWeek(weekIndex) }">

            <div class="week-days flex-1 p-2 overflow-y-auto bg-gray-50 pt-[4rem]">
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
                  isToday(day.date) ? 'border-1 border-primary rounded-md p-2 bg-purple-50 last:border-b-1 last:pb-4 is-today' : '', // Add border for today
                ]"
              >
                <h3 class="day-header text-gray-500 uppercase text-xs tracking-wider mb-1" :class="isToday(day.date) ? 'text-primary font-extrabold' : 'font-semibold'">
                  {{ formatDayHeader(day.date) }}
                </h3>

                <div class="day-events p-1">

                  <!-- **New: Single loop for all sorted events** -->
                  <component
                      v-for="event in getSortedEventsByDate(day.date)"
                      :key="event.id"
                      :is="event.confirmed ? EventCard : GhostEventCard"
                      :event="event"
                      :compact="compactView"
                      @edit="openModal(event)"
                      @click="openModal(event)"
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
          </div>
          <div class="footer sticky bottom-0 flex flex-col">
            <div class="absolute bottom-[63px] left-0 w-full h-10 bg-gradient-to-b from-transparent to-white"></div>
            <div class="week-footer text-center font-bold p-3 bg-gray-200 rounded-b-lg mt-auto" :class="{ 'current-week border-b-2 border-primary': isCurrentWeek(weekIndex) }">
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
/* Add any custom scoped styles here */
/* The switch - the box around the slider */
.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
}

/* Hide default HTML checkbox */
.switch input {
  opacity: 0; /*make it transparent*/
  width: 0;
  height: 0;
  position: absolute;
  top: 0;
  left: 0;
}

/* The slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: .4s;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
}

input:checked + .slider {
  background-color: var(--primary-color);
}

input:focus + .slider {
  box-shadow: 0 0 1px var(--primary-color);
}

input:checked + .slider:before {
  -webkit-transform: translateX(20px);
  -ms-transform: translateX(20px);
  transform: translateX(20px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

/* Responsive design for mobile */
@media (max-width: 640px) {
  .kanban-column {
    width: 100% !important; /* Full width on mobile */
  }
  .week-kanban .flex.gap-4 {
    flex-direction: column; /* Stack columns on mobile */
  }
  .week-header{
    min-width: auto !important;
  }
}

/* Highlight for the current week */
.current-week {
  border-left: 2px solid var(--primary-color);
  border-right: 2px solid var(--primary-color);
  box-shadow: 0 4px 8px rgba(var(--primary-color-rgb), 0.2);
}

</style>
