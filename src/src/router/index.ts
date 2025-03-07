import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import ContactView from '../../views/ContactView.vue';
import CalendarView from '../../views/CalendarView.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/contact/:contactId?',
    name: 'contact',
    component: ContactView,
  },
  {
    path: '/',
    name: 'calendar',
    component: CalendarView,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;