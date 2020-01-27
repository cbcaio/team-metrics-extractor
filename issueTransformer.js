function map(issue) {
  const baseProperties = {
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

  let sprintProperties = {};
  if (issue.sprintDetails) {
    const { sprintDetails } = issue;
    sprintProperties = {
      currentSprint: {
        id: sprintDetails.sprint.id,
        name: sprintDetails.sprint.name,
        goal: sprintDetails.sprint.goal
      },
      pastSprints: sprintDetails.closedSprint.map(s => ({
        id: s.id,
        name: s.name,
        goal: s.goal
      }))
    };
  }

  const mappedProperties = Object.assign({}, baseProperties, sprintProperties);

  return mappedProperties;
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

function extractPointsInTime(changelog) {
  const pointsInTime = {};
  const histories = changelog.histories;
  histories.forEach(h => {
    h.items.forEach(history => {
      const { fromString, toString, field } = history;

      if (field !== 'status') {
        return;
      }

      if (fromString === 'Open' && toString === 'In Progress') {
        pointsInTime.cycleTimeStart = asDatetime(h.created);
      }

      if (toString === 'Resolved') {
        pointsInTime.leadTimeStop = asDatetime(h.created);
        pointsInTime.cycleTimeStop = asDatetime(h.created);
      }

      if (toString === 'Cancelled') {
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
  let estimatedSize = issue.fields['customfield_10106'];

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
    const pointsInTime = extractPointsInTime(issue.changelog);
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
