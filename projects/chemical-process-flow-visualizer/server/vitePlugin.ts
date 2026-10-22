import type { Plugin } from 'vite';
import { handleGenerateHttp, handleModelsHttp } from './http';

export function processFlowApiPlugin(environment: NodeJS.ProcessEnv): Plugin {
  return {
    name: 'process-flow-api',
    configureServer(server) {
      server.middlewares.use('/api/generate', (request, response) => {
        void handleGenerateHttp(request, response, true, environment);
      });
      server.middlewares.use('/api/models', (request, response) => {
        void handleModelsHttp(request, response);
      });
    },
  };
}
