export const parseCommand = text => {
  const t = (text || '').trim()
  if (!t.startsWith('/vm')) return null

  const parts = t.slice(3).trim().split(/\s+/)
  const action = parts.shift()?.toLowerCase()

  if (action === 'list') return {action: 'list'}

  if (action === 'claim') {
    const name = parts.shift()
    if (!name) return null

    let minutes = 120
    if (parts[0] === '--for' && parts[1]) {
      const match = /^(\d+)([mh])$/i.exec(parts[1])
      if (match) {
        const value = parseInt(match[1], 10)
        minutes = match[2].toLowerCase() === 'h' ? value * 60 : value
      }
    }

    return {action: 'claim', name, minutes}
  }

  if (action === 'release') {
    const name = parts.shift()
    if (!name) return null
    return {action: 'release', name}
  }

  return null
}
