import { ref, computed, onMounted, watch } from 'vue';
import { Contact } from '../types/Contact';
import { useContacts } from './useContacts';
import { v4 as uuidv4 } from 'uuid';

interface Event {
  id: string;
  start: Date;
  end: Date;
  contactId?: string | null;
  confirmed: boolean;
  title: string;
  description: string;
  isCompleted: boolean;
}

// Helper function to calculate the next recurrence date
// const calculateNextRecurrenceDate = (
//   lastDate: Date,
//   recurrenceValue: number,
//   recurrenceUnit: 'day' | 'week'
// ): Date => {
//   const nextDate = new Date(lastDate.getTime()); // Create new Date to avoid reference issues
//   if (recurrenceUnit === 'day') {
//     nextDate.setDate(nextDate.getDate() + recurrenceValue);
//   } else if (recurrenceUnit === 'week') {
//     nextDate.setDate(nextDate.getDate() + recurrenceValue * 7);
//   }
//   return nextDate;
// };

// Helper function to calculate the next recurrence date, skipping weekends
const calculateNextRecurrenceDate = (
  lastDate: Date,
  recurrenceValue: number,
  recurrenceUnit: 'day' | 'week'
): Date => {
  let nextDate = new Date(lastDate.getTime());

  if (recurrenceUnit === 'day') {
    nextDate.setDate(nextDate.getDate() + recurrenceValue);
  } else if (recurrenceUnit === 'week') {
    nextDate.setDate(nextDate.getDate() + recurrenceValue * 7);
  }

  // Check for weekend and move to Monday if needed
  if (nextDate.getDay() === 0) {
    // Sunday
    nextDate.setDate(nextDate.getDate() + 1); // Move to Monday
  } else if (nextDate.getDay() === 6) {
    // Saturday
    nextDate.setDate(nextDate.getDate() + 2); // Move to Monday
  }

  return nextDate;
};

// Helper to safely parse dates from storage
const parseDateString = (dateString: string) => {
  if (!dateString) return new Date();
  return new Date(dateString);
};

// Helper function to format total duration
const formatDuration = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const decimalHours = (totalMinutes / 60).toFixed(2);

  return `${hours}h${minutes.toString().padStart(2, '0')} (${decimalHours}h)`;
};

const formatDurationSmall = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const decimalHours = (totalMinutes / 60).toFixed(2);

  return `${decimalHours}h`;
};

