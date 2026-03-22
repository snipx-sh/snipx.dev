/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue"
  const component: DefineComponent<object, object, unknown>
  export default component
}

interface Window {
  MonacoEnvironment?: {
    getWorker(workerId: string, label: string): Worker
  }
}
