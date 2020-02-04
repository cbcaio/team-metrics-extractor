const { meanBy, groupBy } = require('lodash');
const {
  extractNonSubTasksIssues,
  extractResolvedIssues,
  timeDifference,
  calculateTotalIssuesByIssueType
} = require('./helpers');

function calculateMeanCycleTime(issues) {
  const meanCycleTimeDuration = meanBy(
    Object.values(issues).filter(i => i.cycleTime),
    i => i.cycleTime
  );

  return meanCycleTimeDuration;
}
function calculateMeanLeadTime(issues) {
  const meanLeadTimeDuration = meanBy(
    Object.values(issues).filter(i => i.leadTime),
    i => i.leadTime
  );

  return meanLeadTimeDuration;
}
function 
calculateOkrAlignment(issues) {
  let totalAlignedIssues = 0;
  let totalNotAlignedIssues = 0;

  for (const issue of issues) {
    if (issue.isAlignedWithOkr === true) totalAlignedIssues += 1;
    if (issue.isAlignedWithOkr === false) totalNotAlignedIssues += 1;
  }

  const totalIssuesCounted = totalAlignedIssues + totalNotAlignedIssues;

  return (totalAlignedIssues / totalIssuesCounted).toFixed(2);
}
function calculateMetricsPerSize(issues) {
  const accountableIssues = issues.filter(
    i => i.estimatedSize && i.cycleTime && i.leadTime
  );
  const issuesBySize = groupBy(accountableIssues, i => i.estimatedSize);

  const cycleTime = {};
  const leadTime = {};

  Object.keys(issuesBySize).forEach(size => {
    Object.assign(cycleTime, {
      [size]: {
        mean: calculateMeanCycleTime(issuesBySize[size]),
        totalCount: issuesBySize[size].length
      }
    });
    Object.assign(leadTime, {
      [size]: {
        mean: calculateMeanLeadTime(issuesBySize[size]),
        totalCount: issuesBySize[size].length
      }
    });
  });

  return {
    cycleTime,
    leadTime
  };
}

function calculateIssuesMetrics(issues) {
  const issuesWithMetrics = issues.map(i => ({
    cycleTime: timeDifference(i.cycleTimeStop, i.cycleTimeStart),
    leadTime: timeDifference(i.leadTimeStop, i.leadTimeStart),
    ...i
  }));

  return issuesWithMetrics;
}

module.exports = function calculateGenericMetrics(issues) {
  let metrics = {
    totalStories: calculateTotalIssuesByIssueType(issues, 'Story'),
    totalTasks: calculateTotalIssuesByIssueType(issues, 'Task'),
    totalSubTasks: calculateTotalIssuesByIssueType(issues, 'Sub-task')
  };

  const issuesWithMetrics = calculateIssuesMetrics(issues);
  const accountableIssues = extractResolvedIssues(
    extractNonSubTasksIssues(issuesWithMetrics)
  );
  const metricsPerSize = calculateMetricsPerSize(accountableIssues);

  metrics.cycleTime = {
    mean: calculateMeanCycleTime(accountableIssues),
    perSize: metricsPerSize.cycleTime
  };

  metrics.leadTime = {
    mean: calculateMeanLeadTime(accountableIssues),
    perSize: metricsPerSize.leadTime
  };

  metrics.alignmentWithOkr = calculateOkrAlignment(accountableIssues);

  metrics.throughput = accountableIssues.length;

  return metrics;
};
