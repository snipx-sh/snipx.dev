import { defineStore } from "pinia"
import { ref, computed } from "vue"
import { LEARN, LEVELS } from "../lessons"
import type { Chapter, Lesson, Level } from "../types"

const STORAGE_KEY = "snipx-tutorial"
const PERSIST_DEBOUNCE_MS = 500

interface PersistedState {
  chapterId: string
  lessonId: string
  levelN: number
  completed: string[]
  code: Record<string, string>
}

function loadState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedState
  } catch {
    return null
  }
}

function saveState(s: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    // Swallow persistence errors (e.g. quota exceeded, storage disabled)
  }
}

export const useTutorialStore = defineStore("tutorial", () => {
  const saved = loadState()

  // Coerce persisted navigation state to known-good values
  const resolvedChapter = (saved?.chapterId != null
    ? LEARN.find((c) => c.id === saved.chapterId)
    : undefined) ?? LEARN[0]

  const resolvedLesson = (saved?.lessonId != null
    ? resolvedChapter.lessons.find((l) => l.id === saved.lessonId)
    : undefined) ?? resolvedChapter.lessons[0]

  const resolvedLevel = (() => {
    const n = saved?.levelN
    if (typeof n !== "number" || !Number.isInteger(n)) return 1
    if (n < 1) return 1
    if (n > LEVELS.length) return LEVELS.length
    return n
  })()

  // ── Navigation state ────────────────────────────────────────────────────
  const chapterId = ref(resolvedChapter.id)
  const lessonId = ref(resolvedLesson.id)
  const levelN = ref(resolvedLevel)

  // ── Progress ────────────────────────────────────────────────────────────
  const completed = ref<Set<string>>(new Set(saved?.completed ?? []))
  const savedCode = ref<Record<string, string>>(saved?.code ?? {})

  // ── Timer state ─────────────────────────────────────────────────────────
  const timerRunning = ref(false)
  const timeLeft = ref<number | null>(null)
  let timerInterval: ReturnType<typeof setInterval> | null = null

  // ── Editor state ────────────────────────────────────────────────────────
  const code = ref("")
  const showAnswer = ref(false)

  // ── Derived ─────────────────────────────────────────────────────────────
  const chapter = computed<Chapter>(
    () => LEARN.find((c) => c.id === chapterId.value) ?? LEARN[0],
  )

  const lesson = computed<Lesson>(
    () => chapter.value.lessons.find((l) => l.id === lessonId.value) ?? chapter.value.lessons[0],
  )

  const level = computed<Level>(() => LEVELS.find((l) => l.n === levelN.value) ?? LEVELS[0])

  const taskResults = computed(() =>
    lesson.value.tasks.map((t) => ({ ...t, passed: t.check(code.value) })),
  )

  const allTasksPassed = computed(() => taskResults.value.every((t) => t.passed))

  const ghostText = computed<string>(() => {
    const lv = level.value
    if (showAnswer.value) return ""
    if (lv.ghost) return lesson.value.solution
    if (lv.firstLine) {
      const firstLine = lesson.value.solution.split("\n")[0]
      return firstLine
    }
    return ""
  })

  /** Flat list of all lessons across chapters. */
  const allLessons = computed(() => LEARN.flatMap((ch) => ch.lessons.map((l) => ({ ch, l }))))

  const currentIndex = computed(() => allLessons.value.findIndex((x) => x.l.id === lessonId.value))

  const hasPrev = computed(() => currentIndex.value > 0)
  const hasNext = computed(() => currentIndex.value < allLessons.value.length - 1)

  const totalLessons = computed(() => allLessons.value.length)
  const completedCount = computed(() => completed.value.size)

  // ── Actions ─────────────────────────────────────────────────────────────
  function persist() {
    saveState({
      chapterId: chapterId.value,
      lessonId: lessonId.value,
      levelN: levelN.value,
      completed: [...completed.value],
      code: savedCode.value,
    })
  }

  function selectLesson(chId: string, lId: string) {
    // Save current code before switching
    savedCode.value[lessonId.value] = code.value

    chapterId.value = chId
    lessonId.value = lId

    // Restore saved code or use starter from the now-current lesson
    code.value = savedCode.value[lId] ?? lesson.value.starter

    showAnswer.value = false
    stopTimer()
    persist()
  }

  function setLevel(n: number) {
    levelN.value = n
    stopTimer()
    persist()
  }

  let persistTimer: ReturnType<typeof setTimeout> | null = null

  function persistDebounced() {
    if (persistTimer) clearTimeout(persistTimer)
    persistTimer = setTimeout(persist, PERSIST_DEBOUNCE_MS)
  }

  function updateCode(newCode: string) {
    code.value = newCode
    savedCode.value[lessonId.value] = newCode

    if (allTasksPassed.value && !completed.value.has(lessonId.value)) {
      completed.value.add(lessonId.value)
      persist()
    } else {
      persistDebounced()
    }
  }

  function resetLesson() {
    code.value = lesson.value.starter
    savedCode.value[lessonId.value] = lesson.value.starter
    showAnswer.value = false
    stopTimer()
    persist()
  }

  function revealAnswer() {
    showAnswer.value = true
    updateCode(lesson.value.solution)
  }

  function goNext() {
    if (!hasNext.value) return
    const next = allLessons.value[currentIndex.value + 1]
    selectLesson(next.ch.id, next.l.id)
  }

  function goPrev() {
    if (!hasPrev.value) return
    const prev = allLessons.value[currentIndex.value - 1]
    selectLesson(prev.ch.id, prev.l.id)
  }

  function startTimer() {
    if (!level.value.par) return
    stopTimer()
    timeLeft.value = level.value.par
    timerRunning.value = true
    timerInterval = setInterval(() => {
      if (timeLeft.value !== null && timeLeft.value > 0) {
        timeLeft.value--
      } else {
        stopTimer()
      }
    }, 1000)
  }

  function stopTimer() {
    timerRunning.value = false
    timeLeft.value = null
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  // Initialize code for current lesson
  code.value = savedCode.value[lessonId.value] ?? lesson.value.starter

  return {
    chapterId,
    lessonId,
    levelN,
    completed,
    code,
    showAnswer,
    timerRunning,
    timeLeft,
    chapter,
    lesson,
    level,
    taskResults,
    allTasksPassed,
    ghostText,
    hasPrev,
    hasNext,
    totalLessons,
    completedCount,
    selectLesson,
    setLevel,
    updateCode,
    resetLesson,
    revealAnswer,
    goNext,
    goPrev,
    startTimer,
    stopTimer,
  }
})
