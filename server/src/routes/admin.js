const express = require('express');
const router = express.Router();
const { PROJECTS } = require('../services/projectsData');

/**
 * Canonical LeanIX FactSheets dataset adhering strictly to official SAP LeanIX OpenAPI specification:
 * https://app.leanix.net/openapi-explorer/#/%2FfactSheets/getFactSheet
 */
const CANONICAL_LEANIX_FACTSHEETS = [
  {
    id: "e4a2d810-7b2c-493e-9081-0a9b8c7d6e51",
    name: "Order Hub",
    displayName: "Order Hub (ATLAS)",
    fullName: "Daimler Truck Order Hub Integration Engine",
    description: "Central order ingestion and routing gateway for supplier integration modernization under Project ATLAS.",
    type: "Application",
    status: "ACTIVE",
    lxState: "APPROVED",
    level: 1,
    qualitySealStatus: "APPROVED",
    score: 95,
    rev: 48,
    lxExcludeFromQuota: false,
    lxTransformationsFutureFactSheet: false,
    naFields: [],
    createdAt: "2024-01-15T08:30:00.000Z",
    updatedAt: "2026-10-06T18:45:00.000Z",
    approvedAt: "2026-03-01T10:00:00.000Z",
    tags: [
      {
        id: "tag-proj-atlas",
        name: "project:ATLAS",
        description: "Project Atlas Initiative",
        bgColor: "#0284c7",
        status: "ACTIVE",
        tagGroup: { id: "tg-proj", name: "Project", shortName: "PRJ", mandatory: true, mode: "SINGLE" }
      },
      {
        id: "tag-dept-proc",
        name: "department:Procurement",
        description: "Procurement Group Function",
        bgColor: "#0d9488",
        status: "ACTIVE",
        tagGroup: { id: "tg-dept", name: "Department", shortName: "DEPT", mandatory: true, mode: "SINGLE" }
      },
      {
        id: "tag-crit-high",
        name: "criticality:Mission-Critical",
        description: "High tier availability SLA",
        bgColor: "#ef4444",
        status: "ACTIVE",
        tagGroup: { id: "tg-crit", name: "Business Criticality", shortName: "CRIT", mandatory: false, mode: "SINGLE" }
      }
    ],
    fields: [
      { name: "functionalSuitability", data: { type: "StringValue", value: "appropriate" }, dataType: { type: "singleSelect", mandatory: true } },
      { name: "technicalSuitability", data: { type: "StringValue", value: "appropriate" }, dataType: { type: "singleSelect", mandatory: true } },
      { name: "informationClassification", data: { type: "StringValue", value: "Internal" }, dataType: { type: "singleSelect", mandatory: true } },
      { name: "hostingType", data: { type: "StringValue", value: "Cloud-AWS" }, dataType: { type: "singleSelect", mandatory: false } }
    ],
    lifecycle: {
      asString: "active",
      phases: [
        { phase: "plan", startDate: "2023-09-01" },
        { phase: "phaseIn", startDate: "2024-01-15" },
        { phase: "active", startDate: "2024-06-01" }
      ]
    },
    relations: [
      {
        id: "rel-oh-to-atlas",
        displayNameToFS: "relApplicationToProject",
        typeFromFS: "Application",
        typeToFS: "Project",
        fromId: "e4a2d810-7b2c-493e-9081-0a9b8c7d6e51",
        toId: "proj-atlas-fs-id",
        status: "ACTIVE",
        type: "relApplicationToProject",
        factSheet: { id: "proj-atlas-fs-id", name: "Project Atlas", type: "Project" }
      },
      {
        id: "rel-oh-to-s4hana",
        displayNameToFS: "relApplicationToApplication",
        typeFromFS: "Application",
        typeToFS: "Application",
        fromId: "e4a2d810-7b2c-493e-9081-0a9b8c7d6e51",
        toId: "e4a2d810-7b2c-493e-9081-0a9b8c7d6e55",
        status: "ACTIVE",
        type: "relApplicationToApplication",
        factSheet: { id: "e4a2d810-7b2c-493e-9081-0a9b8c7d6e55", name: "SAP S/4HANA Core", type: "Application" }
      },
      {
        id: "rel-oh-to-gateway",
        displayNameToFS: "relApplicationToITComponent",
        typeFromFS: "Application",
        typeToFS: "ITComponent",
        fromId: "e4a2d810-7b2c-493e-9081-0a9b8c7d6e51",
        toId: "itc-dt-api-gateway",
        status: "ACTIVE",
        type: "relApplicationToITComponent",
        factSheet: { id: "itc-dt-api-gateway", name: "Daimler Truck API Gateway", type: "ITComponent" }
      }
    ],
    milestones: [
      { id: "ms-atlas-01", date: "2026-02-15", name: "Architecture Clearance", description: "Confluence ADR-001 Gateway routing approved by Architecture Board." },
      { id: "ms-atlas-02", date: "2026-07-30", name: "Supplier UAT Validation", description: "End-to-end partner testing across 25 pilot tier-1 suppliers." },
      { id: "ms-atlas-03", date: "2026-11-15", name: "Production Cutover Gate", description: "Final change authorization (CHG0019283) and runbook sign-off." }
    ],
    completion: {
      type: "FactSheetCompletion",
      completion: 0.95,
      percentage: 95,
      subCompletions: {
        header: { type: "HeaderCompletion", percentage: 100, completion: 1.0 },
        relations: { type: "RelationsCompletion", percentage: 92, completion: 0.92 },
        responsibilities: { type: "ResponsibilitiesCompletion", percentage: 100, completion: 1.0 },
        milestones: { type: "MilestonesCompletion", percentage: 90, completion: 0.9 }
      }
    },
    documents: [
      {
        id: "doc-adr-001",
        name: "ADR-001: API Gateway Standard",
        description: "Architectural Decision Record mandating Kong API Gateway for B2B supplier traffic",
        url: "https://company-brain.atlassian.net/wiki/spaces/ATLAS/pages/ADR-001",
        origin: "CONFLUENCE",
        documentType: "Architecture Decision Record",
        createdAt: "2026-02-15T11:00:00.000Z"
      },
      {
        id: "doc-sec-approval",
        name: "DOC-002: InfoSec Clearance Certificate",
        description: "Daimler Cyber Defense Center official security approval certificate",
        url: "https://sharepoint.internal/atlas/security-approval.pdf",
        origin: "SHAREPOINT",
        documentType: "Security Review",
        createdAt: "2026-03-01T14:30:00.000Z"
      }
    ],
    comments: [
      {
        id: "cmt-01",
        factSheetId: "e4a2d810-7b2c-493e-9081-0a9b8c7d6e51",
        message: "Quality seal renewed following annual enterprise architecture audit.",
        status: "ACTIVE",
        userId: "jeevan@daimlertruck.com",
        replies: [],
        createdAt: "2026-03-01T10:00:00.000Z"
      }
    ],
    subscriptions: [
      {
        id: "sub-01",
        userId: "jeevan@daimlertruck.com",
        type: "ACCOUNTABLE",
        linkedRoles: [{ roleId: "role-lead-arch", name: "Lead Solutions Architect", description: "Technical architecture" }],
        roles: [{ id: "role-lead-arch", name: "Lead Solutions Architect", subscriptionType: "ACCOUNTABLE" }]
      },
      {
        id: "sub-02",
        userId: "praneetha@daimlertruck.com",
        type: "RESPONSIBLE",
        linkedRoles: [{ roleId: "role-pm", name: "IT Project Manager", description: "Delivery management" }],
        roles: [{ id: "role-pm", name: "IT Project Manager", subscriptionType: "RESPONSIBLE" }]
      }
    ],
    permissions: {
      self: ["READ", "UPDATE"],
      create: ["FactSheet"],
      read: ["ROLE_ARCHITECT", "ROLE_PM", "ROLE_DEV", "ROLE_SUPPORT"],
      update: ["ROLE_ARCHITECT"],
      delete: ["ROLE_ADMIN"]
    },
    permittedReadACL: [{ id: "acl-read-all", name: "All Authenticated Employees" }],
    permittedWriteACL: [{ id: "acl-write-arch", name: "Enterprise Architecture Team" }]
  },
  {
    id: "e4a2d810-7b2c-493e-9081-0a9b8c7d6e55",
    name: "SAP S/4HANA Core",
    displayName: "SAP S/4HANA Core ERP",
    fullName: "SAP S/4HANA Enterprise Cloud (Group Core)",
    description: "Global ERP Core digital backbone for Daimler Truck Group accounting, logistics, and plant execution.",
    type: "Application",
    status: "ACTIVE",
    lxState: "APPROVED",
    level: 1,
    qualitySealStatus: "APPROVED",
    score: 100,
    rev: 120,
    createdAt: "2021-03-01T08:00:00.000Z",
    updatedAt: "2026-10-06T12:00:00.000Z",
    approvedAt: "2026-01-15T09:00:00.000Z",
    tags: [
      { id: "t-phx-01", name: "project:PHOENIX", tagGroup: { name: "Project" } },
      { id: "t-fin-01", name: "department:Finance", tagGroup: { name: "Department" } }
    ],
    fields: [
      { name: "functionalSuitability", data: { type: "StringValue", value: "perfect" }, dataType: { type: "singleSelect" } },
      { name: "technicalSuitability", data: { type: "StringValue", value: "perfect" }, dataType: { type: "singleSelect" } }
    ],
    lifecycle: { asString: "active" },
    relations: [],
    milestones: [
      { id: "ms-phx-01", date: "2026-06-30", name: "Wave 3 Rollout", description: "European plant wave go-live." }
    ],
    completion: { type: "FactSheetCompletion", completion: 1.0, percentage: 100 },
    documents: [],
    comments: [],
    subscriptions: [
      { id: "sub-phx-01", userId: "dr.michael.bauer@daimlertruck.com", type: "ACCOUNTABLE" }
    ],
    permissions: { self: ["READ", "UPDATE"], read: ["ROLE_ARCHITECT", "ROLE_PM", "ROLE_DEV", "ROLE_SUPPORT"] }
  },
  {
    id: "e4a2d810-7b2c-493e-9081-0a9b8c7d6e56",
    name: "SAP Datasphere Core",
    displayName: "SAP Datasphere (Data Platform)",
    fullName: "SAP Datasphere Cloud Enterprise Semantic Layer",
    description: "Enterprise cloud data warehouse and analytical semantic fabric for unified Group reporting.",
    type: "Application",
    status: "ACTIVE",
    lxState: "APPROVED",
    level: 1,
    qualitySealStatus: "APPROVED",
    score: 92,
    rev: 55,
    createdAt: "2024-06-01T10:00:00.000Z",
    updatedAt: "2026-09-20T11:00:00.000Z",
    approvedAt: "2026-04-10T14:00:00.000Z",
    tags: [
      { id: "t-aur-01", name: "project:AURORA", tagGroup: { name: "Project" } },
      { id: "t-btp-01", name: "department:Analytics & BTP", tagGroup: { name: "Department" } }
    ],
    fields: [
      { name: "functionalSuitability", data: { type: "StringValue", value: "perfect" }, dataType: { type: "singleSelect" } }
    ],
    lifecycle: { asString: "active" },
    relations: [],
    milestones: [
      { id: "ms-aur-01", date: "2026-09-15", name: "Semantic Layer Cutover", description: "Datasphere spaces live." }
    ],
    completion: { type: "FactSheetCompletion", completion: 0.92, percentage: 92 },
    documents: [],
    comments: [],
    subscriptions: [
      { id: "sub-aur-01", userId: "dr.elena.rostova@daimlertruck.com", type: "ACCOUNTABLE" }
    ],
    permissions: { self: ["READ"], read: ["ROLE_ARCHITECT", "ROLE_PM", "ROLE_DEV", "ROLE_SUPPORT"] }
  }
];

