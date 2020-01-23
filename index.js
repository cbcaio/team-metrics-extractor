require('dotenv').config();
const config = require('./config');
const Jira = require('./JiraServiceTeam');
const issueTransformer = require('./issueTransformer');
const metricsService = require('./metrics');

console.log('Initializing...');

const jiraService = new Jira(config);

(async () => {
  try {
    const data = await jiraService.allIssues();
    const issues = data.issues;

    const transformedIssues = [];
    for (let issue of issues) {
      const issueDetails = await jiraService.issueDetails(issue.key);
      const transformedIssue = issueTransformer(issueDetails);
      transformedIssues.push(transformedIssue);
    }

    const metrics = metricsService.processAllIssues(transformedIssues);

    console.log(metrics);
  } catch (e) {
    console.log("Error retrieving issue's info from Jira");
    console.error(e);
    process.exit(1);
  }
})();
