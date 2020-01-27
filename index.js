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
    console.log(' Retrieving data from Jira and handling issues details...');
    const issues = await jiraService.getIssues({
      scrum: {
        fromLastXSprints: 2,
      },
      // kanban: {
      //   fromWeeksAgo: 6
      // }
    });
    const transformedIssues = [];
    for (let issue of issues) {
      const issueDetails = await jiraService.issueDetails(issue);
      const transformedIssue = issueTransformer(issueDetails);
      transformedIssues.push(transformedIssue);
    }

    console.log(' Calculating metrics...');
    const metrics = metricsService.processAllIssues(transformedIssues);

    console.log(' Writing reports to googlesheets...');
    await writeReport({
      metrics,
      worksheetTitle: 'last 2 sprints',
      onlySprints: true
    });

    console.log('Finished');
  } catch (e) {
    console.log("Error retrieving issue's info from Jira");
    console.error(e);
    process.exit(1);
  }
})();
