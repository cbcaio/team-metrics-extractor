const issueTransformer = require('./issueTransformer');
const sprintBlacklistFilter = require('../filters/sprintBlacklist');

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
      const sprintData = {
        currentSprint: i.fields.sprint ? sprintInfo(i.fields.sprint) : null,
        pastSprints: i.fields.closedSprints
      };

      i.sprintData = sprintData;

      return {
        ...issueTransformer(i),
        currentSprint: i.fields.sprint ? sprintInfo(i.fields.sprint) : null,
        pastSprints: i.fields.closedSprints
          ? sprintBlacklistFilter(i.fields.closedSprints.map(sprintInfo))
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
