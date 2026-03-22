<script setup lang="ts">
import { T } from "../theme"
import { useTutorialStore } from "../stores/tutorial"

const store = useTutorialStore()
</script>

<template>
  <div class="task-panel">
    <!-- Lesson content -->
    <div class="lesson-content">
      <div class="lesson-header">
        <span class="section-label">{{ store.lesson.section }}</span>
        <h2 class="lesson-title">{{ store.lesson.title }}</h2>
      </div>

      <div v-for="(block, i) in store.lesson.content" :key="i" class="content-block">
        <h3 v-if="block.type === 'h2'" class="content-heading">{{ block.text }}</h3>
        <p v-else-if="block.type === 'p'" class="content-text">{{ block.text }}</p>
        <pre v-else-if="block.type === 'code'" class="content-code"><code>{{ block.text }}</code></pre>
        <div v-else-if="block.type === 'tip'" class="content-tip">
          <span class="tip-icon">💡</span>
          <span>{{ block.text }}</span>
        </div>
      </div>
    </div>

    <!-- Task checklist -->
    <div class="task-section">
      <h3 class="task-heading">Tasks</h3>
      <div v-for="task in store.taskResults" :key="task.id" class="task-item">
        <span
          class="task-check"
          :style="{ color: task.passed ? T.green : T.fgMuted }"
        >
          {{ task.passed ? "✓" : "○" }}
        </span>
        <span
          class="task-label"
          :style="{ color: task.passed ? T.fg : T.fgDim }"
        >
          {{ task.label }}
        </span>
      </div>
    </div>

    <!-- Navigation -->
    <div class="nav-row">
      <button
        class="nav-btn"
        :disabled="!store.hasPrev"
        @click="store.goPrev()"
      >
        ← Previous
      </button>
      <button
        class="nav-btn"
        :disabled="!store.hasNext"
        @click="store.goNext()"
      >
        Next →
      </button>
    </div>
  </div>
</template>

<style scoped>
.task-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  background: v-bind("T.bgPanel");
}

.lesson-content {
  padding: 20px;
  flex: 1;
}

.lesson-header {
  margin-bottom: 16px;
}

.section-label {
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: v-bind("T.fgMuted");
}

.lesson-title {
  font-family: "Inter", sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: v-bind("T.fg");
  margin: 4px 0 0;
}

.content-block {
  margin-bottom: 12px;
}

.content-heading {
  font-family: "Inter", sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: v-bind("T.fg");
  margin: 0;
}

.content-text {
  font-family: "Inter", sans-serif;
  font-size: 13px;
  line-height: 1.6;
  color: v-bind("T.fgDim");
  margin: 0;
}

.content-code {
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  line-height: 1.5;
  background: v-bind("T.bgDark");
  color: v-bind("T.fg");
  padding: 12px;
  border-radius: 6px;
  border: 1px solid v-bind("T.border");
  overflow-x: auto;
  margin: 0;
}

.content-tip {
  display: flex;
  gap: 8px;
  font-family: "Inter", sans-serif;
  font-size: 12px;
  line-height: 1.5;
  color: v-bind("T.yellow");
  background: rgba(224, 175, 104, 0.08);
  border: 1px solid rgba(224, 175, 104, 0.2);
  border-radius: 6px;
  padding: 10px 12px;
}

.tip-icon {
  flex-shrink: 0;
}

.task-section {
  padding: 0 20px 12px;
  border-top: 1px solid v-bind("T.border");
  padding-top: 16px;
}

.task-heading {
  font-family: "Inter", sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: v-bind("T.fgMuted");
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0 0 10px;
}

.task-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 4px 0;
}

.task-check {
  font-size: 13px;
  flex-shrink: 0;
  width: 16px;
  text-align: center;
  transition: color 0.2s;
}

.task-label {
  font-family: "Inter", sans-serif;
  font-size: 12px;
  line-height: 1.4;
  transition: color 0.2s;
}

.nav-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 20px;
  border-top: 1px solid v-bind("T.border");
}

.nav-btn {
  font-family: "Inter", sans-serif;
  font-size: 12px;
  color: v-bind("T.fgDim");
  background: v-bind("T.bgHL");
  border: 1px solid v-bind("T.border");
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.nav-btn:hover:not(:disabled) {
  background: v-bind("T.bgHover");
  color: v-bind("T.fg");
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: default;
}
</style>
