const _ = require('lodash');
const JiraServiceBase = require('./JiraServiceBase');

class JiraScrumApi extends JiraServiceBase {
  constructor(config) {
    super(config);

    this.boardId = config.JIRA_BOARD_ID;
  }

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

    return sprints;
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
  async getSprints(config) {
    const { fromLastXSprints, includeActiveSprints } = config;
    const sprintsArg = {
      states: ['closed'],
      startAt: 0,
      x: fromLastXSprints
    };

    if (includeActiveSprints) sprintsArg.states.push('active');

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
}

module.exports = JiraScrumApi;
