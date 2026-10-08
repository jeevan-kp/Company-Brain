// ============================================================================
// utils.js — Synthetic Generation Utilities, Context Pools & Seeded Helpers
// ============================================================================
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const seedDir = path.join(__dirname, '..', '..', 'seed', 'company_brain');

function readCsv(filename) {
    const filePath = path.join(seedDir, filename);
    const content = fs.readFileSync(filePath, 'utf8');
    return parse(content, { columns: true, skip_empty_lines: true, trim: true });
}

// Load canonical reference datasets
const projects = readCsv('projects.csv');
const people = readCsv('people.csv');
const teams = readCsv('teams.csv');
const platforms = readCsv('platforms.csv');
const platformServices = readCsv('platform_services.csv');
const serviceDependencies = readCsv('service_dependencies.csv');
const projectDependencies = readCsv('project_dependencies.csv');
const projectServiceUsage = readCsv('project_service_usage.csv');
const allocations = readCsv('allocations.csv');

// Lookup maps
const projectMap = new Map(projects.map(p => [p.project_id, p]));
const peopleMap = new Map(people.map(p => [p.person_id, p]));
const teamMap = new Map(teams.map(t => [t.team_id, t]));

const heroProjectIds = ['P-FIN-01', 'P-PRO-01', 'P-DTFS-01', 'P-CYB-01', 'P-SAL-01', 'P-CYB-02'];

// Seeded pseudo-random generator for determinism
class PRNG {
    constructor(seed = 42) {
        this.m = 0x80000000;
        this.a = 1103515245;
        this.c = 12345;
        this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
    }

    nextFloat() {
        this.state = (this.a * this.state + this.c) % this.m;
        return this.state / (this.m - 1);
    }

    nextInt(min, max) {
        return Math.floor(min + this.nextFloat() * (max - min + 1));
    }

    choice(arr) {
        if (!arr || arr.length === 0) return null;
        return arr[this.nextInt(0, arr.length - 1)];
    }

    sample(arr, count) {
        const shuffled = [...arr].sort(() => 0.5 - this.nextFloat());
        return shuffled.slice(0, count);
    }
}

const rng = new PRNG(20261007);

module.exports = {
    projects,
    people,
    teams,
    platforms,
    platformServices,
    serviceDependencies,
    projectDependencies,
    projectServiceUsage,
    allocations,
    projectMap,
    peopleMap,
    teamMap,
    heroProjectIds,
    rng,
    PRNG
};
