require('dotenv').config({ path: '.env' })
const postgres = require('pg')

let credentials = ({
  user: process.env.DATABASE_USERNAME,
  host: process.env.DATABASE_HOST,
  password: process.env.DATABASE_PASSWORD,
  port: 5432,
})

let pool = new postgres.Pool(credentials)


pool.query(`SELECT FROM pg_database WHERE datname = '${process.env.DATABASE_NAME}'`)
  .then(async (dbQuery) => {
    if (dbQuery.rows.length === 0) {
      await pool.query(`CREATE DATABASE ${process.env.DATABASE_NAME}`)
        .then(async () => {
          await pool.end()
          pool = new postgres.Pool({
            user: process.env.DATABASE_USERNAME,
            host: process.env.DATABASE_HOST,
            password: process.env.DATABASE_PASSWORD,
            database: process.env.DATABASE_NAME,
            port: 5432
          })
          await pool.query(
            `
            CREATE TABLE IF NOT EXISTS user_tbl (
              user_id serial PRIMARY KEY,
              username VARCHAR (50) UNIQUE NOT NULL,
              password VARCHAR (255) NOT NULL,
              email VARCHAR (255) UNIQUE NOT NULL,
              created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS user_role_type_tbl (
              role_id serial PRIMARY KEY,
              name VARCHAR(100) NOT NULL,
              code VARCHAR(10) NOT NULL,
              created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS user_role_tbl (
              user_id int NOT NULL,
              role_id int NOT NULL,
              PRIMARY KEY (user_id, role_id),
              FOREIGN KEY (user_id) REFERENCES user_tbl(user_id),
              FOREIGN KEY (role_id) REFERENCES user_role_type_tbl(role_id)
            );

            INSERT INTO user_role_type_tbl(name, code)
            VALUES 
                ('admin', 'ad001'), 
                ('user', 'us001');
          `
          )
        })
    }
  }).then(async () => { await pool.end() }).catch(err => { throw err })



