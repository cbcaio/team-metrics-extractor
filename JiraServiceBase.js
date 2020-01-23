require('dotenv').config();
const axios = require('axios');

class JiraServiceBase {
  constructor(config) {
    this.jqlQuery = config.QUERY;
    this.apiUrl = config.JIRA_URL;
    this.user = config.JIRA_USER;
    this.password = config.JIRA_PASSWORD;

    console.log('Loaded Jira Class');
  }

  auth() {
    return {
      auth: {
        username: this.user,
        password: this.password
      }
    };
  }

  async request(apiRelativePath) {
    return axios({
      method: 'get',
      url: `${this.apiUrl}${apiRelativePath}`,
      withCredentials: true,
      ...this.auth()
    });
  }
}

module.exports = JiraServiceBase;
