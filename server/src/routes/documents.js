// ============================================================================
// server/src/routes/documents.js — Enterprise Document Inspection & Retrieval API
// ============================================================================
const express = require('express');
const router = express.Router();
const { PROJECTS, MOCKS } = require('../services/projectsData');
const fs = require('fs');
const path = require('path');

// In-Memory Document Registry loaded from all 7 mock data sources
const documentRegistry = new Map();

function initDocumentRegistry() {
  try {
    // 1. SharePoint Documents (Charters, Runbooks, Tech Specs, DR Guides)
    const spPath = path.resolve(__dirname, '../../../mock/sharepoint/sharepoint_sites.json');
    if (fs.existsSync(spPath)) {
      const spSites = JSON.parse(fs.readFileSync(spPath, 'utf8'));
      spSites.forEach(site => {
        const proj = PROJECTS.find(p => p.project_id === site.project_id);
        (site.documents || []).forEach(doc => {
          documentRegistry.set(doc.id, {
            id: doc.id,
            title: doc.name,
            source: 'SharePoint Online',
            doc_type: doc.doc_type || 'Governance Document',
            project_id: site.project_id,
            project_name: proj?.name || site.project_id,
            domain: proj?.domain || 'Enterprise',
            author: doc.author || 'Enterprise Architecture Board',
            version: doc.version || '1.0',
            updated_at: doc.updated_at ? doc.updated_at.split('T')[0] : '2026-09-15',
            content_text: doc.content_text || 'Standard operational document verified under enterprise governance.',
            url: `https://autonova.sharepoint.com/sites/${site.project_id.toLowerCase()}/Shared%20Documents/${encodeURIComponent(doc.name)}`
          });
          // Also index by normalized name for fuzzy lookup
          documentRegistry.set(doc.name.toLowerCase().trim(), documentRegistry.get(doc.id));
        });
      });
    }

    // 2. Confluence ADRs & Architecture Pages
    const cfPath = path.resolve(__dirname, '../../../mock/confluence/confluence_spaces.json');
    if (fs.existsSync(cfPath)) {
      const cfSpaces = JSON.parse(fs.readFileSync(cfPath, 'utf8'));
      cfSpaces.forEach(space => {
        const proj = PROJECTS.find(p => p.project_id === space.project_id);
        // Index ADRs
        (space.adrs || []).forEach(adr => {
          const docId = adr.id || `ADR-${space.project_id}-${adr.title.slice(0, 10)}`;
          documentRegistry.set(docId, {
            id: docId,
            title: adr.title,
            source: 'Confluence Cloud',
            doc_type: 'Architecture Decision Record (ADR)',
            project_id: space.project_id,
            project_name: proj?.name || space.project_id,
            domain: proj?.domain || 'Enterprise',
            author: adr.decided_by || 'Lead Systems Architect',
            version: adr.status || 'Accepted',
            updated_at: '2026-03-12',
            content_text: `# ${adr.title}\n\n**Status:** ${adr.status}\n**Decided By:** ${adr.decided_by}\n**Chosen Technology:** ${adr.chosen_technology}\n\n## Context\n${adr.context}\n\n## Decision\n${adr.decision}\n\n## Consequences & Trade-offs\n${adr.consequences}`,
            url: `https://company-brain.atlassian.net/wiki/spaces/${space.key}/pages/${encodeURIComponent(docId)}`
          });
          documentRegistry.set(adr.title.toLowerCase().trim(), documentRegistry.get(docId));
        });

        // Index Confluence Pages
        (space.pages || []).forEach(page => {
          documentRegistry.set(page.id, {
            id: page.id,
            title: page.title,
            source: 'Confluence Cloud',
            doc_type: 'Architecture Documentation',
            project_id: space.project_id,
            project_name: proj?.name || space.project_id,
            domain: proj?.domain || 'Enterprise',
            author: page.author_person_id || 'Engineering Staff',
            version: 'Published',
            updated_at: page.updated_at ? page.updated_at.split('T')[0] : '2026-04-10',
            content_text: `# ${page.title}\n\n${page.body_markdown || 'Enterprise architecture specification and integration guidelines.'}`,
            url: `https://company-brain.atlassian.net/wiki/spaces/${space.key}/pages/${page.id}`
          });
          documentRegistry.set(page.title.toLowerCase().trim(), documentRegistry.get(page.id));
        });
      });
    }

    // 3. ServiceNow ITSM Incidents & Emergency Changes
    const snPath = path.resolve(__dirname, '../../../mock/servicenow/servicenow_itsm.json');
    if (fs.existsSync(snPath)) {
      const snList = JSON.parse(fs.readFileSync(snPath, 'utf8'));
      snList.forEach(sn => {
        const proj = PROJECTS.find(p => p.project_id === sn.project_id);
        (sn.incidents || []).forEach(inc => {
          documentRegistry.set(inc.id, {
            id: inc.id,
            title: `Incident ${inc.id}: ${inc.short_description}`,
            source: 'ServiceNow ITSM',
            doc_type: 'Incident Log & Root Cause Analysis',
            project_id: sn.project_id,
            project_name: proj?.name || sn.project_id,
            domain: proj?.domain || 'Enterprise',
            author: inc.assigned_to_person_id || 'SRE On-Call Lead',
            version: `${inc.priority} - ${inc.state}`,
            updated_at: inc.opened_at ? inc.opened_at.split('T')[0] : '2026-07-14',
            content_text: `# SERVICENOW TICKET: ${inc.id}\n\n**Short Description:** ${inc.short_description}\n**Priority:** ${inc.priority}\n**State:** ${inc.state}\n**Reported At:** ${inc.opened_at}\n\n## Root Cause Analysis (RCA)\n${inc.root_cause || 'Connection saturation in database connection pool.'}\n\n## Resolution Notes\n${inc.resolution_notes || 'Adjusted pooler configuration and scaled reader replica.'}`,
            url: `https://service-now.autonova.internal/nav_to.do?uri=incident.do?sys_id=${inc.id}`
          });
        });
      });
    }

    // 4. HR & Employee Onboarding Policies (30 Core Documents)
    const { ONBOARDING_DOCUMENTS } = require('../services/onboardingPolicies');
    ONBOARDING_DOCUMENTS.forEach(pol => {
      documentRegistry.set(pol.id, {
        id: pol.id,
        title: pol.title,
        source: 'AutoNova HR & Governance Wiki',
        doc_type: `HR Policy (${pol.category})`,
        project_id: 'P-HR-01',
        project_name: 'Human Resources & Employee Governance',
        domain: 'Human Resources (shared function)',
        author: pol.owner,
        version: 'Effective 2026',
        updated_at: pol.effective_date,
        content_text: pol.content_text,
        url: pol.url
      });
      documentRegistry.set(pol.title.toLowerCase().trim(), documentRegistry.get(pol.id));
    });

    console.log(`[Document Registry] Initialized ${documentRegistry.size} verified enterprise documents.`);
  } catch (err) {
    console.error('[Document Registry Error]:', err.message);
  }
}

