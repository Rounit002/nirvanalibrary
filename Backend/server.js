// server.js
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');
const pgSession = require('connect-pg-simple')(session);
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const winston = require('winston');
require('dotenv').config();

const { setupCronJobs } = require('./utils/cronJobs');
const { sendExpirationReminder } = require('./utils/email');

const app = express();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({ format: winston.format.simple() }));
}

app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:8080',
      'https://citylibrary.onrender.com',
      'file://'
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

pool.connect((err, client, release) => {
  if (err) {
    logger.error('Database connection error:', err.stack);
  } else {
    logger.info('Database connected successfully');
  }
  if (client) release();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('trust proxy', 1);

const staticOptions = {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
    else if (filePath.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
  }
};
app.use(express.static(path.join(__dirname, 'dist'), staticOptions));
app.use('/assets', express.static(path.join(__dirname, 'dist/assets'), staticOptions));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  store: new pgSession({ pool: pool, ttl: 24 * 60 * 60 }),
  secret: process.env.SESSION_SECRET || 'your-very-secure-secret-key-please-change',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000, httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' },
}));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 200 * 1024 },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only images (jpeg, jpg, png, gif) are allowed'));
    }
  },
});

const authExports = require('./routes/auth');
const authRouterFactory = authExports.authRouter;
const authenticateUser = authExports.authenticateUser;
const checkAdmin = authExports.checkAdmin;
const { checkPermission } = authExports;

if (typeof authenticateUser !== 'function') {
  logger.error('FATAL: authenticateUser middleware is not a function. Check export in ./routes/auth.js');
  process.exit(1);
}
if (typeof authRouterFactory !== 'function') {
  logger.error('FATAL: authRouter factory is not a function. Check export in ./routes/auth.js');
  process.exit(1);
}
if (typeof checkAdmin !== 'function') {
  logger.error('FATAL: checkAdmin middleware is not a function. Check export in ./routes/auth.js');
  process.exit(1);
}
if (typeof checkPermission !== 'function') {
  logger.error('FATAL: checkPermission middleware is not a function. Check export in ./routes/auth.js');
  process.exit(1);
}

const authRoutes = authRouterFactory(pool);

app.post('/api/upload-image', authenticateUser, checkPermission('manage_library_students'), upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'image', folder: 'student_profiles' },
        (error, uploadResult) => {
          if (error) return reject(error);
          resolve(uploadResult);
        }
      );
      stream.end(file.buffer);
    });

    if (!result || !result.secure_url) {
      logger.error('Cloudinary upload failed, no secure_url returned:', result);
      return res.status(500).json({ message: 'Image upload failed with Cloudinary' });
    }

    logger.info('Image uploaded successfully to Cloudinary', { imageUrl: result.secure_url });
    res.json({ imageUrl: result.secure_url });
  } catch (error) {
    logger.error('Error uploading image to Cloudinary:', {
      message: error.message,
      stack: error.stack,
      cloudinaryConfig: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY ? '****' : undefined,
        api_secret: process.env.CLOUDINARY_API_SECRET ? '****' : undefined,
      },
    });
    res.status(500).json({ message: 'Server error during image upload', error: error.message });
  }
});

const initializeRoute = (filePath, poolInstance) => {
  try {
    const routeFactory = require(filePath);
    if (typeof routeFactory !== 'function') {
      logger.error(`FATAL: Route factory in ${filePath} is not a function. Exiting.`);
      process.exit(1);
    }
    return routeFactory(poolInstance);
  } catch (e) {
    logger.error(`FATAL: Failed to require or initialize route from ${filePath}: ${e.message} ${e.stack}`);
    process.exit(1);
  }
};

const userRoutes = initializeRoute('./routes/users', pool);
const studentRoutes = initializeRoute('./routes/students', pool);
const scheduleRoutes = initializeRoute('./routes/schedules', pool);
const seatsRoutes = initializeRoute('./routes/seats', pool);
const settingsRoutes = initializeRoute('./routes/settings', pool);
const hostelBranchesRoutes = initializeRoute('./routes/hostelBranches', pool);
const hostelStudentsRoutes = initializeRoute('./routes/hostelStudents', pool);
const transactionsRoutes = initializeRoute('./routes/transactions', pool);
const generalCollectionsRoutes = initializeRoute('./routes/collections', pool);
const expensesRoutes = initializeRoute('./routes/expenses', pool);
const reportsRoutes = initializeRoute('./routes/reports', pool);
const hostelCollectionRoutes = initializeRoute('./routes/hostelCollections', pool);
const branchesRoutes = initializeRoute('./routes/branches', pool);
const productsRoutes = initializeRoute('./routes/products', pool);
const lockersRoutes = initializeRoute('./routes/lockers', pool);

app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateUser, userRoutes);

// ✅ FIX: Moved permission checks inside the route files for more granular control
app.use('/api/students', authenticateUser, studentRoutes);
app.use('/api/schedules', authenticateUser, scheduleRoutes);
app.use('/api/seats', authenticateUser, seatsRoutes);
app.use('/api/branches', authenticateUser, branchesRoutes); 
app.use('/api/lockers', authenticateUser, lockersRoutes);

