/**
 * Canonical Project Dataset Service for Company Brain
 * Loads and exposes the full AutoNova (Daimler-like) dataset:
 * - 6 Domains (Cyber Security, DTFS, Finance, Procurement, Sales, HR)
 * - 5 Platforms (Azure, AWS, SAP, Snowflake, Databricks)
 * - 30 Platform Services & 22 Service Dependencies
 * - 32 Teams (Platform + Business + Technical per domain)
 * - 86 People & 209 Allocations
 * - 31 Projects & 53 Dependencies
 * - 658 Graph Edges
 * - 145 Golden Q&As across 9 reasoning categories
 */

const dataset = require('./datasetLoader');

module.exports = {
  DOMAINS: dataset.DOMAINS,
  PLATFORMS: dataset.PLATFORMS,
  PLATFORM_SERVICES: dataset.PLATFORM_SERVICES,
  SERVICE_DEPENDENCIES: dataset.SERVICE_DEPENDENCIES,
  TEAMS: dataset.TEAMS,
  PEOPLE: dataset.PEOPLE,
  PROJECTS: dataset.PROJECTS,
  PROJECT_SERVICE_USAGE: dataset.PROJECT_SERVICE_USAGE,
  PROJECT_DEPENDENCIES: dataset.PROJECT_DEPENDENCIES,
  ALLOCATIONS: dataset.ALLOCATIONS,
  GRAPH_EDGES: dataset.GRAPH_EDGES,
  GOLDEN_QA: dataset.GOLDEN_QA,
  getGlobalGraph: dataset.getGlobalGraph,
  getProjectGraph: dataset.getProjectGraph,
  searchDataset: dataset.searchDataset,
  getProjectById: dataset.getProjectById,
  getProjectsByDepartment: dataset.getProjectsByDepartment,
  getDepartments: dataset.getDepartments
};
