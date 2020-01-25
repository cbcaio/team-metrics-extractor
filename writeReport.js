const Googlesheets = require('./Googlesheets');
const { SHEET_KEY } = require('./config');
const credentials = require('./credentials.json');

function writeSprintSummary(metrics, changeCell) {
  console.log('   Writing Sprint Summary...');

  const {
    objetiveAccomplished,
    alignmentWithOkr,
    velocity,
    cycleTime,
    leadTime,
    totalIssues,
    totalIssuesResolved
  } = metrics;

  changeCell(2, 1, { value: 'objetivo cumprido' });
  changeCell(2, 2, { value: objetiveAccomplished ? 'sim' : 'não' });

  changeCell(3, 1, { value: '% da sprint finalizada' });
  changeCell(3, 2, { value: totalIssuesResolved / totalIssues });

  changeCell(4, 1, { value: 'alinhamento com OKR' });
  changeCell(4, 2, { value: alignmentWithOkr });

  changeCell(5, 1, { value: 'velocity do time' });
  changeCell(5, 2, { value: velocity });

  changeCell(6, 1, { value: 'cycle time médio' });
  changeCell(6, 2, { value: cycleTime.mean });

  changeCell(7, 1, { value: 'lead time médio' });
  changeCell(7, 2, { value: leadTime.mean });
}

function writeSprintDetails(metrics, changeCell) {
  console.log('   Writing Sprint Details...');

  const {
    cycleTime,
    leadTime,
    totalIssues,
    totalIssuesResolved,
    totalStories,
    totalTasks,
    totalSubTasks
  } = metrics;

  changeCell(2, 4, { value: 'total de issues' });
  changeCell(2, 5, { value: totalIssues });

  changeCell(3, 4, { value: 'total de issue finalizados' });
  changeCell(3, 5, { value: totalIssuesResolved });

  changeCell(4, 4, { value: 'total de Historias' });
  changeCell(4, 5, { value: totalStories });

  changeCell(5, 4, { value: 'total de Tasks' });
  changeCell(5, 5, { value: totalTasks });

  changeCell(6, 4, { value: 'total de SubTasks' });
  changeCell(6, 5, { value: totalSubTasks });

  changeCell(7, 4, { value: 'cycle time médio por tamanho estimado' });

  let lastRowManuallyUsed = 7;
  Object.keys(cycleTime.perSize).forEach((size, index) => {
    changeCell(lastRowManuallyUsed + (index + 1), 4, {
      value: size
    });
    changeCell(lastRowManuallyUsed + (index + 1), 5, {
      value: cycleTime.perSize[size].mean
    });
  });

  const lastRowUsed =
    lastRowManuallyUsed + Object.keys(cycleTime.perSize).length;
  changeCell(lastRowUsed + 1, 4, {
    value: 'lead time médio por tamanho estimado'
  });

  lastRowManuallyUsed = lastRowUsed + 1;
  Object.keys(leadTime.perSize).forEach((size, index) => {
    changeCell(lastRowManuallyUsed + (index + 1), 4, {
      value: size
    });
    changeCell(lastRowManuallyUsed + (index + 1), 5, {
      value: leadTime.perSize[size].mean
    });
  });
}

async function findOrCreateWorksheet(googlesheets, title) {
  try {
    await googlesheets.addWorksheet({
      title: title
    });
  } catch (e) {
    if (!e.includes('Error: HTTP error 400 (Bad Request)')) {
      throw e;
    }
    await googlesheets.defineWorksheet(title);
  }
}

module.exports = async function({ metrics, worksheetTitle }) {
  try {
    const googlesheets = new Googlesheets({
      credentials,
      sheetKey: SHEET_KEY
    });

    await googlesheets.setAuth();
    await findOrCreateWorksheet(googlesheets, worksheetTitle);

    await googlesheets.defineHeaderRow([
      'Resumo da Sprint',
      '',
      '',
      'Detalhamento da Sprint',
      ''
    ]);

    const cells = await googlesheets.getCells();

    function changeCell(line, col, values) {
      const lineMaxIndex = line * 4 + line - 1;
      const colIndexAdjustment = 5 - col;

      Object.assign(cells[lineMaxIndex - colIndexAdjustment], values);
    }

    writeSprintSummary(metrics, changeCell);
    writeSprintDetails(metrics, changeCell);

    await googlesheets.bulkUpdateCells(cells);
  } catch (e) {
    console.log('Error while writing report');
    console.error(e);
    process.exit(1);
  }
};
