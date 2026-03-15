import { FolderInfo } from '../types'

/**
 * Save folder handle to localStorage
 */
export function saveFolderHandleRef(
  key: string,
  handle: FileSystemDirectoryHandle
): void {
  try {
    // Note: FileSystemDirectoryHandle cannot be directly serialized
    // We store metadata about it instead
    localStorage.setItem(
      `${key}:folderInfo`,
      JSON.stringify({
        name: handle.name,
        timestamp: Date.now(),
      })
    )
  } catch (err) {
    console.error('[MusicLibrary] localStorage error:', err)
  }
}

/**
 * Get folder info from localStorage
 */
export function getFolderHandleRef(key: string): FolderInfo | null {
  try {
    const data = localStorage.getItem(`${key}:folderInfo`)
    return data ? JSON.parse(data) : null
  } catch (err) {
    console.error('[MusicLibrary] localStorage read error:', err)
    return null
  }
}

/**
 * Clear folder handle from localStorage
 */
export function clearFolderHandleRef(key: string): void {
  try {
    localStorage.removeItem(`${key}:folderInfo`)
  } catch (err) {
    console.error('[MusicLibrary] localStorage clear error:', err)
  }
}
