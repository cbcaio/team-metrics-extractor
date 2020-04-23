const _ = require('lodash');
const JiraServiceBase = require('./JiraServiceBase');
const issueTransformer = require('../transformer/issueTransformer');

class JiraKanbanApi extends JiraServiceBase {
  constructor(config) {
    super(config);

    this.labelsFilter = config.TEAM_LABELS;
    this.projectsFilter = config.PROJECTS;
    this.timebox = config.JIRA_KANBAN_TIMEBOX;
  }

  async getIssues() {
    try {

      let allIssuesJqlQuery = `labels in (${this.labelsFilter.toString()}) AND project in (${this.projectsFilter.toString()})`;
      allIssuesJqlQuery += ` AND (updatedDate >= startOfDay("-${this.timebox}") OR created >= startOfDay("-${this.timebox}"))`;
      allIssuesJqlQuery += ' ORDER BY created DESC';

      const response = await this.request({
        apiRelativePath: `/search?jql=${allIssuesJqlQuery}&maxResults=10000&expand=changelog`,
        version: 2
      });

      return response.data.issues;
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  }

  async getTransformedIssues() {
    const issues = await this.getIssues();

    return issues.map(issueTransformer);
  }

  async issueDetails(issue) {
    const response = await this.request({
      apiRelativePath: `/issue/${issue.key}?expand=changelog`,
      version: 2
    });

    const issueDetails = response.data;

    return issueDetails;
  }
}

module.exports = JiraKanbanApi;
