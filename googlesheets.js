const { promisify } = require('util');
const GoogleSpreadsheet = require('google-spreadsheet');

class GoogleSheets {
  constructor({ credentials, sheetKey, maxCol }) {
    this.sheetsService = new GoogleSpreadsheet(sheetKey);
    this.credentials = credentials;
    this.targetWorksheet;
    this.maxCol = maxCol;
  }

  setAuth() {
    const auth = promisify(
      this.sheetsService.useServiceAccountAuth.bind(this.sheetsService)
    );

    return auth(this.credentials);
  }

  async getDocumentInfo() {
    const getInfo = promisify(this.sheetsService.getInfo);

    const info = await getInfo();
    console.log(
      '     Loaded document: ' + info.title + ' by ' + info.author.email
    );

    return info;
  }

  async addWorksheet(args) {
    const addWorksheetPromise = promisify(
      this.sheetsService.addWorksheet.bind(this.sheetsService)
    );

    const sheet = await addWorksheetPromise(args);
    this.targetWorksheet = sheet;
  }

  async defineWorksheet(title) {
    const doc = await this.getDocumentInfo();

    const worksheet = doc.worksheets.find(w => w.title === title);

    this.targetWorksheet = worksheet;
  }

  async defineHeaderRow(list) {
    const promise = promisify(this.targetWorksheet.setHeaderRow);

    await promise(list);
  }

  async getCells() {
    const getCellsPromise = promisify(
      this.targetWorksheet.getCells.bind(this.targetWorksheet)
    );

    const cells = await getCellsPromise({
      'min-row': 1,
      'max-row': 50,
      'max-col': this.maxCol,
      'return-empty': true
    });

    return cells;
  }

  async bulkUpdateCells(cells) {
    const bulkPromise = promisify(
      this.targetWorksheet.bulkUpdateCells.bind(this.targetWorksheet)
    );

    await bulkPromise(cells);
  }
}

module.exports = GoogleSheets;
