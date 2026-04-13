import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authRoutes } from './routes/auth'
import { propertiesRoutes } from './routes/properties'
import { fixturesRoutes } from './routes/fixtures'
import { profilesRoutes } from './routes/profiles'
import { airroiRoutes } from './routes/airroi'

const app = new Hono().basePath('/api')

app.use(
  '*',
  cors({
    origin: (origin) => origin, // allow same-origin + Capacitor
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  }),
)

app.route('/auth', authRoutes)
app.route('/properties', propertiesRoutes)
app.route('/fixtures', fixturesRoutes)
app.route('/profiles', profilesRoutes)
app.route('/airroi', airroiRoutes)

export default app
