<template>
  <div class="home">
    <div class="hero">
      <h1>WriteSpace</h1>
      <p>A place for writers to share and grow.</p>
      <div class="cta">
        <router-link to="/register" class="btn btn-primary">Get started</router-link>
        <router-link to="/feed" class="btn btn-outline">Explore feed</router-link>
      </div>
    </div>
  </div>
</template>
<style scoped>
.home {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(1rem, 5vw, 2rem);
}
.hero {
  text-align: center;
  max-width: 480px;
  width: 100%;
}
.hero h1 {
  font-size: clamp(1.75rem, 6vw, 2.5rem);
  margin: 0 0 0.5rem;
}
.hero p { color: var(--gray-700); margin: 0 0 1.5rem; font-size: clamp(0.9375rem, 2vw, 1rem); }
.cta { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
.btn {
  padding: 0.75rem clamp(1rem, 4vw, 1.5rem);
  border-radius: var(--radius);
  font-weight: 500;
  display: inline-block;
  font-size: clamp(0.875rem, 2vw, 1rem);
}
.btn-primary { background: var(--primary); color: #fff; border: none; }
.btn-primary:hover { background: var(--primary-dark); text-decoration: none; }
.btn-outline { background: transparent; border: 2px solid var(--gray-300); color: var(--gray-700); }
.btn-outline:hover { border-color: var(--primary); color: var(--primary); text-decoration: none; }
</style>
