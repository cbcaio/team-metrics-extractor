const { SPRINT_BLACKLIST } = require('../config');

module.exports = function sprintBlacklist(sprints) {
  const filteredList = sprints.filter(s =>
    SPRINT_BLACKLIST ? !SPRINT_BLACKLIST.includes(s.name) : true
  );

  return filteredList;
};
