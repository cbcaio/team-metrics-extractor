const { promisify } = require('util');
const GoogleSpreadsheet = require('google-spreadsheet');

class GoogleSheets {
  constructor({credentials, sheetKey}) {
    this.doc = new GoogleSpreadsheet(sheetKey);
    this.sheet;

    this.doc.useServiceAccountAuth(credentials)

    console.log('Loaded Google Sheets Class');
  }

  setAuth(step) {
    doc.useServiceAccountAuth(credentials, step);
  }

  async getSheetInfo(step) {
    await promisify(doc.useServiceAccountAuth)(credentials);
    doc.getInfo(function(err, info) {
      sheet = info.worksheets[0];
      step();
    });
  }

  async loadSheet(sheetIndex) {
    await promisify(doc.useServiceAccountAuth)(credentials);
    const info = await promisify(doc.getInfo)();
    sheet = info.worksheets[sheetIndex];
  }

  async getRow(code) {
    try {
      await promisify(doc.useServiceAccountAuth)(credentials);
      const info = await promisify(doc.getInfo)();
      sheet = info.worksheets[0];
      return await promisify(sheet.getRows)({
        query: `code=${code}`
      });
    } catch (exception) {
      console.error(`Get row exception: ${exception}`);
    }
  }

  async update(entity) {
    try {
      await this.loadSheet(0);
      entity.save();
    } catch (exception) {
      console.error(`Update row exception: ${exception}`);
    }
  }

  mapUpdate(task, issue) {
    task.size = issue.size;
    task.leadtimestart = issue.leadtimestart;
    task.leadtimestop = issue.leadtimestop;
    task.devleadtimestart = issue.devleadtimestart;
    task.devleadtimestop = issue.devleadtimestop;
    task.okraligned = issue.okraligned;
    task.weekarrival = `=IF(G${task.row} = "";"";WEEKNUM(G${task.row};Configurations!B1)&"/"&YEAR(G${task.row}))`;
    task.weekdevleadtimestart = `=IF(OR(J${task.row} = ""; K${task.row} = "");"";WEEKNUM(J${task.row};Configurations!B1)&"/"&YEAR(J${task.row}))`;
    task.weekdevleadtimestop = `=IF(K${task.row} = "";"";WEEKNUM(K${task.row};Configurations!B1)&"/"&YEAR(K${task.row}))`;
    task.leadtime = `=IF(OR(H${task.row} = "";I${task.row} = "");"";I${task.row}-H${task.row}+1)`;
    task.devleadtime = `=IF(OR(J${task.row} = "";K${task.row} = "");"";K${task.row}-J${task.row}+1)`;
    // task.leadtime = `=IF(AND(H${task.row} <> ""; I${task.row} <> "");(I${task.row}-H${task.row}) + 1- IF(DATEDIF(H${task.row}; I${task.row};"D") = 0; 30; 0); "")`;
    // task.devleadtime = `=IF(AND(J${task.row} <> ""; K${task.row} <> "");(K${task.row}-J${task.row}) + 1 - IF(DATEDIF(J${task.row}; K${task.row};"D") = 0; 30; 0); "")`;
    task.row = '=ROW()';
    return task;
  }

  async upinsert(issue) {
    let jiraTask = await this.getRow(issue.code);
    if (jiraTask.length > 0) {
      console.log(`Updating issue ${issue.code}`);
      let task = jiraTask[0];
      task = this.mapUpdate(task, issue);
      await this.update(task);
    } else {
      console.log(`Creating issue ${issue.code}`);
      await this.create(issue);
    }
  }

  async create(entity) {
    try {
      await this.loadSheet(0);
      await promisify(sheet.addRow)(entity);
    } catch (exception) {
      console.error(`Create row exception: ${exception}`);
    }
  }
}

module.exports = GoogleSheets;
