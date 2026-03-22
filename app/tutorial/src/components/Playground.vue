<script setup lang="ts">
import { T } from "../theme"
import Sidebar from "./Sidebar.vue"
import TaskPanel from "./TaskPanel.vue"
import Editor from "./Editor.vue"
import ResultPanel from "./ResultPanel.vue"
import LevelBar from "./LevelBar.vue"
</script>

<template>
  <div class="playground">
    <Sidebar />
    <div class="main-area">
      <div class="top-row">
        <div class="task-pane">
          <TaskPanel />
        </div>
        <div class="editor-pane">
          <Editor />
        </div>
      </div>
      <div class="bottom-row">
        <LevelBar />
        <ResultPanel />
      </div>
    </div>
  </div>
</template>

<style scoped>
.playground {
  display: flex;
  height: 100vh;
  width: 100vw;
  background: v-bind("T.bg");
  color: v-bind("T.fg");
  overflow: hidden;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.top-row {
  flex: 1;
  display: flex;
  min-height: 0;
}

.task-pane {
  width: 340px;
  min-width: 280px;
  border-right: 1px solid v-bind("T.border");
  overflow: hidden;
}

.editor-pane {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.bottom-row {
  height: 220px;
  min-height: 160px;
  border-top: 1px solid v-bind("T.border");
  display: flex;
  flex-direction: column;
}
</style>
