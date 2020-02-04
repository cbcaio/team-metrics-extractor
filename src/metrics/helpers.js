const moment = require('moment');
const momentDurationFormatSetup = require('moment-duration-format');
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

  return timeDifference;
}

function calculateTotalIssuesByIssueType(issues, type) {
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
function calculateTotalIssuesByStatus(issues, status) {
  const accountableIssues = extractNonSubTasksIssues(issues);
  const totalIssuesByStatus = accountableIssues.reduce((acc, currentValue) => {
    if (currentValue.status === status) return acc + 1;

    return acc;
  }, 0);

  return totalIssuesByStatus;
}

module.exports = {
  calculateTotalIssuesByStatus,
  extractResolvedIssues,
  extractNonSubTasksIssues,
  calculateTotalIssuesByIssueType,
  timeDifference,
  humanFriendlyTimeFormat
};
