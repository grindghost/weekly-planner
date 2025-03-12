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

 // Helper function to insert an event in chronological order
 const insertEventInOrder = (events: Event[], newEvent: Event) => {
  const insertionIndex = events.findIndex(event => newEvent.start.getTime() < event.start.getTime());
  if (insertionIndex === -1) {
      // If the new event is after all existing events, push it to the end
      events.push(newEvent);
  } else {
      // Otherwise, insert it at the correct index
      events.splice(insertionIndex, 0, newEvent);
  }
};



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

  const { getContactById, getAntibioticByName } = useContacts();

  // Helper function to find available time slot for a ghost event
  const findAvailableTimeSlot = (date: Date, durationInHours: number): { startTime: Date, endTime: Date } => {
      // Get only confirmed events for the specified date
      const confirmedEventsOnDay = getConfirmedEventsFromLocalStorageByDate(date).filter(event => event.confirmed);
      
      const ghostEventsOnDay = getEventsByDate(date).filter(event => !event.confirmed);

      const allEventsOnDay = [...confirmedEventsOnDay, ...ghostEventsOnDay].sort((a, b) => a.start.getTime() - b.start.getTime()); // Sort all events by 

    const startTime = new Date(date);
    startTime.setHours(8, 0, 0, 0); // Start checking from 8:00 AM

    for (let hour = 8; hour < 18; hour++) { // Check until 18:00
      startTime.setHours(hour, 0, 0, 0);
      const endTime = new Date(startTime);
      endTime.setTime(startTime.getTime() + durationInHours * 60 * 60 * 1000);

      // Check if the time slot is available
      let isSlotAvailable = true;
      for (const event of allEventsOnDay) {
        if (startTime.getTime() < event.end.getTime() && endTime.getTime() > event.start.getTime()) {
          isSlotAvailable = false; // Overlap found
          break;
        }
      }

      if (isSlotAvailable) {
        return { startTime, endTime };
      }
    }

    // If no time slot is available during the day, use the last event's end time + duration
    const lastEvent = allEventsOnDay.length > 0 ? allEventsOnDay[allEventsOnDay.length - 1] : null;
    if (lastEvent) {
      startTime.setTime(lastEvent.end.getTime());
    } else{
      startTime.setHours(18, 0, 0, 0)
    }
    const endTime = new Date(startTime.getTime());
    endTime.setTime(startTime.getTime() + durationInHours * 60 * 60 * 1000);
    return { startTime, endTime };
  };

