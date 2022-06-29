import { readFileSync } from 'fs'

export function safeReadJsonFile(file: string) {
  try {
    const fileContent = readFileSync(file)
    return JSON.parse(fileContent.toString()) as Record<string, any>
  } catch {
    console.log(`File '${file}' not found.`)
    return {}
  }
}
