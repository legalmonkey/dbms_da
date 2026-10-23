/**
 * Neo4j Graph Database Driver and Connection Manager
 * Meridian Diagnostics LIS/LIMS
 * Supports local bolt:// connections and cloud-hosted neo4j+s:// AuraDB endpoints.
 */

const neo4j = require('neo4j-driver');
require('dotenv').config();

let driver = null;

function getDriver() {
  if (driver) return driver;

  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const user = process.env.NEO4J_USER || 'neo4j';
  const password = process.env.NEO4J_PASSWORD || 'meridian123';

  driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
    maxConnectionPoolSize: 50,
    connectionTimeout: 10000,
    disableLosslessIntegers: true, // Auto-converts Neo4j integers to native JavaScript numbers
  });

  return driver;
}

function prepareParams(params = {}) {
  const prepared = {};
  for (const [key, val] of Object.entries(params)) {
    if (typeof val === 'number' && Number.isInteger(val)) {
      prepared[key] = neo4j.int(val);
    } else {
      prepared[key] = val;
    }
  }
  return prepared;
}

/**
 * Execute a Cypher query with automatic session lifecycle management.
 * @param {string} cypher - The Cypher query string
 * @param {object} params - Query parameters
 * @returns {Promise<Array<object>>} - Array of formatted record objects
 */
async function runCypher(cypher, params = {}) {
  const d = getDriver();
  const session = d.session();
  try {
    const prepared = prepareParams(params);
    const result = await session.run(cypher, prepared);
    return result.records.map((record) => {
      const obj = {};
      record.keys.forEach((key) => {
        const val = record.get(key);
        obj[key] = normalizeValue(val);
      });
      return obj;
    });
  } finally {
    await session.close();
  }
}

/**
 * Normalizes Neo4j Node, Relationship, and Path objects into clean JSON-serializable primitives.
 */
function normalizeValue(val) {
  if (val === null || val === undefined) return val;
  if (typeof val === 'object' && val.identity && val.properties) {
    // Node or Relationship
    return {
      _id: val.identity.toString(),
      _labels: val.labels || [val.type],
      ...val.properties,
    };
  }
  if (Array.isArray(val)) {
    return val.map(normalizeValue);
  }
  return val;
}

/**
 * Test connectivity to Neo4j.
 */
async function checkNeo4jConnection() {
  try {
    const d = getDriver();
    const serverInfo = await d.getServerInfo();
    return {
      connected: true,
      address: serverInfo.address,
      version: serverInfo.agent || 'Neo4j 5.x',
    };
  } catch (error) {
    return {
      connected: false,
      message: error.message || 'Neo4j connection error',
    };
  }
}

/**
 * Close driver pool on process termination.
 */
async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

module.exports = {
  getDriver,
  runCypher,
  checkNeo4jConnection,
  closeDriver,
};
