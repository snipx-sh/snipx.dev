/** Shared type definitions for the tutorial playground. */

export interface ContentBlock {
  type: "h2" | "p" | "code" | "tip"
  text: string
  lang?: string
}

export interface Task {
  id: string
  label: string
  /** Regex-based or string-includes check against user code. */
  check: (code: string) => boolean
}

export interface Lesson {
  id: string
  title: string
  section: string
  lang: string
  content: ContentBlock[]
  starter: string
  solution: string
  tasks: Task[]
  output: string
}

export interface Chapter {
  id: string
  title: string
  color: string
  lessons: Lesson[]
}

export interface Level {
  n: number
  label: string
  desc: string
  ghost: boolean
  firstLine?: boolean
  par: number | null
  color: string
}
