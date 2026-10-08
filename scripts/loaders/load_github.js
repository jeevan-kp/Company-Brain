// ============================================================================
// load_github.js — Ingests GitHub Repos, Commits, PRs & Dependencies into Layer B & D
// ============================================================================
const fs = require('fs');
const path = require('path');
const { upsertSourceItem, upsertDocument } = require('./loader_utils');

async function loadGitHub(client) {
    console.log('🐙 Loading GitHub Repositories & Manifests into Layer B & D...');
    const dataPath = path.join(__dirname, '..', '..', 'mock', 'github', 'github_repos.json');
    if (!fs.existsSync(dataPath)) {
        throw new Error(`GitHub data not found at ${dataPath}. Run npm run generate-mocks first.`);
    }

    const repos = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    for (const repo of repos) {
        const sourceItemId = await upsertSourceItem(client, 'github', repo.id, repo.project_id, repo);

        await client.query(`
            INSERT INTO gh_repo (
                id, project_id, name, full_name, description, primary_language, 
                default_branch, is_private, stars_count, forks_count, open_issues_count
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (id) DO UPDATE SET
                description = EXCLUDED.description,
                primary_language = EXCLUDED.primary_language
        `, [
            repo.id, repo.project_id, repo.name, repo.full_name, repo.description,
            repo.primary_language, repo.default_branch, repo.is_private,
            repo.stars_count, repo.forks_count, repo.open_issues_count
        ]);

        // Commits (batch insert)
        for (const commit of (repo.commits || [])) {
            await client.query(`
                INSERT INTO gh_commit (hash, repo_id, author_person_id, author_name, message, committed_at, lines_added, lines_deleted)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (hash) DO NOTHING
            `, [commit.hash, repo.id, commit.author_person_id, commit.author_name, commit.message, commit.committed_at, commit.lines_added, commit.lines_deleted]);
        }

        // PRs
        for (const pr of (repo.pull_requests || [])) {
            await client.query(`
                INSERT INTO gh_pull_request (id, repo_id, pr_number, title, description, state, author_person_id, reviewer_person_id, created_at, merged_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, merged_at = EXCLUDED.merged_at
            `, [pr.id, repo.id, pr.pr_number, pr.title, pr.description, pr.state, pr.author_person_id, pr.reviewer_person_id, pr.created_at, pr.merged_at]);
        }

        // Releases
        for (const rel of (repo.releases || [])) {
            await client.query(`
                INSERT INTO gh_release (id, repo_id, tag_name, name, body, published_at)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, body = EXCLUDED.body
            `, [rel.id, repo.id, rel.tag_name, rel.name, rel.body, rel.published_at]);
        }

        // Files
        for (const file of (repo.files || [])) {
            await client.query(`
                INSERT INTO gh_file (id, repo_id, path, file_type, content, size_bytes, last_commit_hash)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content, size_bytes = EXCLUDED.size_bytes
            `, [file.id, repo.id, file.path, file.file_type, file.content, file.size_bytes, file.last_commit_hash]);

            // Index key files into Document
            await upsertDocument(client, {
                project_id: repo.project_id,
                source_system: 'github',
                source_item_id: sourceItemId,
                external_id: file.id,
                title: `${repo.name}/${file.path}`,
                doc_type: 'gh_file',
                sensitivity: 'internal',
                allowed_roles: ['Developer', 'Architect', 'PM', 'Management', 'Support'],
                author: 'GitHub Automation',
                url_mock: `https://github.com/${repo.id}/blob/main/${file.path}`,
                raw_text: `# File: ${file.path} (${repo.id})\n\n\`\`\`\n${file.content}\n\`\`\``,
                metadata: { repo: repo.id, file_path: file.path }
            });
        }

        // Dependencies
        for (const dep of (repo.dependencies || [])) {
            await client.query(`
                INSERT INTO gh_dependency (repo_id, name, version, package_manager, license, is_vulnerable, cve_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (repo_id, name, version) DO UPDATE SET is_vulnerable = EXCLUDED.is_vulnerable, cve_id = EXCLUDED.cve_id
            `, [repo.id, dep.name, dep.version, dep.package_manager, dep.license || 'MIT', dep.is_vulnerable || false, dep.cve_id || null]);
        }
    }

    console.log('✅ GitHub Layer B & D Data loaded successfully!');
}

module.exports = { loadGitHub };
