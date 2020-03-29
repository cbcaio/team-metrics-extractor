# The Team Metrics Extractor

Se voce usa o Jira como ferramenta de escolha, porém não está satisfeito com as métricas disponibizadas pela plataforma (seja lá por quais motivos) talvez esse projeto era o que voce estava procurando!

## O que temos aqui?

### Features:

- Script que conecta na API do Jira para gerar relatórios
- Fácilmente customizável e estruturado para fácil leitura
- Transformer responsável por extrair apenas os dados de interesse das Issues do Jira
- Gerador de Google Spreadsheet ([configurar permissões](https://www.npmjs.com/package/google-spreadsheet#service-account-recommended-method))

### Métricas extraidas:

*Resumo da Sprint*

  - objetivo cumprido
  - % da sprint finalizada
  - alinhamento com OKR
  - velocity do time
  - cycle time médio
  - lead time médio

*Detalhes da Sprint*

  - total de issues
  - total de issue finalizados
  - total de Historias
  - total de Tasks
  - total de SubTasks
  - cycle time médio por tamanho estimado
  - lead time médio por tamanho estimado

## Como configurar?

Crie um arquivo `.env` na raiz do projeto com os dados apropriados seguindo o modelo.

```
  JIRA_URL=https://jirasoftware.catho.com.br/rest/api/2
  JIRA_USER=jira.username
  JIRA_PASSWORD=123456
  JIRA_BOARD_ID=x
  JIRA_STATUSES={"Open": "To Do", "InProgress": "In Progress", "Resolved": "Done", "Canceled": "Cancelled"}
  JIRA_ESTIMATE_FIELD=
  JIRA_BOARD_TYPE=scrum ou kanban
  JIRA_ENABLE_ACTIVE_SPRINT=1 ou 0
  JIRA_SPRINTS=x
  SHEET_KEY=axasdqwewq1231aqeq21313
  TEAM_LABELS=""label","label2""
  PROJECTS=""Projeto 1","Projeto 2""
```

- Explicação:
  `JIRA_BOARD_ID`: board que será usado como referência para as métricas
  `JIRA_STATUSES`: dependendo da configuração do seu jira, será necessário mudar o "nome" dos status utilizados
  `JIRA_ESTIMATE_FIELD`: campo usado para as estimativas (`customfield_***`)
  `JIRA_BOARD_TYPE`: indica se seu board é scrum ou kanban
  `JIRA_ENABLE_ACTIVE_SPRINT`: indica se a sprint atual (apenas para board type `scrum`) deverá ser levada em consideração nas métricas
  `JIRA_SPRINTS`: quantidade de sprints que deve ser considerada para gerar as métricas
  `SHEET_KEY`: é aquela chave que fica na url docs.google.com/spreadsheets/d/[ALGUMA COISA AQUI]
  `TEAM_LABELS`: labels do jira, usadas para filtrar issues que serão contabilizadas
  `PROJECTS`: nomes dos projetos do jira, usados para filtrar issues que serão contabilizadas

## Como executar?

Siga os passos:

  1. `nvm use` ou `nvm install`
  1. `npm i`
  2. Cria seu arquivo `.env`
  3. Crie seu arquivo `credentials.json`
  4. `npm run start`

## Próximos Passos

- Adicionar opção para relátorio por time-range
- Melhorar customização para outros times
- Descobrir se é possível formatar estilo da planilha


## Importante

Para funcionar a escrita no googlesheets, é necessário compartilhar a planilha destino com o email incluso no arquivo `credentials.json` gerado pelo Google (campo client_email).
