<template>
  <div class="feed">
    <h1>Feed</h1>
    <div v-if="loading">Loading…</div>
    <div v-else-if="posts.length === 0">No posts yet. <router-link to="/write">Write</router-link> one.</div>
    <div v-else class="post-list">
      <PostCard v-for="p in posts" :key="p.id" :post="p" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/api/client'
import PostCard from '@/components/PostCard.vue'
const posts = ref([])
const loading = ref(true)
onMounted(async () => {
  try {
    const { data } = await api.get('/feed')
    posts.value = data
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.feed { padding: 0; }
.post-list { display: flex; flex-direction: column; gap: 1rem; }
</style>
