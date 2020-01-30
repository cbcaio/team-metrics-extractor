const { promisify } = require('util');
const GoogleSpreadsheet = require('google-spreadsheet');

class GoogleSheets {
  constructor({ credentials, sheetKey, maxCol }) {
    this.sheetsService = new GoogleSpreadsheet(sheetKey);
    this.credentials = credentials;
    this.targetWorksheet;
    this.maxCol = maxCol;
    this.cells;
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

  async loadTargetWorksheetCells() {
    const getCellsPromise = promisify(
      this.targetWorksheet.getCells.bind(this.targetWorksheet)
    );

    const cells = await getCellsPromise({
      'min-row': 1,
      'max-row': 50,
      'max-col': this.maxCol,
      'return-empty': true
    });

    this.cells = cells;

    return this.cells;
  }

  changeCell(line, col, values) {
    const lineMaxIndex = line * (this.maxCol - 1) + line - 1;
    const colIndexAdjustment = this.maxCol - col;

    Object.assign(this.cells[lineMaxIndex - colIndexAdjustment], values);
  }

  async bulkUpdateCells() {
    const bulkPromise = promisify(
      this.targetWorksheet.bulkUpdateCells.bind(this.targetWorksheet)
    );

    await bulkPromise(this.cells);
  }

  async findOrCreateWorksheet(title) {
    try {
      await this.addWorksheet({
        title: title
      });
    } catch (e) {
      if (!e.includes('Error: HTTP error 400 (Bad Request)')) {
        throw e;
      }
      await this.defineWorksheet(title);
    }
  }
}

module.exports = GoogleSheets;
