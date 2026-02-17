<template>
  <div class="profile-header-skeleton">
    <div class="avatar-wrap-skeleton">
      <div class="avatar-skeleton shimmer"></div>
    </div>
    <div class="name-skeleton shimmer"></div>
    <div class="bio-skeleton shimmer"></div>
    <div class="stats-skeleton">
      <div class="stat-item-skeleton shimmer" v-for="i in 3" :key="i"></div>
    </div>
  </div>
</template>

<style scoped>
.profile-header-skeleton {
  text-align: center;
  padding: clamp(1rem, 4vw, 2rem);
  border-bottom: 2px solid var(--border-light);
  margin-bottom: clamp(1rem, 3vw, 1.5rem);
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 2px solid var(--border-light);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-wrap-skeleton {
  margin-bottom: 1rem;
}

.avatar-skeleton {
  width: clamp(72px, 20vw, 96px);
  height: clamp(72px, 20vw, 96px);
  border-radius: 50%;
}

.name-skeleton {
  height: 2rem;
  width: 50%;
  max-width: 300px;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.bio-skeleton {
  height: 1rem;
  width: 70%;
  max-width: 400px;
  border-radius: 4px;
  margin-bottom: 1.5rem;
}

.stats-skeleton {
  display: flex;
  justify-content: center;
  gap: 2rem;
  width: 100%;
  max-width: 360px;
  padding-top: 1rem;
  border-top: 1px solid var(--border-light);
}

.stat-item-skeleton {
  height: 3rem;
  width: 4rem;
  border-radius: 8px;
}

.shimmer {
  background: linear-gradient(
    90deg,
    var(--bg-primary) 25%,
    var(--border-light) 50%,
    var(--bg-primary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
