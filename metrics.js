const moment = require('moment');
const momentDurationFormatSetup = require('moment-duration-format');
const _ = require('lodash');

momentDurationFormatSetup(moment);

function humanFriendlyTimeFormat(timeInput) {
  const duration = moment.duration(timeInput);

  return {
    readable: duration.format('dd [dias, ] hh [horas e] mm [m]'),
    inHours: Number(duration.format('hh')),
    inSeconds: Number(duration.format('ss').replace(/,/g, ''))
  };
}

function timeDifference(posteriorDate, initialDate) {
  if (!(posteriorDate && initialDate)) {
    return;
  }

  let initialDateMoment = moment(initialDate, 'DD/MM/YYYY HH:mm:ss');
  let posteriorDateMoment = moment(posteriorDate, 'DD/MM/YYYY HH:mm:ss');

  const timeDifference = posteriorDateMoment.diff(initialDateMoment);

  return {
    timeDifference,
    inFriendlyFormat: humanFriendlyTimeFormat(timeDifference)
  };
}

function calculateCycleTime(issue) {
  const { cycleTimeStart, cycleTimeStop } = issue;

  return timeDifference(cycleTimeStop, cycleTimeStart);
}

function calculateLeadTime(issue) {
  const { leadTimeStart, leadTimeStop } = issue;

  return timeDifference(leadTimeStop, leadTimeStart);
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

function calculateTotalByIssueType(issues, type) {
  const totalIssuesByType = issues.reduce((acc, currentValue) => {
    if (currentValue.issueType === type) return acc + 1;

    return acc;
  }, 0);

  return totalIssuesByType;
}

function extractNonSubTasksIssues(issues) {
  return issues.filter(issue => issue.issueType !== 'Sub-task');
}
function extractResolvedIssues(issues) {
  return issues.filter(issue => issue.status === 'Resolved');
}
function calculateTotalByStatus(issues, status) {
  const accountableIssues = extractNonSubTasksIssues(issues);
  const totalIssuesByStatus = accountableIssues.reduce((acc, currentValue) => {
    if (currentValue.status === status) return acc + 1;

    return acc;
  }, 0);

  return totalIssuesByStatus;
}

function calculateVelocity(issues) {
  const nonSubTasksIssues = extractNonSubTasksIssues(issues);
  const resolvedIssues = extractResolvedIssues(nonSubTasksIssues);

  const velocity = resolvedIssues.reduce(
    (acc, currentValue) => acc + currentValue.estimatedSize,
    0
  );

  return velocity;
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

  const issuesBySize = _.groupBy(statsWithSizeAppended, i => i.estimatedSize);

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

function processAllIssues(issues) {
  const stats = {};

  const resolvedIssues = extractResolvedIssues(issues);
  const estimatedIssues = extractNonSubTasksIssues(resolvedIssues);

  const issuesStats = {};
  for (const issue of estimatedIssues) {
    const cycleTime = calculateCycleTime(issue);
    const leadTime = calculateLeadTime(issue);

    issuesStats[issue.code] = {
      leadTime,
      cycleTime
    };
  }

  const metricsPerSize = calculateMetricsPerSize(estimatedIssues, issuesStats);
  stats.cycleTime = {
    mean: calculateMeanCycleTime(issuesStats),
    perSize: metricsPerSize.cycleTime
  };

  stats.leadTime = {
    mean: calculateMeanLeadTime(issuesStats),
    perSize: metricsPerSize.leadTime
  };

  stats.alignmentWithOkr = calculateOkrAlignment(issues);
  stats.totalStories = calculateTotalByIssueType(issues, 'Story');
  stats.totalTasks = calculateTotalByIssueType(issues, 'Task');
  stats.totalSubTasks = calculateTotalByIssueType(issues, 'Sub-task');
  stats.totalIssues = extractNonSubTasksIssues(issues).length;
  stats.totalIssuesResolved = calculateTotalByStatus(issues, 'Resolved');
  stats.velocity = calculateVelocity(issues);
  stats.objetiveAccomplished = stats.totalIssues === stats.totalIssuesResolved;

  return stats;
}

module.exports = {
  processAllIssues,
  calculateCycleTime
};
