const { groupBy, flatten, uniqBy } = require('lodash');
const calculateGenericMetrics = require('./genericMetrics');

function calculateVelocity(issues) {
  const nonSubTasksIssues = extractNonSubTasksIssues(issues);
  const resolvedIssues = extractResolvedIssues(nonSubTasksIssues);

  const velocity = resolvedIssues.reduce(
    (acc, currentValue) => acc + currentValue.estimatedSize,
    0
  );

  return velocity;
}

module.exports = function calculateScrumMetrics(sprints) {
  const resolvedIssues = extractResolvedIssues(issues);
  const estimatedIssues = extractNonSubTasksIssues(resolvedIssues);
};
