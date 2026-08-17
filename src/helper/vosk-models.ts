import fs from 'fs'
import path from 'path'

export type VoskModelConfig = {
  name: string
  description: string
  path: string
  transcriptLanguage: string
  voskUrl: string
}

const isVoskModelConfig = (value: unknown): value is VoskModelConfig => {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.name === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.path === 'string' &&
    typeof obj.transcriptLanguage === 'string' &&
    typeof obj.voskUrl === 'string'
  )
}

export const loadVoskModels = (): VoskModelConfig[] => {
  const configDir = process.env.CONFIG
  if (!configDir) {
    console.warn('CONFIG env var is not set; vosk models will not be loaded')
    return []
  }

  const resolvedDir = path.isAbsolute(configDir)
    ? configDir
    : path.resolve(process.cwd(), configDir)

  if (!fs.existsSync(resolvedDir) || !fs.statSync(resolvedDir).isDirectory()) {
    console.error(`CONFIG directory does not exist: ${resolvedDir}`)
    return []
  }

  const files = fs
    .readdirSync(resolvedDir)
    .filter(file => file.endsWith('.json'))
  const models: VoskModelConfig[] = []

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(resolvedDir, file), 'utf8')
      const parsed = JSON.parse(raw) as unknown
      const items = Array.isArray(parsed) ? parsed : [parsed]

      for (const item of items) {
        if (isVoskModelConfig(item)) {
          models.push(item)
        } else {
          console.warn(`Invalid vosk model entry in ${file}:`, item)
        }
      }
    } catch (error) {
      console.error(`Failed to read vosk model config ${file}:`, error)
    }
  }

  return models
}

export const findVoskModel = (
  modelId?: string,
): VoskModelConfig | undefined => {
  const models = loadVoskModels()
  if (!models.length) return undefined
  if (!modelId) return models[0]

  return (
    models.find(
      model =>
        model.name === modelId ||
        model.path === modelId ||
        model.description === modelId,
    ) ?? models[0]
  )
}
