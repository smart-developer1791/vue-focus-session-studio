import { test, expect } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { sample } from '../../src/domain/session.ts'
const key = 'focus-session-studio:FS1'
test('captured intervals survive plan edits and pauses while getters update the next phase', async ({
  page,
}) => {
  await page.clock.install()
  await page.goto('/')
  await page.getByLabel('Focus · minutes', { exact: true }).fill('1')
  await page.getByLabel('Rest · minutes', { exact: true }).fill('1')
  await page.getByLabel('Focus cycles', { exact: true }).fill('2')
  await page.getByRole('button', { name: 'Start focus', exact: true }).click()
  await page.clock.fastForward(10000)
  await expect(page.getByRole('timer')).toHaveText('00:50')
  await page.getByLabel('Focus · minutes', { exact: true }).fill('2')
  await page.getByLabel('Rest · minutes', { exact: true }).fill('2')
  await expect(page.getByRole('timer')).toHaveText('00:50')
  await expect(page.locator('[data-ui~="next-phase"]')).toContainText('2 min')
  await page.getByRole('button', { name: 'Pause interval', exact: true }).click()
  await page.clock.fastForward(120000)
  await expect(page.getByRole('timer')).toHaveText('00:50')
  await page.getByRole('button', { name: 'Resume interval', exact: true }).click()
  await page.clock.fastForward(50000)
  await expect(page.getByRole('button', { name: 'Start rest', exact: true })).toBeVisible()
  await expect(page.getByRole('timer')).toHaveText('02:00')
  await expect(page.locator('[data-ui~="journal-list"] article')).toHaveCount(1)
  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key)
  expect(stored.journal[0].seconds).toBe(60)
  expect(stored.rest).toBe(2)
  await page.clock.fastForward(180000)
  await expect(page.locator('[data-ui~="journal-list"] article')).toHaveCount(1)
})
test('completed intervals export as real JSON and CSV while reload resets only timer progress', async ({
  page,
}) => {
  await page.clock.install()
  await page.goto('/')
  await page.getByLabel('Focus · minutes', { exact: true }).fill('1')
  await page.getByLabel('Focus cycles', { exact: true }).fill('1')
  await page.getByRole('button', { name: 'Start focus', exact: true }).click()
  await page.clock.fastForward(60000)
  await expect(page.locator('[data-ui~="clock-actions"] [data-ui~="small-pill"]')).toHaveText(
    'COMPLETE',
  )
  await expect(page.locator('[data-ui~="journal-list"] article')).toHaveCount(1)
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  const jsonWait = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download session JSON', exact: true }).click()
  const json = JSON.parse(await readFile((await (await jsonWait).path())!, 'utf8'))
  expect(json.journal[0].seconds).toBe(60)
  expect(json.provenance.marker).toMatch(/^FS-[A-F0-9]{8}$/)
  const csvWait = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download journal CSV', exact: true }).click()
  const csv = await csvWait
  expect(csv.suggestedFilename()).toMatch(/FS-[A-F0-9]{8}\.csv$/)
  expect(await readFile((await csv.path())!, 'utf8')).toContain('"work","Focus 1 of 1"')
  await page.reload()
  await expect(page.locator('[data-ui~="clock-actions"] [data-ui~="small-pill"]')).toHaveText(
    'READY',
  )
  await expect(page.getByRole('timer')).toHaveText('01:00')
  await expect(page.locator('[data-ui~="journal-list"] article')).toHaveCount(1)
})
test('tasks persist and rejected imports or invalid direct edits keep the last valid plan', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Small tasks', exact: true }).click()
  await page.getByRole('button', { name: 'Add a small task', exact: true }).click()
  await page.getByLabel('Task title', { exact: true }).last().fill('Read one useful page')
  await page.getByLabel('Complete Read one useful page', { exact: true }).check()
  await page.reload()
  await page.getByRole('button', { name: 'Small tasks', exact: true }).click()
  await expect(page.getByLabel('Complete Read one useful page', { exact: true })).toBeChecked()
  await page.getByRole('button', { name: 'Import', exact: true }).click()
  await page.getByLabel('Or paste FS/1 JSON').fill(JSON.stringify({ ...sample, cycles: 0 }))
  await page.getByRole('button', { name: 'Import session', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('1–8 cycles')
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click()
  await expect(page.getByLabel('Task title', { exact: true })).toHaveCount(4)
  await page.getByRole('button', { name: 'The plan', exact: true }).click()
  await page.getByLabel('Focus · minutes', { exact: true }).fill('0')
  await expect(page.getByRole('button', { name: 'Export', exact: true })).toBeDisabled()
  await expect(page.getByRole('timer')).toHaveText('25:00')
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).work, key)).toBe(25)
})
test('mobile tab changes and confirmed restart keep panels stable and completed history intact', async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 850 })
  await page.clock.install()
  await page.goto('/')
  const editor = await page.locator('[data-ui~="editor-pane"]').boundingBox(),
    stage = await page.locator('[data-ui~="session-stage"]').boundingBox()
  await page.getByRole('button', { name: 'Small tasks', exact: true }).click()
  await page.getByRole('button', { name: 'Add a small task', exact: true }).click()
  expect((await page.locator('[data-ui~="editor-pane"]').boundingBox())!.height).toBe(
    editor!.height,
  )
  expect((await page.locator('[data-ui~="session-stage"]').boundingBox())!.height).toBe(
    stage!.height,
  )
  await page.getByRole('button', { name: 'The plan', exact: true }).click()
  await page.getByLabel('Focus · minutes', { exact: true }).fill('1')
  await page.getByRole('button', { name: 'Start focus', exact: true }).click()
  await page.clock.fastForward(60000)
  await page.getByRole('button', { name: 'Restart session', exact: true }).click()
  await page.getByRole('button', { name: 'Restart timer', exact: true }).click()
  await expect(page.getByRole('timer')).toHaveText('01:00')
  await expect(page.locator('[data-ui~="journal-list"] article')).toHaveCount(1)
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
})
