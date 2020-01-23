const moment = require('moment');
const momentDurationFormatSetup = require('moment-duration-format');

momentDurationFormatSetup(moment);

function timeDifference(posteriorDate, initialDate) {
  if (!(posteriorDate && initialDate)) {
    return;
  }

  let initialDateMoment = moment(initialDate, 'DD/MM/YYYY HH:mm:ss');
  let posteriorDateMoment = moment(posteriorDate, 'DD/MM/YYYY HH:mm:ss');

  let timeDifference = moment.duration(
    posteriorDateMoment.diff(initialDateMoment)
  );

  return timeDifference.format('dd [dias, ] hh [horas e] mm [m]');
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

function processAllIssues(issues) {
  const stats = {
    issues: {}
  };

  for (const issue of issues) {
    const cycleTime = calculateCycleTime(issue);
    const leadTime = calculateLeadTime(issue);

    stats.issues[issue.code] = {
      leadTime,
      cycleTime
    };
  }

  stats.alignmentWithOkr = calculateOkrAlignment(issues);
  stats.totalStories = calculateTotalByIssueType(issues, 'Story');
  stats.totalTasks = calculateTotalByIssueType(issues, 'Task');
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
