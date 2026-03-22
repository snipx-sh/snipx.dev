<script setup lang="ts">
import { T, LANG_COLOR } from "../theme"
import { LEARN } from "../lessons"
import { useTutorialStore } from "../stores/tutorial"

const store = useTutorialStore()
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <span class="logo">▸ snipx</span>
      <span class="badge">tutorial</span>
    </div>

    <div class="progress-bar">
      <div
        class="progress-fill"
        :style="{ '--progress': `${(store.completedCount / store.totalLessons) * 100}%` }"
      />
    </div>
    <div class="progress-label">{{ store.completedCount }}/{{ store.totalLessons }} complete</div>

    <nav class="chapter-list">
      <div
        v-for="ch in LEARN"
        :key="ch.id"
        class="chapter"
        :style="{ '--chapter-color': ch.color }"
      >
        <div class="chapter-title">
          {{ ch.title }}
        </div>
        <button
          v-for="lesson in ch.lessons"
          :key="lesson.id"
          class="lesson-btn"
          :class="{
            active: store.lessonId === lesson.id,
            completed: store.completed.has(lesson.id),
          }"
          :style="{ '--lang-color': LANG_COLOR[lesson.lang] || T.fgDim }"
          @click="store.selectLesson(ch.id, lesson.id)"
        >
          <span class="lesson-check">
            {{ store.completed.has(lesson.id) ? "✓" : "○" }}
          </span>
          <span class="lesson-title">{{ lesson.title }}</span>
          <span class="lesson-lang">
            {{ lesson.lang }}
          </span>
        </button>
      </div>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  width: 240px;
  min-width: 240px;
  background: v-bind("T.bgDark");
  border-right: 1px solid v-bind("T.border");
  overflow-y: auto;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 16px 8px;
}

.logo {
  font-family: "JetBrains Mono", monospace;
  font-weight: 700;
  font-size: 15px;
  color: v-bind("T.fg");
  letter-spacing: 0.06em;
}

.badge {
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  color: v-bind("T.fgMuted");
  background: v-bind("T.bgHL");
  padding: 2px 6px;
  border-radius: 4px;
}

.progress-bar {
  height: 3px;
  background: v-bind("T.bgHL");
  margin: 8px 16px;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
  width: var(--progress);
  background: v-bind("T.green");
}

.progress-label {
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  color: v-bind("T.fgMuted");
  padding: 0 16px 12px;
}

.chapter-list {
  flex: 1;
  padding: 0 8px 16px;
}

.chapter {
  margin-bottom: 8px;
}

.chapter-title {
  font-family: "Inter", sans-serif;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 8px 8px 4px;
  color: var(--chapter-color);
}

.lesson-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  border: none;
  border-left: 2px solid transparent;
  background: none;
  cursor: pointer;
  border-radius: 0 4px 4px 0;
  transition: background 0.15s;
  font-family: "Inter", sans-serif;
  font-size: 12px;
}

.lesson-btn:hover {
  background: v-bind("T.bgHover");
}

.lesson-btn.active {
  background: v-bind("T.bgHL");
  border-left-color: var(--chapter-color);
}

.lesson-check {
  font-size: 12px;
  flex-shrink: 0;
  width: 16px;
  text-align: center;
  color: v-bind("T.fgMuted");
}

.lesson-btn.completed .lesson-check {
  color: v-bind("T.green");
}

.lesson-title {
  color: v-bind("T.fg");
  flex: 1;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lesson-lang {
  font-family: "JetBrains Mono", monospace;
  font-size: 9px;
  flex-shrink: 0;
  color: var(--lang-color);
}
</style>
