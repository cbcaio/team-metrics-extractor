const _ = require('lodash');
const JiraServiceBase = require('./JiraServiceBase');

class JiraServiceTeam extends JiraServiceBase {
  constructor(config) {
    super(config);

    this.labelsFilter = config.TEAM_LABELS;
    this.projectsFilter = config.PROJECTS;
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

    let issues = [];

    issuesPerSprint.forEach(sprintIssues => {
      issues = _.unionBy(issues, sprintIssues, i => i.id);
    });

    return issues;
  }

  async getIssuesInSprint(sprintId) {
    const url = `/sprint/${sprintId}/issue`;

    const response = await this.request({
      apiRelativePath: url,
      version: 1
    });

    const issues = response.data.issues;

    return issues;
  }

  async getIssues(config) {
    const { scrum, kanban } = config;

    let issues;

    if (scrum) {
      const { fromLastXSprints, onlyOpenSprint } = scrum;
      const sprintsArg = {
        states: ['closed'],
        startAt: 0,
        x: fromLastXSprints
      };

      if (onlyOpenSprint) sprintsArg.states = ['open'];

      const sprints = await this.getLastXSprints(sprintsArg);

      issues = await this.getIssuesInSprints(sprints.map(s => s.id));
    }

    if (kanban) {
      const { fromWeeksAgo } = kanban;

      issues = await this.getKanbanIssues({ fromWeeksAgo });
    }

    return issues;
  }

  async getKanbanIssues(config) {
    try {
      const { fromWeeksAgo } = config;

      let allIssuesJqlQuery = `labels in (${this.labelsFilter.toString()}) AND project in (${this.projectsFilter.toString()})`;
      allIssuesJqlQuery += ` AND (updatedDate >= startOfDay("-${fromWeeksAgo}w") OR created >= startOfDay("-${fromWeeksAgo}w"))`;
      allIssuesJqlQuery += ' ORDER BY created DESC';

      const response = await this.request({
        apiRelativePath: `/search?jql=${allIssuesJqlQuery}&maxResults=10000`,
        version: 2
      });

      return response.data.issues;
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  }

  extractSprintDetails(issue) {
    return {
      sprint: issue.fields.sprint,
      closedSprint: issue.fields.closedSprints
    };
  }
  async issueDetails(issue) {
    let sprintDetails;
    if (issue.fields.sprint || issue.fields.closedSprints) {
      sprintDetails = this.extractSprintDetails(issue);
    }

    const response = await this.request({
      apiRelativePath: `/issue/${issue.key}?expand=changelog`,
      version: 2
    });

    const issueDetails = response.data;
    if (sprintDetails) {
      Object.assign(issueDetails, { sprintDetails });
    }

    return issueDetails;
  }
}

module.exports = JiraServiceTeam;