// Function to generate next ghost events
const generateGhostEvents = (event: Event) => {
  const newEvents: Event[] = [];
  const contact = getContactById(event.contactId as string);
  if (!contact || !contact.antibioticRecurrenceValue) return [];

  let firstEventDate = new Date(event.start.getTime());
  let lastEventDate = new Date(event.end.getTime());
  
  // loop once to create one ghost event
  for (let i = 0; i < 1; i++) {
    const nextStartDate = calculateNextRecurrenceDate(
      firstEventDate,
      contact.antibioticRecurrenceValue,
      contact.antibioticRecurrenceUnit || 'week'
    );
    
    let antibioticDuration = 1;
    if(contact.antibiotic){
      const antibiotic = getAntibioticByName(contact.antibiotic);
      antibioticDuration = antibiotic ? antibiotic.duration : 1;
    }

    const { startTime: nextEventStartTime, endTime: nextEventEndTime } = findAvailableTimeSlot(nextStartDate, antibioticDuration);

    newEvents.push({
      id: uuidv4(),
      start: new Date(nextEventStartTime.getTime()),
      end: new Date(nextEventEndTime.getTime()),
      contactId: event.contactId,
      confirmed: false, // Ghost event
      title: 'Ghost Event', // Add default title
      description: '', // Add default description
      isCompleted: false, // Add default isCompleted
    });

    lastEventDate = new Date(nextEventEndTime.getTime()); // Update lastEventDate
  }
  return newEvents;
};


  // Function to generate next ghost events
  const v1_generateGhostEvents = (event: Event) => {
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

      lastEventDate = new Date(nextEndDate.getTime()); // Create new Date to avoid reference issues
    }
    return newEvents;
  };

  // Flag to prevent recursive calls
  let isGeneratingGhostEvents = false;


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
    console.log("confirmedEvents.value: ", confirmedEvents.value);
    return [...confirmedEvents.value, ...ghostEvents.value].sort((a, b) => a.start.getTime() - b.start.getTime());
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
      insertEventInOrder(confirmedEvents.value, newEvent); // Insert in chronological order
      confirmedEvents.value.sort((a,b) => a.start.getTime() - b.start.getTime());
      generateAllGhostEvents();

  } else{
      insertEventInOrder(ghostEvents.value, newEvent); // Insert in chronological order
      ghostEvents.value.sort((a,b) => a.start.getTime() - b.start.getTime());
  }

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
      confirmedEvents.value.sort((a,b) => a.start.getTime() - b.start.getTime());//sort after update
      generateAllGhostEvents(); // Call here, to regenerate the ghost events.
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
        ghostEvents.value.sort((a,b) => a.start.getTime() - b.start.getTime()); //sort after update

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

    // Temporary debugging method to retrieve and filter confirmed events from localStorage
    const getConfirmedEventsFromLocalStorageByDate = (date: Date): Event[] => {
      const savedEvents = localStorage.getItem('calendar-events');
      if (!savedEvents) {
        console.warn('No events found in localStorage.');
        return [];
      }
  
      try {
        const parsedEvents = JSON.parse(savedEvents) as Event[];
        // console.log("events found in the local storage: ", parsedEvents);
  
        const confirmedEvents = parsedEvents
          .map((event) => ({
            ...event,
            start: parseDateString(event.start),
            end: parseDateString(event.end),
          }))
          .filter((event) => {
            const eventDate = event.start;
            return (
              eventDate.getFullYear() === date.getFullYear() &&
              eventDate.getMonth() === date.getMonth() &&
              eventDate.getDate() === date.getDate()
            );
          })
          .sort((a, b) => a.start.getTime() - b.start.getTime());
        // console.log('getConfirmedEventsFromLocalStorageByDate - Filtered and sorted events:', confirmedEvents);
        return confirmedEvents;
      } catch (error) {
        console.error('Error parsing events from localStorage:', error);
        return [];
      }
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

    // Modified getSuggestedEventTime function
    const getSuggestedEventTime = (date: Date, contactId: string | null) => {

      // Get only confirmed events for the specified date
      const confirmedEventsOnDay = getConfirmedEventsFromLocalStorageByDate(date).filter(event => event.confirmed);
      
      const ghostEventsOnDay = getEventsByDate(date).filter(event => !event.confirmed);

      const allEventsOnDay = [...confirmedEventsOnDay, ...ghostEventsOnDay].sort((a, b) => a.start.getTime() - b.start.getTime()); // Sort all events by 

      let antibioticDuration = 1;
      if (contactId) {
        const contact = getContactById(contactId);
        if(contact?.antibiotic){
          const antibiotic = getAntibioticByName(contact.antibiotic);
          antibioticDuration = antibiotic ? antibiotic.duration : 1;
        }
      }

      // Check if there are any events on that day.
      if (allEventsOnDay.length === 0) {
          // If no events, suggest 8:00 AM
          const startTime = new Date(date);
          startTime.setHours(8, 0, 0, 0);
  
          const endTime = new Date(startTime);
          endTime.setTime(startTime.getTime() + antibioticDuration * 60 * 60 * 1000);
  
          return { startTime, endTime };
      }

      // Find available time slot
      let suggestedStartTime = new Date(date);
      suggestedStartTime.setHours(8, 0, 0, 0); // Start checking from 8:00 AM

      for (let hour = 8; hour < 18; hour++) { // Check until 18:00
        suggestedStartTime.setHours(hour, 0, 0, 0);
        const suggestedEndTime = new Date(suggestedStartTime);
        suggestedEndTime.setTime(suggestedStartTime.getTime() + antibioticDuration * 60 * 60 * 1000);

        // Check if the time slot is available
        let isSlotAvailable = true;
        for (const event of allEventsOnDay) {
          if (suggestedStartTime.getTime() < event.end.getTime() && suggestedEndTime.getTime() > event.start.getTime()) {
            isSlotAvailable = false; // Overlap found
            break;
          }
        }

        if (isSlotAvailable) {
          return { startTime: suggestedStartTime, endTime: suggestedEndTime };
        }
      }

      // If no time slot is available during the day, use the last event's end time + 1 hour
      const lastEvent = allEventsOnDay[allEventsOnDay.length - 1];
      const startTime = new Date(lastEvent.end.getTime());
      const endTime = new Date(startTime.getTime());
      endTime.setTime(startTime.getTime() + antibioticDuration * 60 * 60 * 1000);
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
    getConfirmedEventsFromLocalStorageByDate,
    getAllEvents,
  };
}