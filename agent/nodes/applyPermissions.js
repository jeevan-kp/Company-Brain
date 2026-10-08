// ============================================================================
// agent/nodes/applyPermissions.js — Node 4: RBAC & Permission Enforcement
// ============================================================================

async function applyPermissions(state) {
    const startTime = Date.now();
    const { userRole, graphFacts } = state;
    const sanitizedFacts = JSON.parse(JSON.stringify(graphFacts || {}));

    const isManagementOrPM = ['Management', 'PM', 'Architect'].includes(userRole);

    // Strip confidential budget figures from graph facts for Developer / Support roles
    if (!isManagementOrPM) {
        for (const pid of Object.keys(sanitizedFacts)) {
            if (sanitizedFacts[pid]?.budget) {
                sanitizedFacts[pid].budget = {
                    status: 'RESTRICTED_BY_ROLE',
                    message: 'Financial budget details are restricted to Management, PM and Architect roles.'
                };
            }
        }
    }

    const duration = Date.now() - startTime;
    const timings = { ...state.timings, apply_permissions: duration };

    return {
        ...state,
        graphFacts: sanitizedFacts,
        timings
    };
}

module.exports = { applyPermissions };
