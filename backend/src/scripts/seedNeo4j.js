/**
 * Standalone CLI Seed Script for Neo4j Database
 * Usage: node src/scripts/seedNeo4j.js
 */

require('dotenv').config();
const graphService = require('../services/graphService');
const { closeDriver } = require('../config/neo4j');

async function main() {
  console.log('====================================================');
  console.log(' MERIDIAN DIAGNOSTICS - NEO4J KNOWLEDGE GRAPH SEEDER');
  console.log('====================================================');
  console.log('Connecting to Neo4j...');

  try {
    const result = await graphService.seedGraphData();
    console.log('\n[SUCCESS]', result.message);
    if (result.nodeCount !== undefined) {
      console.log(`Nodes: ${result.nodeCount}, Relationships: ${result.relationshipCount}`);
    }

    const overview = await graphService.getOverview();
    console.log('\n--- Graph Metrics ---');
    console.log('Total Nodes:', overview.summary.totalNodes);
    console.log('Total Relationships:', overview.summary.totalRelationships);
    console.log('Node Breakdown:', JSON.stringify(overview.summary.nodeLabels, null, 2));
    console.log('Relationship Breakdown:', JSON.stringify(overview.summary.relationshipTypes, null, 2));
  } catch (err) {
    console.error('\n[ERROR] Seeding failed:', err.message);
  } finally {
    await closeDriver();
    console.log('\nNeo4j driver connection closed.');
    process.exit(0);
  }
}

main();