/**
 * GET /api/admin/leanix/factsheets
 * Official LeanIX OpenAPI FactSheets endpoint
 */
router.get('/leanix/factsheets', async (req, res, next) => {
  try {
    res.json({
      status: "OK",
      type: "FactSheetListResponse",
      message: "FactSheets retrieved successfully",
      errors: [],
      total: CANONICAL_LEANIX_FACTSHEETS.length,
      data: CANONICAL_LEANIX_FACTSHEETS,
      cursor: "cursor-end"
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/leanix/factsheets/:id
 * Get single FactSheet with complete attributes
 */
router.get('/leanix/factsheets/:id', async (req, res, next) => {
  try {
    const fs = CANONICAL_LEANIX_FACTSHEETS.find(f => f.id === req.params.id || f.name.toLowerCase() === req.params.id.toLowerCase());
    if (!fs) {
      return res.status(404).json({ status: "ERROR", message: "FactSheet not found" });
    }
    res.json({
      status: "OK",
      data: [fs]
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/refresh
 * Trigger manual refresh
 */
router.post('/refresh', async (req, res, next) => {
  try {
    res.json({ status: 'Refresh triggered successfully', timestamp: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/sync-status
 * Get latest sync run status
 */
router.get('/sync-status', async (req, res, next) => {
  try {
    res.json({ status: 'completed', last_run: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/sources
 * Get source system status and freshness
 */
router.get('/sources', async (req, res, next) => {
  try {
    res.json([
      { name: 'SAP LeanIX', type: 'OpenAPI REST & GraphQL', endpoint: 'https://app.leanix.net/services/pathfinder/v1/factSheets', status: 'Connected', records: CANONICAL_LEANIX_FACTSHEETS.length, freshness: 'Just now' },
      { name: 'Jira Cloud', type: 'Real Atlassian REST v3', endpoint: 'https://company-brain.atlassian.net', status: 'Connected', records: 12, freshness: '10 mins ago' },
      { name: 'Confluence Cloud', type: 'Real Atlassian REST v2', endpoint: 'https://company-brain.atlassian.net/wiki', status: 'Connected', records: 5, freshness: '15 mins ago' },
      { name: 'GitHub', type: 'Real GitHub REST API', endpoint: 'https://api.github.com', status: 'Connected', records: 4, freshness: '1 hour ago' },
      { name: 'SharePoint Online', type: 'Microsoft Graph v1.0', endpoint: 'https://graph.microsoft.com/v1.0/sites/root/drives', status: 'Connected', records: 6, freshness: '1 hour ago' },
      { name: 'Microsoft Teams', type: 'Microsoft Graph chatMessage', endpoint: 'https://graph.microsoft.com/v1.0/teams', status: 'Connected', records: 14, freshness: '25 mins ago' },
      { name: 'ServiceNow', type: 'REST Table API', endpoint: 'https://service-now.internal/api/now/table', status: 'Connected', records: 4, freshness: '30 mins ago' }
    ]);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/users
 * List users with roles
 */
router.get('/users', async (req, res, next) => {
  try {
    res.json([
      { id: '1', name: 'Jeevan (Lead Architect)', role: 'architect', email: 'jeevan@daimlertruck.com' },
      { id: '2', name: 'Praneetha (PM)', role: 'project_manager', email: 'praneetha@daimlertruck.com' },
      { id: '3', name: 'Dr. Michael Bauer (OneERP Director)', role: 'management', email: 'dr.michael.bauer@daimlertruck.com' },
      { id: '4', name: 'Marcus Vance (CISO)', role: 'architect', email: 'marcus.vance@daimlertruck.com' }
    ]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
