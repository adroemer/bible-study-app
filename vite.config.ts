import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.AZURE_OPENAI_API_KEY': JSON.stringify(env.AZURE_OPENAI_API_KEY || env.VITE_AZURE_OPENAI_API_KEY),
        'process.env.AZURE_OPENAI_ENDPOINT': JSON.stringify(env.AZURE_OPENAI_ENDPOINT || env.VITE_AZURE_OPENAI_ENDPOINT),
        'process.env.DEPLOYMENT_NAME': JSON.stringify(env.DEPLOYMENT_NAME || env.VITE_DEPLOYMENT_NAME),
        'process.env.VITE_AZURE_OPENAI_API_KEY': JSON.stringify(env.VITE_AZURE_OPENAI_API_KEY || env.AZURE_OPENAI_API_KEY),
        'process.env.VITE_AZURE_OPENAI_ENDPOINT': JSON.stringify(env.VITE_AZURE_OPENAI_ENDPOINT || env.AZURE_OPENAI_ENDPOINT),
        'process.env.VITE_DEPLOYMENT_NAME': JSON.stringify(env.VITE_DEPLOYMENT_NAME || env.DEPLOYMENT_NAME)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
