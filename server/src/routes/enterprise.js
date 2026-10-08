const express = require('express');
const router = express.Router();
const { PROJECTS, DOMAINS, PLATFORMS, ANOMALIES, getDepartments } = require('../services/projectsData');

/**
 * GET /api/enterprise
 * Enterprise overview
 */
router.get('/', async (req, res, next) => {
  try {
    const departments = getDepartments();
    const readyCount = PROJECTS.filter(p => p.readiness?.status === 'READY').length;
    const condCount = PROJECTS.filter(p => p.readiness?.status === 'CONDITIONALLY_READY').length;
    const notReadyCount = PROJECTS.filter(p => p.readiness?.status === 'NOT_READY').length;
    
    const avgScore = Math.round(PROJECTS.reduce((acc, p) => acc + (p.readiness?.score || 70), 0) / PROJECTS.length);

    res.json({
      departments_count: departments.length,
      domains_count: DOMAINS.length,
      platforms_count: PLATFORMS.length,
      total_projects: PROJECTS.length,
      overall_readiness: avgScore,
      ready_projects: readyCount,
      conditionally_ready_projects: condCount,
      not_ready_projects: notReadyCount,
      anomalies_count: ANOMALIES.length
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/enterprise/departments
 * List departments with project counts, risk summary
 */
router.get('/departments', async (req, res, next) => {
  try {
    res.json(getDepartments());
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/enterprise/departments/:department
 * Department detail
 */
router.get('/departments/:department', async (req, res, next) => {
  try {
    const { department } = req.params;
    const projects = PROJECTS.filter(p => 
      p.department.toLowerCase() === department.toLowerCase() ||
      p.domain_id.toLowerCase() === department.toLowerCase()
    );
    res.json({
      department,
      project_count: projects.length,
      projects
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/enterprise/kpis
 * Portfolio-level KPIs
 */
router.get('/kpis', async (req, res, next) => {
  try {
    const readyCount = PROJECTS.filter(p => p.readiness?.status === 'READY').length;
    const condCount = PROJECTS.filter(p => p.readiness?.status === 'CONDITIONALLY_READY').length;
    const notReadyCount = PROJECTS.filter(p => p.readiness?.status === 'NOT_READY').length;
    const criticalAnomalies = ANOMALIES.filter(a => a.severity === 'Critical').length;
    const highAnomalies = ANOMALIES.filter(a => a.severity === 'High').length;

    const kpis = {
      projects_at_risk: notReadyCount + condCount,
      critical_anomalies: criticalAnomalies,
      blocking_conflicts: highAnomalies + criticalAnomalies,
      open_critical_incidents: 2,
      total_anomalies: ANOMALIES.length,
      readiness_distribution: [
        { name: 'Ready', value: readyCount, color: '#10b981' },
        { name: 'Conditionally Ready', value: condCount, color: '#f59e0b' },
        { name: 'Not Ready', value: notReadyCount, color: '#ef4444' }
      ]
    };
    res.json(kpis);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/enterprise/anomalies
 * List the 15 planted enterprise anomalies catalogue with optional severity filter
 */
router.get('/anomalies', async (req, res, next) => {
  try {
    const { severity, project_id } = req.query;
    let list = [...ANOMALIES];

    if (severity) {
      list = list.filter(a => a.severity.toLowerCase() === severity.toLowerCase());
    }

    if (project_id) {
      list = list.filter(a => a.project_id.toUpperCase() === project_id.toUpperCase());
    }

    res.json({
      total: list.length,
      data: list
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/enterprise/people
 * Searchable employee directory across all 86 people with allocations
 */
router.get('/people', (req, res, next) => {
  try {
    const { PEOPLE, ALLOCATIONS, TEAMS } = require('../services/datasetLoader');
    const q = (req.query.q || '').toLowerCase().trim();

    const peopleList = PEOPLE.map(p => {
      const teamId = p.primary_team_id || p.team_id;
      const team = TEAMS.find(t => t.team_id === teamId);
      const dept = p.domain_or_platform || team?.parent_domain_or_platform || 'Engineering';
      const userAllocations = ALLOCATIONS.filter(a => a.person_id === p.person_id).map(a => {
        const proj = PROJECTS.find(pr => pr.project_id === a.project_id);
        return {
          project_id: a.project_id,
          project_name: proj?.name || a.project_id,
          role_on_project: a.role_on_project,
          allocation_pct: parseInt(a.allocation_pct, 10) || 0
        };
      });

      return {
        person_id: p.person_id,
        name: p.name || 'Unknown',
        job_title: p.job_title || 'Specialist',
        department: dept,
        team_id: teamId || 'Unassigned',
        team_name: team?.name || teamId || 'Unassigned',
        location: p.location || 'Stuttgart HQ',
        email: p.email || `${(p.name || 'user').toLowerCase().replace(/\s+/g, '.')}@autonova.example`,
        allocations: userAllocations,
        total_allocation_pct: userAllocations.reduce((sum, a) => sum + a.allocation_pct, 0)
      };
    });

    if (q) {
      const filtered = peopleList.filter(p => 
        (p.name || '').toLowerCase().includes(q) ||
        (p.job_title || '').toLowerCase().includes(q) ||
        (p.department || '').toLowerCase().includes(q) ||
        (p.team_name || '').toLowerCase().includes(q) ||
        p.allocations.some(a => (a.project_name || '').toLowerCase().includes(q))
      );
      return res.json(filtered);
    }

    res.json(peopleList);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/enterprise/feed
 * Real-time Company Brain Activity Feed: Decisions (ADRs), Changes, and Code Commits
 */
router.get('/feed', (req, res, next) => {
  try {
    const feed = [];

    // 1. Confluence Architecture Decisions
    PROJECTS.forEach(p => {
      (p.unstructured_knowledge?.adrs || []).forEach(adr => {
        feed.push({
          id: adr.id,
          type: 'DECISION',
          title: adr.title,
          system: 'Confluence Cloud',
          project_id: p.project_id,
          project_name: p.name,
          badge: adr.status || 'Accepted',
          badge_color: 'emerald',
          date: '2026-03-12',
          author: adr.decided_by || 'Architecture Board',
          description: `${adr.decision} Context: ${adr.context}`
        });
      });

      // 2. ServiceNow Emergency Changes & Incidents
      (p.unstructured_knowledge?.incidents || []).slice(0, 2).forEach(inc => {
        feed.push({
          id: inc.id,
          type: 'INCIDENT',
          title: `ITSM Incident: ${inc.short_description}`,
          system: 'ServiceNow ITSM',
          project_id: p.project_id,
          project_name: p.name,
          badge: inc.priority || 'P1',
          badge_color: inc.priority === 'P1' ? 'red' : 'amber',
          date: inc.opened_at ? inc.opened_at.split('T')[0] : '2026-07-14',
          author: inc.assigned_to_person_id || 'SRE Incident Commander',
          description: `RCA: ${inc.root_cause || 'Service threshold exceeded'}. Resolution: ${inc.resolution_notes || 'Reconfigured cluster pooler'}.`
        });
      });

      // 3. SharePoint Governance Runbooks & Charters
      (p.unstructured_knowledge?.documents || []).slice(0, 2).forEach(doc => {
        feed.push({
          id: doc.id,
          type: 'GOVERNANCE',
          title: `${doc.name}`,
          system: 'SharePoint Online',
          project_id: p.project_id,
          project_name: p.name,
          badge: doc.doc_type || 'Charter',
          badge_color: 'sky',
          date: doc.updated_at ? doc.updated_at.split('T')[0] : '2026-09-15',
          author: doc.author || 'Executive Sponsor',
          description: doc.content_text ? doc.content_text.slice(0, 180) + '...' : 'Approved baseline.'
        });
      });
    });

    // Sort by type/date
    res.json(feed.slice(0, 30));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/enterprise/hierarchy
 * Executive Organization Hierarchy (E1 to E5+ & Specialists) mapped to Projects & Budgets
 */
router.get('/hierarchy', (req, res, next) => {
  try {
    const { PEOPLE, ALLOCATIONS, TEAMS } = require('../services/datasetLoader');

    // Categorize people into standardized executive levels (using strict word boundary regex)
    const getLevel = (person) => {
      const title = (person.job_title || '').toLowerCase();
      
      // E1: C-Level (CEO, CTO, CIO, CFO)
      if (/\b(ceo|cto|cio|cfo|chief)\b/i.test(title)) return 'E1';
      
      // E2: Directors
      if (/\b(director|head of)\b/i.test(title)) return 'E2';
      
      // E3: Vice Presidents (VPs)
      if (/\b(vp|vice president)\b/i.test(title)) return 'E3';
      
      // E4: General Managers & Platform Leads
      if (/\b(general manager|gm|platform lead|architect|principal)\b/i.test(title)) return 'E4';
      
      // E5: Engineering Managers & Product Owners
      if (/\b(manager|product owner|scrum master|lead|controller)\b/i.test(title)) return 'E5';
      
      if (/\b(senior|consultant)\b/i.test(title)) return 'Senior Specialist';
      if (/\b(developer|engineer|analyst)\b/i.test(title)) return 'Engineer';
      if (/\b(intern|junior)\b/i.test(title)) return 'Associate / Intern';
      return 'Specialist';
    };

    // Executive Level Groups (Legacy flat bucket list preserved for grid/filters)
    const levelHierarchy = {
      E1: {
        code: 'E1',
        title: 'E1 • Executive Board & C-Level (CEO, CTO, CIO, CFO)',
        description: 'Strategic group mandates, enterprise capital envelope authorization (€75M+), and board accountability.',
        members: [
          {
            person_id: 'E1000',
            name: 'Dr. Elena Rostova',
            job_title: 'Group Chief Technology Officer (CTO & CIO)',
            department: 'Corporate IT & Technology Board',
            location: 'Stuttgart HQ',
            direct_initiatives: ['Cloud Modernization 2026', 'TISAX Cyber Shield', 'Unified Vehicle Telematics Fabric'],
            headcount_oversight: 38,
            budget_oversight: 48500000
          },
          {
            person_id: 'E0999',
            name: 'Markus Weber',
            job_title: 'Chief Executive Officer (CEO)',
            department: 'Executive Board',
            location: 'Stuttgart HQ',
            direct_initiatives: ['AutoNova 2030 Digital Transformation', 'Clean Mobility Financial Services'],
            headcount_oversight: 20,
            budget_oversight: 75000000
          },
          {
            person_id: 'E0998',
            name: 'Thomas Keller',
            job_title: 'Chief Financial Officer (CFO)',
            department: 'Executive Board',
            location: 'Stuttgart HQ',
            direct_initiatives: ['Global Capex Envelope & Treasury Optimization'],
            headcount_oversight: 28,
            budget_oversight: 62000000
          }
        ]
      },
      E2: {
        code: 'E2',
        title: 'E2 • Functional & Domain Directors',
        description: 'Directorial leadership across Cyber Security, Group Accounting, Treasury, Retail Lending, and Aftersales.',
        members: []
      },
      E3: {
        code: 'E3',
        title: 'E3 • Vice Presidents (VPs)',
        description: 'Executive Vice Presidents driving multi-domain P&L roadmaps, strategic sourcing, and global sales operations.',
        members: []
      },
      E4: {
        code: 'E4',
        title: 'E4 • General Managers & Platform Leads (GMs & Lead Architects)',
        description: 'Platform General Managers and Principal Architects owning shared landing zones (Azure, AWS, SAP, Snowflake).',
        members: []
      },
      E5: {
        code: 'E5',
        title: 'E5 • Engineering Managers & Product Owners (Managers & POs)',
        description: 'Operational managers and delivery product owners managing agile sprint velocity and production readiness gates.',
        members: []
      }
    };

    // Helper to resolve enriched project summary
    const getProjectSummary = (pId) => {
      const p = PROJECTS.find(pr => pr.project_id === pId);
      if (!p) return null;
      return {
        project_id: p.project_id,
        name: p.name,
        department: p.department || p.domain_id,
        domain_id: p.domain_id,
        rag_status: p.rag_status,
        readiness_score: p.readiness?.score || 85,
        budget_capex: p.budget?.capex_planned || 2500000,
        business_criticality: p.business_criticality || 'high',
        strategic_initiative: p.strategic_initiative || 'Digital Modernization'
      };
    };

    // Helper to resolve enriched person details
    const getPersonSummary = (pId, overrideGrade = null) => {
      const p = PEOPLE.find(item => item.person_id === pId) || { person_id: pId, name: pId, job_title: 'Specialist', location: 'HQ', email: `${pId.toLowerCase()}@autonova.example` };
      return {
        person_id: p.person_id,
        name: p.name,
        job_title: p.job_title,
        department: p.domain_or_platform || 'Engineering',
        location: p.location,
        email: p.email,
        executive_grade: overrideGrade || getLevel(p)
      };
    };

    PEOPLE.forEach(p => {
      const lvl = getLevel(p);
      const userAllocations = ALLOCATIONS.filter(a => a.person_id === p.person_id);
      const ownedProjects = PROJECTS.filter(pr => 
        pr.business_owner?.person_id === p.person_id || 
        pr.tech_lead?.person_id === p.person_id ||
        userAllocations.some(a => a.project_id === pr.project_id)
      ).map(pr => ({
        project_id: pr.project_id,
        name: pr.name,
        department: pr.department,
        rag_status: pr.rag_status,
        readiness_score: pr.readiness?.score || 85,
        budget_capex: pr.budget?.capex_planned || 2500000,
        is_lead: pr.tech_lead?.person_id === p.person_id,
        is_owner: pr.business_owner?.person_id === p.person_id
      }));

      const member = {
        person_id: p.person_id,
        name: p.name,
        job_title: p.job_title,
        department: p.domain_or_platform || 'Engineering',
        location: p.location,
        projects_count: ownedProjects.length,
        projects: ownedProjects,
        total_budget_oversight: ownedProjects.reduce((sum, pr) => sum + pr.budget_capex, 0)
      };

      if (levelHierarchy[lvl] && lvl !== 'E1') {
        levelHierarchy[lvl].members.push(member);
      }
    });

    // -------------------------------------------------------------
    // PERSON-BY-PERSON REPORTING TREE STRUCTURE (E1 -> E2 -> E3/E4 -> E5 -> PROJECTS)
    // -------------------------------------------------------------
    const reportingTrees = [
      // 1. CFO THOMAS KELLER TREE
      {
        person_id: 'E0998',
        name: 'Thomas Keller',
        job_title: 'Chief Financial Officer (CFO)',
        executive_grade: 'E1',
        department: 'Executive Board • Finance & Financial Services (FIN & DTFS)',
        location: 'Stuttgart HQ',
        email: 'thomas.keller@autonova.example',
        mandate: 'Enterprise capital envelope authorization (€62M), global treasury governance, statutory IFRS/SOX compliance, and automotive loan/leasing portfolio risk.',
        budget_oversight: 62000000,
        headcount_oversight: 28,
        total_projects_count: 12,
        direct_reports: [
          {
            ...getPersonSummary('E1039', 'E2'),
            assigned_domain: 'Finance (FIN)',
            domain_label: 'Corporate Finance & Accounting',
            roles_and_responsibilities: 'Group General Ledger, SAP S/4HANA Finance Core, IFRS/SOX statutory accounting, automated financial consolidation, and tax audit compliance.',
            headcount_oversight: 12,
            budget_oversight: 28500000,
            direct_reports: [
              {
                ...getPersonSummary('E1042', 'E4'),
                role_focus: 'SAP RISE Core ERP & General Ledger Architecture',
                projects: [getProjectSummary('P-FIN-01')].filter(Boolean),
                direct_reports: [
                  {
                    ...getPersonSummary('E1041', 'E5'),
                    role_focus: 'Finance Business Process & Tax Reporting',
                    projects: [getProjectSummary('P-FIN-06')].filter(Boolean),
                    direct_reports: []
                  },
                  {
                    ...getPersonSummary('E1044', 'E5'),
                    role_focus: 'SAP Financial Interface & Tax Integration',
                    projects: [getProjectSummary('P-FIN-06')].filter(Boolean),
                    direct_reports: []
                  }
                ]
              },
              {
                ...getPersonSummary('E1040', 'E4'),
                role_focus: 'Group Controlling, Reporting & Financial Data Mart',
                projects: [getProjectSummary('P-FIN-03'), getProjectSummary('P-FIN-05')].filter(Boolean),
                direct_reports: [
                  {
                    ...getPersonSummary('E1043', 'E5'),
                    role_focus: 'SAP FICO Consulting & Intercompany Eliminations',
                    projects: [getProjectSummary('P-FIN-03')].filter(Boolean),
                    direct_reports: []
                  },
                  {
                    ...getPersonSummary('E1049', 'E5'),
                    role_focus: 'Snowflake Finance Mart BI Development',
                    projects: [getProjectSummary('P-FIN-05')].filter(Boolean),
                    direct_reports: []
                  }
                ]
              },
              {
                ...getPersonSummary('E1045', 'E4'),
                role_focus: 'Corporate Treasury & Liquidity Management',
                projects: [getProjectSummary('P-FIN-04')].filter(Boolean),
                direct_reports: [
                  {
                    ...getPersonSummary('E1046', 'E5'),
                    role_focus: 'Cash Positioning & Foreign Exchange Hedging',
                    projects: [getProjectSummary('P-FIN-04')].filter(Boolean),
                    direct_reports: []
                  },
                  {
                    ...getPersonSummary('E1047', 'E5'),
                    role_focus: 'SWIFT Bank Connectivity & Treasury Systems',
                    projects: [getProjectSummary('P-FIN-04')].filter(Boolean),
                    direct_reports: []
                  }
                ]
              },
              {
                ...getPersonSummary('E1048', 'E5'),
                role_focus: 'Finance Analytics Cloud & Datasphere Modeling',
                projects: [getProjectSummary('P-FIN-02')].filter(Boolean),
                direct_reports: []
              }
            ]
          },
          {
            ...getPersonSummary('E1059', 'E2'),
            assigned_domain: 'Daimler Truck Financial Services (DTFS)',
            domain_label: 'Commercial Vehicle Lending & Leasing',
            roles_and_responsibilities: 'Commercial fleet lending, dealer wholesale floorplan financing, digital loan origination, credit risk decision engines, and BaFin/IFRS 9 regulatory impairment.',
            headcount_oversight: 16,
            budget_oversight: 33500000,
            direct_reports: [
              {
                ...getPersonSummary('E1062', 'E4'),
                role_focus: 'Digital Loan Origination & Leasing Architecture',
                projects: [getProjectSummary('P-DTFS-01'), getProjectSummary('P-DTFS-03')].filter(Boolean),
                direct_reports: [
                  {
                    ...getPersonSummary('E1061', 'E5'),
                    role_focus: 'Product Owner Digital Lending Workflow',
                    projects: [getProjectSummary('P-DTFS-01')].filter(Boolean),
                    direct_reports: []
                  },
                  {
                    ...getPersonSummary('E1063', 'E5'),
                    role_focus: 'Senior Backend Microservices (Spring Boot)',
                    projects: [getProjectSummary('P-DTFS-03')].filter(Boolean),
                    direct_reports: []
                  },
                  {
                    ...getPersonSummary('E1064', 'E5'),
                    role_focus: 'QA Automation & Release Verification',
                    projects: [getProjectSummary('P-DTFS-01')].filter(Boolean),
                    direct_reports: []
                  },
                  {
                    ...getPersonSummary('E1065', 'E5'),
                    role_focus: 'Dealer Floorplan Wholesale Banking Core',
                    projects: [getProjectSummary('P-DTFS-06')].filter(Boolean),
                    direct_reports: []
                  }
                ]
              },
              {
                ...getPersonSummary('E1066', 'E4'),
                role_focus: 'Credit Risk Scoring & Regulatory Modeling',
                projects: [getProjectSummary('P-DTFS-02'), getProjectSummary('P-DTFS-05')].filter(Boolean),
                direct_reports: [
                  {
                    ...getPersonSummary('E1060', 'E5'),
                    role_focus: 'Commercial Credit Policy & Underwriting Rules',
                    projects: [getProjectSummary('P-DTFS-02'), getProjectSummary('P-DTFS-06')].filter(Boolean),
                    direct_reports: []
                  },
                  {
                    ...getPersonSummary('E1067', 'E5'),
                    role_focus: 'Credit Scoring ML Pipeline & Feature Engineering',
                    projects: [getProjectSummary('P-DTFS-02')].filter(Boolean),
                    direct_reports: []
                  },
                  {
                    ...getPersonSummary('E1068', 'E5'),
                    role_focus: 'IFRS 9 Expected Credit Loss & Basel Impairment',
                    projects: [getProjectSummary('P-DTFS-05')].filter(Boolean),
                    direct_reports: []
                  }
                ]
              },
              {
                ...getPersonSummary('E1069', 'E4'),
                role_focus: 'Collections, Servicing & Contract Workflows',
                projects: [getProjectSummary('P-DTFS-04')].filter(Boolean),
                direct_reports: [
                  {
                    ...getPersonSummary('E1070', 'E5'),
                    role_focus: 'Servicing Platform & Dunning Engine',
                    projects: [getProjectSummary('P-DTFS-04')].filter(Boolean),
                    direct_reports: []
                  }
                ]
              }
            ]
          }
        ]
      },

      // 2. CTO & CIO DR. ELENA ROSTOVA TREE
      {
        person_id: 'E1000',
        name: 'Dr. Elena Rostova',
        job_title: 'Group Chief Technology Officer (CTO & CIO)',
        executive_grade: 'E1',
        department: 'Corporate IT, Technology & Cyber Board (CYB & PLATFORMS)',
        location: 'Stuttgart HQ',
        email: 'elena.rostova@autonova.example',
        mandate: 'Group enterprise architecture blueprint, multi-cloud infrastructure modernization (€48.5M), TISAX cyber shield, and connected vehicle digital fabric.',
        budget_oversight: 48500000,
        headcount_oversight: 38,
        total_projects_count: 7,
        direct_reports: [
          {
            ...getPersonSummary('E1024', 'E2'),
            assigned_domain: 'Cyber Security (CYB)',
            domain_label: 'Group Cybersecurity & CISO Office',
            roles_and_responsibilities: 'Enterprise Security Operations Center (SOC), vehicle cybersecurity (UN R155/156), TISAX AL3 certification, Identity & Access Governance, vulnerability management, and incident response.',
            headcount_oversight: 15,
            budget_oversight: 22000000,
            direct_reports: [
              {
                ...getPersonSummary('E1026', 'E4'),
                role_focus: 'SOC Operations & SIEM Telemetry Analytics',
                projects: [getProjectSummary('P-CYB-01'), getProjectSummary('P-CYB-05')].filter(Boolean),
                direct_reports: [
                  {
                    ...getPersonSummary('E1027', 'E5'),
                    role_focus: 'Cyber Threat Analysis & Alert Correlation',
                    projects: [getProjectSummary('P-CYB-01')].filter(Boolean),
                    direct_reports: []
                  },
                  {
                    ...getPersonSummary('E1028', 'E5'),
                    role_focus: 'Security Telemetry Lake & Threat Hunting',
                    projects: [getProjectSummary('P-CYB-05')].filter(Boolean),
                    direct_reports: []
                  },
                  {
                    ...getPersonSummary('E1029', 'E5'),
                    role_focus: 'SOC Triage & Incident Containment',
                    projects: [getProjectSummary('P-CYB-01')].filter(Boolean),
                    direct_reports: []
                  }
                ]
              },
              {
                ...getPersonSummary('E1030', 'E4'),
                role_focus: 'Enterprise Identity & Access Governance (IAM)',
                projects: [getProjectSummary('P-CYB-02'), getProjectSummary('P-CYB-06')].filter(Boolean),
                direct_reports: [
                  {
                    ...getPersonSummary('E1031', 'E5'),
                    role_focus: 'SSO Federation & Joiner/Mover/Leaver Engine',
                    projects: [getProjectSummary('P-CYB-02')].filter(Boolean),
                    direct_reports: []
                  },
                  {
                    ...getPersonSummary('E1032', 'E5'),
                    role_focus: 'Privileged Access Management & Secret Vaults',
                    projects: [getProjectSummary('P-CYB-06')].filter(Boolean),
                    direct_reports: []
                  }
                ]
              },
              {
                ...getPersonSummary('E1035', 'E4'),
                role_focus: 'Cloud Security Posture & Drift Prevention',
                projects: [getProjectSummary('P-CYB-03')].filter(Boolean),
                direct_reports: [
                  {
                    ...getPersonSummary('E1036', 'E5'),
                    role_focus: 'Azure & AWS Guardrails Implementation',
                    projects: [getProjectSummary('P-CYB-03')].filter(Boolean),
                    direct_reports: []
                  }
                ]
              },
              {
                ...getPersonSummary('E1033', 'E4'),
                role_focus: 'Vulnerability Scanning & Patch Enforcement',
                projects: [getProjectSummary('P-CYB-04')].filter(Boolean),
                direct_reports: [
                  {
                    ...getPersonSummary('E1034', 'E5'),
                    role_focus: 'Container & Host Patch SLA Automation',
                    projects: [getProjectSummary('P-CYB-04')].filter(Boolean),
                    direct_reports: []
                  }
                ]
              },
              {
                ...getPersonSummary('E1037', 'E4'),
                role_focus: 'Incident Response Automation & SOAR Playbooks',
                projects: [getProjectSummary('P-CYB-07')].filter(Boolean),
                direct_reports: [
                  {
                    ...getPersonSummary('E1038', 'E5'),
                    role_focus: 'Automated CSIRT Playbook Execution',
                    projects: [getProjectSummary('P-CYB-07')].filter(Boolean),
                    direct_reports: []
                  }
                ]
              },
              {
                ...getPersonSummary('E1025', 'E4'),
                role_focus: 'Security Compliance & TISAX Auditing',
                projects: [],
                direct_reports: []
              }
            ]
          },
          {
            ...getPersonSummary('E1001', 'E2'),
            assigned_domain: 'Cloud Platforms (AZURE & AWS)',
            domain_label: 'Cloud Infrastructure & Landing Zones',
            roles_and_responsibilities: 'Multi-region Azure and AWS landing zones, Kubernetes (AKS/EKS) cluster management, Terraform IaC governance, ExpressRoute networks, and cloud cost FinOps.',
            headcount_oversight: 12,
            budget_oversight: 15500000,
            direct_reports: [
              {
                ...getPersonSummary('E1003', 'E4'),
                role_focus: 'Azure Enterprise Landing Zones & Governance',
                projects: [],
                direct_reports: [
                  {
                    ...getPersonSummary('E1002', 'E5'),
                    role_focus: 'Cloud Network Backbone & ExpressRoute Routing',
                    projects: [],
                    direct_reports: []
                  }
                ]
              },
              {
                ...getPersonSummary('E1004', 'E4'),
                role_focus: 'Azure Kubernetes Service (AKS) Fleet Lead',
                projects: [],
                direct_reports: [
                  {
                    ...getPersonSummary('E1005', 'E5'),
                    role_focus: 'Kubernetes Reliability, GitOps & SRE',
                    projects: [],
                    direct_reports: []
                  },
                  {
                    ...getPersonSummary('E1006', 'E5'),
                    role_focus: 'DevOps Automation & Helm Packaging',
                    projects: [],
                    direct_reports: []
                  }
                ]
              },
              {
                ...getPersonSummary('E1009', 'E4'),
                role_focus: 'AWS Multi-Account Platform Lead',
                projects: [],
                direct_reports: [
                  {
                    ...getPersonSummary('E1010', 'E5'),
                    role_focus: 'AWS Infrastructure Engineering',
                    projects: [],
                    direct_reports: []
                  },
                  {
                    ...getPersonSummary('E1011', 'E5'),
                    role_focus: 'AWS Solutions Architecture & Well-Architected',
                    projects: [],
                    direct_reports: []
                  }
                ]
              },
              {
                ...getPersonSummary('E1007', 'E4'),
                role_focus: 'Azure Data Platform & Blob Storage Lead',
                projects: [],
                direct_reports: [
                  {
                    ...getPersonSummary('E1008', 'E5'),
                    role_focus: 'Data Factory Orchestration & Ingestion',
                    projects: [],
                    direct_reports: []
                  }
                ]
              }
            ]
          },
          {
            ...getPersonSummary('E1017', 'E2'),
            assigned_domain: 'Integration & IoT (SAP, DATABRICKS, SNOWFLAKE)',
            domain_label: 'Enterprise Integration, Data Platforms & IoT',
            roles_and_responsibilities: 'Connected truck CAN-bus telematics ingestion, Kafka streaming brokers, SAP BTP integration suite, Databricks AI/ML workspace, and Snowflake analytics fabric.',
            headcount_oversight: 11,
            budget_oversight: 11000000,
            direct_reports: [
              {
                ...getPersonSummary('E1013', 'E4'),
                role_focus: 'SAP RISE Service & Managed Cloud SLAs',
                projects: [],
                direct_reports: [
                  {
                    ...getPersonSummary('E1012', 'E5'),
                    role_focus: 'SAP Basis Administration & Kernel Updates',
                    projects: [],
                    direct_reports: []
                  },
                  {
                    ...getPersonSummary('E1014', 'E5'),
                    role_focus: 'SAP HANA In-Memory Database Administration',
                    projects: [],
                    direct_reports: []
                  }
                ]
              },
              {
                ...getPersonSummary('E1015', 'E4'),
                role_focus: 'SAP Analytics Cloud & Datasphere Integration',
                projects: [],
                direct_reports: [
                  {
                    ...getPersonSummary('E1016', 'E5'),
                    role_focus: 'Datasphere Semantic Modeling & Federation',
                    projects: [],
                    direct_reports: []
                  },
                  {
                    ...getPersonSummary('E1018', 'E5'),
                    role_focus: 'BTP Cloud Integration & API Gateway',
                    projects: [],
                    direct_reports: []
                  }
                ]
              },
              {
                ...getPersonSummary('E1021', 'E4'),
                role_focus: 'Databricks Lakehouse & ML Feature Platform',
                projects: [],
                direct_reports: [
                  {
                    ...getPersonSummary('E1022', 'E5'),
                    role_focus: 'Machine Learning Infrastructure & MLOps',
                    projects: [],
                    direct_reports: []
                  },
                  {
                    ...getPersonSummary('E1023', 'E5'),
                    role_focus: 'Data Platform ETL & Delta Lake Pipelines',
                    projects: [],
                    direct_reports: []
                  }
                ]
              },
              {
                ...getPersonSummary('E1019', 'E4'),
                role_focus: 'Snowflake Enterprise Data Warehouse Lead',
                projects: [],
                direct_reports: [
                  {
                    ...getPersonSummary('E1020', 'E5'),
                    role_focus: 'Snowflake Virtual Warehouses & Optimization',
                    projects: [],
                    direct_reports: []
                  }
                ]
              }
            ]
          }
        ]
      },

      // 3. CEO MARKUS WEBER TREE
      {
        person_id: 'E0999',
        name: 'Markus Weber',
        job_title: 'Chief Executive Officer (CEO)',
        executive_grade: 'E1',
        department: 'Executive Board • Operations, Commercial & People (PRO, SAL, HR)',
        location: 'Stuttgart HQ',
        email: 'markus.weber@autonova.example',
        mandate: 'Group strategy AutoNova 2030, commercial vehicle sales expansion, strategic supplier supply-chain resilience, and corporate culture.',
        budget_oversight: 75000000,
        headcount_oversight: 20,
        total_projects_count: 12,
        direct_reports: [
          {
            ...getPersonSummary('E1050', 'E3'),
            assigned_domain: 'Procurement (PRO)',
            domain_label: 'Strategic Sourcing & Supply Chain',
            roles_and_responsibilities: 'Global supplier direct procurement, SAP Ariba digital contracts, supplier self-service portal, tier-1 vendor risk scoring, and raw material index tracking.',
            headcount_oversight: 8,
            budget_oversight: 31000000,
            direct_reports: [
              {
                ...getPersonSummary('E1053', 'E4'),
                role_focus: 'Supplier Portal & Invoice Automation Delivery',
                projects: [getProjectSummary('P-PRO-01'), getProjectSummary('P-PRO-03')].filter(Boolean),
                direct_reports: [
                  {
                    ...getPersonSummary('E1054', 'E5'),
                    role_focus: 'Full-Stack Portal Development & React Web',
                    projects: [getProjectSummary('P-PRO-01')].filter(Boolean),
                    direct_reports: []
                  },
                  {
                    ...getPersonSummary('E1056', 'E5'),
                    role_focus: 'Backend Microservices & S/4 AP Automation',
                    projects: [getProjectSummary('P-PRO-03')].filter(Boolean),
                    direct_reports: []
                  }
                ]
              },
              {
                ...getPersonSummary('E1051', 'E4'),
                role_focus: 'Strategic Direct Materials & Supplier Risk',
                projects: [getProjectSummary('P-PRO-02'), getProjectSummary('P-PRO-05')].filter(Boolean),
                direct_reports: [
                  {
                    ...getPersonSummary('E1055', 'E5'),
                    role_focus: 'SAP Ariba Contracts & Sourcing Events',
                    projects: [getProjectSummary('P-PRO-02')].filter(Boolean),
                    direct_reports: []
                  },
                  {
                    ...getPersonSummary('E1058', 'E5'),
                    role_focus: 'Supplier Disruption Risk Machine Learning',
                    projects: [getProjectSummary('P-PRO-05')].filter(Boolean),
                    direct_reports: []
                  }
                ]
              },
              {
                ...getPersonSummary('E1052', 'E4'),
                role_focus: 'Electronics Category & Spend Intelligence',
                projects: [getProjectSummary('P-PRO-04')].filter(Boolean),
                direct_reports: [
                  {
                    ...getPersonSummary('E1057', 'E5'),
                    role_focus: 'Spend Cube Analysis & Maverick Spend Audits',
                    projects: [getProjectSummary('P-PRO-04')].filter(Boolean),
                    direct_reports: []
                  }
                ]
              }
            ]
          },
          {
            ...getPersonSummary('E1071', 'E3'),
            assigned_domain: 'Sales & Aftersales (SAL)',
            domain_label: 'Commercial Vehicle Sales & Aftersales Operations',
            roles_and_responsibilities: 'Global franchised dealership integration hub, vehicle order-to-delivery lifecycle, Customer 360 CRM, and demand pricing analytics.',
            headcount_oversight: 12,
            budget_oversight: 38000000,
            direct_reports: [
              {
                ...getPersonSummary('E1074', 'E4'),
                role_focus: 'Aftersales Service Portals & Workshop Systems',
                projects: [getProjectSummary('P-SAL-03'), getProjectSummary('P-SAL-04')].filter(Boolean),
                direct_reports: [
                  {
                    ...getPersonSummary('E1075', 'E5'),
                    role_focus: 'Service Process Optimization & Warranty Claims',
                    projects: [],
                    direct_reports: []
                  },
                  {
                    ...getPersonSummary('E1076', 'E5'),
                    role_focus: 'Workshop Repair Scheduling & Parts Catalog',
                    projects: [getProjectSummary('P-SAL-03')].filter(Boolean),
                    direct_reports: []
                  },
                  {
                    ...getPersonSummary('E1079', 'E5'),
                    role_focus: 'Fleet Telematics Cloud Ingestion (CAN-Bus)',
                    projects: [getProjectSummary('P-SAL-04')].filter(Boolean),
                    direct_reports: []
                  }
                ]
              },
              {
                ...getPersonSummary('E1072', 'E4'),
                role_focus: 'Franchised Dealer Network & Order Execution',
                projects: [getProjectSummary('P-SAL-01'), getProjectSummary('P-SAL-06')].filter(Boolean),
                direct_reports: [
                  {
                    ...getPersonSummary('E1077', 'E5'),
                    role_focus: 'Dealer Management Platform Architecture',
                    projects: [getProjectSummary('P-SAL-01')].filter(Boolean),
                    direct_reports: []
                  },
                  {
                    ...getPersonSummary('E1078', 'E5'),
                    role_focus: 'Dealer Portal Frontend & Quote Builder',
                    projects: [getProjectSummary('P-SAL-01')].filter(Boolean),
                    direct_reports: []
                  },
                  {
                    ...getPersonSummary('E1073', 'E5'),
                    role_focus: 'Regional Commercial Sales Management',
                    projects: [],
                    direct_reports: []
                  }
                ]
              },
              {
                ...getPersonSummary('E1080', 'E4'),
                role_focus: 'Sales Analytics & Customer 360 Insights',
                projects: [getProjectSummary('P-SAL-02'), getProjectSummary('P-SAL-05')].filter(Boolean),
                direct_reports: [
                  {
                    ...getPersonSummary('E1081', 'E5'),
                    role_focus: 'CRM Data Engineering & Pipeline Sync',
                    projects: [getProjectSummary('P-SAL-02')].filter(Boolean),
                    direct_reports: []
                  },
                  {
                    ...getPersonSummary('E1082', 'E5'),
                    role_focus: 'Demand Forecasting & Market Pricing Models',
                    projects: [getProjectSummary('P-SAL-05')].filter(Boolean),
                    direct_reports: []
                  }
                ]
              }
            ]
          },
          {
            ...getPersonSummary('E1083', 'E2'),
            assigned_domain: 'Human Resources (HR)',
            domain_label: 'People & Culture and HR Systems',
            roles_and_responsibilities: 'Corporate identity governance, SuccessFactors HR cloud core, organizational talent development, and engineering mobility.',
            headcount_oversight: 4,
            budget_oversight: 6000000,
            direct_reports: [
              {
                ...getPersonSummary('E1084', 'E4'),
                role_focus: 'Global HR Operations & People Programs',
                projects: [],
                direct_reports: []
              },
              {
                ...getPersonSummary('E1085', 'E4'),
                role_focus: 'SAP SuccessFactors Core Architecture',
                projects: [getProjectSummary('P-HR-01')].filter(Boolean),
                direct_reports: [
                  {
                    ...getPersonSummary('E1086', 'E5'),
                    role_focus: 'SuccessFactors Employee Central & Integration',
                    projects: [getProjectSummary('P-HR-01')].filter(Boolean),
                    direct_reports: []
                  }
                ]
              }
            ]
          }
        ]
      }
    ];

    // Summary KPIs
    const hierarchySummary = {
      e1_count: levelHierarchy.E1.members.length,
      e2_count: levelHierarchy.E2.members.length,
      e3_count: levelHierarchy.E3.members.length,
      e4_count: levelHierarchy.E4.members.length,
      e5_count: levelHierarchy.E5.members.length,
      total_workforce: PEOPLE.length,
      total_portfolio_projects: PROJECTS.length
    };

    res.json({
      summary: hierarchySummary,
      levels: levelHierarchy,
      trees: reportingTrees
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Helper to resolve relevant Jira stories and issues for an employee
 */
function resolvePersonJiraIssues(person, userAllocs, PROJECTS) {
  const projIds = (userAllocs || []).map(a => a.project_id);
  const directIssues = [];
  const projectIssues = [];

  PROJECTS.forEach(pr => {
    const issues = pr.sources?.jira?.issues || [];
    issues.forEach(iss => {
      const issueObj = {
        key: iss.key,
        jira_project_key: iss.jira_project_key || pr.jira?.project_key || 'CYB',
        project_id: pr.project_id,
        project_name: pr.name,
        issue_type: iss.issue_type || 'Story',
        summary: iss.summary,
        description: iss.description || '',
        status: iss.status || 'Done',
        priority: iss.priority || 'Medium',
        story_points: iss.story_points || 3,
        sprint_name: iss.sprint_id ? iss.sprint_id.replace(/^SPRINT-/, '') : (pr.jira?.active_sprint?.name || 'Sprint 24.3'),
        assignee_id: iss.assignee_person_id || person.person_id,
        assignee_name: person.name,
        board_url: pr.jira?.board_url || `https://autonova.atlassian.net/jira/software/projects/${pr.jira?.project_key || 'CYB'}/boards/101`
      };

      if (iss.assignee_person_id === person.person_id || iss.reporter_person_id === person.person_id) {
        directIssues.push(issueObj);
      } else if (projIds.includes(pr.project_id)) {
        projectIssues.push(issueObj);
      }
    });
  });

  if (directIssues.length > 0) return directIssues;

  if (projectIssues.length > 0) {
    const hash = person.person_id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const count = 8;
    const startIdx = hash % Math.max(1, projectIssues.length - count);
    return projectIssues.slice(startIdx, startIdx + count).map(iss => ({
      ...iss,
      assignee_name: person.name,
      assignee_id: person.person_id
    }));
  }

  return [];
}

/**
 * GET /api/enterprise/workforce
 * Workforce Intelligence: Allocation distribution, Key Person Risk (SPOF), Engineering Velocity & Skills
 */
router.get('/workforce', (req, res, next) => {
  try {
    const { PEOPLE, ALLOCATIONS, TEAMS } = require('../services/datasetLoader');

    const peopleProfiles = PEOPLE.map(p => {
      const userAllocs = ALLOCATIONS.filter(a => a.person_id === p.person_id).map(a => {
        const proj = PROJECTS.find(pr => pr.project_id === a.project_id);
        return {
          project_id: a.project_id,
          project_name: proj?.name || a.project_id,
          department: proj?.department || 'Engineering',
          role_on_project: a.role_on_project,
          allocation_pct: parseInt(a.allocation_pct, 10) || 0,
          criticality: proj?.business_criticality || 'medium'
        };
      });

      const totalPct = userAllocs.reduce((sum, a) => sum + a.allocation_pct, 0);
      const isLead = PROJECTS.filter(pr => 
        pr.tech_lead?.person_id === p.person_id || 
        pr.business_owner?.person_id === p.person_id ||
        userAllocs.some(a => a.project_id === pr.project_id && (a.role_on_project || '').toLowerCase().includes('lead'))
      );
      
      // Determine Key Person Risk (Single Point of Failure)
      const criticalProjectsCount = userAllocs.filter(a => a.criticality === 'critical' || a.criticality === 'high').length;
      const isSinglePointOfFailure = isLead.length >= 2 || (criticalProjectsCount >= 2 && totalPct >= 80);
      const effectiveLeadCount = Math.max(isLead.length, isSinglePointOfFailure ? Math.max(1, criticalProjectsCount) : 0);

      // Engineering Activity Score (GitHub commits + Jira issues resolved)
      let githubCommits = 0;
      PROJECTS.forEach(pr => {
        const gh = pr.sources?.github || [];
        gh.forEach(repo => {
          (repo.commits || []).forEach(c => {
            if (c.author_person_id === p.person_id) githubCommits++;
          });
        });
      });

      const personJiraIssues = resolvePersonJiraIssues(p, userAllocs, PROJECTS);
      const jiraResolved = personJiraIssues.filter(iss => iss.status === 'Done').length;

      // Realistic diversified telemetry based on role, department, and ID hash
      const idNum = parseInt((p.person_id || '').replace(/\D/g, '') || '1000', 10);
      const realisticCommits = githubCommits > 0 
        ? githubCommits 
        : (((idNum * 19 + 29) % 87) + 18); // range 18 - 104 commits
      const realisticJiraResolved = (jiraResolved > 0)
        ? jiraResolved
        : (((idNum * 13 + 17) % 29) + 7); // range 7 - 35 issues

      // Inferred Skills based on job title, platform, and project participation
      const skills = [];
      const titleLower = (p.job_title || '').toLowerCase();
      const domainLower = (p.domain_or_platform || '').toLowerCase();
      
      if (titleLower.includes('cloud') || titleLower.includes('azure') || domainLower.includes('azure')) skills.push('Azure Landing Zones', 'ARM / Bicep', 'Azure Kubernetes (AKS)');
      if (titleLower.includes('aws') || domainLower.includes('aws')) skills.push('AWS Cloud', 'Lambda', 'Amazon EKS');
      if (titleLower.includes('sap') || titleLower.includes('fico') || titleLower.includes('rise')) skills.push('SAP S/4HANA', 'SAP BTP', 'ABAP / Cloud CAP');
      if (titleLower.includes('security') || titleLower.includes('soc') || titleLower.includes('iam') || domainLower.includes('cyb')) skills.push('TISAX Compliance', 'SIEM Telemetry', 'OAuth2 / MTLS', 'Vulnerability Scans');
      if (titleLower.includes('developer') || titleLower.includes('engineer') || titleLower.includes('backend')) skills.push('Java 21 / Spring Boot', 'Node.js', 'PostgreSQL', 'Docker');
      if (titleLower.includes('data') || titleLower.includes('analytics') || titleLower.includes('ml')) skills.push('Snowflake EDW', 'Apache Kafka', 'PySpark', 'Databricks');
      if (titleLower.includes('product') || titleLower.includes('owner') || titleLower.includes('lead')) skills.push('Agile Delivery', 'Jira Architecture', 'RACI Governance');
      if (skills.length === 0) skills.push('Enterprise Solutions Architecture', 'Cross-Domain Integration');

      return {
        person_id: p.person_id,
        name: p.name,
        job_title: p.job_title,
        department: p.domain_or_platform || 'Corporate Engineering',
        location: p.location,
        email: p.email,
        total_allocation_pct: totalPct,
        allocation_status: totalPct > 100 ? 'Over-Allocated' : (totalPct >= 70 ? 'Optimal' : 'Available Capacity'),
        key_person_risk: isSinglePointOfFailure,
        leadership_roles_count: effectiveLeadCount,
        github_commits: realisticCommits,
        jira_issues_resolved: realisticJiraResolved,
        jira_issues: personJiraIssues,
        skills: [...new Set(skills)],
        allocations: userAllocs
      };
    });

    const overAllocated = peopleProfiles.filter(p => p.total_allocation_pct > 100);
    const availableCapacity = peopleProfiles.filter(p => p.total_allocation_pct < 70);
    const spofRisks = peopleProfiles.filter(p => p.key_person_risk);

    res.json({
      metrics: {
        total_employees: peopleProfiles.length,
        over_allocated_count: overAllocated.length,
        optimal_allocated_count: peopleProfiles.length - overAllocated.length - availableCapacity.length,
        available_capacity_count: availableCapacity.length,
        key_person_risk_count: spofRisks.length,
        average_allocation_pct: Math.round(peopleProfiles.reduce((sum, p) => sum + p.total_allocation_pct, 0) / peopleProfiles.length)
      },
      key_person_risks: spofRisks,
      profiles: peopleProfiles
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/enterprise/workforce/:personId/jira-issues
 * Returns relevant Jira stories and delivery issues for a specific person
 */
router.get('/workforce/:personId/jira-issues', (req, res, next) => {
  try {
    const { personId } = req.params;
    const { PEOPLE, ALLOCATIONS } = require('../services/datasetLoader');
    const person = PEOPLE.find(p => p.person_id === personId || p.name.toLowerCase() === personId.toLowerCase());
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }
    const userAllocs = ALLOCATIONS.filter(a => a.person_id === person.person_id);
    const issues = resolvePersonJiraIssues(person, userAllocs, PROJECTS);
    res.json({
      person: {
        person_id: person.person_id,
        name: person.name,
        job_title: person.job_title,
        department: person.domain_or_platform
      },
      total_issues: issues.length,
      done_count: issues.filter(i => i.status === 'Done').length,
      in_progress_count: issues.filter(i => i.status === 'In Progress').length,
      issues
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/enterprise/data-lineage
 * Enterprise Data Catalog & End-to-End Lineage Flow (Automobile Context)
 */
router.get('/data-lineage', (req, res, next) => {
  try {
    const DATASETS_CATALOG = [
      {
        id: 'DS-FIN-GL',
        name: 'SAP S/4HANA General Ledger & Corporate Journal',
        domain: 'Finance',
        producer_project_id: 'P-FIN-01',
        producer_name: 'SAP S/4HANA Finance Core',
        data_owner: 'Lena Fischer (Head of Group Accounting)',
        data_steward: 'Thomas Albrecht (Group Controller)',
        classification: 'Confidential / SOX Regulated',
        contains_pii: false,
        retention_months: 120,
        storage_engine: 'SAP HANA Cloud (Columnar In-Memory)',
        update_frequency: 'Continuous / Hourly Micro-Batch',
        protocol: 'SAP OData v4 & RFC Connectors',
        consumers: [
          { project_id: 'P-DTFS-01', name: 'Loan Origination Platform', reason: 'Monthly credit clearing, bad-debt provisioning, and balance sheet reconciliation.' },
          { project_id: 'P-FIN-02', name: 'Corporate Treasury & Cash Management', reason: 'Daily liquidity pooling and currency hedging calculations.' },
          { project_id: 'P-PRO-01', name: 'Supplier Portal', reason: 'Three-way invoice matching and accounts payable release.' }
        ]
      },
      {
        id: 'DS-IOT-TELEMETRY',
        name: 'Connected Vehicle CAN-Bus & Diagnostic Telemetry Stream',
        domain: 'Cyber Security',
        producer_project_id: 'P-SAL-01',
        producer_name: 'Connected Vehicle Telematics Gateway',
        data_owner: 'Vikram Rao (Director of Integration & IoT)',
        data_steward: 'Dr. Elena Rostova (Group CTO)',
        classification: 'Restricted / TISAX Level 3',
        contains_pii: true,
        retention_months: 84,
        storage_engine: 'Apache Kafka & Azure Event Hubs (12,000 eps)',
        update_frequency: 'Sub-Second Real-Time Streaming',
        protocol: 'MQTT over TLS 1.3 -> Kafka Avro Stream',
        consumers: [
          { project_id: 'P-CYB-01', name: 'Security Log Monitoring (SIEM)', reason: 'Real-time vehicle security anomaly detection & ECU intrusion prevention.' },
          { project_id: 'P-SAL-02', name: 'Dealer Workshop Diagnostic Hub', reason: 'Predictive maintenance alerts, battery health, and warranty diagnostic codes.' }
        ]
      },
      {
        id: 'DS-DTFS-LOANS',
        name: 'Commercial Fleet Lending & Lease Contracts Register',
        domain: 'DTFS - Truck Financial Services',
        producer_project_id: 'P-DTFS-01',
        producer_name: 'Loan Origination Platform',
        data_owner: 'Stephanie Krueger (Head of Retail Lending)',
        data_steward: 'Alexander Beck (Loan Platform Tech Lead)',
        classification: 'Confidential / GDPR & Banking Secrecy',
        contains_pii: true,
        retention_months: 120,
        storage_engine: 'Azure Database for PostgreSQL Flexible (v16.2)',
        update_frequency: 'Real-Time Event Driven',
        protocol: 'RESTful JSON API with MTLS & OAuth2',
        consumers: [
          { project_id: 'P-DTFS-02', name: 'Credit Risk Decision Engine', reason: 'Scoring applicant creditworthiness and collateral residual value valuation.' },
          { project_id: 'P-FIN-01', name: 'SAP S/4HANA Finance Core', reason: 'Monthly asset depreciation, interest accrual, and leasing portfolio capitalization.' }
        ]
      },
      {
        id: 'DS-PRO-SUPPLIERS',
        name: 'Supplier Master Directory, EDI Orders & Lead Times',
        domain: 'Procurement',
        producer_project_id: 'P-PRO-01',
        producer_name: 'Supplier Portal',
        data_owner: 'Andreas Schneider (VP Strategic Sourcing)',
        data_steward: 'Anjali Kapoor (Full-stack Developer)',
        classification: 'Internal / Commercial Sensitive',
        contains_pii: false,
        retention_months: 60,
        storage_engine: 'Azure PostgreSQL Flexible & SAP Ariba EDI',
        update_frequency: 'Hourly Batch & AS2 EDI Streams',
        protocol: 'AS2 / EDIFACT / HTTPS REST',
        consumers: [
          { project_id: 'P-PRO-02', name: 'Strategic Sourcing Intelligence', reason: 'Spend analytics, supplier risk scoring, and raw material index tracking.' },
          { project_id: 'P-SAL-02', name: 'Dealer Workshop Diagnostic Hub', reason: 'Spare parts stock availability, factory order ETA, and dealer inventory replenishment.' }
        ]
      },
      {
        id: 'DS-CYB-AUDIT',
        name: 'Enterprise Unified Audit Logs & SOC Security Telemetry',
        domain: 'Cyber Security',
        producer_project_id: 'P-CYB-01',
        producer_name: 'Security Log Monitoring (SIEM)',
        data_owner: 'Claudia Lang (Head of CISO Office)',
        data_steward: 'Rahul Verma (SOC Lead)',
        classification: 'Restricted / Forensic Audit Trail',
        contains_pii: true,
        retention_months: 84,
        storage_engine: 'Azure Log Analytics & Microsoft Sentinel',
        update_frequency: 'Continuous Real-Time Ingest',
        protocol: 'Syslog-ng / Event Hub / WEC Agent',
        consumers: [
          { project_id: 'P-CYB-03', name: 'Identity & Access Assurance (IAM)', reason: 'Impossible travel detection, brute force mitigation, and privileged credential monitoring.' },
          { project_id: 'P-FIN-01', name: 'SAP S/4HANA Finance Core', reason: 'SOX regulatory audit compliance and segregated access log verification.' }
        ]
      },
      {
        id: 'DS-SAL-DEALER-ORDERS',
        name: 'Global Dealer Vehicle Orders, Allocations & Factory Build Slots',
        domain: 'Sales & Aftersales',
        producer_project_id: 'P-SAL-03',
        producer_name: 'Dealer Management Integration Hub',
        data_owner: 'Frank Dietz (VP Sales Operations)',
        data_steward: 'Laura Bennett (Dealer Network Manager)',
        classification: 'Confidential / Commercial Sensitive',
        contains_pii: true,
        retention_months: 84,
        storage_engine: 'Azure Cosmos DB & PostgreSQL Flexible',
        update_frequency: 'Real-Time Event Stream',
        protocol: 'HTTPS RESTful Webhooks & Kafka Topic',
        consumers: [
          { project_id: 'P-FIN-01', name: 'SAP S/4HANA Finance Core', reason: 'Automated factory build slot revenue recognition and VAT invoice issuance.' },
          { project_id: 'P-PRO-01', name: 'Supplier Portal', reason: 'Just-in-Time tier-1 supplier component release schedules for plant assembly lines.' },
          { project_id: 'P-DTFS-01', name: 'Loan Origination Platform', reason: 'Immediate floorplan loan financing activation upon dealer delivery.' }
        ]
      },
      {
        id: 'DS-HR-EMPLOYEE-ROSTER',
        name: 'Corporate Identity Roster, Organization Hierarchy & RBAC Entitlements',
        domain: 'Human Resources (shared function)',
        producer_project_id: 'P-HR-01',
        producer_name: 'HR Core & Workday Directory Hub',
        data_owner: 'Birgit Sauer (Director People & Culture)',
        data_steward: 'Christoph Reiter (HR Systems Lead)',
        classification: 'Restricted / GDPR Regulated PII',
        contains_pii: true,
        retention_months: 120,
        storage_engine: 'Workday Cloud & Azure Entra ID Synced Directory',
        update_frequency: 'Near-Real-Time SCIM Directory Sync',
        protocol: 'SCIM 2.0 & Microsoft Graph API',
        consumers: [
          { project_id: 'P-CYB-03', name: 'Identity & Access Assurance (IAM)', reason: 'Automated Day-1 employee RBAC onboarding and immediate offboarding deprovisioning.' },
          { project_id: 'P-FIN-04', name: 'Cost Center & Corporate Payroll Accounting', reason: 'Monthly employee compensation allocation across project cost centers.' },
          { project_id: 'P-PRO-04', name: 'Procurement Approval Limit Engine', reason: 'Enforcing executive purchase approval hierarchies based on E1-E5 grade.' }
        ]
      },
      {
        id: 'DS-SAL-OTA-PACKAGES',
        name: 'Vehicle Over-the-Air (OTA) Firmware & ECU Cryptographic Calibration Binaries',
        domain: 'Sales & Aftersales',
        producer_project_id: 'P-SAL-04',
        producer_name: 'Fleet OTA Update Management Server',
        data_owner: 'Vikram Rao (Director of Integration & IoT)',
        data_steward: 'Dr. Elena Rostova (Group CTO)',
        classification: 'Restricted / Automotive Safety Critical (ISO 26262)',
        contains_pii: false,
        retention_months: 180,
        storage_engine: 'Azure Blob Storage (Immutable WORM) & Azure Key Vault HSM',
        update_frequency: 'Bi-Weekly Release Sprints & Security Emergency Hotfixes',
        protocol: 'TLS 1.3 Signed Artifact Pipeline with HSM Signature Verification',
        consumers: [
          { project_id: 'P-CYB-02', name: 'Vulnerability & Patch Management', reason: 'Pre-flight binary vulnerability scanning, SBOM attestation, and CVE verification.' },
          { project_id: 'P-SAL-01', name: 'Connected Vehicle Telematics Gateway', reason: 'Targeted broadcast of signed update packages to vehicle telematics units (TCUs).' }
        ]
      },
      {
        id: 'DS-DTFS-RESIDUAL-RISK',
        name: 'Commercial Truck Secondary Market Valuation & Residual Value Projections',
        domain: 'DTFS - Truck Financial Services',
        producer_project_id: 'P-DTFS-03',
        producer_name: 'Fleet Residual Risk Valuation Engine',
        data_owner: 'Stephanie Krueger (Head of Retail Lending)',
        data_steward: 'Sophie Lenz (Head of Credit Risk Analytics)',
        classification: 'Confidential / Proprietary Actuarial Model',
        contains_pii: false,
        retention_months: 120,
        storage_engine: 'Snowflake Data Warehouse & Azure Machine Learning',
        update_frequency: 'Weekly Market Calibrations & Monthly Index Refresh',
        protocol: 'Snowflake JDBC & Python REST Microservice',
        consumers: [
          { project_id: 'P-DTFS-01', name: 'Loan Origination Platform', reason: 'Dynamic end-of-lease balloon payment and monthly lease amortization quoting.' },
          { project_id: 'P-FIN-02', name: 'Corporate Treasury & Cash Management', reason: 'Forecasting portfolio asset liquidation cash flow and credit reserve requirements.' }
        ]
      },
      {
        id: 'DS-PRO-BOM-CATALOG',
        name: 'Vehicle Engineering Bill of Materials (BOM) & Sourcing Price Matrix',
        domain: 'Procurement',
        producer_project_id: 'P-PRO-03',
        producer_name: 'Sourcing BOM Cost Analytics Engine',
        data_owner: 'Andreas Schneider (VP Strategic Sourcing)',
        data_steward: 'Jan Dietrich (Supplier Portal Product Owner)',
        classification: 'Confidential / Commercial Sourcing',
        contains_pii: false,
        retention_months: 96,
        storage_engine: 'Azure Database for PostgreSQL & SAP S/4HANA MM',
        update_frequency: 'Daily Batch Sync & Commodity Price Tickers',
        protocol: 'PostgreSQL Direct Connector & HTTPS REST',
        consumers: [
          { project_id: 'P-FIN-01', name: 'SAP S/4HANA Finance Core', reason: 'Product costing calculation, standard vs actual cost variances.' },
          { project_id: 'P-PRO-01', name: 'Supplier Portal', reason: 'Publishing negotiated parts price catalogs to tier-1 suppliers.' }
        ]
      }
    ];

    // Enterprise Teams Taxonomy: Platform vs Application vs Infrastructure
    const TEAMS_TAXONOMY = {
      summary: {
        platform_teams_count: 4,
        application_teams_count: 6,
        infrastructure_teams_count: 4,
        total_teams: 14
      },
      categories: [
        {
          id: 'PLATFORM_TEAMS',
          title: 'Platform Engineering Teams (Shared Services Foundation)',
          badge_color: 'sky',
          role_definition: 'Designs, provisions, and maintains multi-tenant cloud foundations, landing zones, shared event buses (Kafka), API gateways, and CI/CD pipelines used by all application engineering squads.',
          key_responsibilities: [
            'Provisions standardized Azure/AWS Landing Zones and Terraform IaC modules',
            'Manages enterprise Apache Kafka / Azure Event Hubs streaming pipelines',
            'Enforces Zero Trust IAM, Azure Entra ID SSO, and automated secret rotations',
            'Builds centralized observability exporters (Prometheus, OpenTelemetry, Grafana)'
          ],
          teams: [
            { id: 'TEAM-PLT-01', name: 'Cloud Landing Zone & Azure Platform Team', lead: 'Markus Bauer (Director Cloud Infrastructure)', members_count: 14, primary_tech: ['Azure', 'Terraform', 'AKS v1.28', 'Bicep'] },
            { id: 'TEAM-PLT-02', name: 'Enterprise Data Fabric & Kafka Streaming Team', lead: 'Vikram Rao (Director Integration & IoT)', members_count: 11, primary_tech: ['Apache Kafka', 'Event Hubs', 'Spark', 'Snowflake'] },
            { id: 'TEAM-PLT-03', name: 'IAM & Security Platform Team', lead: 'Claudia Lang (Head of CISO Office)', members_count: 9, primary_tech: ['Azure Entra ID', 'HashiCorp Vault', 'OAuth2', 'mTLS'] },
            { id: 'TEAM-PLT-04', name: 'DevOps & Shared CI/CD Pipeline Team', lead: 'Daniel Hoffmann (AKS Platform Lead)', members_count: 8, primary_tech: ['GitHub Actions', 'SonarQube', 'ArgoCD', 'Snyk'] }
          ]
        },
        {
          id: 'APPLICATION_TEAMS',
          title: 'Application Engineering Teams (Domain Feature Delivery)',
          badge_color: 'indigo',
          role_definition: 'Builds end-user business applications, customer-facing portals, automotive telematics microservices, and financial transaction engines aligned directly to domain product roadmaps.',
          key_responsibilities: [
            'Develops sprint deliverables, user stories, and Jira backlog features',
            'Designs domain microservices (Spring Boot 3, FastAPI, Node.js) and React web interfaces',
            'Implements domain business logic, loan underwriting algorithms, and workshop diagnostic tools',
            'Conducts user acceptance testing (UAT) with business stakeholders and product owners'
          ],
          teams: [
            { id: 'TEAM-APP-01', name: 'SAP S/4HANA Finance & Accounting App Team', lead: 'Lena Fischer (Head of Group Accounting)', members_count: 16, primary_tech: ['SAP S/4HANA', 'ABAP Cloud', 'SAP Fiori', 'SAP HANA'] },
            { id: 'TEAM-APP-02', name: 'Retail Lending & Fleet Origination App Team', lead: 'Stephanie Krueger (Head of Retail Lending)', members_count: 15, primary_tech: ['Spring Boot 3', 'React 18', 'PostgreSQL', 'Camunda'] },
            { id: 'TEAM-APP-03', name: 'Connected Vehicle & Diagnostics App Team', lead: 'Gerhard Lutz (Head of Aftersales)', members_count: 18, primary_tech: ['Python FastAPI', 'MQTT', 'Go', 'React'] },
            { id: 'TEAM-APP-04', name: 'Supplier Portal & Sourcing App Team', lead: 'Andreas Schneider (VP Strategic Sourcing)', members_count: 12, primary_tech: ['Node.js 20', 'Next.js', 'PostgreSQL', 'EDIFACT'] },
            { id: 'TEAM-APP-05', name: 'Dealer Management Integration Hub Team', lead: 'Frank Dietz (VP Sales Operations)', members_count: 14, primary_tech: ['FastAPI', 'Cosmos DB', 'GraphQL', 'Vite'] },
            { id: 'TEAM-APP-06', name: 'HR Core & Workday Directory App Team', lead: 'Birgit Sauer (Director People & Culture)', members_count: 8, primary_tech: ['Workday RaaS', 'SCIM 2.0', 'Azure Logic Apps'] }
          ]
        },
        {
          id: 'INFRASTRUCTURE_TEAMS',
          title: 'Infrastructure & SRE Teams (Reliability, Network & 24/7 Operations)',
          badge_color: 'emerald',
          role_definition: 'Guarantees 99.95% production uptime, manages physical/virtual networking, database clustering and disaster recovery (DR) failovers, and operates 24/7 SOC incident response.',
          key_responsibilities: [
            'Conducts semi-annual Disaster Recovery (DR) simulations with < 15 min RTO targets',
            'Tunes database performance, pgvector connection pools, and multi-region replication',
            'Maintains plant network security perimeters, industrial DMZs, and ExpressRoute circuits',
            'Provides 24/7 on-call tier-1 incident remediation and root cause analysis (RCA)'
          ],
          teams: [
            { id: 'TEAM-INF-01', name: '24/7 Site Reliability Engineering (SRE) Team', lead: 'Daniel Hoffmann (AKS Platform Lead)', members_count: 12, primary_tech: ['Kubernetes SRE', 'Grafana', 'PagerDuty', 'Azure Monitor'] },
            { id: 'TEAM-INF-02', name: 'Database Operations & pgvector Cluster Team', lead: 'Tom Becker (Azure Landing Zone Architect)', members_count: 7, primary_tech: ['PostgreSQL 17', 'pgvector', 'Redis 7', 'PgBouncer'] },
            { id: 'TEAM-INF-03', name: 'Plant Network & Industrial DMZ Edge Team', lead: 'Priya Nair (Cloud Network Engineer)', members_count: 10, primary_tech: ['Cisco ACI', 'Palo Alto WAF', 'Azure ExpressRoute', 'IPsec'] },
            { id: 'TEAM-INF-04', name: 'Cyber Defense & SOC Incident Response Team', lead: 'Claudia Lang (Head of CISO Office)', members_count: 11, primary_tech: ['Microsoft Sentinel', 'Splunk SIEM', 'CrowdStrike', 'SOAR'] }
          ]
        }
      ],
      raci_matrix: [
        {
          lifecycle_phase: '1. Architecture & Cloud Landing Zone Design',
          platform_role: 'Accountable (A) & Responsible (R)',
          platform_desc: 'Designs multi-tenant architecture, network topology, and security guardrails.',
          app_role: 'Consulted (C)',
          app_desc: 'Specifies functional requirements, performance SLAs, and data schema models.',
          infra_role: 'Consulted (C)',
          infra_desc: 'Validates sizing, disaster recovery topologies, and compliance certifications (TISAX).'
        },
        {
          lifecycle_phase: '2. Sprint Delivery & Domain Microservice Coding',
          platform_role: 'Informed (I) / Consulted (C)',
          platform_desc: 'Provides base Docker images, CI/CD templates, and shared library dependencies.',
          app_role: 'Accountable (A) & Responsible (R)',
          app_desc: 'Builds business logic, automated unit/integration tests, and user interfaces.',
          infra_role: 'Informed (I)',
          infra_desc: 'Monitors resource utilization trends during dev/staging load simulations.'
        },
        {
          lifecycle_phase: '3. CI/CD Deployment & Production Release Gate',
          platform_role: 'Responsible (R)',
          platform_desc: 'Operates automated GitHub Actions pipelines, security scanning (Sonar/Snyk), and canary gates.',
          app_role: 'Responsible (R)',
          app_desc: 'Performs smoke testing, verifies database migration scripts, and signs off release.',
          infra_role: 'Accountable (A)',
          infra_desc: 'Authorizes production change requests (CAB) and executes rolling zero-downtime updates.'
        },
        {
          lifecycle_phase: '4. 24/7 Production Run, SLA & Incident Remediation',
          platform_role: 'Consulted (C)',
          platform_desc: 'Assists with platform-level runtime patches and Kubernetes control plane upgrades.',
          app_role: 'Responsible (R - Tier 3)',
          app_desc: 'Provides Tier-3 application bug fix escalations and hotfix releases.',
          infra_role: 'Accountable (A) & Responsible (R - Tier 1/2)',
          infra_desc: 'Primary 24/7 PagerDuty on-call response, node auto-recovery, and failover coordination.'
        }
      ]
    };

    // Compute Graph Nodes & Links for Lineage Canvas
    const nodes = [];
    const links = [];
    const nodeIds = new Set();

    DATASETS_CATALOG.forEach(ds => {
      // Producer Node
      if (!nodeIds.has(ds.producer_project_id)) {
        nodes.push({ id: ds.producer_project_id, name: ds.producer_name, type: 'PRODUCER', domain: ds.domain });
        nodeIds.add(ds.producer_project_id);
      }
      // Dataset Node
      if (!nodeIds.has(ds.id)) {
        nodes.push({ id: ds.id, name: ds.name, type: 'DATASET', domain: ds.domain, classification: ds.classification });
        nodeIds.add(ds.id);
      }
      // Link Producer -> Dataset
      links.push({ source: ds.producer_project_id, target: ds.id, label: 'Publishes', protocol: ds.protocol });

      // Consumers
      ds.consumers.forEach(cons => {
        if (!nodeIds.has(cons.project_id)) {
          nodes.push({ id: cons.project_id, name: cons.name, type: 'CONSUMER', domain: ds.domain });
          nodeIds.add(cons.project_id);
        }
        links.push({ source: ds.id, target: cons.project_id, label: 'Consumes', reason: cons.reason });
      });
    });

    res.json({
      total_datasets: DATASETS_CATALOG.length,
      datasets: DATASETS_CATALOG,
      teams_taxonomy: TEAMS_TAXONOMY,
      lineage_graph: { nodes, links }
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/enterprise/onboarding
 * Employee Onboarding Hub & Company Wiki: 30 Full HR/Workplace Policy Documents
 */
router.get('/onboarding', (req, res, next) => {
  try {
    const { ONBOARDING_DOCUMENTS } = require('../services/onboardingPolicies');
    
    // Group documents by category
    const categoriesMap = {};
    ONBOARDING_DOCUMENTS.forEach(doc => {
      if (!categoriesMap[doc.category]) {
        categoriesMap[doc.category] = [];
      }
      categoriesMap[doc.category].push(doc);
    });

    const categoryList = Object.keys(categoriesMap).map(catName => ({
      name: catName,
      count: categoriesMap[catName].length,
      documents: categoriesMap[catName]
    }));

    const promptChips = [
      'What is our hybrid 3:2 work from home policy?',
      'When is the monthly payroll cut-off date and salary disbursement?',
      'How many annual vacation days do I get and how does carryover work?',
      'What is the employee home office ergonomics stipend amount?',
      'How does the annual professional development training budget work?',
      'What is the parental and paternity leave allowance?',
      'What hardware and laptops are issued to engineering and business staff?',
      'What are the guidelines for on-call duty (Rufbereitschaft) allowances?'
    ];

    res.json({
      summary: {
        total_documents: ONBOARDING_DOCUMENTS.length,
        categories_count: categoryList.length,
        verified_status: '100% Policy Attested (2026)',
        governance_owner: 'People & Culture and Executive Board'
      },
      categories: categoryList,
      documents: ONBOARDING_DOCUMENTS,
      prompt_chips: promptChips
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/enterprise/tech-stack
 * Enterprise Tech Stack Observatory & Standardization Metrics
 */
router.get('/tech-stack', (req, res, next) => {
  try {
    const techObservatory = {
      platforms: [
        { name: 'Microsoft Azure Central EU', projects_count: 19, status: 'Strategic Standard', approved_tier: 'Tier 1 Landing Zone' },
        { name: 'SAP RISE Private Cloud', projects_count: 6, status: 'Strategic Standard', approved_tier: 'Enterprise ERP Baseline' },
        { name: 'Amazon Web Services (AWS)', projects_count: 4, status: 'Specialized (IoT/Edge)', approved_tier: 'Connected Vehicle Telematics' },
        { name: 'Hybrid On-Premises DMZ', projects_count: 2, status: 'Legacy Maintenance', approved_tier: 'Plant Manufacturing Systems' }
      ],
      runtimes: [
        { name: 'Azure Kubernetes Service (AKS v1.28)', category: 'Container Orchestration', adoption_count: 18, standard: true },
        { name: 'Java 21 / Spring Boot 3', category: 'Backend Framework', adoption_count: 14, standard: true },
        { name: 'Node.js 20 LTS / Express / Fastify', category: 'Backend Framework', adoption_count: 12, standard: true },
        { name: 'React 18 / Vite / Tailwind', category: 'Frontend Architecture', adoption_count: 16, standard: true },
        { name: 'Python 3.11 / FastAPI / PyTorch', category: 'Data & Machine Learning', adoption_count: 7, standard: true },
        { name: 'Kubernetes v1.22 (EOL)', category: 'Deprecated Runtime', adoption_count: 2, standard: false, warning: 'EOL: Security patch support ended. Upgrade required.' }
      ],
      databases: [
        { name: 'Azure Database for PostgreSQL Flexible (v16.2)', category: 'Relational Database', adoption_count: 15, standard: true },
        { name: 'SAP HANA Cloud (Columnar In-Memory)', category: 'Enterprise ERP Database', adoption_count: 6, standard: true },
        { name: 'Redis 7 (Azure Cache)', category: 'In-Memory Cache & Session', adoption_count: 11, standard: true },
        { name: 'Snowflake Data Cloud', category: 'Enterprise Analytics EDW', adoption_count: 5, standard: true }
      ],
      messaging: [
        { name: 'Apache Kafka / Azure Event Hubs', category: 'Event Streaming', adoption_count: 10, standard: true },
        { name: 'RabbitMQ / Azure Service Bus', category: 'Message Broker', adoption_count: 6, standard: true }
      ],
      security: [
        { name: 'Microsoft Entra ID (Azure AD) + OAuth2', category: 'Identity & Access', adoption_count: 31, standard: true },
        { name: 'HashiCorp Vault', category: 'Secrets Management', adoption_count: 22, standard: true },
        { name: 'TISAX AL3 Network Segmentation', category: 'Automotive Security Standard', adoption_count: 31, standard: true }
      ]
    };

    res.json(techObservatory);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/enterprise/recommend-solution
 * AI Architectural Solution Recommender: Recommends AutoNova blueprint based on existing ADRs and patterns
 */
router.post('/recommend-solution', async (req, res, next) => {
  try {
    const { requirement, domain } = req.body;
    if (!requirement) {
      return res.status(400).json({ error: 'Requirement description is required' });
    }

    const { callChatLLM } = require('../../../agent/llm');

    const prompt = `You are the AutoNova Group Enterprise Architecture Board AI.
An engineer is requesting a recommended architecture solution for a new internal project requirement:
"${requirement}"
Target Domain: ${domain || 'Cross-Domain'}

Based on AutoNova Group's proven technology stack and approved architecture baseline:
- Cloud Platform: Microsoft Azure Central EU (Landing Zone compliant) or SAP BTP
- Runtimes: Java 21 / Spring Boot 3 or Node.js 20 LTS on Azure Kubernetes Service (AKS)
- Data: PostgreSQL Flexible (v16.2), Redis 7, or SAP HANA Cloud
- Event Streaming: Apache Kafka / Azure Event Hubs
- Security: Microsoft Entra ID (OAuth2/MTLS), TISAX Level 3 compliance

Provide a structured, executive architectural recommendation formatted in clean markdown:
1. ### Recommended Architectural Blueprint
2. ### Tech Stack Selection & Justification
3. ### Reusable AutoNova Components & Similar Existing Projects
4. ### Compliance & TISAX Security Considerations
5. ### Next Steps & Confluence ADR Template`;

    const llmRes = await callChatLLM({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 800
    });

    res.json({
      recommendation: llmRes.content || '',
      baseline_patterns: [
        'ADR-001: Cloud-Native Microservices on Azure AKS',
        'ADR-004: Event Streaming via Apache Kafka with Avro Schemas',
        'ADR-008: Zero-Trust Identity Federation via Entra ID'
      ]
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/enterprise/talent-marketplace
 * Internal Talent Marketplace & Smart Position Filling: Matches open roles to existing employees with capacity
 */
router.get('/talent-marketplace', (req, res, next) => {
  try {
    const { PEOPLE, ALLOCATIONS } = require('../services/datasetLoader');

    const OPEN_POSITIONS = [
      {
        id: 'POS-2026-01',
        title: 'Senior Cloud Security Architect',
        department: 'Cyber Security',
        project_id: 'P-CYB-01',
        project_name: 'Security Log Monitoring (SIEM)',
        urgency: 'Critical',
        required_skills: ['Azure Landing Zones', 'TISAX Compliance', 'OAuth2 / MTLS', 'Vulnerability Scans'],
        capacity_needed_pct: 30,
        estimated_contractor_cost_monthly: 14500
      },
      {
        id: 'POS-2026-02',
        title: 'Kafka & Distributed Event Streaming Lead',
        department: 'Sales & Aftersales',
        project_id: 'P-SAL-01',
        project_name: 'Connected Vehicle Telematics Gateway',
        urgency: 'High',
        required_skills: ['Apache Kafka', 'Event Streaming', 'PySpark', 'Docker'],
        capacity_needed_pct: 40,
        estimated_contractor_cost_monthly: 16000
      },
      {
        id: 'POS-2026-03',
        title: 'SAP BTP Integration Specialist',
        department: 'Finance',
        project_id: 'P-FIN-01',
        project_name: 'SAP S/4HANA Finance Core',
        urgency: 'High',
        required_skills: ['SAP S/4HANA', 'SAP BTP', 'ABAP / Cloud CAP'],
        capacity_needed_pct: 25,
        estimated_contractor_cost_monthly: 13500
      },
      {
        id: 'POS-2026-04',
        title: 'Full-Stack Developer (React & Node.js)',
        department: 'Procurement',
        project_id: 'P-PRO-01',
        project_name: 'Supplier Portal',
        urgency: 'Medium',
        required_skills: ['React 18 / Vite / Tailwind', 'Node.js', 'PostgreSQL', 'Docker'],
        capacity_needed_pct: 35,
        estimated_contractor_cost_monthly: 11000
      }
    ];

    // Compute matches from existing 86 employees
    const matchedPositions = OPEN_POSITIONS.map(pos => {
      const candidates = PEOPLE.map(p => {
        const userAllocs = ALLOCATIONS.filter(a => a.person_id === p.person_id);
        const totalAlloc = userAllocs.reduce((sum, a) => sum + (parseInt(a.allocation_pct, 10) || 0), 0);
        const availableBandwidth = Math.max(0, 100 - totalAlloc);

        // Compute skill overlap
        const titleLower = (p.job_title || '').toLowerCase();
        let matchScore = 40; // baseline enterprise knowledge

        pos.required_skills.forEach(skill => {
          const sLower = skill.toLowerCase();
          if (titleLower.includes(sLower.split(' ')[0])) matchScore += 20;
          if (p.domain_or_platform?.toLowerCase() === pos.department.toLowerCase()) matchScore += 15;
        });

        matchScore = Math.min(98, Math.max(50, matchScore));

        return {
          person_id: p.person_id,
          name: p.name,
          job_title: p.job_title,
          department: p.domain_or_platform || 'Engineering',
          current_allocation_pct: totalAlloc,
          available_bandwidth_pct: availableBandwidth,
          match_score: matchScore,
          can_accommodate: availableBandwidth >= pos.capacity_needed_pct,
          recommendation: availableBandwidth >= pos.capacity_needed_pct
            ? `Share internal capacity at ${pos.capacity_needed_pct}% allocation (Saves €${pos.estimated_contractor_cost_monthly.toLocaleString()}/mo)`
            : `Partial internal transfer or reallocate ${pos.capacity_needed_pct - availableBandwidth}% from non-critical sprint.`
        };
      })
      .filter(c => c.match_score >= 65)
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 3);

      return {
        ...pos,
        top_candidates: candidates,
        recommended_action: candidates.some(c => c.can_accommodate)
          ? 'Internal Talent Reallocation (Recommended)'
          : 'External Contractor Sourcing Required'
      };
    });

    const totalPotentialSavingsMonthly = OPEN_POSITIONS.reduce((sum, p) => sum + p.estimated_contractor_cost_monthly, 0);

    res.json({
      summary: {
        open_positions_count: OPEN_POSITIONS.length,
        potential_monthly_cost_savings: totalPotentialSavingsMonthly,
        internal_fillable_rate: '85%'
      },
      positions: matchedPositions
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
