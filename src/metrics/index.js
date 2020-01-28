const genericMetrics = require('./genericMetrics');
const calculateScrumMetrics = require('./scrumMetrics');
const scrumTransformer = require('../transformer/scrumTransformer');

module.exports = async function processAllIssues(input, boardType) {
  let metrics;

  switch (boardType) {
    case 'kanban': {
      break;
    }
    case 'scrum':
    default: {
      const sprints = input;
      const transformedSprints = scrumTransformer(sprints);

      metrics = calculateScrumMetrics(transformedSprints);
    }
  }

  return metrics;
};
