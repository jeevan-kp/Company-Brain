// ============================================================================
// gen_github.js — Source Code, Commits, PRs, Releases & Dependencies Generator
// ============================================================================
const fs = require('fs');
const path = require('path');
const { projects, people, heroProjectIds, rng } = require('./utils');

function generateGitHub() {
    console.log('🐙 Generating GitHub Repos, Commits, PRs & Dependency Manifests...');
    const outDir = path.join(__dirname, '..', '..', 'mock', 'github');
    fs.mkdirSync(outDir, { recursive: true });

    const allRepos = [];

    for (const p of projects) {
        const isHero = heroProjectIds.includes(p.project_id);
        const repoCount = isHero ? 3 : 1;

        for (let rIdx = 1; rIdx <= repoCount; rIdx++) {
            const suffix = rIdx === 1 ? 'core' : (rIdx === 2 ? 'api' : 'frontend');
            const repoSlug = `${p.project_id.toLowerCase()}-${suffix}`;
            const repoId = `autonova-group/${repoSlug}`;

            let primaryLang = 'TypeScript';
            let pkgMgr = 'npm';
            if (p.domain_id === 'FIN') { primaryLang = 'Java'; pkgMgr = 'maven'; }
            else if (p.domain_id === 'CYB') { primaryLang = 'Go'; pkgMgr = 'gomod'; }
            else if (p.domain_id === 'DTFS') { primaryLang = 'Python'; pkgMgr = 'pip'; }

            // Anomaly ANOM-03 on P-CYB-01: primary language is Python/Go, NOT Rust
            if (p.project_id === 'P-CYB-01' && rIdx === 1) {
                primaryLang = 'Python';
                pkgMgr = 'pip';
            }

            // Commits
            const commitCount = isHero ? 45 : 25;
            const commits = [];
            for (let c = 1; c <= commitCount; c++) {
                const dayOffset = commitCount - c;
                // Anomaly ANOM-10: P-SAL-02 commits within last 3 days
                const commitDate = new Date(Date.parse('2026-10-06T12:00:00Z') - (dayOffset * 86400000)).toISOString();
                const hash = `a${c}f90${(c * 1337).toString(16).padStart(5, '0')}${(c * 999).toString(16).padStart(28, '0')}`.slice(0, 40);

                commits.push({
                    hash,
                    repo_id: repoId,
                    author_person_id: p.tech_lead_id,
                    author_name: p.tech_lead_id,
                    message: `feat(${suffix}): optimize ingestion queue handling and connection pooling [commit #${c}]`,
                    committed_at: commitDate,
                    lines_added: 45 + (c * 3),
                    lines_deleted: 12 + (c * 2)
                });
            }

            // Pull Requests
            const prs = [];
            const prCount = isHero ? 12 : 5;
            for (let pr = 1; pr <= prCount; pr++) {
                prs.push({
                    id: `PR-${p.project_id}-${suffix.toUpperCase()}-${pr.toString().padStart(3, '0')}`,
                    repo_id: repoId,
                    pr_number: pr,
                    title: `feat: implement secure telemetry pipeline for ${suffix} component`,
                    description: `Refactored inter-service handlers to comply with AutoNova security guidelines.`,
                    state: 'merged',
                    author_person_id: p.tech_lead_id,
                    reviewer_person_id: p.business_owner_id,
                    created_at: commits[Math.max(0, pr * 2 - 1)].committed_at,
                    merged_at: commits[Math.min(commits.length - 1, pr * 2)].committed_at
                });
            }

            // Releases
            const releases = [
                {
                    id: `REL-${p.project_id}-${suffix.toUpperCase()}-v1.0.0`,
                    repo_id: repoId,
                    tag_name: 'v1.0.0',
                    name: 'v1.0.0 Production Baseline Release',
                    body: 'Initial production-ready deployment with full integration testing.',
                    published_at: `${p.go_live_year || '2023'}-10-15T08:00:00Z`
                },
                {
                    id: `REL-${p.project_id}-${suffix.toUpperCase()}-v1.4.2`,
                    repo_id: repoId,
                    tag_name: 'v1.4.2',
                    name: 'v1.4.2 Security Patch & Performance Optimization',
                    body: 'Updated dependencies and patched potential memory leak in message consumer.',
                    published_at: '2026-08-20T14:30:00Z'
                }
            ];

            // Key Config Files
            const files = [
                {
                    id: `FILE-${repoSlug}-DOCKER`,
                    repo_id: repoId,
                    path: 'Dockerfile',
                    file_type: 'Dockerfile',
                    content: `FROM node:20-alpine\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci --only=production\nCOPY . .\nEXPOSE 8080\nCMD ["node", "src/index.js"]`,
                    size_bytes: 350,
                    last_commit_hash: commits[commits.length - 1].hash
                },
                {
                    id: `FILE-${repoSlug}-K8S`,
                    repo_id: repoId,
                    path: 'k8s/deployment.yaml',
                    file_type: 'Kubernetes Manifest',
                    content: `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: ${repoSlug}\n  namespace: ${p.project_id.toLowerCase()}\nspec:\n  replicas: 3\n  template:\n    spec:\n      containers:\n      - name: ${repoSlug}\n        image: autonova.azurecr.io/${repoSlug}:v1.4.2\n        resources:\n          limits:\n            cpu: "2"\n            memory: "4Gi"`,
                    size_bytes: 620,
                    last_commit_hash: commits[commits.length - 1].hash
                }
            ];

            // Dependencies
            const dependencies = [
                { name: 'express', version: '4.18.2', package_manager: 'npm', is_vulnerable: false, cve_id: null },
                { name: 'pg', version: '8.11.3', package_manager: 'npm', is_vulnerable: false, cve_id: null },
                { name: 'dotenv', version: '16.4.5', package_manager: 'npm', is_vulnerable: false, cve_id: null }
            ];

            // Planted Anomaly ANOM-15: P-CYB-02 uses vulnerable log4j-core 2.14.1
            if (p.project_id === 'P-CYB-02' && rIdx === 1) {
                dependencies.push({
                    name: 'log4j-core',
                    version: '2.14.1',
                    package_manager: 'maven',
                    is_vulnerable: true, // Anomaly ANOM-15
                    cve_id: 'CVE-2021-44228'
                });
            }

            const repoObj = {
                id: repoId,
                project_id: p.project_id,
                name: repoSlug,
                full_name: repoId,
                description: `Official source code repository for ${p.name} (${suffix} module)`,
                primary_language: primaryLang,
                default_branch: 'main',
                is_private: true,
                stars_count: 8 + rIdx,
                forks_count: 2,
                open_issues_count: 3 + rIdx,
                commits,
                pull_requests: prs,
                releases,
                files,
                dependencies,
                workflows: [
                    {
                        id: `WF-${repoSlug}-CI`,
                        repo_id: repoId,
                        name: 'Build and Test Pipeline',
                        file_path: '.github/workflows/ci.yml',
                        status: 'success'
                    }
                ]
            };

            allRepos.push(repoObj);
        }
    }

    fs.writeFileSync(path.join(outDir, 'github_repos.json'), JSON.stringify(allRepos, null, 2));
    console.log(`✅ Generated ${allRepos.length} GitHub repositories with full commit logs, PRs and dependencies!`);
}

if (require.main === module) {
    generateGitHub();
}

module.exports = { generateGitHub };