initDocumentRegistry();

/**
 * GET /api/documents
 * List enterprise documents with optional limit/source filters
 */
router.get('/', (req, res) => {
  const source = req.query.source;
  const docType = req.query.doc_type;
  const limit = parseInt(req.query.limit, 10) || 50;

  const results = [];
  const seen = new Set();

  for (const [key, doc] of documentRegistry.entries()) {
    if (seen.has(doc.id)) continue;
    seen.add(doc.id);

    if (source && !doc.source.toLowerCase().includes(source.toLowerCase())) continue;
    if (docType && !doc.doc_type.toLowerCase().includes(docType.toLowerCase())) continue;

    results.push({
      id: doc.id,
      title: doc.title,
      source: doc.source,
      doc_type: doc.doc_type,
      project_id: doc.project_id,
      project_name: doc.project_name,
      domain: doc.domain,
      author: doc.author,
      version: doc.version,
      updated_at: doc.updated_at,
      excerpt: (doc.content_text || '').slice(0, 160) + '...'
    });

    if (results.length >= limit) break;
  }

  res.json({
    total: seen.size,
    count: results.length,
    documents: results
  });
});

/**
 * GET /api/documents/search?query=...
 */
router.get('/search', (req, res) => {
  const q = (req.query.query || '').toLowerCase().trim();
  if (!q) {
    return res.json([]);
  }

  const results = [];
  const seen = new Set();

  for (const [key, doc] of documentRegistry.entries()) {
    if (seen.has(doc.id)) continue;
    const titleMatch = doc.title.toLowerCase().includes(q);
    const contentMatch = doc.content_text.toLowerCase().includes(q);
    const projMatch = doc.project_id?.toLowerCase().includes(q) || doc.project_name?.toLowerCase().includes(q);

    if (titleMatch || contentMatch || projMatch) {
      seen.add(doc.id);
      results.push({
        id: doc.id,
        title: doc.title,
        source: doc.source,
        doc_type: doc.doc_type,
        project_id: doc.project_id,
        project_name: doc.project_name,
        updated_at: doc.updated_at,
        excerpt: doc.content_text.slice(0, 200) + '...'
      });
    }
  }

  res.json(results.slice(0, 15));
});

