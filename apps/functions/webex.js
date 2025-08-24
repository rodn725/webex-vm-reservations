import crypto from "node:crypto"
let botToken = process.env.WEBEX_BOT_TOKEN
let botId
const webhookSecret = process.env.WEBEX_WEBHOOK_SECRET
const baseUrl = "https://webexapis.com/v1"

export const init = async () => {
  if (botId) return
  if (!botToken) throw new Error("WEBEX_BOT_TOKEN not set")
  console.log("initializing webex client")
  const res = await fetch(`${baseUrl}/people/me`, {
    headers: { Authorization: `Bearer ${botToken}` },
  })
  if (!res.ok) throw new Error(`init failed ${res.status}`)
  const me = await res.json()
  botId = me.id
  console.log("webex client initialized with bot id", botId)
}

export const getBotId = () => botId

export const verifySignature = (raw, signature = "") => {
  if (!webhookSecret || !raw || !signature) {
    console.warn("Missing required verification data")
    return false
  }

  const hmac = crypto.createHmac("sha1", webhookSecret.trim())
  hmac.update(raw)
  const digest = hmac.digest("hex")
  const ok = digest === signature
  console.log("signature match", ok)
  return ok
}

export const webexGet = async (path) => {
  await init()
  console.log("webex GET", path)
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${botToken}` },
  })
  console.log("webex GET status", res.status)
  if (!res.ok) throw new Error(`GET ${path} ${res.status}`)
  return res.json()
}

export const webexPost = async (path, body) => {
  await init()
  console.log("webex POST", path, body)
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  console.log("webex POST status", res.status)
  if (!res.ok) throw new Error(`POST ${path} ${res.status}`)
  return res.json()
}

export const sendText = (roomId, markdown) => {
  console.log("sending text to", roomId)
  return webexPost("/messages", { roomId, markdown })
}
