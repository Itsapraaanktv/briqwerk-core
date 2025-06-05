/// <reference types="vite/client" />
/// <reference types="node" />

declare module 'vite' {
  export { defineConfig } from 'vite'
}

declare module '@vitejs/plugin-react' {
  const plugin: () => any
  export default plugin
}

declare module 'vite-plugin-pwa' {
  export const VitePWA: any
}

declare module 'path' {
  export function resolve(...paths: string[]): string
  export function dirname(path: string): string
}

declare module 'url' {
  export function fileURLToPath(url: string | URL): string
}

interface ImportMeta {
  url: string
} 