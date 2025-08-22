import test from 'node:test'
import assert from 'node:assert'
import {parseCommand} from './vm-commands.js'

test('parse list', () => {
  assert.deepStrictEqual(parseCommand('/vm list'), {action: 'list'})
})

test('parse claim default', () => {
  assert.deepStrictEqual(parseCommand('/vm claim vm1'), {
    action: 'claim',
    name: 'vm1',
    minutes: 120
  })
})

test('parse claim minutes', () => {
  assert.deepStrictEqual(parseCommand('/vm claim vm1 --for 90m'), {
    action: 'claim',
    name: 'vm1',
    minutes: 90
  })
})

test('parse claim hours', () => {
  assert.deepStrictEqual(parseCommand('/vm claim vm1 --for 2h'), {
    action: 'claim',
    name: 'vm1',
    minutes: 120
  })
})

test('parse release', () => {
  assert.deepStrictEqual(parseCommand('/vm release vm1'), {
    action: 'release',
    name: 'vm1'
  })
})
