const calculateGenericMetrics = require('./genericMetrics');
const {
  extractResolvedIssues,
  extractNonSubTasksIssues
} = require('./helpers');

function calculateVelocity(issues) {
  const nonSubTasksIssues = extractNonSubTasksIssues(issues);
  const resolvedIssues = extractResolvedIssues(nonSubTasksIssues);

  const velocity = resolvedIssues.reduce(
    (acc, currentValue) => acc + currentValue.estimatedSize,
    0
  );

  return velocity;
}

function calculateObjetiveAccomplished(sprint) {
  return true;
}

function calculateCarriedOnIssues(issues) {
  let carriedOnIssues = 0;

  for (const issue of issues) {
    if (issue.pastSprints.length > 0) carriedOnIssues += 1;
  }

  return carriedOnIssues;
}

module.exports = function calculateScrumMetrics(sprint) {
  const { issues } = sprint;

  const totalIssues = extractNonSubTasksIssues(issues);
  const resolvedIssues = extractResolvedIssues(totalIssues);

  const sprintMetrics = {
    velocity: calculateVelocity(issues),
    objetiveAccomplished: calculateObjetiveAccomplished(sprint),
    finishedPercentage: resolvedIssues.length / totalIssues.length,
    carriedOnIssues: calculateCarriedOnIssues(totalIssues),
    ...calculateGenericMetrics(issues)
  };

  return sprintMetrics;
};
