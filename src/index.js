require('dotenv').config();
const {
  jiraBaseConfig, 
  kanbanConfig, 
  scrumConfig,
  JIRA_BOARD_TYPE
} = require('./config');
const JiraScrumApi = require('./jira/JiraScrumApi');
const JiraKanbanApi = require('./jira/JiraKanbanApi');
const metricsService = require('./metrics');
const writeReport = require('./writeReport');

console.log('Initializing...');


(async () => {
  try {
    console.log(' Retrieving data from Jira and handling issues details...');

    let metricsInput;

    const boardType = JIRA_BOARD_TYPE;
    switch (boardType) {
      case 'scrum': {
        const jiraService = new JiraScrumApi({
          ...jiraBaseConfig,
          ...scrumConfig,
        });

        metricsInput = await jiraService.getTransformedSprints();

        break;
      }
      case 'kanban': {
        const jiraService = new JiraKanbanApi({
          ...jiraBaseConfig,
          ...kanbanConfig
        });


        metricsInput = await jiraService.getTransformedIssues();
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
