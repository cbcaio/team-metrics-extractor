require('dotenv').config();
const config = require('./config');
const sprintBlacklistFilter = require('./filters/sprintBlacklist');
const JiraScrumApi = require('./jira/JiraScrumApi');
const JiraKanbanApi = require('./jira/JiraKanbanApi');
const metricsService = require('./metrics');
const writeReport = require('./writeReport');

console.log('Initializing...');
const args = ['scrum', '0', '5'];
// const args = ['kanban', '6w'];

(async () => {
  try {
    console.log(' Retrieving data from Jira and handling issues details...');

    let metricsInput;

    const boardType = args[0];
    switch (boardType) {
      case 'scrum': {
        const jiraService = new JiraScrumApi({
          ...config,
          sprintBlacklistFilter
        });
        const [includeActiveSprints, fromLastXSprints] = args.slice(1);

        const sprints = await jiraService.getSprints({
          fromLastXSprints: Number(fromLastXSprints),
          includeActiveSprints: includeActiveSprints === '1'
        });

        const sprintIssues = await jiraService.getIssuesInSprints(
          sprints.map(s => s.id)
        );

        const sprintsWithIssues = sprints.map((sprint, i) => ({
          ...sprint,
          issues: sprintIssues[i]
        }));

        metricsInput = sprintsWithIssues;

        break;
      }
      case 'kanban': {
        const jiraService = new JiraKanbanApi(config);

        const [fromXAgo] = args.slice(1);
        const issues = await jiraService.getIssues({
          fromXAgo
        });

        metricsInput = issues;
        break;
      }
      default:
        console.error('Invalid arg');
        process.exit(1);
    }

    console.log(' Calculating metrics...');
    const metrics = metricsService(metricsInput, boardType);

    console.log(' Writing reports to googlesheets...');
    await writeReport({
      metrics,
      worksheetTitle: 'Kanban Board',
      boardType
    });

    console.log('Finished');
  } catch (e) {
    console.log("Error retrieving issue's info from Jira");
    console.error(e);
    process.exit(1);
  }
})();
