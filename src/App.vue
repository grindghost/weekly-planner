<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import CalendarWeekKanban from './components/CalendarWeekKanban.vue';
import CalendarMonth from './components/CalendarMonth.vue';
import Logo from './assets/logo.svg';
import AvatarPlaceholder from './assets/avatar-placeholder.png';
import { RouterLink } from 'vue-router';

const view = ref<'month' | 'week'>('week');
const route = useRoute();

// State for the hamburger menu
const isMenuOpen = ref(false);

const toggleView = () => {
  view.value = view.value === 'month' ? 'week' : 'month';
};

// Check if the current route is the home route
const isHomeRoute = computed(() => route.path === '/');

// Function to toggle the menu
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

//close the menu if navigate
const closeMenu = () => {
  isMenuOpen.value = false
}
</script>

<template>
  <div class="bg-gray-100 min-h-screen w-full">
    <!-- Header Bar -->
    <header
      class="bg-white shadow-md fixed top-0 left-0 w-full z-10 p-4 flex items-center justify-between"
    >
      <!-- Logo -->
      <div class="logo-container">
        <img :src="Logo" alt="App Logo" class="h-8" />
      </div>

      <!-- Hamburger Menu (Mobile) -->
      <div class="sm:hidden">
        <button @click="toggleMenu" class="text-gray-600 focus:outline-none">
          <svg
            class="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16m-7 6h7"
            ></path>
          </svg>
        </button>
      </div>

      <!-- Navigation Links (Desktop) -->
      <nav class="hidden sm:flex items-center space-x-4">
        <!-- Calendar view toggle Button, only shown if home page -->
        <p
          v-if="isHomeRoute"
          @click="toggleView"
          class="text-primary hover:underline font-medium transition-colors cursor-pointer"
        >
          {{ view === 'month' ? 'Weeks ↩ ' : 'Month ↩ ' }}
        </p>
        <!-- Router link to calendar, always shown -->
        <RouterLink to="/" class="text-primary hover:underline font-medium transition-colors cursor-pointer">
          Planner
        </RouterLink>
        <!-- Router link to contact, always shown -->
        <RouterLink to="/contact" class="text-primary hover:underline font-medium transition-colors cursor-pointer">
          Clients
        </RouterLink>
      </nav>

      <!-- Avatar and Name -->
      <div class="hidden sm:flex items-center space-x-2 pl-4">
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

      <!-- Mobile Menu (Dropdown) -->
      <div v-if="isMenuOpen" class="absolute top-16 left-0 w-full bg-white shadow-md rounded-md overflow-hidden z-20 sm:hidden">
        <nav class="flex flex-col p-4">
          <!-- Calendar view toggle Button, only shown if home page -->
          <p
            v-if="isHomeRoute"
            @click="toggleView"
            class="text-primary hover:underline font-medium transition-colors cursor-pointer py-2"
          >
            {{ view === 'month' ? 'Weeks ↩ ' : 'Month ↩ ' }}
          </p>
          <!-- Router link to calendar, always shown -->
          <RouterLink @click="closeMenu" to="/" class="text-primary hover:underline font-medium transition-colors cursor-pointer py-2">
            Planner
          </RouterLink>
          <!-- Router link to contact, always shown -->
          <RouterLink @click="closeMenu" to="/contact" class="text-primary hover:underline font-medium transition-colors cursor-pointer py-2">
            Clients
          </RouterLink>
        </nav>
      </div>
    </header>

    <!-- Main Content -->
    <main class="pt-22 p-4 w-full flex flex-1">
      <router-view />
        <div class="w-full">
            <!-- calendar, only if home page -->
            <CalendarMonth v-if="isHomeRoute && view === 'month'" />
            <CalendarWeekKanban v-if="isHomeRoute && view === 'week'" />
        </div>
    </main>
  </div>
</template>

<style scoped>
/* Add your scoped styles here */
</style>
