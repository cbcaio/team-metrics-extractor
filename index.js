require('dotenv').config();
const config = require('./config');
const Jira = require('./JiraServiceTeam');
const issueTransformer = require('./issueTransformer');
const metricsService = require('./metrics');
const writeReport = require('./writeReport');

console.log('Initializing...');
(async () => {
  try {
    const jiraService = new Jira(config);
    const onlyOpenSprint = false;
    console.log(' Retrieving data from Jira and handling issues details...');
    const data = await jiraService.allIssues({
      onlyOpenSprint,
      fromWeeksAgo: 6
    });
    const issues = data.issues;
    const transformedIssues = [];
    for (let issue of issues) {
      const issueDetails = await jiraService.issueDetails(issue.key);
      const transformedIssue = issueTransformer(issueDetails);
      transformedIssues.push(transformedIssue);
    }

    console.log(' Calculating metrics...');
    const metrics = metricsService.processAllIssues(transformedIssues);

    console.log(' Writing reports to googlesheets...');
    await writeReport({
      metrics,
      worksheetTitle: 'Team Metrics Report',
      onlyOpenSprint
    });

    console.log('Finished');
  } catch (e) {
    console.log("Error retrieving issue's info from Jira");
    console.error(e);
    process.exit(1);
  }
})();
