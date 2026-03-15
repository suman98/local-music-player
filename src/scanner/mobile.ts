import { AudioTrack, FolderInfo } from '../types'
import { isSupportedAudio, createAudioTrack, sortTracks } from '../utils/audio'

/**
 * Open file picker (mobile fallback)
 */
export async function openFilePicker(formats?: string[]): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.multiple = true
    input.accept = (formats || ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'])
      .map(fmt => `.${fmt}`)
      .join(',')

    // Enable directory selection on supported browsers
    input.setAttribute('webkitdirectory', '')

    input.onchange = () => {
      const files = Array.from(input.files || [])
      resolve(files)
    }

    input.onerror = () => {
      resolve([])
    }

    input.click()
  })
}

/**
 * Load from mobile folder
 */
export async function loadFromMobileFolder(
  files: File[]
): Promise<{
  tracks: AudioTrack[]
  folderInfo: FolderInfo
}> {
  const audioFiles = files.filter(file => isSupportedAudio(file.name))

  if (audioFiles.length === 0) {
    throw new Error('No audio files found in selected folder')
  }

  const tracks = await Promise.all(
    audioFiles.map(file => createAudioTrack(file, file.name))
  )

  // Extract folder name from webkitRelativePath
  const firstPath = (audioFiles[0] as any).webkitRelativePath
  const folderName = firstPath ? firstPath.split('/')[0] : 'Selected Files'

  const folderInfo: FolderInfo = {
    name: folderName,
    timestamp: Date.now(),
    trackCount: tracks.length,
    isDesktop: false,
  }

  return { tracks: sortTracks(tracks), folderInfo }
}
