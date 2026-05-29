import {expect, test} from 'bun:test'

const {default: tokShow} = await import('#src/main.ts')

test('should run', () => {
  const result = tokShow()
  expect(result).toBe('tok.show') // TODO Test actual functionality
})
