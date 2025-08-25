import { Firestore } from "@google-cloud/firestore"

const db = new Firestore()

export const vms = (database = db) => database.collection("vms")

export const listVms = async (database = db) => {
  console.log("listing vms")
  const snapshot = await vms(database).orderBy("id").get()
  const results = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  console.log("found", results.length, "vms")
  return results
}

export const claimVm = async (vmName, user, minutes = 120, database = db) => {
  console.log("claiming vm", vmName, "for", user, "for", minutes, "minutes")
  const vmRef = vms(database).doc(vmName)
  const now = new Date()

  return database.runTransaction(async (tx) => {
    const vmDoc = await tx.get(vmRef)
    const data = vmDoc.exists ? vmDoc.data() : {}
    console.log("current vm data", data)

    if (data.assignedTo && data.endAt && data.endAt > now) {
      console.log("vm already claimed")
      throw new Error("VM already claimed")
    }

    const startAt = now
    const endAt = new Date(now.getTime() + minutes * 60000)

    tx.update(vmRef, { assignedTo: user, startAt, endAt })
    console.log("vm claimed until", endAt)

    return { assignedTo: user, startAt, endAt }
  })
}

export const releaseVm = (vmName, database = db) => {
  console.log("releasing vm", vmName)
  return vms(database)
    .doc(vmName)
    .update({ assignedTo: null, startAt: null, endAt: null })
}
