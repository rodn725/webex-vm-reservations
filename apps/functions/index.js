import {
  init,
  verifySignature,
  webexGet,
  webexPost,
  getBotId,
} from "./webex.js"
import { parseCommand } from "./vm-commands.js"
import { listVms, claimVm, releaseVm, vms } from "./firestore.js"
import { rosterCard } from "./cards.js"

const postRoster = async (roomId) => {
  console.log("posting roster for room", roomId)
  const vms = await listVms()
  console.log("roster has", vms.length, "vms")
  const card = rosterCard(vms)
  console.log("roster card created")
  console.log(JSON.stringify(card, null, 2))
  await webexPost("/messages", {
    roomId,
    markdown: "VM roster",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: card,
      },
    ],
  })
  console.log("roster posted")
}

const handleCommand = async (roomId, text, personId) => {
  console.log("handleCommand received", { roomId, text, personId })
  const cmd = parseCommand(text)
  console.log("parsed command", cmd)
  if (!cmd) return

  if (cmd.action === "list") {
    console.log("executing list command")
    await postRoster(roomId)
    return
  }

  if (cmd.action === "claim" && personId) {
    console.log("executing claim command for", cmd.name)
    const person = await webexGet(`/people/${personId}`)
    await claimVm(cmd.name, person.displayName, cmd.minutes)
    await postRoster(roomId)
    return
  }

  if (cmd.action === "release") {
    console.log("executing release command for", cmd.name)
    await releaseVm(cmd.name)
    await postRoster(roomId)
  }
}

export const webexHooks = async (req, res) => {
  try {
    console.log("webexHooks invoked")
    await init()
    console.log("webex init complete")
    const signature = req.get("x-spark-signature") || ""
    const raw = req.rawBody
    console.log("received signature", signature)

    if (!verifySignature(raw, signature)) {
      console.warn("invalid signature")
      res.status(401).send("invalid signature")
      return
    }
    console.log("signature verified")

    const { resource, event, data } = req.body
    console.log("webhook payload", resource, event, data)

    if (resource === "messages" && event === "created") {
      try {
        console.log("processing message event", data.id)
        const msg = await webexGet(`/messages/${data.id}`)
        console.log("fetched message", msg)
        if (msg.personId === getBotId()) {
          console.log("ignoring bot message")
          res.status(200).send("ok")
          return
        }
        await handleCommand(msg.roomId, msg.text || "", msg.personId)
      } catch (err) {
        console.error("message handling error", err)
      }
    }

    if (resource === "attachmentActions" && event === "created") {
      try {
        console.log("processing attachment action", data.id)
        const action = await webexGet(`/attachment/actions/${data.id}`)
        console.log("fetched action", action)
        await handleCommand(
          action.roomId,
          action.inputs?.command || "",
          action.personId,
        )
      } catch (err) {
        console.error("attachment action error", err)
      }
    }

    res.status(200).send("ok")
  } catch (err) {
    console.error("webexHooks error", err)
    res.status(500).send("error")
  }
}

export const cleanup = async (req, res) => {
  try {
    console.log("cleanup invoked")
    const collection = vms()
    const now = new Date()
    const snapshot = await collection
      .where("endAt", "<=", now)
      .where("endAt", "!=", null)
      .get()

    if (!snapshot.empty) {
      const batch = collection.firestore.batch()
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { assignedTo: null, startAt: null, endAt: null })
      })
      await batch.commit()
      console.log("released", snapshot.size, "vms")
    } else {
      console.log("no expired vms found")
    }

    res.status(200).send("ok")
  } catch (err) {
    console.error("cleanup error", err)
    res.status(500).send("error")
  }
}
