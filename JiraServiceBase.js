require('dotenv').config();
const axios = require('axios');

class JiraServiceBase {
  constructor(config) {
    this.jqlQuery = config.QUERY;
    this.apiUrl = config.JIRA_URL;
    this.user = config.JIRA_USER;
    this.password = config.JIRA_PASSWORD;
    this.restAgileV1Url = '/rest/agile/1.0';
    this.restV2Url = '/rest/api/2';
  }

  auth() {
    return {
      auth: {
        username: this.user,
        password: this.password
      }
    };
  }

  async request({
    apiRelativePath,
    version
  }) {
    const baseUrl = this.apiUrl;
    const versionUrl = version === 1 ? this.restAgileV1Url : this.restV2Url;

    return axios({
      method: 'get',
      url: `${baseUrl}${versionUrl}${apiRelativePath}`,
      withCredentials: true,
      ...this.auth()
    });
  }
}

module.exports = JiraServiceBase;
