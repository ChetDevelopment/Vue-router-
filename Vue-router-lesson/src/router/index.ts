import { createRouter, createWebHistory } from 'vue-router'
import Homepage from '@/view/Homepage.vue'
import About from '@/view/About.vue'
import Projects from '@/view/Projects.vue'
import ProjectDetail from '@/view/ProjectDetail.vue'
import NotFound from '@/view/NotFound.vue'

const routes = [
  {
    name: 'home',
    path: '/',
    component: Homepage,
  },
  {
    name: 'about',
    path: '/about',
    component: About,
  },
  {
    name: 'projects',
    path: '/projects',
    component: Projects,
  },
  {
    name: 'project-detail',
    path: '/projects/:id',
    component: ProjectDetail,
  },
  {
    name: 'not-found',
    path: '/:pathMatch(.*)*',
    component: NotFound,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
