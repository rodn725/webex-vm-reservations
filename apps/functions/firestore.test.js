import test from 'node:test'
import assert from 'node:assert'
import { claimVm, releaseVm } from './firestore.js'

const mockDb = store => ({
  collection: () => ({
    doc: id => ({ id })
  }),
  runTransaction: async fn => {
    const tx = {
      get: async ref => ({ exists: true, data: () => store[ref.id] }),
      update: (ref, data) => {
        store[ref.id] = { ...store[ref.id], ...data }
      }
    }
    return fn(tx)
  }
})

test('claimVm assigns free VM', async () => {
  const store = { vm1: {} }
  const db = mockDb(store)

  const result = await claimVm('vm1', 'alice', 60, db)

  assert.strictEqual(store.vm1.assignedTo, 'alice')
  assert.ok(store.vm1.startAt instanceof Date)
  assert.ok(store.vm1.endAt instanceof Date)
  assert.strictEqual(result.assignedTo, 'alice')
})

test('claimVm rejects if VM already claimed', async () => {
  const future = new Date(Date.now() + 1000)
  const store = { vm1: { assignedTo: 'bob', endAt: future } }
  const db = mockDb(store)

  await assert.rejects(claimVm('vm1', 'alice', 60, db))
})

test('releaseVm clears assignment', async () => {
  const store = { vm1: { assignedTo: 'alice', startAt: new Date(), endAt: new Date() } }
  const db = {
    collection: () => ({
      doc: id => ({
        update: data => {
          store[id] = { ...store[id], ...data }
        }
      })
    })
  }

  await releaseVm('vm1', db)

  assert.deepStrictEqual(store.vm1, { assignedTo: null, startAt: null, endAt: null })
})

