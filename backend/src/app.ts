import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import path from 'path'
import authRoutes from './routes/auth'
import journalRoutes from './routes/journals'
import userRoutes from './routes/users'

const app = express()

// Configure CORS
app.use(cors({
  origin: 'http://localhost:5174', // Your frontend's actual port
  credentials: false // Set to false since we don't need credentials
}))

// Other middleware
app.use(morgan('dev'))
app.use(express.json())

// Configure helmet but allow images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "http://localhost:5000"]
    }
  }
}))

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (_res, _path) => {
    _res.set('Access-Control-Allow-Origin', 'http://localhost:5173');
    _res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}))


// Routes
app.use('/api/auth', authRoutes)
app.use('/api/journals', journalRoutes)
app.use('/api/users', userRoutes)

// Error handling
app.use((_err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(_err.stack)
  res.status(500).json({ error: 'Something broke!' })
})

export default app
