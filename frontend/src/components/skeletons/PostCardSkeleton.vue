<template>
  <div class="card-skeleton">
    <div class="header-skeleton">
      <div class="avatar-skeleton shimmer"></div>
      <div class="info-skeleton">
        <div class="name-skeleton shimmer"></div>
        <div class="meta-skeleton shimmer"></div>
      </div>
    </div>
    <div class="body-skeleton">
      <div class="title-skeleton shimmer"></div>
      <div class="line-skeleton shimmer"></div>
      <div class="line-skeleton shimmer" style="width: 80%"></div>
    </div>
    <div class="footer-skeleton">
      <div class="btn-skeleton shimmer"></div>
      <div class="btn-skeleton shimmer"></div>
      <div class="btn-skeleton shimmer"></div>
    </div>
  </div>
</template>

<style scoped>
.card-skeleton {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: clamp(1rem, 4vw, 2rem);
  border: 2px solid var(--border-light);
  margin-bottom: 0;
}

.header-skeleton {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-light);
}

.avatar-skeleton {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  flex-shrink: 0;
}

.info-skeleton {
  flex: 1;
}

.name-skeleton {
  height: 1rem;
  width: 40%;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.meta-skeleton {
  height: 0.75rem;
  width: 60%;
  border-radius: 4px;
}

.body-skeleton {
  margin-bottom: 1.5rem;
}

.title-skeleton {
  height: 1.5rem;
  width: 80%;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.line-skeleton {
  height: 0.875rem;
  width: 100%;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.footer-skeleton {
  display: flex;
  gap: 0.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--border-light);
}

.btn-skeleton {
  height: 2.25rem;
  width: 4rem;
  border-radius: var(--radius-sm);
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

@media (max-width: 768px) {
  .avatar-skeleton { width: 44px; height: 44px; }
  .btn-skeleton { height: 1.75rem; width: 3rem; }
}
</style>
