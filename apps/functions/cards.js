const toDate = v => {
  if (!v) return null
  if (v instanceof Date) return v
  if (typeof v.toDate === 'function') return v.toDate()
  return new Date(v)
}

export const rosterCard = vms => ({
  type: 'AdaptiveCard',
  $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
  version: '1.4',
  body: vms.flatMap(vm => {
    const endAt = toDate(vm.endAt)
    const inUse = vm.assignedTo && endAt && endAt > new Date()

    const status = inUse
      ? `In use by ${vm.assignedTo} until ${endAt.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`
      : 'Available'

    const actions = inUse
      ? [
          {
            type: 'Action.Submit',
            title: 'Release',
            data: {command: `/vm release ${vm.id}`}
          }
        ]
      : [
          {
            type: 'Action.Submit',
            title: 'Claim 1h',
            data: {command: `/vm claim ${vm.id} --for 1h`}
          },
          {
            type: 'Action.Submit',
            title: 'Claim 2h',
            data: {command: `/vm claim ${vm.id} --for 2h`}
          }
        ]

    return [
      {
        type: 'Container',
        items: [
          {type: 'TextBlock', text: vm.id, weight: 'bolder'},
          {type: 'TextBlock', text: status}
        ]
      },
      {type: 'ActionSet', actions}
    ]
  })
})
