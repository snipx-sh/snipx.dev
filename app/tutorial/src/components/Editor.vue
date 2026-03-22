<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from "vue"
import * as monaco from "monaco-editor"
import "monaco-editor/esm/vs/editor/editor.all.js"
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker"
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker"
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker"
import {
  T,
  MONACO_THEME_RULES,
  MONACO_THEME_COLORS,
} from "../theme"
import { useTutorialStore } from "../stores/tutorial"

// Configure Monaco workers
window.MonacoEnvironment = {
  getWorker(_: string, label: string) {
    if (label === "typescript" || label === "javascript") return new tsWorker()
    if (label === "json") return new jsonWorker()
    return new editorWorker()
  },
}

const store = useTutorialStore()
const editorContainer = ref<HTMLElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor | null = null
let ghostDecorations: monaco.editor.IEditorDecorationsCollection | null = null

const LANG_MAP: Record<string, string> = {
  nushell: "shell",
  bash: "shell",
  typescript: "typescript",
  javascript: "javascript",
  rust: "rust",
}

const EXT_MAP: Record<string, string> = {
  typescript: "ts",
  javascript: "js",
}

function fileExt(lang: string): string {
  return EXT_MAP[lang] ?? lang
}

function getMonacoLang(lang: string): string {
  return LANG_MAP[lang] ?? "plaintext"
}

function applyGhostText() {
  if (!editor || !ghostDecorations) return
  const ghost = store.ghostText
  const userCode = store.code

  if (!ghost || !ghost.startsWith(userCode)) {
    ghostDecorations.set([])
    return
  }

  // Compute the part of the solution beyond what the user typed
  const remainder = ghost.slice(userCode.length)
  if (!remainder) {
    ghostDecorations.set([])
    return
  }

  const model = editor.getModel()
  if (!model) return

  const pos = model.getPositionAt(userCode.length)

  ghostDecorations.set([
    {
      range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
      options: {
        after: {
          content: remainder.split("\n")[0],
          inlineClassName: "ghost-text-decoration",
        },
      },
    },
  ])
}

function initEditor() {
  if (!editorContainer.value) return

  // Define Tokyo Night theme
  monaco.editor.defineTheme("tokyo-night", {
    base: "vs-dark",
    inherit: true,
    rules: MONACO_THEME_RULES,
    colors: MONACO_THEME_COLORS,
  })

  editor = monaco.editor.create(editorContainer.value, {
    value: store.code,
    language: getMonacoLang(store.lesson.lang),
    theme: "tokyo-night",
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Cascadia Code', monospace",
    fontLigatures: true,
    lineNumbers: "on",
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    renderLineHighlight: "line",
    padding: { top: 12, bottom: 12 },
    smoothScrolling: true,
    cursorBlinking: "smooth",
    cursorSmoothCaretAnimation: "on",
    automaticLayout: true,
    tabSize: 2,
    wordWrap: "on",
    overviewRulerBorder: false,
    hideCursorInOverviewRuler: true,
    overviewRulerLanes: 0,
    scrollbar: {
      verticalScrollbarSize: 6,
      horizontalScrollbarSize: 6,
    },
  })

  ghostDecorations = editor.createDecorationsCollection([])

  editor.onDidChangeModelContent(() => {
    const value = editor?.getValue() ?? ""
    store.updateCode(value)
  })

  applyGhostText()
}

// Watch for lesson changes — update editor content and language
watch(
  () => store.lessonId,
  async () => {
    if (!editor) return
    await nextTick()
    const model = editor.getModel()
    if (model) {
      monaco.editor.setModelLanguage(model, getMonacoLang(store.lesson.lang))
    }
    // Use pushEditOperations to set value without losing undo stack context
    editor.setValue(store.code)
    applyGhostText()
  },
)

// Watch code changes from external sources (reveal answer, reset)
watch(
  () => store.showAnswer,
  () => {
    if (!editor) return
    if (editor.getValue() !== store.code) {
      editor.setValue(store.code)
    }
    applyGhostText()
  },
)

// Watch ghost text changes
watch(() => store.ghostText, applyGhostText)

// Watch code for ghost text updates
watch(() => store.code, applyGhostText)

onMounted(() => {
  initEditor()
})

onBeforeUnmount(() => {
  editor?.dispose()
})
</script>

<template>
  <div class="editor-wrapper">
    <div class="editor-toolbar">
      <span class="editor-lang" :style="{ color: store.chapter.color }">
        {{ store.lesson.lang }}
      </span>
      <span class="editor-file">{{ store.lesson.id }}.{{ fileExt(store.lesson.lang) }}</span>
      <div class="editor-actions">
        <button class="action-btn" title="Reset" @click="store.resetLesson()">↺ Reset</button>
        <button class="action-btn reveal-btn" title="Show Answer" @click="store.revealAnswer()">
          {{ store.showAnswer ? "✓ Answer" : "👁 Answer" }}
        </button>
      </div>
    </div>
    <div ref="editorContainer" class="editor-container" />
  </div>
</template>

<style scoped>
.editor-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: v-bind("T.bg");
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  height: 36px;
  background: v-bind("T.bgDark");
  border-bottom: 1px solid v-bind("T.border");
  flex-shrink: 0;
}

.editor-lang {
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.editor-file {
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  color: v-bind("T.fgMuted");
}

.editor-actions {
  margin-left: auto;
  display: flex;
  gap: 6px;
}

.action-btn {
  font-family: "Inter", sans-serif;
  font-size: 11px;
  color: v-bind("T.fgDim");
  background: v-bind("T.bgHL");
  border: 1px solid v-bind("T.border");
  padding: 3px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  background: v-bind("T.bgHover");
  color: v-bind("T.fg");
}

.reveal-btn {
  color: v-bind("T.yellow");
}

.editor-container {
  flex: 1;
  min-height: 0;
}
</style>

<style>
/* Global style for ghost text decorations (Monaco injects these outside scoped) */
.ghost-text-decoration {
  color: #565f89 !important;
  font-style: italic;
  opacity: 0.5;
}
</style>
