const { meanBy } = require('lodash');

function calculateCycleTime(issue) {
  const { cycleTimeStart, cycleTimeStop } = issue;

  return timeDifference(cycleTimeStop, cycleTimeStart);
}

function calculateLeadTime(issue) {
  const { leadTimeStart, leadTimeStop } = issue;

  return timeDifference(leadTimeStop, leadTimeStart);
}
function calculateMeanCycleTime(issuesStats) {
  const meanCycleTimeDuration = _.meanBy(
    Object.values(issuesStats),
    i => i.cycleTime.timeDifference
  );

  return humanFriendlyTimeFormat(meanCycleTimeDuration);
}
function calculateMeanLeadTime(issuesStats) {
  const meanLeadTimeDuration = _.meanBy(
    Object.values(issuesStats),
    i => i.leadTime.timeDifference
  );

  return humanFriendlyTimeFormat(meanLeadTimeDuration);
}
function calculateOkrAlignment(issues) {
  let totalAlignedIssues = 0;
  let totalNotAlignedIssues = 0;

  for (const issue of issues) {
    if (issue.isAlignedWithOkr === true) totalAlignedIssues += 1;
    if (issue.isAlignedWithOkr === false) totalNotAlignedIssues += 1;
  }

  const totalIssuesCounted = totalAlignedIssues + totalNotAlignedIssues;

  return (totalAlignedIssues / totalIssuesCounted).toFixed(2);
}
function calculateMetricsPerSize(issuesDetails, issuesStats) {
  const statsWithSizeAppended = [];

  Object.keys(issuesStats).forEach(i => {
    const accountableIssue = issuesDetails.find(d => d.code === i);
    if (!accountableIssue) return;

    statsWithSizeAppended.push({
      estimatedSize: accountableIssue.estimatedSize,
      ...issuesStats[i]
    });
  });

  const issuesBySize = groupBy(statsWithSizeAppended, i => i.estimatedSize);

  const cycleTime = {};
  const leadTime = {};

  Object.keys(issuesBySize).forEach(size => {
    const issuesListPerSizeWithStats = issuesBySize[size];

    Object.assign(cycleTime, {
      [size]: {
        mean: calculateMeanCycleTime(issuesListPerSizeWithStats),
        totalCount: issuesListPerSizeWithStats.length
      }
    });
    Object.assign(leadTime, {
      [size]: {
        mean: calculateMeanLeadTime(issuesListPerSizeWithStats),
        totalCount: issuesListPerSizeWithStats.length
      }
    });
  });

  return {
    cycleTime,
    leadTime
  };
}
module.exports = function calculateGenericMetrics() {
  const metricsPerSize = calculateMetricsPerSize(estimatedIssues, issuesStats);

  const cycleTime = calculateCycleTime(issue);
  const leadTime = calculateLeadTime(issue);
  
  stats.cycleTime = {
    mean: calculateMeanCycleTime(issuesStats),
    perSize: metricsPerSize.cycleTime
  };

  stats.leadTime = {
    mean: calculateMeanLeadTime(issuesStats),
    perSize: metricsPerSize.leadTime
  };
  stats.alignmentWithOkr = calculateOkrAlignment(issues);
  stats.totalStories = calculateTotalIssuesByIssueType(issues, 'Story');
  stats.totalTasks = calculateTotalIssuesByIssueType(issues, 'Task');
  stats.totalSubTasks = calculateTotalIssuesByIssueType(issues, 'Sub-task');
  stats.totalIssues = extractNonSubTasksIssues(issues).length;
};
