import { IDB_CONFIG } from '../utils/constants'
import { AudioTrack, StoredTrack, FolderInfo } from '../types'

/**
 * Initialize IndexedDB
 */
export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_CONFIG.dbName, IDB_CONFIG.version)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(IDB_CONFIG.stores.tracks)) {
        db.createObjectStore(IDB_CONFIG.stores.tracks, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(IDB_CONFIG.stores.metadata)) {
        db.createObjectStore(IDB_CONFIG.stores.metadata)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Save tracks to IndexedDB
 */
export async function saveTracksToIDB(
  tracks: AudioTrack[],
  folderInfo: FolderInfo
): Promise<void> {
  const db = await initDB()
  const transaction = db.transaction(
    [IDB_CONFIG.stores.tracks, IDB_CONFIG.stores.metadata],
    'readwrite'
  )

  // Clear old data
  transaction.objectStore(IDB_CONFIG.stores.tracks).clear()
  transaction.objectStore(IDB_CONFIG.stores.metadata).clear()

  // Save each track as ArrayBuffer to minimize size
  for (const track of tracks) {
    const arrayBuffer = await track.file.arrayBuffer()
    const storedTrack: StoredTrack = {
      id: track.id,
      name: track.name,
      fileName: track.fileName,
      fileData: arrayBuffer,
      mimeType: track.mimeType || 'audio/mpeg',
      size: track.size || track.file.size,
    }
    transaction.objectStore(IDB_CONFIG.stores.tracks).put(storedTrack)
  }

  // Save metadata
  transaction.objectStore(IDB_CONFIG.stores.metadata).put(folderInfo, 'folderInfo')

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

/**
 * Load tracks from IndexedDB
 */
export async function loadTracksFromIDB(): Promise<{
  tracks: AudioTrack[]
  folderInfo: FolderInfo | null
}> {
  try {
    const db = await initDB()
    const transaction = db.transaction(
      [IDB_CONFIG.stores.tracks, IDB_CONFIG.stores.metadata],
      'readonly'
    )

    const tracksRequest = transaction.objectStore(IDB_CONFIG.stores.tracks).getAll()
    const metadataRequest = transaction
      .objectStore(IDB_CONFIG.stores.metadata)
      .get('folderInfo')

    return new Promise((resolve) => {
      let loadedTracks: AudioTrack[] = []
      let folderInfo: FolderInfo | null = null

      tracksRequest.onsuccess = () => {
        loadedTracks = tracksRequest.result.map((stored: StoredTrack) =>
          new Blob([stored.fileData], { type: stored.mimeType }),
          ({
            id: stored.id,
            name: stored.name,
            fileName: stored.fileName,
            file: new Blob([stored.fileData], { type: stored.mimeType }),
            mimeType: stored.mimeType,
            size: stored.size,
          } as AudioTrack)
        )
      }

      metadataRequest.onsuccess = () => {
        folderInfo = metadataRequest.result || null
      }

      transaction.oncomplete = () => {
        resolve({ tracks: loadedTracks, folderInfo })
      }

      transaction.onerror = () => {
        resolve({ tracks: [], folderInfo: null })
      }
    })
  } catch (err) {
    console.error('[MusicLibrary] IDB load error:', err)
    return { tracks: [], folderInfo: null }
  }
}

/**
 * Clear IndexedDB
 */
export async function clearIDB(): Promise<void> {
  const db = await initDB()
  const transaction = db.transaction(
    [IDB_CONFIG.stores.tracks, IDB_CONFIG.stores.metadata],
    'readwrite'
  )

  transaction.objectStore(IDB_CONFIG.stores.tracks).clear()
  transaction.objectStore(IDB_CONFIG.stores.metadata).clear()

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
  })
}

/**
 * Get IndexedDB size estimate
 */
export async function getStorageEstimate(): Promise<{
  usage: number
  quota: number
}> {
  if (!navigator.storage?.estimate) {
    return { usage: 0, quota: 0 }
  }

  const estimate = await navigator.storage.estimate()
  return {
    usage: estimate.usage || 0,
    quota: estimate.quota || 0,
  }
}
