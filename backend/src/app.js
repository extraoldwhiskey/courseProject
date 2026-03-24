require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('passport');
const PgSession = require('connect-pg-simple')(session);
const { createClient } = require('pg');

require('./config/passport');

const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventories');
const itemRoutes = require('./routes/items');
const userRoutes = require('./routes/users');
const searchRoutes = require('./routes/search');
const adminRoutes = require('./routes/admin');
const tagRoutes = require('./routes/tags');
const commentRoutes = require('./routes/comments');
const uploadRoutes = require('./routes/upload');
const categoryRoutes = require('./routes/categories');
const salesforceRoutes = require('./routes/salesforce');

const initSocket = require('./socket/index');

const app = express();
const server = http.createServer(app);

initSocket(server);

const pgPool = new (require('pg').Pool)({ connectionString: process.env.DATABASE_URL });

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  store: new PgSession({ pool: pgPool, tableName: 'session' }),
  secret: process.env.SESSION_SECRET || 'inventra-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000, secure: true, sameSite: 'none' },
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/api/auth', authRoutes);
app.use('/api/inventories', inventoryRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/users', userRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/salesforce', salesforceRoutes);

const { getIo } = require('./socket/index');
app.use((req, res, next) => { req.app.set('io', getIo()); next(); });

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Inventra backend running on :${PORT}`));
