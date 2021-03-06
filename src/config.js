const {
  SHEET_KEY,
  JIRA_URL,
  JIRA_USER,
  JIRA_PASSWORD,
  JIRA_BOARD_ID,
  JIRA_STATUSES,
  JIRA_ESTIMATE_FIELD,
  JIRA_BOARD_TYPE,
  JIRA_ENABLE_ACTIVE_SPRINT,
  JIRA_SPRINTS,
  TEAM_LABELS,
  PROJECTS,
  SPRINT_BLACKLIST,
  JIRA_KANBAN_TIMEBOX
} = process.env;

module.exports = {
  SHEET_KEY: SHEET_KEY,
  JIRA_BOARD_ID: JIRA_BOARD_ID,
  JIRA_STATUSES: JSON.parse(JIRA_STATUSES),
  JIRA_ESTIMATE_FIELD,
  JIRA_BOARD_TYPE,
  maxCol: 9,
  credentials: require('../credentials.json'),
  jiraBaseConfig: {
    JIRA_URL,
    JIRA_USER,
    JIRA_PASSWORD
  },
  kanbanConfig: {
    JIRA_KANBAN_TIMEBOX,
    TEAM_LABELS: TEAM_LABELS ? TEAM_LABELS.split(',') : undefined,
    PROJECTS: PROJECTS ? PROJECTS.split(',') : undefined,
  },
  scrumConfig: {
    JIRA_ENABLE_ACTIVE_SPRINT,
    JIRA_SPRINTS,
    JIRA_BOARD_ID,
    SPRINT_BLACKLIST: SPRINT_BLACKLIST ? SPRINT_BLACKLIST.split(',') : undefined,
  }
};
