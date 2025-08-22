import {init, verifySignature, webexGet, webexPost, getBotId} from './webex.js'
import {parseCommand} from './vm-commands.js'
import {listVms, claimVm, releaseVm} from './firestore.js'
import {rosterCard} from './cards.js'

const postRoster = async roomId => {
  const vms = await listVms()
  const card = rosterCard(vms)
  await webexPost('/messages', {
    roomId,
    markdown: 'VM roster',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: card
      }
    ]
  })
}

const handleCommand = async (roomId, text, personId) => {
  const cmd = parseCommand(text)
  if (!cmd) return

  if (cmd.action === 'list') {
    await postRoster(roomId)
    return
  }

  if (cmd.action === 'claim' && personId) {
    const person = await webexGet(`/people/${personId}`)
    await claimVm(cmd.name, person.displayName, cmd.minutes)
    await postRoster(roomId)
    return
  }

  if (cmd.action === 'release') {
    await releaseVm(cmd.name)
    await postRoster(roomId)
  }
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
        await handleCommand(msg.roomId, msg.text || '', msg.personId)
      } catch (err) {
        console.error('message handling error', err)
      }
    }

    if (resource === 'attachmentActions' && event === 'created') {
      try {
        const action = await webexGet(`/attachment/actions/${data.id}`)
        await handleCommand(action.roomId, action.inputs?.command || '', action.personId)
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
