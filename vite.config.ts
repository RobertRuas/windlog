/**
 * ============================================================================
 * VITE CONFIGURATION
 * ============================================================================
 *
 * O QUE É ESTE ARQUIVO?
 * ---------------------
 * Configuração principal do Vite (ferramenta de build e dev server).
 * Aqui definimos:
 * - Plugins (React, Tailwind CSS)
 * - Proxy para a API (evita problemas de CORS em desenvolvimento)
 * - Alias de paths para imports mais limpos
 *
 * COMO FUNCIONA O PROXY?
 * ----------------------
 * Quando o frontend faz uma chamada para /api/v1/auth/login,
 * o Vite redireciona automaticamente para http://localhost:3000/api/v1/auth/login.
 * Isso faz parecer que a API e o frontend estão no mesmo servidor.
 * ============================================================================
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  // Plugins utilizados no projeto
  plugins: [
    react(),         // Suporte a React com Fast Refresh
    tailwindcss(),   // Tailwind CSS integrado ao Vite
  ],

  // Constantes injetadas em tempo de build
  // __BUILD_TIME__: data/hora em que o build foi gerado (exibida no sidebar)
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },

  // Configuração do servidor de desenvolvimento
  server: {
    host: '0.0.0.0', // Escuta em todas as interfaces de rede (acesso pela LAN)
    port: 5173,

    // Proxy: redireciona chamadas /api para o backend NestJS
    // Exemplo: /api/v1/auth/login -> http://localhost:3000/api/v1/auth/login
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },

  // Alias de paths: permite usar '@/' ao invés de caminhos relativos
  // Exemplo: import Button from '@/components/ui/Button'
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
