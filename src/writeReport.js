const Googlesheets = require('./Googlesheets');
const { humanFriendlyTimeFormat } = require('./metrics/helpers');
const { SHEET_KEY, maxCol, credentials } = require('./config');

function writeSprintSummary(sprint, changeCell) {
  const { metrics } = sprint;
  const lastUsedLine = writeSummary(metrics, changeCell) + 2;

  changeCell(lastUsedLine + 1, 1, { value: 'Específicos da Sprint' });

  changeCell(lastUsedLine + 2, 1, { value: 'velocity' });
  changeCell(lastUsedLine + 2, 2, { value: metrics.velocity });

  changeCell(lastUsedLine + 3, 1, { value: 'issues carregados' });
  changeCell(lastUsedLine + 3, 2, { value: metrics.carriedOnIssues });

  changeCell(lastUsedLine + 4, 1, { value: 'objetivo atingido' });
  changeCell(lastUsedLine + 4, 2, {
    value: metrics.objetiveAccomplished ? 'sim' : 'não'
  });

  writeDetails(sprint.metrics, changeCell);
}

function writeSummary(metrics, changeCell) {
  console.log('   Writing Summary...');

  const {
    alignmentWithOkr,
    cycleTime,
    leadTime,
    totalStories,
    totalTasks,
    totalSubTasks,
    finishedPercentage,
    throughput
  } = metrics;

  changeCell(2, 1, { value: '% alinhamento com OKR' });
  const alignmentPercentage = (alignmentWithOkr * 100).toFixed(2);
  changeCell(2, 2, { value: `${alignmentPercentage}%` });

  changeCell(3, 1, { value: '% issues finalizados' });
  changeCell(3, 2, { value: (finishedPercentage * 100).toFixed(2) });

  changeCell(4, 1, { value: 'lead time médio' });
  changeCell(4, 2, { value: humanFriendlyTimeFormat(leadTime.mean).readable });

  changeCell(5, 1, { value: 'cycle time médio' });
  changeCell(5, 2, { value: humanFriendlyTimeFormat(cycleTime.mean).readable });

  changeCell(6, 1, { value: 'total stories' });
  changeCell(6, 2, { value: totalStories });

  changeCell(7, 1, { value: 'total tasks' });
  changeCell(7, 2, { value: totalTasks });

  changeCell(8, 1, { value: 'total totalSubTasks' });
  changeCell(8, 2, { value: totalSubTasks });

  changeCell(9, 1, { value: 'throughput' });
  changeCell(9, 2, { value: throughput });

  const lastUsedLine = 9;

  return lastUsedLine;
}
function writeDetails(metrics, changeCell) {
  console.log('   Writing Details...');

  const { cycleTime, leadTime } = metrics;

  changeCell(2, 4, { value: 'cycle time médio por tamanho estimado' });

  let lastRowManuallyUsed = 2;
  Object.keys(cycleTime.perSize).forEach((size, index) => {
    changeCell(lastRowManuallyUsed + (index + 1), 4, {
      value: size
    });
    changeCell(lastRowManuallyUsed + (index + 1), 5, {
      value: humanFriendlyTimeFormat(cycleTime.perSize[size].mean).readable
    });
    changeCell(lastRowManuallyUsed + (index + 1), 6, {
      value: humanFriendlyTimeFormat(cycleTime.perSize[size].mean).inSeconds
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
      value: humanFriendlyTimeFormat(leadTime.perSize[size].mean).readable
    });
    changeCell(lastRowManuallyUsed + (index + 1), 9, {
      value: humanFriendlyTimeFormat(leadTime.perSize[size].mean).inSeconds
    });
  });
}

function writeOverallMetrics(metrics, changeCell) {
  console.log('   Writing Overall...');
  const {
    meanVelocity,
    meanThroughput,
    meanFinishedPercentage,
    meanCarriedOnIssues,
    meanCycleTime,
    meanLeadTime
  } = metrics;

  changeCell(2, 1, { value: 'Cycle Time Médio do Time' });
  changeCell(2, 2, { value: meanCycleTime.readable });
  changeCell(3, 1, { value: 'Lead Time Médio do Time' });
  changeCell(3, 2, { value: meanLeadTime.readable });
  changeCell(4, 1, { value: '% de issues completos médio por sprint' });
  changeCell(4, 2, { value: meanFinishedPercentage });
  changeCell(5, 1, { value: 'média de issues carregados por sprint' });
  changeCell(5, 2, { value: meanCarriedOnIssues });
  changeCell(6, 1, { value: 'throughput' });
  changeCell(6, 2, { value: meanThroughput });
  if (meanVelocity) {
    changeCell(7, 1, { value: 'velocity' });
    changeCell(7, 2, { value: meanVelocity });
  }
}

module.exports = async function({ metrics, worksheetTitle, boardType }) {
  try {
    const googlesheets = new Googlesheets({
      credentials,
      sheetKey: SHEET_KEY,
      maxCol
    });

    await googlesheets.setAuth();

    switch (boardType) {
      case 'kanban': {
        break;
      }
      case 'scrum':
      default: {
        const { sprints } = metrics;

        for (const sprint of sprints) {
          await googlesheets.findOrCreateWorksheet(
            `${sprint.id} - ${sprint.name}`
          );
          await googlesheets.defineHeaderRow([
            'Resumo',
            '',
            '',
            'Detalhamento',
            ''
          ]);

          await googlesheets.loadTargetWorksheetCells();

          writeSprintSummary(
            sprint,
            googlesheets.changeCell.bind(googlesheets)
          );

          await googlesheets.bulkUpdateCells();
        }

        await googlesheets.findOrCreateWorksheet('Resultado');
        await googlesheets.defineHeaderRow(['Situação Atual']);

        await googlesheets.loadTargetWorksheetCells();

        writeOverallMetrics(
          metrics,
          googlesheets.changeCell.bind(googlesheets)
        );

        await googlesheets.bulkUpdateCells();

        break;
      }
    }
  } catch (e) {
    console.log('Error while writing report');
    console.error(e);
    process.exit(1);
  }
};
