const _ = require('lodash');
const JiraServiceBase = require('./JiraServiceBase');
const issueTransformer = require('../transformer/issueTransformer');


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

class JiraScrumApi extends JiraServiceBase {
  constructor(config) {
    super(config);

    this.boardId = config.JIRA_BOARD_ID;
    this.sprintBlacklist = config.SPRINT_BLACKLIST;
    this.fromLastXSprints =   JIRA_SPRINTS;
    this.includeActiveSprints = JIRA_ENABLE_ACTIVE_SPRINT === '1';
  }

  sprintBlacklistFilter(sprints) {
    const filteredList = sprints.filter(s =>
      this.sprintBlacklist ? !this.sprintBlacklist.includes(s.name) : true
    );
  
    return filteredList;
  };
  

  async getLastXSprints({ x, startAt = 0, states = ['closed'] }) {
    const statesQueryString = states.join(',');
    const url = `/board/${this.boardId}/sprint?state=${statesQueryString}&startAt=${startAt}&maxResults=50`;

    const response = await this.request({
      apiRelativePath: url,
      version: 1
    });

    const sprintsHistory = response.data.values;

    if (sprintsHistory.length === 50) {
      return this.getLastXSprints({
        x,
        startAt: sprintsHistory.length - x + startAt,
        states
      });
    }

    let sprints = _.slice(
      sprintsHistory,
      sprintsHistory.length - x,
      sprintsHistory.length
    );

    const filteredSprintsList = this.sprintBlacklistFilter(sprints);

    return filteredSprintsList;
  }

  async getIssuesInSprints(sprintIds) {
    const promises = [];

    sprintIds.forEach(sprintId => {
      promises.push(this.getIssuesInSprint(sprintId));
    });

    const issuesPerSprint = await Promise.all(promises);

    return issuesPerSprint;
  }

  async getIssuesInSprint(sprintId) {
    const url = `/sprint/${sprintId}/issue?expand=changelog`;

    const response = await this.request({
      apiRelativePath: url,
      version: 1
    });

    const issues = response.data.issues;

    return issues;
  }
  async getSprints() {
    const sprintsArg = {
      states: ['closed'],
      startAt: 0,
      x: this.fromLastXSprints
    };

    if (this.includeActiveSprints) sprintsArg.states.push('active');

    const sprints = await this.getLastXSprints(sprintsArg);

    return sprints;
  }

  async getIssueDetails(issue) {
    const response = await this.request({
      apiRelativePath: `/issue/${issue.key}?expand=changelog`,
      version: 2
    });

    const issueDetails = response.data;

    const sprintDetails = {
      sprint: issue.fields.sprint,
      closedSprint: issue.fields.closedSprints
    };

    Object.assign(issueDetails, { sprintDetails });

    return issueDetails;
  }

  async getTransformedSprints() {
    const sprints = await this.getSprints();
    const sprintIssues = await this.getIssuesInSprints(
      sprints.map(s => s.id)
    );

    const sprintsWithIssues = sprints.map((sprint, i) => ({
      ...sprint,
      issues: sprintIssues[i]
    }));

    return this.transform(sprintsWithIssues);
  }

  transform(sprints) {
    let transformedSprints = sprints.map(sprint => {
      const issues = sprint.issues.map(i => {
        const sprintData = {
          currentSprint: i.fields.sprint ? sprintInfo(i.fields.sprint) : null,
          pastSprints: i.fields.closedSprints
        };
  
        const issue = Object.assign({}, i, { sprintData });
  
        return {
          ...issueTransformer(issue),
          currentSprint: i.fields.sprint ? sprintInfo(i.fields.sprint) : null,
          pastSprints: i.fields.closedSprints
            ? this.sprintBlacklistFilter(i.fields.closedSprints.map(sprintInfo))
            : []
        };
      });
  
      return {
        ...sprintInfo(sprint),
        issues
      };
    });
  
    return transformedSprints;
  };
}

module.exports = JiraScrumApi;
