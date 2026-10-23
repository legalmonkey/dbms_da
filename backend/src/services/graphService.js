/**
 * Graph Service - Pure Neo4j Engine for Meridian Diagnostics LIS/LIMS
 * Powers Specimen Chain of Custody, Contamination Tracing, Familial Risk & Knowledge Graphs.
 * Connects directly to Neo4j Desktop / Server via Bolt protocol.
 */

const { runCypher, checkNeo4jConnection } = require('../config/neo4j');

class GraphService {
  /**
   * Initializes schema constraints and indexes in Neo4j.
   */
  async initSchema() {
    const health = await checkNeo4jConnection();
    if (!health.connected) {
      throw new Error(`Neo4j is not connected: ${health.message}`);
    }

    const constraints = [
      'CREATE CONSTRAINT patient_id_unique IF NOT EXISTS FOR (p:Patient) REQUIRE p.id IS UNIQUE',
      'CREATE CONSTRAINT sample_no_unique IF NOT EXISTS FOR (s:Sample) REQUIRE s.sampleNo IS UNIQUE',
      'CREATE CONSTRAINT test_id_unique IF NOT EXISTS FOR (t:Test) REQUIRE t.id IS UNIQUE',
      'CREATE CONSTRAINT doctor_id_unique IF NOT EXISTS FOR (d:Doctor) REQUIRE d.id IS UNIQUE',
      'CREATE CONSTRAINT staff_id_unique IF NOT EXISTS FOR (st:Staff) REQUIRE st.id IS UNIQUE',
      'CREATE CONSTRAINT equipment_id_unique IF NOT EXISTS FOR (eq:Equipment) REQUIRE eq.id IS UNIQUE',
      'CREATE CONSTRAINT lab_id_unique IF NOT EXISTS FOR (l:Laboratory) REQUIRE l.id IS UNIQUE',
    ];

    for (const c of constraints) {
      await runCypher(c);
    }

    return { status: 'success', message: 'All 7 Neo4j constraints verified and active.' };
  }

