import { Firestore } from "@google-cloud/firestore"

const db = new Firestore()

export const vms = () => db.collection("vms")
