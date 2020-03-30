const { isDateBetween } = require('../metrics/helpers');
const { JIRA_STATUSES, JIRA_ESTIMATE_FIELD } = require('../config');

function map(issue) {
  return {
    code: issue.key,
    issueType: issue.fields.issuetype.name,
    issueSummary: issue.fields.summary,
    status: issue.fields.status.name,
    hasSubtasks: issue.fields.subtasks.length > 0,
    projectKey: issue.fields.project.key,
    projectName: issue.fields.project.name,
    created: asDate(issue.fields.created),
    leadTimeStart: asDatetime(issue.fields.created)
  };
}

function asDate(date) {
  var originalDate = date.toString().split('T');
  var splitedDate = originalDate[0].split('-');

  return splitedDate[2] + '/' + splitedDate[1] + '/' + splitedDate[0];
}

function asDatetime(date) {
  var originalDate = date.toString().split('T');
  var splitedTime = originalDate[1].split('.');
  var splitedDate = originalDate[0].split('-');

  return (
    splitedDate[2] +
    '/' +
    splitedDate[1] +
    '/' +
    splitedDate[0] +
    ' ' +
    splitedTime[0]
  );
}

function isSubTask(issue) {
  return issue.fields.issuetype.name === 'Sub-task';
}
function extractPointsInTime(issue) {
  const { changelog } = issue;

  const pointsInTime = {};
  const histories = changelog.histories;

  histories.forEach(h => {
    h.items.forEach(history => {
      const { fromString, toString, field } = history;
      const sprint = issue.sprintData.currentSprint || issue.sprintData.pastSprints[0];

      if (field !== 'status') {
        return;
      }

      if (fromString === JIRA_STATUSES.Open && toString === JIRA_STATUSES.InProgress &&
        isDateBetween(h.created, sprint.startDate, sprint.endDate)) {
        pointsInTime.cycleTimeStart = asDatetime(h.created);
      }

      if (toString === JIRA_STATUSES.Resolved) {
        pointsInTime.leadTimeStop = asDatetime(h.created);
        pointsInTime.cycleTimeStop = asDatetime(h.created);
      }

      if (toString === JIRA_STATUSES.Cancelled) {
        pointsInTime.cancelled = true;
      }
    });
  });

  return pointsInTime;
}

function isIssueAlignedWithOkr(issue) {
  let labels = issue.fields.labels;
  let isAligned = false;

  labels.forEach(label => {
    if (label.match(/.*kr.*/gi)) {
      isAligned = true;
    }
  });

  return isAligned;
}

function extractEstimatedSize(issue) {
  let estimatedSize = issue.fields[JIRA_ESTIMATE_FIELD];

  return Number(estimatedSize);
}

function handleExceptions(transformedIssue) {
  const issue = { ...transformedIssue };
  const { leadTimeStop, cycleTimeStart } = issue;

  if (leadTimeStop && !cycleTimeStart) {
    issue.cycleTimeStart = issue.leadTimeStart;
  }

  return issue;
}

module.exports = function issueTransformer(issue) {
  try {
    const mappedFields = map(issue);
    const pointsInTime = extractPointsInTime(issue);
    let isAlignedWithOkr;
    let estimatedSize;

    if (!isSubTask(issue)) {
      isAlignedWithOkr = isIssueAlignedWithOkr(issue);
      estimatedSize = extractEstimatedSize(issue);
    }

    const transformedIssue = {
      ...mappedFields,
      ...pointsInTime,
      isAlignedWithOkr,
      estimatedSize
    };

    const finalIssueDetails = handleExceptions(transformedIssue);

    return finalIssueDetails;
  } catch (e) {
    console.log('Error transforming issue');
    console.error(e);
    process.exit(1);
  }
};
