'use strict';

const StatsController = require('../../lib/server/controller/Stats.controller').default;
const { PERMISSIONS } = require('../../lib/config/Keys/Permissions');
const { sessionIdField, withAuth } = require('../shared.helpers');

module.exports = function registerDashboardTools(server, axioDBInstance) {
  const statsController = new StatsController(axioDBInstance);

  server.registerTool(
    'axiodb_get_dashboard_stats',
    {
      description: 'Get aggregate instance stats: database/collection/document counts, storage usage, and cache usage.',
      inputSchema: { ...sessionIdField },
    },
    withAuth(PERMISSIONS.DASHBOARD_VIEW, () => statsController.getDashBoardStat()),
  );
};
