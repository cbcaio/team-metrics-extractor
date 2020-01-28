const Googlesheets = require('./Googlesheets');
const { SHEET_KEY, maxCol, credentials } = require('./config');

function writeSprintSpecifics(metrics, changeCell) {
  console.log('   Writing Sprint Specifics...');

  const { objetiveAccomplished, totalIssues, totalIssuesResolved } = metrics;

  changeCell(7, 1, { value: 'Sprint' });

  changeCell(8, 1, { value: 'objetivo cumprido' });
  changeCell(8, 2, { value: objetiveAccomplished ? 'sim' : 'não' });

  changeCell(9, 1, { value: '% da sprint finalizada' });
  const finishedPercentage = (
    (totalIssuesResolved / totalIssues) *
    100
  ).toFixed(2);
  changeCell(9, 2, { value: `${finishedPercentage}%` });
}

function writeSummary(metrics, changeCell) {
  console.log('   Writing Summary...');

  const { alignmentWithOkr, velocity, cycleTime, leadTime } = metrics;

  changeCell(2, 1, { value: 'alinhamento com OKR' });
  const alignmentPercentage = (alignmentWithOkr * 100).toFixed(2);
  changeCell(2, 2, { value: `${alignmentPercentage}%` });

  changeCell(3, 1, { value: 'velocity do time' });
  changeCell(3, 2, { value: velocity });

  changeCell(4, 1, { value: 'cycle time médio' });
  changeCell(4, 2, { value: cycleTime.mean.readable });

  changeCell(5, 1, { value: 'lead time médio' });
  changeCell(5, 2, { value: leadTime.mean.readable });
}

function writeDetails(metrics, changeCell) {
  console.log('   Writing Details...');

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
      value: cycleTime.perSize[size].mean.readable
    });
    changeCell(lastRowManuallyUsed + (index + 1), 6, {
      value: cycleTime.perSize[size].mean.inSeconds
    });
  });

  changeCell(lastRowManuallyUsed, 7, {
    value: 'lead time médio por tamanho estimado'
  });

  Object.keys(leadTime.perSize).forEach((size, index) => {
    changeCell(lastRowManuallyUsed + (index + 1), 7, {
      value: size
    });
    changeCell(lastRowManuallyUsed + (index + 1), 8, {
      value: leadTime.perSize[size].mean.readable
    });
    changeCell(lastRowManuallyUsed + (index + 1), 9, {
      value: leadTime.perSize[size].mean.inSeconds
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

module.exports = async function({ metrics, worksheetTitle, onlySprints }) {
  try {
    const googlesheets = new Googlesheets({
      credentials,
      sheetKey: SHEET_KEY,
      maxCol
    });

    await googlesheets.setAuth();
    await findOrCreateWorksheet(googlesheets, worksheetTitle);

    await googlesheets.defineHeaderRow(['Resumo', '', '', 'Detalhamento', '']);

    const cells = await googlesheets.getCells();

    function changeCell(line, col, values) {
      const lineMaxIndex = line * (maxCol - 1) + line - 1;
      const colIndexAdjustment = maxCol - col;

      Object.assign(cells[lineMaxIndex - colIndexAdjustment], values);
    }

    writeSummary(metrics, changeCell);
    writeDetails(metrics, changeCell);
    if (onlySprints) {
      writeSprintSpecifics(metrics, changeCell);
    }

    await googlesheets.bulkUpdateCells(cells);
  } catch (e) {
    console.log('Error while writing report');
    console.error(e);
    process.exit(1);
  }
};
