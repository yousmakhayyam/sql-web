const express = require('express');
const path = require('path');
const sql = require('mssql');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 3000;

// Debug: Log environment variables
console.log('Environment Variables:');
console.log('DB_SERVER:', process.env.DB_SERVER);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_DATABASE:', process.env.DB_DATABASE);
console.log('PORT:', process.env.PORT);

// ✅ Updated database configuration with connection string support
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  connectionString: process.env.SQL_CONNECTION_STRING,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

let pool;

// ✅ Updated initializeDatabase function
async function initializeDatabase() {
  try {
    console.log('Attempting to connect with config:', {
      server: dbConfig.server,
      user: dbConfig.user,
      database: dbConfig.database,
      usingConnectionString: !!dbConfig.connectionString
    });

    // Use connection string if provided
    if (dbConfig.connectionString) {
      pool = await sql.connect(dbConfig.connectionString);
    } else {
      pool = await sql.connect(dbConfig);
    }

    console.log("✅ Database connected successfully!");

    // Create table if not exists
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Messages' AND xtype='U')
      CREATE TABLE Messages (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(50) NOT NULL,
        message NVARCHAR(300) NOT NULL,
        created_at DATETIME DEFAULT GETDATE()
      )
    `);

    pool.on('error', err => {
      console.error('❌ Database connection error:', err);
    });

  } catch (err) {
    console.error("❌ Failed to connect to database:", err);
    throw err;
  }
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/messages', async (req, res) => {
  try {
    const result = await pool.request()
      .query('SELECT name, message, created_at FROM Messages ORDER BY created_at DESC');
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Failed to load messages" });
  }
});

app.post('/submit', async (req, res) => {
  const { name, message } = req.body;
  if (!name || !message) {
    return res.status(400).json({ error: "Name and message are required" });
  }

  try {
    await pool.request()
      .input('name', sql.NVarChar, name)
      .input('message', sql.NVarChar, message)
      .query('INSERT INTO Messages (name, message) VALUES (@name, @message)');
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Submit Error:", err);
    res.status(500).json({ error: "Failed to save message" });
  }
});

// Start the server
initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
