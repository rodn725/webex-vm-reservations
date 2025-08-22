import crypto from "node:crypto"
let botToken = process.env.WEBEX_BOT_TOKEN
let botId
const webhookSecret = process.env.WEBEX_WEBHOOK_SECRET
const baseUrl = "https://webexapis.com/v1"

export const init = async () => {
  if (botId) return
  if (!botToken) throw new Error("WEBEX_BOT_TOKEN not set")
  const res = await fetch(`${baseUrl}/people/me`, {
    headers: { Authorization: `Bearer ${botToken}` },
  })
  const me = await res.json()
  botId = me.id
}

export const getBotId = () => botId

export const verifySignature = (raw, signature = "") => {
  if (!webhookSecret || !raw || !signature) return false
  const hmac = crypto.createHmac("sha1", webhookSecret)
  hmac.update(raw)
  const digest = hmac.digest("hex")
  return digest === signature
}

export const webexGet = async (path) => {
  await init()
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${botToken}` },
  })
  if (!res.ok) throw new Error(`GET ${path} ${res.status}`)
  return res.json()
}

export const webexPost = async (path, body) => {
  await init()
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`POST ${path} ${res.status}`)
  return res.json()
}

export const sendText = (roomId, markdown) =>
  webexPost("/messages", { roomId, markdown })
