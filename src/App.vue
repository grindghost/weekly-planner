<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import CalendarWeekKanban from './components/CalendarWeekKanban.vue';
import CalendarMonth from './components/CalendarMonth.vue';
import Logo from './assets/logo.svg';
import AvatarPlaceholder from './assets/avatar-placeholder.png';

const view = ref<'month' | 'week'>('month');
const route = useRoute();

const toggleView = () => {
  view.value = view.value === 'month' ? 'week' : 'month';
};

// Check if the current route is the home route
const isHomeRoute = computed(() => route.path === '/');
</script>

<template>
  <div class="bg-gray-100 min-h-screen">
    <!-- Header Bar -->
    <header
      class="bg-white shadow-md fixed top-0 left-0 w-full z-10 p-4 flex items-center justify-between"
    >
      <div class="logo-container">
        <img :src="Logo" alt="App Logo" class="h-8" />
      </div>
      <div class="flex items-center space-x-4">
        <!-- Calendar view toggle Button, only shown if home page -->
        <button
          v-if="isHomeRoute"
          @click="toggleView"
          class="text-primary hover:underline font-medium transition-colors cursor-pointer"
        >
          {{ view === 'month' ? 'Weeks ↩ ' : 'Month ↩ ' }}
        </button>
        <!-- Router link to calendar, always shown -->
        <router-link to="/" class="text-primary hover:underline font-medium transition-colors cursor-pointer">
          Planner
        </router-link>
        <!-- Router link to contact, always shown -->
        <router-link to="/contact" class="text-primary hover:underline font-medium transition-colors cursor-pointer">
          Clients
        </router-link>

        <!-- Avatar and Name -->
        <div class="flex items-center space-x-2 border-l-1 border-gray-200 pl-4">
          <img
            :src="AvatarPlaceholder"
            alt="Amélie Desmanches"
            class="w-10 h-10 rounded-full object-cover"
          />
          <div class="flex flex-col justify-center leading-4">
            <span class="font-bold text-[0.9rem] text-gray-700">Amélie Desmanches</span>
            <span class="text-[0.8rem] text-gray-500">❤️ La plus belle</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="p-4 pt-22">
      <router-view />
      <!-- calendar, only if home page -->
      <CalendarMonth v-if="isHomeRoute && view === 'month'" />
      <CalendarWeekKanban v-if="isHomeRoute && view === 'week'" />
    </main>
  </div>
</template>

<style scoped></style>
