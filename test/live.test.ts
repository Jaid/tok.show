import type {Browser, KeyInput, Page} from 'puppeteer-core'
import type {PreviewServer} from 'vite'

import {afterAll, beforeAll, describe, expect, test} from 'bun:test'
import {resolve} from 'node:path'

import {launch} from 'puppeteer-core'
import {preview} from 'vite'

// Run against a built app with `bun run test-live`.
describe.skipIf(!Bun.env.target)('number shortcuts in the browser', () => {
  let browser: Browser
  let server: PreviewServer
  let url: string
  beforeAll(async () => {
    server = await preview({
      configFile: false,
      build: {outDir: resolve(Bun.env.target!)},
      preview: {
        host: '127.0.0.1',
        port: 0,
      },
    })
    url = server.resolvedUrls!.local[0]!
    browser = await launch({
      executablePath: Bun.env.CHROME_PATH ?? Bun.which('chromium') ?? Bun.which('google-chrome') ?? undefined,
      args: ['--no-sandbox'],
      headless: true,
    })
  })
  afterAll(async () => {
    await browser?.close()
    await new Promise<void>((resolve, reject) => {
      if (!server) {
        resolve()
        return
      }
      server.httpServer.close(error => (error ? reject(error) : resolve()))
    })
  })
  const session = async (page: Page) => page.$eval('a[title^="Duplicate or share"]', link => Object.fromEntries(new URL(link.href).searchParams))
  const pressNumber = async (page: Page, digit: string, numpad: boolean) => {
    if (!numpad) {
      await page.keyboard.press(digit as KeyInput)
      return
    }
    // Puppeteer’s Numpad key definitions default to Num Lock off. Send the numeric variant explicitly.
    const client = await page.createCDPSession()
    try {
      const key = {
        key: digit,
        code: `Numpad${digit}`,
        windowsVirtualKeyCode: 96 + Number(digit),
        isKeypad: true,
      }
      await client.send('Input.dispatchKeyEvent', {
        ...key,
        type: 'keyDown',
        text: digit,
        unmodifiedText: digit,
      })
      await client.send('Input.dispatchKeyEvent', {
        ...key,
        type: 'keyUp',
      })
    } finally {
      await client.detach()
    }
  }
  for (const monaco of [false, true]) {
    for (const numpad of [false, true]) {
      test(`${monaco ? 'Monaco' : 'textarea'} accepts ${numpad ? 'numpad' : 'top-row'} digits without switching models`, async () => {
        const page = await browser.newPage()
        try {
          await page.goto(`${url}?monaco=${monaco}&model=gpt&models=gpt,deepseek`)
          const selector = monaco ? '.monaco-editor [role="textbox"]' : 'textarea'
          await page.waitForSelector(selector)
          await page.focus(selector)
          let text = ''
          for (const digit of '0123456789') {
            await pressNumber(page, digit, numpad)
            text += digit
            await page.waitForFunction(expected => {
              const link = document.querySelector<HTMLAnchorElement>('a[title^="Duplicate or share"]')
              return link && new URL(link.href).searchParams.get('text') === expected
            }, {}, text)
            expect((await session(page)).model).toBe('gpt')
          }
          // The same shortcuts still work after focus leaves the editor.
          await page.$eval(selector, element => (element as HTMLElement).blur())
          await pressNumber(page, '0', numpad)
          expect((await session(page)).model).toBe('')
          await pressNumber(page, '2', numpad)
          expect((await session(page)).model).toBe('deepseek')
          expect((await session(page)).text).toBe(text)
        } finally {
          await page.close()
        }
      }, 30_000)
    }
  }
})
