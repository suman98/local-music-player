import { AudioTrack, FolderInfo } from '../types'
import { isSupportedAudio, createAudioTrack, sortTracks } from '../utils/audio'

/**
 * Scan directory recursively (Desktop)
 */
async function scanDirectoryRecursive(
  dirHandle: FileSystemDirectoryHandle
): Promise<AudioTrack[]> {
  const tracks: AudioTrack[] = []

  async function scan(handle: FileSystemDirectoryHandle, depth = 0) {
    // Limit recursion depth
    if (depth > 5) return

    try {
      // @ts-ignore - FileSystemDirectoryHandle is iterable but TS doesn't recognize it
      for await (const [name, entry] of handle) {
        if (entry.kind === 'file' && isSupportedAudio(name)) {
          const file = await (entry as FileSystemFileHandle).getFile()
          const track = await createAudioTrack(file, name)
          tracks.push(track)
        } else if (entry.kind === 'directory' && depth < 5) {
          await scan(entry as FileSystemDirectoryHandle, depth + 1)
        }
      }
    } catch (err) {
      console.error('[MusicLibrary] Scan error:', err)
    }
  }

  await scan(dirHandle)
  return sortTracks(tracks)
}

/**
 * Load from desktop folder
 */
export async function loadFromDesktopFolder(
  dirHandle: FileSystemDirectoryHandle
): Promise<{
  tracks: AudioTrack[]
  folderInfo: FolderInfo
}> {
  const tracks = await scanDirectoryRecursive(dirHandle)

  const folderInfo: FolderInfo = {
    name: dirHandle.name,
    timestamp: Date.now(),
    trackCount: tracks.length,
    isDesktop: true,
  }

  return { tracks, folderInfo }
}

/**
 * Open folder picker (desktop)
 */
export async function openFolderPicker(): Promise<FileSystemDirectoryHandle> {
  if (!('showDirectoryPicker' in window)) {
    throw new Error('File System Access API not supported in this browser')
  }

  return await (window as any).showDirectoryPicker({ mode: 'read' })
}
