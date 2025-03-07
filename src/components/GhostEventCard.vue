<script setup lang="ts">
import { defineProps, computed } from 'vue';
import { useContacts } from '../composables/useContacts';
import { Contact } from '../types/Contact';
import { OhVueIcon, addIcons } from 'oh-vue-icons';
import { FaPumpMedical, RiSyringeFill } from 'oh-vue-icons/icons';

// Add icons to the list of available icon in the app
addIcons(FaPumpMedical, RiSyringeFill);

interface Event {
  id: string;
  start: Date;
  end: Date;
  contactId?: string | null;
  confirmed: boolean;
  title?: string;
  description?: string;
}

const props = defineProps<{
  event: Event;
}>();

const emits = defineEmits(['click']);

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const { getContactById } = useContacts();
const contact = computed<Contact | null>(() => {
  return props.event.contactId ? getContactById(props.event.contactId) : null;
});

const getInjectionType = computed<string | null>(() => {
  return contact.value?.injectionType || null;
});

const getAntibiotic = computed<string | null>(() => {
  return contact.value?.antibiotic || null;
});

// Computed property to get the contact's color, or null if no contact or no color
const contactColor = computed<string | null>(() => {
  return contact.value?.color || null;
});


const handleClick = () => {
  emits('click', props.event);
};
</script>

<template>
  <div
    class="border border-gray-300 rounded-md p-3 bg-white relative opacity-40 animate-pulse" 
    :style="contactColor ? { borderLeft: `6px solid ${contactColor}` } : {}"
    @click="handleClick()"
  >
    <div class="flex flex-col items-start justify-start mb-1">
      <h3 class="font-semibold text-left text-[1rem] leading-[110%] tracking-tight">
        ‼️ {{ contact?.name || 'No contact' }}
      </h3>
    </div>
    <!-- Injection type -->
    <div
      v-if="getInjectionType"
      class="absolute top-2 right-2 w-5 h-5 rounded-[50%] flex items-center justify-center"
      :class="getInjectionType === 'intravenous' ? 'bg-red-300' : 'bg-amber-300'"
    >
      <OhVueIcon :name="getInjectionType === 'intravenous' ? 'ri-syringe-fill' : 'ri-syringe-fill'" :scale="0.7" />
    </div>
    <div class="text-[0.8rem] mb-1">
      {{ formatTime(props.event.start) }} - {{ formatTime(props.event.end) }}
    </div>
    <div v-if="getAntibiotic" class="leading-tight font-light tracking-tight text-[0.7rem]">
      {{ getAntibiotic }}
    </div>
  </div>
</template>

<style scoped>
/* Add any custom scoped styles here */
</style>