  /**
   * Seeds the Neo4j graph with complete clinical specimen, pedigree and equipment nodes.
   */
  async seedGraphData() {
    const health = await checkNeo4jConnection();
    if (!health.connected) {
      throw new Error(`Neo4j is not connected: ${health.message}`);
    }

    await this.initSchema();

    const seedCypher = `
      // 1. Laboratories & Equipment
      MERGE (lab1:Laboratory {id: 'LAB-01'})
        SET lab1.name = 'Meridian Central Pathology Core', lab1.location = 'Building A, Floor 2'
      MERGE (lab2:Laboratory {id: 'LAB-02'})
        SET lab2.name = 'Meridian Molecular & Genetics Wing', lab2.location = 'Building B, Floor 1'

      MERGE (eq1:Equipment {id: 'EQ-COBAS-01'})
        SET eq1.name = 'Roche Cobas c311 Autoanalyzer', eq1.model = 'Cobas-311', eq1.status = 'ALERT_CONTAMINATED', eq1.labId = 'LAB-01'
      MERGE (eq2:Equipment {id: 'EQ-XN550-01'})
        SET eq2.name = 'Sysmex XN-550 Automated Hematology Analyzer', eq2.model = 'XN-550', eq2.status = 'OPERATIONAL', eq2.labId = 'LAB-01'
      MERGE (eq3:Equipment {id: 'EQ-PCR-01'})
        SET eq3.name = 'BioRad CFX96 Deep-Well Real-Time PCR', eq3.model = 'CFX96', eq3.status = 'OPERATIONAL', eq3.labId = 'LAB-02'

      MERGE (eq1)-[:LOCATED_IN]->(lab1)
      MERGE (eq2)-[:LOCATED_IN]->(lab1)
      MERGE (eq3)-[:LOCATED_IN]->(lab2)

      // 2. Staff
      MERGE (st1:Staff {id: 'STF-301'})
        SET st1.name = 'Dr. Alistair Finch', st1.role = 'Chief Pathologist', st1.department = 'Pathology'
      MERGE (st2:Staff {id: 'STF-302'})
        SET st2.name = 'Elena Rostova', st2.role = 'Senior Lab Technician', st2.department = 'Biochemistry'
      MERGE (st3:Staff {id: 'STF-303'})
        SET st3.name = 'David Kim', st3.role = 'Phlebotomist / Tech', st3.department = 'Intake'

      MERGE (st2)-[:OPERATED {shift: 'Morning', certifiedUntil: '2027-12-31'}]->(eq1)
      MERGE (st2)-[:OPERATED {shift: 'Afternoon', certifiedUntil: '2027-12-31'}]->(eq2)

      // 3. Tests
      MERGE (t1:Test {id: 'TST-101'})
        SET t1.name = 'HbA1c Glycated Hemoglobin', t1.code = 'GLYC-01', t1.category = 'Biochemistry'
      MERGE (t2:Test {id: 'TST-102'})
        SET t2.name = 'Complete Blood Count (CBC)', t2.code = 'HEM-CBC', t2.category = 'Hematology'
      MERGE (t3:Test {id: 'TST-103'})
        SET t3.name = 'Comprehensive Lipid Profile', t3.code = 'LIPID-04', t3.category = 'Biochemistry'
      MERGE (t4:Test {id: 'TST-104'})
        SET t4.name = 'Renal Function Panel (KFT)', t4.code = 'REN-02', t4.category = 'Biochemistry'
      MERGE (t5:Test {id: 'TST-105'})
        SET t5.name = 'COVID-19 RT-PCR Qualitative', t5.code = 'MOL-COV', t5.category = 'Molecular'

      // 4. Doctors
      MERGE (d1:Doctor {id: 'DOC-201'})
        SET d1.name = 'Dr. Sophia Reyes', d1.specialization = 'Endocrinology', d1.hospital = 'Metropolitan General'
      MERGE (d2:Doctor {id: 'DOC-202'})
        SET d2.name = 'Dr. James Thorne', d2.specialization = 'Internal Medicine', d2.hospital = 'St. Jude Clinical Hospital'

      // 5. Patients & Familial Pedigree
      MERGE (p1:Patient {id: 'P-1001'})
        SET p1.name = 'Eleanor Vance', p1.gender = 'Female', p1.dob = '1968-04-12', p1.bloodGroup = 'A+', p1.risk = 'High'
      MERGE (p2:Patient {id: 'P-1002'})
        SET p2.name = 'Thomas Vance', p2.gender = 'Male', p2.dob = '1995-09-22', p2.bloodGroup = 'A+', p2.risk = 'Moderate'
      MERGE (p3:Patient {id: 'P-1003'})
        SET p3.name = 'Clara Vance', p3.gender = 'Female', p3.dob = '1972-11-03', p3.bloodGroup = 'O+', p3.risk = 'High'
      MERGE (p4:Patient {id: 'P-1004'})
        SET p4.name = 'Marcus Brody', p4.gender = 'Male', p4.dob = '1984-06-18', p4.bloodGroup = 'B+', p4.risk = 'Low'
      MERGE (p5:Patient {id: 'P-1005'})
        SET p5.name = 'Sarah Chen', p5.gender = 'Female', p5.dob = '1990-01-30', p5.bloodGroup = 'AB+', p5.risk = 'Low'

      MERGE (p1)-[:FAMILY_MEMBER_OF {relation: 'PARENT'}]->(p2)
      MERGE (p1)-[:FAMILY_MEMBER_OF {relation: 'SIBLING'}]->(p3)

      MERGE (d1)-[:REFERRED]->(p1)
      MERGE (d2)-[:REFERRED]->(p2)
      MERGE (d1)-[:ORDERED]->(t1)
      MERGE (d1)-[:ORDERED]->(t3)

      // 6. Samples & Chain of Custody
      MERGE (s1:Sample {sampleNo: 'SMP-8001'})
        SET s1.type = 'Serum', s1.status = 'Exposed / At Risk', s1.collectedAt = '2026-10-18T08:30:00Z'
      MERGE (s2:Sample {sampleNo: 'SMP-8002'})
        SET s2.type = 'EDTA Whole Blood', s2.status = 'Verified', s2.collectedAt = '2026-10-18T09:15:00Z'
      MERGE (s3:Sample {sampleNo: 'SMP-8003'})
        SET s3.type = 'Serum', s3.status = 'Exposed / At Risk', s3.collectedAt = '2026-10-18T10:00:00Z'
      MERGE (s4:Sample {sampleNo: 'SMP-8004'})
        SET s4.type = 'Nasopharyngeal Swab', s4.status = 'Verified', s4.collectedAt = '2026-10-18T10:45:00Z'

      MERGE (p1)-[:PROVIDED]->(s1)
      MERGE (p4)-[:PROVIDED]->(s2)
      MERGE (p2)-[:PROVIDED]->(s3)
      MERGE (p5)-[:PROVIDED]->(s4)

      MERGE (st3)-[:COLLECTED]->(s1)
      MERGE (st3)-[:COLLECTED]->(s2)
      MERGE (st3)-[:COLLECTED]->(s3)
      MERGE (st3)-[:COLLECTED]->(s4)

      MERGE (s1)-[:PROCESSED_ON {batchId: 'BATCH-20261018-01'}]->(eq1)
      MERGE (s3)-[:PROCESSED_ON {batchId: 'BATCH-20261018-01'}]->(eq1)
      MERGE (s2)-[:PROCESSED_ON {batchId: 'BATCH-20261018-02'}]->(eq2)
      MERGE (s4)-[:PROCESSED_ON {batchId: 'BATCH-20261018-03'}]->(eq3)

      MERGE (s1)-[:ANALYZED_FOR]->(t1)
      MERGE (s1)-[:ANALYZED_FOR]->(t3)
      MERGE (s2)-[:ANALYZED_FOR]->(t2)
      MERGE (s3)-[:ANALYZED_FOR]->(t3)
      MERGE (s4)-[:ANALYZED_FOR]->(t5)

      MERGE (st1)-[:VERIFIED]->(t1)
      MERGE (st1)-[:VERIFIED]->(t2)
    `;

    await runCypher(seedCypher);

    const overview = await this.getOverview();

    return {
      status: 'success',
      message: 'Neo4j clinical knowledge graph seeded with complete clinical entities, relationships and contamination scenario.',
      nodeCount: overview.summary.totalNodes,
      relationshipCount: overview.summary.totalRelationships,
    };
  }

