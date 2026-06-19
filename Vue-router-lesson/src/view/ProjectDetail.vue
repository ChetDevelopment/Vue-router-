<template>
  <div>
    <h1>{{ project?.title || 'Project Not Found' }}</h1>
    <p v-if="project">{{ project.description }}</p>
    <p v-else>No project found with ID {{ $route.params.id }}.</p>
    <RouterLink to="/projects">Back to Projects</RouterLink>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const projects = [
  { id: 1, title: 'Project Alpha', description: 'The first project.' },
  { id: 2, title: 'Project Beta', description: 'The second project.' },
  { id: 3, title: 'Project Gamma', description: 'The third project.' },
]

const route = useRoute()
const project = projects.find((p) => p.id === Number(route.params.id))
</script>

<style scoped>

</style>
