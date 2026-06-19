<template>
  <div>
    <h1>Projects</h1>
    <ul>
      <li v-for="project in projects" :key="project.id">
        <RouterLink :to="`/projects/${project.id}`">
          {{ project.title }}
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const projects = [
  { id: 1, title: 'Project Alpha' },
  { id: 2, title: 'Project Beta' },
  { id: 3, title: 'Project Gamma' },
]
</script>

<style scoped>

</style>
