import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { callLLM } from './api/_llm.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // .env dosyasındaki (VITE_ öneki OLMAYAN) sunucu-taraflı anahtarları yükle
  const env = loadEnv(mode, process.cwd(), '')
  process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || env.GROQ_API_KEY
  process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY
  process.env.LLM_PROVIDER = process.env.LLM_PROVIDER || env.LLM_PROVIDER

  return {
    plugins: [
      react(),
      {
        // `npm run dev` sırasında /api/parse isteklerini yakalayıp
        // api/parse.js (Vercel) ile AYNI mantıkla (api/_llm.js) cevaplar.
        // Böylece hem localde hem Vercel'de tek bir davranış olur.
        name: 'dev-api-parse-proxy',
        configureServer(server) {
          server.middlewares.use('/api/parse', (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405
              res.end()
              return
            }
            let body = ''
            req.on('data', (chunk) => {
              body += chunk
            })
            req.on('end', async () => {
              res.setHeader('Content-Type', 'application/json')
              try {
                const { text } = JSON.parse(body || '{}')
                if (!text) {
                  res.statusCode = 400
                  res.end(JSON.stringify({ error: 'text is required' }))
                  return
                }
                const result = await callLLM(text)
                res.end(JSON.stringify(result))
              } catch (err) {
                res.statusCode = 500
                res.end(JSON.stringify({ error: err.message }))
              }
            })
          })
        },
      },
    ],
  }
})