  /**
   * Retrieves high-level graph topology metrics directly from Neo4j.
   */
  async getOverview() {
    const health = await checkNeo4jConnection();
    if (!health.connected) {
      throw new Error(`Neo4j is not connected: ${health.message}`);
    }

    const nodeCountResult = await runCypher(`
      MATCH (n)
      RETURN labels(n)[0] AS label, count(n) AS count
    `);

    const relCountResult = await runCypher(`
      MATCH ()-[r]->()
      RETURN type(r) AS relType, count(r) AS count
    `);

    const nodeLabels = {};
    let totalNodes = 0;
    nodeCountResult.forEach((row) => {
      nodeLabels[row.label || 'Unlabeled'] = row.count;
      totalNodes += row.count;
    });

    const relationshipTypes = {};
    let totalRels = 0;
    relCountResult.forEach((row) => {
      relationshipTypes[row.relType] = row.count;
      totalRels += row.count;
    });

    return {
      connected: true,
      address: health.address,
      version: health.version,
      source: 'live-neo4j',
      summary: {
        totalNodes,
        totalRelationships: totalRels,
        nodeLabels,
        relationshipTypes,
      },
    };
  }

  /**
   * Returns a complete subgraph directly from Neo4j for front-end network graph visualization.
   */
  async getGraphNetwork(limit = 100) {
    const intLimit = parseInt(limit, 10) || 100;
    const cypher = `
      MATCH (n)-[r]->(m)
      RETURN 
        coalesce(n.id, n.sampleNo, elementId(n)) AS sourceId, 
        coalesce(n.name, n.sampleNo, n.id) AS sourceLabel, 
        labels(n)[0] AS sourceType,
        coalesce(m.id, m.sampleNo, elementId(m)) AS targetId, 
        coalesce(m.name, m.sampleNo, m.id) AS targetLabel, 
        labels(m)[0] AS targetType,
        type(r) AS relType,
        properties(r) AS relProps,
        properties(n) AS sourceProps,
        properties(m) AS targetProps
      LIMIT $limit
    `;

    const records = await runCypher(cypher, { limit: intLimit });
    const nodesMap = new Map();
    const links = [];

    records.forEach((row) => {
      const srcId = row.sourceId || row.sourceProps?.id || row.sourceProps?.sampleNo;
      const tgtId = row.targetId || row.targetProps?.id || row.targetProps?.sampleNo;

      if (!nodesMap.has(srcId)) {
        nodesMap.set(srcId, {
          id: srcId,
          label: row.sourceLabel,
          type: row.sourceType,
          group: (row.sourceType || '').toLowerCase(),
          ...row.sourceProps,
        });
      }

      if (!nodesMap.has(tgtId)) {
        nodesMap.set(tgtId, {
          id: tgtId,
          label: row.targetLabel,
          type: row.targetType,
          group: (row.targetType || '').toLowerCase(),
          ...row.targetProps,
        });
      }

      links.push({
        source: srcId,
        target: tgtId,
        label: row.relType,
        type: row.relType,
        ...row.relProps,
      });
    });

    return {
      nodes: Array.from(nodesMap.values()),
      links,
    };
  }

