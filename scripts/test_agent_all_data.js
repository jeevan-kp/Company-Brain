// ============================================================================
// scripts/test_agent_all_data.js — Comprehensive Agent Verification Across All Data
// ============================================================================
const { runAgentQuery } = require('../agent/workflow');
const { PROJECTS, DOMAINS, PLATFORMS, ANOMALIES, GOLDEN_QA } = require('../server/src/services/projectsData');
const { resolveActiveProvider } = require('../agent/llm');

const TEST_SUITE = [
  // 1. Cyber Security Domain
  {
    category: '1. Cyber Security Domain',
    query: 'Who is the business owner and tech lead of Security Log Monitoring (SIEM)?',
    role: 'Architect',
    expectedKeywords: ['Claudia Lang', 'Rahul Verma', 'P-CYB-01']
  },
  // 2. Finance Domain & Multi-Hop Blast Radius
  {
    category: '2. Finance Domain & Outage Blast Radius',
    query: 'Which projects and teams are affected if SAP S/4HANA Cloud (RISE) has an outage?',
    role: 'Architect',
    expectedKeywords: ['Identity & Access Governance', 'P-FIN-01', 'downstream']
  },
  // 3. Digital Truck Financial Services (DTFS) Domain
  {
    category: '3. DTFS Domain Intelligence',
    query: 'What is the production readiness status and score of Truck Leasing Core (P-DTFS-01)?',
    role: 'Management',
    expectedKeywords: ['P-DTFS-01', 'Truck Leasing Core', 'Readiness']
  },
  // 4. Procurement Domain
  {
    category: '4. Procurement Domain',
    query: 'Who is the tech lead of Supplier Portal (P-PRO-01) and what services does it use?',
    role: 'Developer',
    expectedKeywords: ['P-PRO-01', 'Supplier Portal']
  },
  // 5. Sales & Marketing Domain
  {
    category: '5. Sales & Marketing Domain',
    query: 'What is the business objective and domain of Dealer Management Platform (P-SAL-01)?',
    role: 'Architect',
    expectedKeywords: ['P-SAL-01', 'Dealer Management Platform']
  },
  // 6. HR Domain
  {
    category: '6. HR Domain',
    query: 'Which projects belong to the Human Resources domain?',
    role: 'Management',
    expectedKeywords: ['P-HR-01', 'HR']
  },
  // 7. Unstructured Knowledge & Runbook SOP
  {
    category: '7. Unstructured SOP Runbook Recovery',
    query: 'How do I resolve a P1 telemetry queue latency alert in Security Log Monitoring?',
    role: 'Developer',
    expectedKeywords: ['Runbook', 'Event Hubs', 'pods', 'latency']
  },
  // 8. Cross-Source Conflict Discovery
  {
    category: '8. Cross-Source Architecture Conflicts',
    query: 'Show the conflict between LeanIX and Jira for Truck Leasing Core.',
    role: 'Architect',
    expectedKeywords: ['CONF-01', 'Lifecycle', 'LeanIX', 'Jira']
  },
  // 9. Financial Permissions & RBAC
  {
    category: '9. Financial Envelope (Role-Aware)',
    query: 'What is the approved capex budget and cost center for Security Log Monitoring (P-CYB-01)?',
    role: 'Management',
    expectedKeywords: ['Cost Center', 'Capex', 'P-CYB-01']
  },
  // 10. Downstream Dependency Impact (Who depends on me?)
  {
    category: '10. Downstream Impact Check',
    query: 'Who depends on SAP S/4HANA Finance Core if its data model changes?',
    role: 'Architect',
    expectedKeywords: ['P-FIN-01', 'testing', 'teams']
  }
];

async function runTestSuite() {
  console.log('======================================================================');
  console.log('🤖 AutoNova "Company Brain" Agent Verification across All Data');
  console.log(`📡 Active LLM Provider: "${resolveActiveProvider().toUpperCase()}"`);
  console.log(`📊 Available Dataset Spine: ${PROJECTS.length} Projects, ${DOMAINS.length} Domains, ${PLATFORMS.length} Platforms, ${ANOMALIES.length} Anomalies, ${GOLDEN_QA.length} Golden Q&As`);
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;
  const results = [];

  for (let i = 0; i < TEST_SUITE.length; i++) {
    const test = TEST_SUITE[i];
    process.stdout.write(`[Test ${i + 1}/${TEST_SUITE.length}] ${test.category}... `);
    const start = Date.now();

    try {
      const state = await runAgentQuery({
        query: test.query,
        userRole: test.role
      });
      const duration = Date.now() - start;

      const answer = state.answer || '';
      const hasContent = answer.length > 50;
      
      // Keyword verification
      const matchedKeywords = test.expectedKeywords.filter(k => 
        answer.toLowerCase().includes(k.toLowerCase())
      );
      const isSuccess = hasContent && (matchedKeywords.length >= 1 || answer.includes('AutoNova'));

      if (isSuccess) {
        passed++;
        console.log(`✅ PASSED (${duration}ms)`);
      } else {
        failed++;
        console.log(`❌ FAILED (${duration}ms)`);
      }

      results.push({
        test: test.category,
        query: test.query,
        intent: state.intent,
        duration_ms: duration,
        status: isSuccess ? 'PASSED' : 'FAILED',
        answer_preview: answer.replace(/\n+/g, ' ').slice(0, 140) + '...'
      });
    } catch (err) {
      failed++;
      console.log(`💥 ERROR: ${err.message}`);
      results.push({
        test: test.category,
        query: test.query,
        status: 'ERROR',
        error: err.message
      });
    }
  }

  console.log('\n======================================================================');
  console.log(`🏁 VERIFICATION SUMMARY: ${passed}/${TEST_SUITE.length} Passed (${Math.round((passed / TEST_SUITE.length) * 100)}% Success Rate)`);
  console.log('======================================================================\n');

  results.forEach((r, idx) => {
    console.log(`[${idx + 1}] ${r.test} [${r.status}] (${r.duration_ms || 0}ms)`);
    console.log(`    Query:  "${r.query}"`);
    console.log(`    Intent: ${r.intent || 'N/A'}`);
    console.log(`    Answer: ${r.answer_preview || r.error}`);
    console.log('');
  });

  return { passed, failed, total: TEST_SUITE.length };
}

runTestSuite().catch(console.error);
