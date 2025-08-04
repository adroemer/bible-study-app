import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.AZURE_OPENAI_API_KEY': JSON.stringify(env.AZURE_OPENAI_API_KEY),
        'process.env.AZURE_OPENAI_ENDPOINT': JSON.stringify(env.AZURE_OPENAI_ENDPOINT),
        'process.env.DEPLOYMENT_NAME': JSON.stringify(env.DEPLOYMENT_NAME)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
