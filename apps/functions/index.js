import {init, verifySignature, webexGet, getBotId} from './webex.js'
import {parseCommand} from './vm-commands.js'

const handleCommand = async (roomId, text) => {
  const cmd = parseCommand(text)
  if (!cmd) return
  console.log('command', cmd)
}

export const webexHooks = async (req, res) => {
  try {
    await init()
    const signature = req.get('x-spark-signature') || ''
    const raw = req.rawBody
    if (!verifySignature(raw, signature)) {
      console.warn('invalid signature')
      res.status(401).send('invalid signature')
      return
    }

    const {resource, event, data} = req.body

    if (resource === 'messages' && event === 'created') {
      try {
        const msg = await webexGet(`/messages/${data.id}`)
        if (msg.personId === getBotId()) {
          res.status(200).send('ok')
          return
        }
        await handleCommand(msg.roomId, msg.text || '')
      } catch (err) {
        console.error('message handling error', err)
      }
    }

    if (resource === 'attachmentActions' && event === 'created') {
      try {
        const action = await webexGet(`/attachment/actions/${data.id}`)
        await handleCommand(action.roomId, action.inputs?.command || '')
      } catch (err) {
        console.error('attachment action error', err)
      }
    }

    res.status(200).send('ok')
  } catch (err) {
    console.error('webexHooks error', err)
    res.status(500).send('error')
  }
}

export const cleanup = async () => {}
