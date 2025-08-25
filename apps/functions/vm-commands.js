export const parseCommand = text => {
  const t = (text || '').trim()
  // Find "/vm ..."
  // Require it to be at start or preceded by whitespace to avoid false hits
  const m = t.match(/(?:^|\s)(\/vm\b.*)$/i)
  if (!m) return null

  const cmdLine = m[1].trim()          // "/vm list" or "/vm claim vm-01 --for 2h"
  const parts = cmdLine.slice(3).trim().split(/\s+/)
  const action = parts.shift()?.toLowerCase()

  if (action === 'list') return { action: 'list' }

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
    return { action: 'claim', name, minutes }
  }

  if (action === 'release') {
    const name = parts.shift()
    if (!name) return null
    return { action: 'release', name }
  }

  return null
}
