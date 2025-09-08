// vite.config.ts
import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src/lib/**/*'],
      rollupTypes: true,
      tsconfigPath: './tsconfig.app.json',
    })
  ],
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/lib/index.ts'),
        providers: resolve(__dirname, 'src/lib/providers/index.ts'),
        storage: resolve(__dirname, 'src/lib/storage/index.ts'),
        context: resolve(__dirname, 'src/lib/context/index.ts'),
      },
      name: 'AISDKReactModelPicker',
      fileName: (format, entryName) => {
        const extension = format === 'es' ? 'js' : 'cjs'
        return `${entryName}.${extension}`
      },
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-hook-form',
        '@heroicons/react',
        '@ai-sdk/openai',
        '@ai-sdk/anthropic',
        '@ai-sdk/google',
        '@ai-sdk/azure',
        '@ai-sdk/mistral',
        '@ai-sdk/cohere',
        'ai',
      ],
      output: {
        preserveModules: false,
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          'react-hook-form': 'ReactHookForm',
        },
      },
    },
  },
})