  /**
   * Multi-hop Specimen Contamination & Chain-of-Custody Audit Query directly from Neo4j.
   */
  async traceContamination(equipmentId = 'EQ-COBAS-01') {
    const tStart = Date.now();
    const cypher = `
      MATCH (eq:Equipment {id: $equipmentId})
      OPTIONAL MATCH (s:Sample)-[:PROCESSED_ON]->(eq)
      OPTIONAL MATCH (p:Patient)-[:PROVIDED]->(s)
      OPTIONAL MATCH (s)-[:ANALYZED_FOR]->(t:Test)
      OPTIONAL MATCH (staff:Staff)-[:OPERATED]->(eq)
      RETURN 
        eq.id AS equipmentId,
        eq.name AS equipmentName,
        eq.status AS equipmentStatus,
        eq.labId AS labId,
        collect(DISTINCT {
          sampleNo: s.sampleNo,
          type: s.type,
          status: s.status,
          patientId: p.id,
          patientName: p.name,
          testName: t.name
        }) AS exposedSamples,
        collect(DISTINCT {
          id: staff.id,
          name: staff.name,
          role: staff.role
        }) AS involvedStaff
    `;

    const records = await runCypher(cypher, { equipmentId });
    const elapsed = Date.now() - tStart;

    if (!records.length) {
      return {
        incidentEquipment: { id: equipmentId, name: 'Unknown Equipment', status: 'UNKNOWN' },
        affectedSamplesCount: 0,
        affectedPatientsCount: 0,
        exposedSamples: [],
        involvedStaff: [],
        cypherQuery: cypher.trim(),
        executionTimeMs: elapsed,
        message: `Equipment ${equipmentId} not found in Neo4j graph.`,
      };
    }

    const rec = records[0];
    const exposed = (rec.exposedSamples || []).filter((s) => s.sampleNo);
    const staff = (rec.involvedStaff || []).filter((st) => st.id);

    const uniquePatients = new Set(exposed.map((e) => e.patientId).filter(Boolean));

    return {
      incidentEquipment: {
        id: rec.equipmentId,
        name: rec.equipmentName,
        status: rec.equipmentStatus,
        labId: rec.labId,
      },
      affectedSamplesCount: exposed.length,
      affectedPatientsCount: uniquePatients.size,
      exposedSamples: exposed,
      involvedStaff: staff,
      cypherQuery: cypher.trim(),
      executionTimeMs: elapsed,
      justification: 'Traversed multi-hop chain-of-custody path (Equipment <- Sample <- Patient) using O(1) index-free adjacency pointers in Neo4j.',
    };
  }

