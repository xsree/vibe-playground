import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { processFlowApiPlugin } from './server/vitePlugin';

export default defineConfig(({ mode }) => {
  const environment = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
  return {
    plugins: [react(), processFlowApiPlugin(environment)],
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  };
});
