<script setup lang="ts">
import { T } from "../theme"
import { useTutorialStore } from "../stores/tutorial"

const store = useTutorialStore()
</script>

<template>
  <div class="result-panel">
    <div class="result-header">
      <span class="result-title">Expected Output</span>
      <span
        v-if="store.allTasksPassed"
        class="result-badge pass"
      >
        ✓ All tasks passed
      </span>
      <span v-else class="result-badge pending">
        {{ store.taskResults.filter(t => t.passed).length }}/{{ store.taskResults.length }} tasks
      </span>
    </div>
    <pre class="result-output"><code>{{ store.lesson.output }}</code></pre>
  </div>
</template>

<style scoped>
.result-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: v-bind("T.bgDark");
}

.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  height: 36px;
  border-bottom: 1px solid v-bind("T.border");
  flex-shrink: 0;
}

.result-title {
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  color: v-bind("T.fgMuted");
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.result-badge {
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  margin-left: auto;
}

.result-badge.pass {
  color: v-bind("T.green");
  background: rgba(158, 206, 106, 0.12);
}

.result-badge.pending {
  color: v-bind("T.yellow");
  background: rgba(224, 175, 104, 0.12);
}

.result-output {
  flex: 1;
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  line-height: 1.6;
  color: v-bind("T.fgDim");
  padding: 12px;
  margin: 0;
  overflow: auto;
  white-space: pre;
}
</style>