// Other routes that can keep their global permissions
app.use('/api/transactions', authenticateUser, checkPermission('view_transactions'), transactionsRoutes);
app.use('/api/collections', authenticateUser, checkPermission('view_collections'), generalCollectionsRoutes);
app.use('/api/expenses', authenticateUser, checkPermission('manage_expenses'), expensesRoutes);
app.use('/api/reports', authenticateUser, checkPermission('view_reports'), reportsRoutes);
app.use('/api/hostel/branches', authenticateUser, checkPermission('manage_hostel_branches'), hostelBranchesRoutes);
app.use('/api/hostel/students', authenticateUser, checkPermission('manage_hostel_students'), hostelStudentsRoutes);
app.use('/api/hostel/collections', authenticateUser, checkPermission('view_hostel_collections'), hostelCollectionRoutes);
app.use('/api/products', authenticateUser, checkPermission('manage_products'), productsRoutes); 
app.use('/api/settings', authenticateUser, checkAdmin, settingsRoutes);

app.get('/api/test-email', async (req, res) => {
  try {
    const settingsResult = await pool.query("SELECT value FROM settings WHERE key = 'brevo_template_id'");
    if (settingsResult.rows.length === 0 || !settingsResult.rows[0].value) {
      return res.status(400).json({ message: 'Brevo template ID not set in settings' });
    }
    const brevoTemplateId = parseInt(settingsResult.rows[0].value);
    if (isNaN(brevoTemplateId)) {
      return res.status(400).json({ message: 'Brevo template ID is not a valid number in settings' });
    }
    const testStudent = { email: 'test@example.com', name: 'Test Student', membership_end: '2025-12-31' };
    await sendExpirationReminder(testStudent, brevoTemplateId);
    res.json({ message: 'Test email initiated (check Brevo logs/test email inbox)' });
  } catch (err) {
    logger.error('Error in test-email endpoint:', err);
    res.status(500).json({ message: 'Failed to send test email', error: err.message });
  }
});

app.get('/api', (req, res) => {
  res.json({ message: 'Student Management API' });
});

app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    logger.error('Index.html not found in dist folder. Path searched:', indexPath);
    res.status(404).send('Application resource not found. Please ensure the frontend is built and `dist/index.html` exists.');
  }
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', { message: err.message, stack: err.stack, path: req.path, method: req.method });
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

const PORT_NUM = process.env.PORT || 3000;

(async () => {
  try {
    await initializeSessionTable();
    await createDefaultAdmin();
    if (typeof setupCronJobs === 'function') {
        setupCronJobs(pool);
    } else {
        logger.warn('setupCronJobs is not a function, cron jobs not started.');
    }
    const server = app.listen(PORT_NUM, '0.0.0.0', () => { 
      logger.info(`Server running on port ${PORT_NUM}`);
    });

    server.keepAliveTimeout = 65000;
    server.headersTimeout = 70000;

  } catch (err) {
    logger.error('Failed to start server:', err.stack);
    process.exit(1);
  }
})();

async function initializeSessionTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      ) WITH (OIDS=FALSE);`);
    const pkeyCheck = await pool.query(`
      SELECT conname FROM pg_constraint
      WHERE conrelid = 'session'::regclass AND conrelid::oid IN (
        SELECT oid FROM pg_class WHERE relname = 'session' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      ) AND contype = 'p';
    `);
    if (pkeyCheck.rows.length === 0) {
      await pool.query(`ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;`);
    }
    await pool.query(`CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");`);
    logger.info('Session table checked/initialized successfully');
  } catch (err) {
    logger.error('Error initializing session table:', err.stack);
    if (err.code !== '42P07' && err.code !== '42710') {
    } else {
      logger.warn(`Session table or its constraints/indexes might already exist: ${err.message}`);
    }
  }
}

async function createDefaultAdmin() {
  try {
    const usersTableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE   table_schema = 'public'
        AND     table_name   = 'users'
      );
    `);
    if (!usersTableExists.rows[0].exists) {
        logger.warn('Users table does not exist yet. Default admin cannot be created. Please run migrations/schema setup.');
        return;
    }

    const userCountResult = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
    if (parseInt(userCountResult.rows[0].count) === 0) {
      const plainPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin';
      await pool.query(
        'INSERT INTO users (username, password, role, full_name, email) VALUES ($1, $2, $3, $4, $5)',
        [process.env.DEFAULT_ADMIN_USERNAME || 'admin', plainPassword, 'admin', 'Default Admin', 'admin@example.com']
      );
      logger.info('Default admin user created.');
    } else {
      logger.info('Admin user(s) already exist, skipping default admin creation.');
    }
  } catch (err) {
    logger.error('Error creating default admin user:', err.stack);
      if (err.code === '42P01') {
        logger.warn('Users table does not exist yet (checked again). Default admin cannot be created.');
    } else if (err.code !== '23505') {
    } else {
        logger.warn(`Admin user might already exist or other unique constraint violation during default admin creation: ${err.message}`);
    }
  }
}