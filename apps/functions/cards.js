const toDate = v => {
  if (!v) return null
  if (v instanceof Date) return v
  if (typeof v.toDate === 'function') return v.toDate()
  return new Date(v)
}

const TZ = 'America/Chicago'

export const rosterCard = vms => ({
  type: 'AdaptiveCard',
  $schema: 'https://adaptivecards.io/schemas/adaptive-card.json',
  version: '1.3',
  body: vms.flatMap(vm => {
    const endAt = toDate(vm.endAt)
    const inUse = vm.assignedTo && endAt && endAt > new Date()

    const status = inUse
      ? `In use by ${vm.assignedTo} until ${endAt.toLocaleTimeString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit', hour12: true })}`
      : 'Available'

    const actions = inUse
      ? [
          {
            type: 'Action.Submit',
            title: 'Release',
            data: {command: `/vm release ${vm.id}`},
            style: 'destructive'
          }
        ]
      : [
          {
            type: 'Action.Submit',
            title: 'Claim 4h',
            data: {command: `/vm claim ${vm.id} --for 4h`},
            style: 'positive'
          },
          {
            type: 'Action.Submit',
            title: 'Claim 8h',
            data: {command: `/vm claim ${vm.id} --for 8h`},
            style: 'positive'
          }
        ]

    return [
      {
        type: 'Container',
        separator: true,
        items: [
          {type: 'TextBlock', text: `**${vm.id}**: ${vm.name}`, size: 'Medium'},
          {type: 'TextBlock', text: status, size: 'Small'},
          {type: 'ActionSet', actions}
        ]
      },
    ]
  })
})