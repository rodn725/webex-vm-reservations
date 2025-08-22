import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { Firestore } from "@google-cloud/firestore"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const data = JSON.parse(
  await readFile(path.join(__dirname, "seed-vms.json"), "utf8"),
)

const db = new Firestore()
const batch = db.batch()
const col = db.collection("vms")

data.forEach((vm) => {
  const ref = col.doc(vm.id)
  batch.set(ref, vm)
})

await batch.commit()

console.log(`Seeded ${data.length} VMs`)
