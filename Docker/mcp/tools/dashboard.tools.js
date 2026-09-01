'use strict';

const StatsController = require('../../lib/server/controller/Stats.controller').default;
const { PERMISSIONS } = require('../../lib/config/Keys/Permissions');
const { sessionIdField, withAuth } = require('../shared.helpers');
const { READ_ONLY } = require('../confirmation.helper');

module.exports = function registerDashboardTools(server, axioDBInstance) {
  const statsController = new StatsController(axioDBInstance);

  server.registerTool(
    'axiodb_health',
    {
      description: 'Check whether the AxioDB service is healthy and return runtime status.',
      inputSchema: { ...sessionIdField },
      annotations: READ_ONLY,
    },
    withAuth(PERMISSIONS.DASHBOARD_VIEW, async () => ({
      statusCode: 200,
      message: 'AxioDB is healthy',
      data: { status: 'ok', timestamp: Date.now() },
    })),
  );

  server.registerTool(
    'axiodb_get_dashboard_stats',
    {
      description: 'Get aggregate instance stats: database/collection/document counts, storage usage, and cache usage.',
      inputSchema: { ...sessionIdField },
      annotations: READ_ONLY,
    },
    withAuth(PERMISSIONS.DASHBOARD_VIEW, () => statsController.getDashBoardStat()),
  );
};
