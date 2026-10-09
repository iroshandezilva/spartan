import linearDocs from './linear-docs.json';

// Canonical Linear destinations for the retired local project routes. The map lives in JSON so
// next.config.mjs can build redirects from it.
export { linearDocs };
export const linearProjectIssues = linearDocs['project/tasks'];
export const linearProjectHome = linearDocs[''];
