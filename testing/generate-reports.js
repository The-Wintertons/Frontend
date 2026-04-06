#!/usr/bin/env node

import ExcelJS from 'exceljs'
import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const resultsDir = path.join(__dirname, 'test-results')
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true })
}

const vitestResultsPath = path.join(resultsDir, 'vitest-results.json')
const teamMember = 'Tom'
const testingFrameworkNote = 'Testing framework used: Vitest with Vue Test Utils.'

const fileMeta = {
  'sidebar.test.ts': { group: 'Sidebar', testingType: 'Unit' },
  'portfolio-dropdown.test.ts': { group: 'Portfolio Dropdown', testingType: 'Unit' },
  'iris-switch.test.ts': { group: 'Iris Switch', testingType: 'Unit' },
  'modals.test.ts': { group: 'Modals', testingType: 'Unit' },
  'countdown-timer.test.ts': { group: 'Countdown Timer', testingType: 'Unit' },
  'data-display.test.ts': { group: 'Data Display', testingType: 'Unit' },
  'integration.test.ts': { group: 'Integration', testingType: 'Integration' },
  'usability.test.ts': { group: 'Usability', testingType: 'Usability' },
}

function runVitest() {
  const result = spawnSync(
    'npx',
    ['vitest', 'run', '--reporter=default', '--reporter=json', `--outputFile=${vitestResultsPath}`],
    { cwd: __dirname, stdio: 'inherit' }
  )

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function loadVitestResults() {
  return JSON.parse(fs.readFileSync(vitestResultsPath, 'utf8'))
}

function normalizeFunctionTask(title) {
  const marker = ' - should '
  if (!title.includes(marker)) return title
  return title.split(marker)[0] ?? title
}

function normalizeScenario(title) {
  const marker = ' - should '
  if (!title.includes(marker)) return title
  return title.split(marker)[1] ?? title
}

function getTestRows(results) {
  const rows = []

  for (const suite of results.testResults ?? []) {
    const fileName = path.basename(suite.name)
    const meta = fileMeta[fileName] ?? { group: fileName.replace(/\.test\.ts$/, ''), testingType: 'Unit' }

    for (const assertion of suite.assertionResults ?? []) {
      const passed = assertion.status === 'passed'
      rows.push({
        group: meta.group,
        testingType: meta.testingType,
        functionTask: normalizeFunctionTask(assertion.title),
        testScenario: normalizeScenario(assertion.title),
        teamMember,
        comments: '',
        finished: passed ? 'X' : '',
        status: passed ? 'PASS' : assertion.status.toUpperCase(),
      })
    }
  }

  return rows
}

function groupRowsForSheet(rows) {
  const grouped = []
  let lastGroup = null

  for (const row of rows) {
    if (row.group !== lastGroup) {
      grouped.push({
        kind: 'group',
        group: row.group,
        testingType: row.testingType,
      })
      lastGroup = row.group
    }

    grouped.push({
      kind: 'test',
      ...row,
    })
  }

  return grouped
}

function getSummary(rows) {
  const totalTests = rows.length
  const passedTests = rows.filter(row => row.status === 'PASS').length
  return {
    totalTests,
    passedTests,
    failedTests: totalTests - passedTests,
  }
}

function escapeCsv(value) {
  return `"${String(value).replaceAll('"', '""')}"`
}

function buildMarkdown(rows) {
  return rows.map(row => {
    if (row.kind === 'group') {
      return `| ${row.group} | ${row.testingType} |  |  |  |  |  |`
    }

    return `|  | ${row.testingType} | ${row.functionTask} | ${row.testScenario} | ${row.teamMember} | ${row.comments} | ${row.finished} |`
  }).join('\n')
}

function buildCsv(rows) {
  const lines = ['Group,Testing Type,Function/Task,Test Scenario,Team Member,Comment/Issues,Finished']

  for (const row of rows) {
    if (row.kind === 'group') {
      lines.push([row.group, row.testingType, '', '', '', '', ''].map(escapeCsv).join(','))
    } else {
      lines.push(['', row.testingType, row.functionTask, row.testScenario, row.teamMember, row.comments, row.finished].map(escapeCsv).join(','))
    }
  }

  return lines.join('\n')
}

async function writeExcelReport(rows) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Tom Winterton'
  workbook.created = new Date()
  workbook.modified = new Date()

  const worksheet = workbook.addWorksheet('Testing Plan')
  worksheet.views = [{ state: 'frozen', ySplit: 1 }]
  worksheet.columns = [
    { width: 28 },
    { width: 16 },
    { width: 24 },
    { width: 48 },
    { width: 14 },
    { width: 32 },
    { width: 10 },
  ]

  const header = worksheet.addRow(['Group', 'Testing Type', 'Function/Task', 'Test Scenario', 'Team Member', 'Comment/Issues', 'Finished'])
  header.eachCell((cell) => {
    cell.font = { bold: true }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF7F7F7F' } },
      left: { style: 'thin', color: { argb: 'FF7F7F7F' } },
      bottom: { style: 'thin', color: { argb: 'FF7F7F7F' } },
      right: { style: 'thin', color: { argb: 'FF7F7F7F' } },
    }
  })

  const groupFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFAFCBEA' } }
  const detailBorder = {
    top: { style: 'thin', color: { argb: 'FF7F7F7F' } },
    left: { style: 'thin', color: { argb: 'FF7F7F7F' } },
    bottom: { style: 'thin', color: { argb: 'FF7F7F7F' } },
    right: { style: 'thin', color: { argb: 'FF7F7F7F' } },
  }

  for (const row of rows) {
    const values = row.kind === 'group'
      ? [row.group, row.testingType, '', '', '', '', '']
      : ['', row.testingType, row.functionTask, row.testScenario, row.teamMember, row.comments, row.finished]

    const excelRow = worksheet.addRow(values)
    excelRow.height = row.kind === 'group' ? 20 : 19

    excelRow.eachCell((cell, colNumber) => {
      cell.border = detailBorder
      cell.alignment = { vertical: 'middle', horizontal: colNumber === 7 ? 'center' : 'left', wrapText: true }
      if (row.kind === 'group') {
        cell.fill = groupFill
        cell.font = { bold: true }
      }
    })
  }

  await workbook.xlsx.writeFile(path.join(resultsDir, 'test-report.xlsx'))
}

