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
      entry: resolve(__dirname, 'src/lib/index.ts'),
      formats: ['es', 'cjs'],
      name: 'AISDKReactModelPicker',
      fileName: (format) => {
        const extension = format === 'es' ? 'js' : 'cjs'
        return `index.${extension}`
      },
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-hook-form',
        '@ai-sdk/openai',
        '@ai-sdk/anthropic',
        '@ai-sdk/google',
        '@ai-sdk/azure',
        '@ai-sdk/mistral',
        '@ai-sdk/cohere',
        '@ai-sdk/amazon-bedrock',
        'ai-sdk-provider-claude-code',
        '@anthropic-ai/claude-code',
        'ai',
      ],
      output: {
        preserveModules: false,
        exports: 'named',
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          'react-hook-form': 'ReactHookForm',
        },
        assetFileNames: (assetInfo) => {
          return assetInfo.name?.endsWith('.css') ? 'styles.css' : 'assets/[name][extname]'
        },
      },
    },
  },
})