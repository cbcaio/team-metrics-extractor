const issueTransformer = require('./issueTransformer');

function sprintInfo(sprint) {
  return {
    id: sprint.id,
    name: sprint.name,
    goal: sprint.goal || null,
    startDate: sprint.startDate,
    endDate: sprint.endDate,
    completeDate: sprint.completeDate || null
  };
}

module.exports = function scrumTransformer(sprints) {
  let transformedSprint = sprints.map(sprint => {
    const issues = sprint.issues.map(i => {
      return {
        ...issueTransformer(i),
        currentSprint: sprintInfo(i.fields.sprint),
        pastSprints: i.fields.closedSprints
          ? i.fields.closedSprints.map(sprintInfo)
          : []
      };
    });

    return {
      ...sprintInfo(sprint),
      issues
    };
  });

  return transformedSprint;
};
