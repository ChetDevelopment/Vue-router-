<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <nav>
      <RouterLink to="/" :class="{ active: $route.name === 'home' }">Home</RouterLink>
      <RouterLink to="/about" :class="{ active: $route.name === 'about' }">About</RouterLink>
      <RouterLink to="/projects" :class="{ active: $route.name === 'projects' || $route.name === 'project-detail' }">Projects</RouterLink>
    </nav>
  </header>
  <main>
    <RouterView />
  </main>
</template>

<style scoped>
nav {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #f5f5f5;
}

a {
  text-decoration: none;
  color: #333;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

a.active {
  color: #fff;
  background: #42b883;
}
</style>
