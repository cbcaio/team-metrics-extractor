const _ = require('lodash');
const JiraServiceBase = require('./JiraServiceBase');

class JiraKanbanApi extends JiraServiceBase {
  constructor(config) {
    super(config);

    this.labelsFilter = config.TEAM_LABELS;
    this.projectsFilter = config.PROJECTS;
  }

  async getIssues(config) {
    try {
      const { fromXAgo } = config;

      let allIssuesJqlQuery = `labels in (${this.labelsFilter.toString()}) AND project in (${this.projectsFilter.toString()})`;
      allIssuesJqlQuery += ` AND (updatedDate >= startOfDay("-${fromXAgo}") OR created >= startOfDay("-${fromWeeksAgo}w"))`;
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
