const genericMetrics = require('./genericMetrics');
const calculateScrumMetrics = require('./scrumMetrics');
const scrumTransformer = require('../transformer/scrumTransformer');

module.exports = function processAllIssues(input, boardType) {
  let metrics;

  switch (boardType) {
    case 'kanban': {
      break;
    }
    case 'scrum':
    default: {
      const sprints = input;
      const transformedSprints = scrumTransformer(sprints);

      metrics = transformedSprints.map(sprint => ({
        metrics: calculateScrumMetrics(sprint),
        ...sprint
      }));
    }
  }

  return metrics;
};
