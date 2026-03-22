<script setup lang="ts">
import { T } from "../theme"
import { LEVELS } from "../lessons"
import { useTutorialStore } from "../stores/tutorial"

const store = useTutorialStore()

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}
</script>

<template>
  <div class="level-bar">
    <div class="level-buttons">
      <button
        v-for="lv in LEVELS"
        :key="lv.n"
        class="level-btn"
        :class="{ active: store.levelN === lv.n }"
        :style="{
          borderColor: store.levelN === lv.n ? lv.color : T.border,
          color: store.levelN === lv.n ? lv.color : T.fgMuted,
          background: store.levelN === lv.n ? `${lv.color}15` : 'transparent',
        }"
        :title="lv.desc"
        @click="store.setLevel(lv.n)"
      >
        {{ lv.label }}
      </button>
    </div>

    <span class="level-desc">{{ store.level.desc }}</span>

    <div v-if="store.level.par" class="timer-section">
      <template v-if="store.timerRunning && store.timeLeft !== null">
        <span
          class="timer"
          :style="{ color: store.timeLeft < 15 ? T.red : store.level.color }"
        >
          {{ formatTime(store.timeLeft) }}
        </span>
        <button class="timer-btn" @click="store.stopTimer()">■</button>
      </template>
      <template v-else>
        <button class="timer-btn start" @click="store.startTimer()">▶ Start</button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.level-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  height: 36px;
  background: v-bind("T.bgDark");
  border-top: 1px solid v-bind("T.border");
  flex-shrink: 0;
}

.level-buttons {
  display: flex;
  gap: 4px;
}

.level-btn {
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border: 1px solid;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s;
}

.level-btn:hover {
  background: v-bind("T.bgHover");
}

.level-desc {
  font-family: "Inter", sans-serif;
  font-size: 11px;
  color: v-bind("T.fgMuted");
}

.timer-section {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.timer {
  font-family: "JetBrains Mono", monospace;
  font-size: 14px;
  font-weight: 600;
}

.timer-btn {
  font-family: "Inter", sans-serif;
  font-size: 11px;
  color: v-bind("T.fgDim");
  background: v-bind("T.bgHL");
  border: 1px solid v-bind("T.border");
  padding: 2px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.timer-btn:hover {
  background: v-bind("T.bgHover");
  color: v-bind("T.fg");
}

.timer-btn.start {
  color: v-bind("T.green");
}
</style>
