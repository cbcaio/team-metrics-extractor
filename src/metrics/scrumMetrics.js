const calculateGenericMetrics = require('./genericMetrics');
const {
  extractResolvedIssues,
  extractNonSubTasksIssues,
  humanFriendlyTimeFormat
} = require('./helpers');
const { meanBy } = require('lodash');

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

function calculateOverallMetrics(sprintMetrics) {
  const meanVelocity = meanBy(sprintMetrics, s => s.metrics.velocity);
  const meanThroughput = meanBy(sprintMetrics, s => s.metrics.throughput);
  const meanFinishedPercentage = meanBy(
    sprintMetrics,
    s => s.metrics.finishedPercentage
  );
  const meanCarriedOnIssues = meanBy(
    sprintMetrics,
    s => s.metrics.carriedOnIssues
  );
  const meanCycleTime = meanBy(sprintMetrics, s => s.metrics.cycleTime.mean);
  const meanLeadTime = meanBy(sprintMetrics, s => s.metrics.leadTime.mean);

  return {
    meanVelocity,
    meanThroughput,
    meanFinishedPercentage,
    meanCarriedOnIssues,
    meanCycleTime: humanFriendlyTimeFormat(meanCycleTime),
    meanLeadTime: humanFriendlyTimeFormat(meanLeadTime)
  };
}

function calculateScrumMetrics(sprint) {
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
}

module.exports = {
  calculateScrumMetrics,
  calculateOverallMetrics
};