export function useEvents() {
  // Store only confirmed events
  const confirmedEvents = ref<Event[]>([]);
  // Store all ghost events
  const ghostEvents = ref<Event[]>([]);

  const { getContactById } = useContacts();

  // Function to generate next ghost events
  const generateGhostEvents = (event: Event) => {
    const newEvents: Event[] = [];
    const contact = getContactById(event.contactId as string);
    if (!contact || !contact.antibioticRecurrenceValue) return [];

    let firstEventDate = new Date(event.start.getTime()); // Create new Date to avoid reference issues
    let lastEventDate = new Date(event.end.getTime()); // Create new Date to avoid reference issues
    
    // loop once to create one ghost event
    for (let i = 0; i < 1; i++) {
      const nextStartDate = calculateNextRecurrenceDate(
        firstEventDate,
        contact.antibioticRecurrenceValue,
        contact.antibioticRecurrenceUnit || 'week'
      );

      const nextEndDate = new Date(nextStartDate.getTime());
      nextEndDate.setTime(nextStartDate.getTime() + 60 * 60 * 1000); // Add 1 hour

      newEvents.push({
        id: uuidv4(),
        start: new Date(nextStartDate.getTime()), // Create new Date to avoid reference issues
        end: new Date(nextEndDate.getTime()), // Create new Date to avoid reference issues
        contactId: event.contactId,
        confirmed: false, // Ghost event
      });

      console.log(new Date(nextStartDate.getTime()))

      lastEventDate = new Date(nextEndDate.getTime()); // Create new Date to avoid reference issues
    }
    return newEvents;
  };

  // Flag to prevent recursive calls
  let isGeneratingGhostEvents = false;

  // Function to generate all ghost events from confirmed events
  // const generateAllGhostEvents = () => {
  //   // Guard against recursive calls
  //   if (isGeneratingGhostEvents) return;
    
  //   isGeneratingGhostEvents = true;
  //   try {
  //     ghostEvents.value = [];
  //     confirmedEvents.value.forEach(confirmedEvent => {
  //       ghostEvents.value.push(...generateGhostEvents(confirmedEvent));
  //     });
  //   } finally {
  //     isGeneratingGhostEvents = false;
  //   }
  // };

  // const generateAllGhostEvents = () => {
  //   // Guard against recursive calls
  //   if (isGeneratingGhostEvents) return;

  //   isGeneratingGhostEvents = true;
  //   try {
  //     ghostEvents.value = [];
  //     // Find the most recent confirmed event
  //     if (confirmedEvents.value.length > 0) {
  //       const mostRecentConfirmedEvent = confirmedEvents.value.reduce((mostRecent, current) => {
  //         return current.end > mostRecent.end ? current : mostRecent;
  //       }, confirmedEvents.value[0]); // Initialize with the first event

  //       ghostEvents.value.push(...generateGhostEvents(mostRecentConfirmedEvent));
  //     }
  //   } finally {
  //     isGeneratingGhostEvents = false;
  //   }
  // };

  const generateAllGhostEvents = () => {
    // Guard against recursive calls
    if (isGeneratingGhostEvents) return;

    isGeneratingGhostEvents = true;
    try {
        ghostEvents.value = [];

        // Group confirmed events by contactId
        const eventsByContact = confirmedEvents.value.reduce((acc: { [key: string]: Event[] }, event) => {
            if (event.contactId) {
                acc[event.contactId] = acc[event.contactId] || [];
                acc[event.contactId].push(event);
            }
            return acc;
        }, {});

        // Find the most recent event for each contact
        for (const contactId in eventsByContact) {
            const contactEvents = eventsByContact[contactId];
            const mostRecentEvent = contactEvents.reduce((mostRecent, current) => {
                return current.end > mostRecent.end ? current : mostRecent;
            }, contactEvents[0]);
            
            // Generate ghost events for the most recent event of each contact
            ghostEvents.value.push(...generateGhostEvents(mostRecentEvent));
        }
    } finally {
        isGeneratingGhostEvents = false;
    }
};



  // Function to get all confirmed events, and dynamically compute ghost events
  const getAllEvents = computed(() => {
    return [...confirmedEvents.value, ...ghostEvents.value];
  });

  const addEvent = (event: Event) => {
    // Create a new event object with a deep copy of dates
    const newEvent: Event = { 
      ...event, 
      id: uuidv4(),
      start: new Date(event.start.getTime()),
      end: new Date(event.end.getTime()),
      confirmed: event.confirmed || false,
      title: event.title || 'New Event',
      description: event.description || '',
      isCompleted: event.isCompleted || false, //add this line
    };
    
    if (newEvent.confirmed) {
      confirmedEvents.value.push(newEvent);
    }
    // No need to call generateAllGhostEvents here, the watcher will handle it
  };

  const updateEvent = (id: string, updatedEvent: Partial<Event>) => {
    const confirmedIndex = confirmedEvents.value.findIndex((e) => e.id === id);
    const ghostIndex = ghostEvents.value.findIndex((e) => e.id === id);

    if (confirmedIndex !== -1) {
      const oldEvent = confirmedEvents.value[confirmedIndex];

      // Create a new event object with deep copies of dates
      confirmedEvents.value[confirmedIndex] = {
        ...oldEvent,
        ...updatedEvent,
        start: updatedEvent.start ? new Date(updatedEvent.start.getTime()) : oldEvent.start,
        end: updatedEvent.end ? new Date(updatedEvent.end.getTime()) : oldEvent.end,
        confirmed: updatedEvent.confirmed ?? oldEvent.confirmed, //add this line
        title: updatedEvent.title ?? oldEvent.title,
        description: updatedEvent.description ?? oldEvent.description,
        isCompleted: updatedEvent.isCompleted ?? oldEvent.isCompleted,//add this line

      };
    }
    if (ghostIndex !== -1) {
        const oldEvent = ghostEvents.value[ghostIndex];
    
        // Create a new event object with deep copies of dates
        ghostEvents.value[ghostIndex] = {
          ...oldEvent,
          ...updatedEvent,
          start: updatedEvent.start ? new Date(updatedEvent.start.getTime()) : oldEvent.start,
          end: updatedEvent.end ? new Date(updatedEvent.end.getTime()) : oldEvent.end,
          confirmed: updatedEvent.confirmed ?? oldEvent.confirmed, //add this line
          title: updatedEvent.title ?? oldEvent.title,
          description: updatedEvent.description ?? oldEvent.description,
          isCompleted: updatedEvent.isCompleted ?? oldEvent.isCompleted, //add this line

        };
    }
    // No need to call generateAllGhostEvents here, the watcher will handle it
  };



  const deleteEvent = (id: string) => {
    confirmedEvents.value = confirmedEvents.value.filter((e) => e.id !== id);
    // No need to call generateAllGhostEvents here, the watcher will handle it
  };

  const getEventsByDate = (date: Date) => {
    const dateString = date.toDateString();
    return getAllEvents.value
      .filter((event) => event.start.toDateString() === dateString)
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  };

  const getEventsByWeek = (weekStart: Date, weekEnd: Date) => {
    return confirmedEvents.value.filter(event =>
      event.start.getTime() >= weekStart.getTime() && 
      event.start.getTime() <= weekEnd.getTime()
    );
  };

  const calculateWeekTotalDuration = (weekStart: Date, weekEnd: Date) => {
    const weekEvents = getEventsByWeek(weekStart, weekEnd);
    const totalMinutes = weekEvents.reduce((total, event) => {
      const duration = (event.end.getTime() - event.start.getTime()) / (1000 * 60);
      return total + duration;
    }, 0);
    return formatDuration(totalMinutes);
  };

    // New function to calculate the total duration for confirmed events on a specific day
    const calculateDayTotalDuration = (date: Date) => {
      const dayEvents = getEventsByDate(date).filter(event => event.confirmed);
      const totalMinutes = dayEvents.reduce((total, event) => {
        const duration = (event.end.getTime() - event.start.getTime()) / (1000 * 60);
        return total + duration;
      }, 0);
      return formatDurationSmall(totalMinutes);
    };

    // New function to get the number of confirmed events on a specific day
    const getConfirmedEventsCountByDay = (date: Date) => {
      return getEventsByDate(date).filter(event => event.confirmed).length;
    };

  // Get the suggested start time for a new event on a specific date
  // const getSuggestedEventTime = (date: Date) => {
  //   const eventsOnDay = getEventsByDate(date);

  //   // If no events, suggest 8:00 AM
  //   if (eventsOnDay.length === 0) {
  //     const startTime = new Date(date);
  //     startTime.setHours(8, 0, 0, 0);

  //     const endTime = new Date(startTime);
  //     endTime.setHours(9, 0, 0, 0);

  //     return { startTime, endTime };
  //   }

  //   // Otherwise, use end time of last event
  //   const lastEvent = eventsOnDay[eventsOnDay.length - 1];
  //   const startTime = new Date(lastEvent.end.getTime());

  //   const endTime = new Date(startTime.getTime());
  //   endTime.setTime(startTime.getTime() + 60 * 60 * 1000); // Add 1 hour

  //   return { startTime, endTime };
  // };

  const getSuggestedEventTime = (date: Date) => {
    // Get only confirmed events for the specified date
    const confirmedEventsOnDay = getEventsByDate(date).filter(event => event.confirmed);

    // If no confirmed events, suggest 8:00 AM
    if (confirmedEventsOnDay.length === 0) {
      
      const startTime = new Date(date);
      startTime.setHours(8, 0, 0, 0);

      const endTime = new Date(startTime);
      endTime.setHours(9, 0, 0, 0);

      return { startTime, endTime };
    }

    // Otherwise, use end time of last confirmed event
    const lastConfirmedEvent = confirmedEventsOnDay.reduce((last, current) => {
      return current.end > last.end ? current : last;
    }, confirmedEventsOnDay[0]); // Initialize with the first event

    const startTime = new Date(lastConfirmedEvent.end.getTime());

    const endTime = new Date(startTime.getTime());
    endTime.setTime(startTime.getTime() + 60 * 60 * 1000); // Add 1 hour

    return { startTime, endTime };
  };


  const confirmEvent = (event: Event) => {

    // Remove the ghost event by ID
    ghostEvents.value = ghostEvents.value.filter(e => e.id !== event.id);
    
    // Create a new confirmed event with deep copies of dates
    const newEvent: Event = { 
      ...event, 
      confirmed: true, 
      id: uuidv4(),
      start: new Date(event.start.getTime()), 
      end: new Date(event.end.getTime()),
      isCompleted: event.isCompleted || false, //add this line

    };
    
    // Add to confirmed events
    confirmedEvents.value.push(newEvent);

    generateAllGhostEvents();
    
    // No need to call generateAllGhostEvents here, the watcher will handle it
  };

  // Load events from localStorage on mount
  onMounted(() => {
    const savedEvents = localStorage.getItem('calendar-events');
    if (savedEvents) {
      try {
        const parsedEvents = JSON.parse(savedEvents);
        confirmedEvents.value = parsedEvents.map((event: any) => ({
          ...event,
          start: parseDateString(event.start),
          end: parseDateString(event.end),
          id: event.id || uuidv4(), // Ensure all events have IDs
          confirmed: true, // Ensure all loaded events are confirmed
        }));
        // No need to call generateAllGhostEvents here, the watcher will handle it
      } catch (e) {
        console.error('Failed to parse saved events', e);
      }
    }
  });

  // Save events to localStorage whenever they change
  watch(
    confirmedEvents,
    (newEvents) => {
      // Make sure we only save confirmed events
      const eventsToSave = newEvents
        .filter(event => event.confirmed)
        .map((event) => ({
          ...event,
          start: event.start.toISOString(),
          end: event.end.toISOString(),
          id: event.id,
          confirmed: true,
        }));
      localStorage.setItem('calendar-events', JSON.stringify(eventsToSave));
    },
    { deep: true }
  );

  // Recompute ghost events whenever confirmedEvents are updated (but with a delay to avoid recursion)
  watch(
    confirmedEvents,
    () => {
      setTimeout(() => {
        generateAllGhostEvents();
      }, 0);
    },
    { deep: true }
  );

  return {
    events: getAllEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsByDate,
    getEventsByWeek,
    calculateWeekTotalDuration,
    getSuggestedEventTime,
    confirmEvent,
    calculateDayTotalDuration,
    getConfirmedEventsCountByDay,
  };
}