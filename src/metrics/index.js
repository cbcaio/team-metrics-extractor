const genericMetrics = require('./genericMetrics');
const {
  calculateScrumMetrics,
  calculateOverallMetrics
} = require('./scrumMetrics');

module.exports = function processAllIssues(input, boardType) {

  switch (boardType) {
    case 'kanban': {
      return genericMetrics(input);
    }
    case 'scrum':
    default: {
      const sprints = input;

      const sprintsWithMetrics = sprints.map(sprint => ({
        metrics: calculateScrumMetrics(sprint),
        ...sprint
      }));

      return {
        ...calculateOverallMetrics(sprintsWithMetrics),
        sprints: sprintsWithMetrics
      };
    }
  }
};
