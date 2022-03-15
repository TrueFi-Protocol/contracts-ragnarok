export function env<T extends string | number | boolean>(name: string, defaultValue: T): T {
  if (typeof defaultValue === 'number') {
    return process.env[name] ? Number(process.env[name]) as unknown as T : defaultValue
  }
  if (typeof defaultValue === 'boolean') {
    return process.env[name] ? (process.env[name] === 'true') as unknown as T : defaultValue
  }
  return process.env[name] as unknown as T || defaultValue
}
