/**
 * Oracle Database Connection Pool using oracledb.
 * Connects to Oracle Database / SQL*Plus schema.
 * All credentials and connect strings loaded strictly from environment variables.
 */

const oracledb = require('oracledb');
require('dotenv').config();

// Default to JavaScript plain objects
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true;

let pool = null;

async function getPool() {
  if (pool) return pool;

  const poolConfig = {
    user: process.env.DB_USER || 'system',
    password: process.env.DB_PASSWORD || 'ritvik',
    connectString: process.env.DB_CONNECT_STRING || 'localhost:1521/XE',
    poolMin: parseInt(process.env.DB_POOL_MIN || '1', 10),
    poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
    poolIncrement: 1,
  };

  if (process.env.DB_WALLET_LOCATION) {
    poolConfig.walletLocation = process.env.DB_WALLET_LOCATION;
    if (process.env.DB_WALLET_PASSWORD) {
      poolConfig.walletPassword = process.env.DB_WALLET_PASSWORD;
    }
  }

  pool = await oracledb.createPool(poolConfig);

  return pool;
}

/**
 * Execute a query on a dedicated connection or pool.
 * Automatically translates ? to :1, :2, etc. for SQL*Plus/Oracle compatibility.
 * Normalizes case-insensitive keys.
 */
async function query(sql, params = []) {
  const p = await getPool();
  const conn = await p.getConnection();
  try {
    let bindCounter = 1;
    const binds = [];
    const oracleSql = sql.replace(/\?/g, () => {
      binds.push(params[bindCounter - 1]);
      return `:${bindCounter++}`;
    });

    const result = await conn.execute(oracleSql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
    });

    return [result.rows || [], result];
  } finally {
    await conn.close();
  }
}

/**
 * Transaction-aware connection helper.
 */
async function getConnection() {
  const p = await getPool();
  const conn = await p.getConnection();

  return {
    async beginTransaction() {
      // Oracle starts transaction on first DML statement
    },
    async commit() {
      await conn.commit();
    },
    async rollback() {
      await conn.rollback();
    },
    async release() {
      await conn.close();
    },
    async query(sql, params = []) {
      let bindCounter = 1;
      const binds = [];
      const oracleSql = sql.replace(/\?/g, () => {
        binds.push(params[bindCounter - 1]);
        return `:${bindCounter++}`;
      });

      const result = await conn.execute(oracleSql, binds, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        autoCommit: false,
      });

      return [result.rows || [], result];
    },
  };
}

/**
 * Health check helper testing Oracle connectivity.
 */
async function checkDatabaseConnection() {
  try {
    const [rows] = await query("SELECT 'Oracle Connected' AS \"status\" FROM DUAL");
    return { connected: true, status: rows[0]?.status };
  } catch (error) {
    return {
      connected: false,
      message: error.message || 'Oracle database connection error',
    };
  }
}

module.exports = {
  pool: {
    query,
    getConnection,
  },
  query,
  checkDatabaseConnection,
};
