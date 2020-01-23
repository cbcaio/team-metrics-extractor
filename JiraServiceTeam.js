const JiraServiceBase = require('./JiraServiceBase');

class JiraServiceTeam extends JiraServiceBase {
  constructor(config) {
    super(config);

    this.labelsFilter = config.TEAM_LABELS;
    this.projectsFilter = config.PROJECTS;
  }

  async allIssues(config = { onlyOpenSprint: true }) {
    const { onlyOpenSprint } = config;
    try {
      let allIssuesJqlQuery = `labels in (${this.labelsFilter.toString()}) AND project in (${this.projectsFilter.toString()})`;

      if (onlyOpenSprint) {
        allIssuesJqlQuery += ' AND sprint in openSprints ()';
      }

      allIssuesJqlQuery += ' ORDER BY Prioridade ASC';

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
