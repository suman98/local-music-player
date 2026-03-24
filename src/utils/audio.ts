import { AudioTrack } from '../types'
import { MIME_TYPE_MAP, SUPPORTED_AUDIO_FORMATS } from './constants'

/**
 * Generate UUID v4 (fallback for non-secure contexts)
 */
function generateUUID(): string {
  // Use crypto.randomUUID if available (secure context)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID()
    } catch {
      // Fall back to manual generation
    }
  }

  // Fallback UUID v4 generator for non-secure contexts
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Get audio file extension
 */
export function getAudioExtension(filename: string): string | null {
  const match = filename.match(/\.([a-zA-Z0-9]+)$/)
  return match ? match[1].toLowerCase() : null
}

/**
 * Check if file is supported audio
 */
export function isSupportedAudio(filename: string): boolean {
  const ext = getAudioExtension(filename)
  return ext ? SUPPORTED_AUDIO_FORMATS.includes(ext) : false
}

/**
 * Get MIME type from extension
 */
export function getMimeType(filename: string): string {
  const ext = getAudioExtension(filename)
  if (!ext) return 'audio/mpeg'
  return MIME_TYPE_MAP[ext] || 'audio/mpeg'
}

/**
 * Get audio file duration (async)
 */
export async function getAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio()
    const url = URL.createObjectURL(blob)

    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(audio.duration)
    }

    audio.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load audio metadata'))
    }

    audio.src = url
  })
}

/**
 * Format seconds to MM:SS
 */
export function formatDuration(seconds: number): string {
  if (!isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Create audio track from file
 */
export async function createAudioTrack(
  file: File | Blob,
  filename: string
): Promise<AudioTrack> {
  const duration = await getAudioDuration(file)

  return {
    id: generateUUID(),
    name: filename.replace(/\.[^.]+$/, ''),
    fileName: filename,
    file,
    duration,
    size: file.size,
    mimeType: getMimeType(filename),
  }
}

/**
 * Sort tracks alphabetically
 */
export function sortTracks(tracks: AudioTrack[]): AudioTrack[] {
  return [...tracks].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true })
  )
}
