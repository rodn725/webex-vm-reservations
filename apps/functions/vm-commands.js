export const parseCommand = text => {
  const t = (text || '').trim()
  if (!t.startsWith('/vm')) return null
  const parts = t.slice(3).trim().split(/\s+/)
  const action = parts.shift()?.toLowerCase()
  return {action, args: parts}
}
