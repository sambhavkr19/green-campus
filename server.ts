import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { connectDB } from './src/config/db.js';
import apiRouter from './src/routes/index.js';
import { notFoundHandler, globalErrorHandler } from './src/middleware/errorHandler.js';

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Initialize MongoDB Connection
  await connectDB();

  // Middleware: Enable CORS
  app.use(
    cors({
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body parser middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api', apiRouter);

  // Vite Middleware for Development / Static serving for Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 404 and Global Error Handlers
  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Green CSJMU Server] Server running on port ${PORT}`);
    console.log(`[Green CSJMU Server] Health check available at http://localhost:${PORT}/api/health`);
  });
}

startServer().catch((err) => {
  console.error('[Green CSJMU Server Error] Failed to start server:', err);
});
