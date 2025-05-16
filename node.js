const sql = require("mssql");

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

sql.connect(config)
  .then(() => {
    console.log("✅ DB Connected");
    return sql.query("SELECT * FROM Students");
  })
  .then(result => {
    console.log(result.recordset);
  })
  .catch(err => {
    console.error("❌ DB Connection Failed:", err);
  });