  /**
   * Familial Pedigree & Hereditary Risk Analysis directly from Neo4j.
   */
  async getHereditaryRisk(patientId = 'P-1001') {
    const tStart = Date.now();
    const cypher = `
      MATCH (p:Patient {id: $patientId})
      MATCH (p)-[r:FAMILY_MEMBER_OF*1..2]-(rel:Patient)
      WHERE p <> rel
      OPTIONAL MATCH (p)-[:PROVIDED]->(:Sample)-[:ANALYZED_FOR]->(pTest:Test)
      OPTIONAL MATCH (rel)-[:PROVIDED]->(:Sample)-[:ANALYZED_FOR]->(relTest:Test)
      RETURN 
        p.id AS patientId,
        p.name AS patientName,
        p.risk AS riskProfile,
        rel.id AS relId,
        rel.name AS relName,
        rel.bloodGroup AS relBloodGroup,
        rel.risk AS relRisk,
        collect(DISTINCT pTest.name) AS indexPatientTests,
        collect(DISTINCT relTest.name) AS relativeTests
    `;

    const records = await runCypher(cypher, { patientId });
    const elapsed = Date.now() - tStart;

    const relatives = records.map((r) => {
      const uncompleted = (r.indexPatientTests || []).filter(
        (testName) => !r.relativeTests.includes(testName)
      );
      return {
        id: r.relId,
        name: r.relName,
        bloodGroup: r.relBloodGroup,
        inheritedRiskLevel: r.relRisk || 'Moderate',
        recommendedScreenings: uncompleted.length ? uncompleted : ['Preventive Metabolic Screening'],
      };
    });

    return {
      indexPatient: {
        id: records[0]?.patientId || patientId,
        name: records[0]?.patientName || 'Patient',
        riskProfile: records[0]?.riskProfile || 'Standard',
      },
      familyMembersCount: relatives.length,
      relatives,
      cypherQuery: cypher.trim(),
      executionTimeMs: elapsed,
    };
  }

  /**
   * Diagnostic Test Co-Occurrence and Correlation Network directly from Neo4j.
   */
  async getCoOccurrenceNetwork() {
    const cypher = `
      MATCH (t1:Test)<-[:ANALYZED_FOR]-(:Sample)<-[:PROVIDED]-(p:Patient)-[:PROVIDED]->(:Sample)-[:ANALYZED_FOR]->(t2:Test)
      WHERE id(t1) < id(t2)
      RETURN 
        t1.name AS testA, 
        t2.name AS testB, 
        count(DISTINCT p) AS frequency,
        t1.category + ' & ' + t2.category AS category
      ORDER BY frequency DESC
      LIMIT 10
    `;

    return await runCypher(cypher);
  }

  /**
   * Executes a custom Cypher query with performance timing metrics directly on Neo4j.
   */
  async runDemonstrationQuery(cypherQuery, params = {}) {
    const tStart = Date.now();
    try {
      const records = await runCypher(cypherQuery, params);
      const elapsed = Date.now() - tStart;
      return {
        success: true,
        source: 'live-neo4j',
        cypher: cypherQuery,
        executionTimeMs: elapsed,
        recordsCount: records.length,
        records,
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        cypher: cypherQuery,
      };
    }
  }
}

module.exports = new GraphService();