runVitest()

const vitestResults = loadVitestResults()
const testRows = getTestRows(vitestResults)
const sheetRows = groupRowsForSheet(testRows)
const summary = getSummary(testRows)

const markdownReport = `# Testing Plan Assignment

Due: 4/10/2026 @ 11:59 PM

${testingFrameworkNote}

The objective of the testing plan is to cover the elements of the project which need to be tested. This plan focuses on logical completeness, including positive and negative cases where applicable.

| Group | Testing Type | Function/Task | Test Scenario | Team Member | Comment/Issues | Finished |
|---|---|---|---|---|---|---|
${buildMarkdown(sheetRows)}

## Summary

- Total items: ${summary.totalTests}
- Passed: ${summary.passedTests}
- Failed: ${summary.failedTests}
- Team member: ${teamMember}
`

const csvReport = buildCsv(sheetRows)

const jsonReport = JSON.stringify({
  title: 'Testing Plan Assignment',
  dueDate: '4/10/2026 @ 11:59 PM',
  testingFrameworkNote,
  teamMember,
  summary,
  rows: sheetRows,
}, null, 2)

const textReport = `TESTING PLAN ASSIGNMENT
Due: 4/10/2026 @ 11:59 PM

${testingFrameworkNote}

Total items: ${summary.totalTests}
Passed: ${summary.passedTests}
Failed: ${summary.failedTests}
Team member: ${teamMember}

Group | Testing Type | Function/Task | Test Scenario | Team Member | Comment/Issues | Finished
${buildMarkdown(sheetRows).replaceAll('|---|---|---|---|---|---|---|', '').trim()}
`

fs.writeFileSync(path.join(resultsDir, 'test-report.md'), markdownReport)
fs.writeFileSync(path.join(resultsDir, 'test-report.csv'), csvReport)
fs.writeFileSync(path.join(resultsDir, 'test-report.json'), jsonReport)
fs.writeFileSync(path.join(resultsDir, 'test-summary.txt'), textReport)
await writeExcelReport(sheetRows)

console.log('✓ Markdown report generated: test-results/test-report.md')
console.log('✓ CSV report generated: test-results/test-report.csv')
console.log('✓ JSON report generated: test-results/test-report.json')
console.log('✓ Excel report generated: test-results/test-report.xlsx')
console.log('✓ Text summary generated: test-results/test-summary.txt')
console.log(`\nReports Summary:`)
console.log(`  Total Items: ${summary.totalTests}`)
console.log(`  Passed: ${summary.passedTests}`)
console.log(`  Failed: ${summary.failedTests}`)
console.log(`  Success Rate: ${Math.round((summary.passedTests / summary.totalTests) * 100)}%`)
