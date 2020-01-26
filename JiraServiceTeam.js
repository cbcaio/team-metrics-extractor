const JiraServiceBase = require('./JiraServiceBase');

class JiraServiceTeam extends JiraServiceBase {
  constructor(config) {
    super(config);

    this.labelsFilter = config.TEAM_LABELS;
    this.projectsFilter = config.PROJECTS;
  }

  async allIssues(config) {
    const { onlyOpenSprint, fromWeeksAgo } = config;

    try {
      let allIssuesJqlQuery = `labels in (${this.labelsFilter.toString()}) AND project in (${this.projectsFilter.toString()})`;

      if (onlyOpenSprint) {
        allIssuesJqlQuery += ' AND sprint in openSprints ()';
      }

      if (!onlyOpenSprint) {
        allIssuesJqlQuery += ` AND (updatedDate >= startOfDay("-${fromWeeksAgo}w") OR created >= startOfDay("-${fromWeeksAgo}w"))`;
      }

      allIssuesJqlQuery += ' ORDER BY created DESC';

      const response = await this.request(
        `/search?jql=${allIssuesJqlQuery}&maxResults=10000`
      );

      return response.data;
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  }

  async issueDetails(issueKey) {
    const response = await this.request(`/issue/${issueKey}?expand=changelog`);

    return response.data;
  }
}

module.exports = JiraServiceTeam;
