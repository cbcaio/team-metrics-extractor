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

function extractPointsInTime(changelog) {
  const extractPointsInTime = {};
  const histories = changelog.histories;
  histories.forEach(element => {
    element.items.forEach(history => {
      const { fromString, toString, field } = history;

      if (field !== 'status') {
        return;
      }

      if (fromString === 'Open' && toString === 'In Progress') {
        extractPointsInTime.cycleTimeStart = asDatetime(element.created);
      }

      if (toString === 'Resolved') {
        extractPointsInTime.leadTimeStop = asDatetime(element.created);
        extractPointsInTime.cycleTimeStop = asDatetime(element.created);
      }

      if (toString === 'Cancelled') {
        extractPointsInTime.cancelled = true;
      }
    });
  });

  return extractPointsInTime;
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

    return transformedIssue;
  } catch (e) {
    console.log('Error transforming issue');
    console.error(e);
    process.exit(1);
  }
};