/**
 * GET /api/documents/:docId
 * Returns full verified enterprise document by ID or fuzzy title match
 */
router.get('/:docId', (req, res) => {
  const id = decodeURIComponent(req.params.docId).trim();
  
  // Exact match
  if (documentRegistry.has(id)) {
    return res.json(documentRegistry.get(id));
  }

  // Lowercase match
  if (documentRegistry.has(id.toLowerCase())) {
    return res.json(documentRegistry.get(id.toLowerCase()));
  }

  // Fuzzy match on title or ID
  const lowerId = id.toLowerCase();
  for (const [key, doc] of documentRegistry.entries()) {
    if (doc.id.toLowerCase().includes(lowerId) || 
        doc.title.toLowerCase().includes(lowerId) || 
        lowerId.includes(doc.title.toLowerCase().slice(0, 25))) {
      return res.json(doc);
    }
  }

  // Fallback: If querying a project ID like P-CYB-01 or SP-CHARTER-P-CYB-02, return its Project Charter
  const pid = lowerId.replace('sp-charter-', '').trim();
  const projMatch = PROJECTS.find(p => p.project_id.toLowerCase() === pid || p.project_id.toLowerCase() === lowerId || p.name.toLowerCase().includes(lowerId));
  if (projMatch) {
    return res.json({
      id: `SP-CHARTER-${projMatch.project_id}`,
      title: `${projMatch.name} — Project Charter & Governance Baseline`,
      source: 'SharePoint Online',
      doc_type: 'Project Charter & Business Case',
      project_id: projMatch.project_id,
      project_name: projMatch.name,
      domain: projMatch.domain,
      author: projMatch.business_owner?.name || 'Executive Governance',
      version: 'Approved v2.1',
      updated_at: '2026-09-15',
      content_text: `# PROJECT CHARTER: ${projMatch.name.toUpperCase()} (${projMatch.project_id})\n\n## Executive Summary\n${projMatch.description}\n\n## Governance & Leadership\n- **Business Owner:** ${projMatch.business_owner?.name} (${projMatch.business_owner?.job_title})\n- **Tech Lead:** ${projMatch.tech_lead?.name} (${projMatch.tech_lead?.job_title})\n- **Cost Center:** ${projMatch.budget?.cost_center}\n- **Capex Approved:** €${(projMatch.budget?.capex_planned || 0).toLocaleString()}\n- **Opex Annual Baseline:** €${(projMatch.budget?.opex_planned || 0).toLocaleString()}\n\n## Upstream Dependencies\n${projMatch.upstream_dependencies.map(u => `- Depends on ${u.provider_name} (${u.provider_id}): ${u.description}`).join('\n') || '- None'}\n\n## Downstream Blast Radius\n${projMatch.downstream_dependents.map(d => `- Feeds into ${d.consumer_name} (${d.consumer_id}): ${d.description}`).join('\n') || '- Enterprise Data Fabric'}`,
      url: `https://autonova.sharepoint.com/sites/${projMatch.project_id.toLowerCase()}/Charter`
    });
  }

  res.status(404).json({ error: 'Document not found in enterprise registry.' });
});

module.exports = {
  router,
  documentRegistry
};
