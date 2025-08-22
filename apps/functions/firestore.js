import { Firestore } from "@google-cloud/firestore"

const db = new Firestore()

export const vms = (database = db) => database.collection("vms")

export const listVms = async (database = db) => {
  const snapshot = await vms(database).orderBy("name").get()
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export const claimVm = async (vmName, user, minutes = 120, database = db) => {
  const vmRef = vms(database).doc(vmName)
  const now = new Date()

  return database.runTransaction(async tx => {
    const vmDoc = await tx.get(vmRef)
    const data = vmDoc.exists ? vmDoc.data() : {}

    if (data.assignedTo && data.endAt && data.endAt > now) {
      throw new Error("VM already claimed")
    }

    const startAt = now
    const endAt = new Date(now.getTime() + minutes * 60000)

    tx.update(vmRef, { assignedTo: user, startAt, endAt })

    return { assignedTo: user, startAt, endAt }
  })
}

export const releaseVm = (vmName, database = db) =>
  vms(database).doc(vmName).update({ assignedTo: null, startAt: null, endAt: null })
