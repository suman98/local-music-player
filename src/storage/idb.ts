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
 * Helper to convert IDB request to promise
 */
function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
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

  // Prepare all data first (before transaction)
  const storedTracks: StoredTrack[] = []
  for (const track of tracks) {
    const arrayBuffer = await track.file.arrayBuffer()
    storedTracks.push({
      id: track.id,
      name: track.name,
      fileName: track.fileName,
      fileData: arrayBuffer,
      mimeType: track.mimeType || 'audio/mpeg',
      size: track.size || track.file.size,
    })
  }

  // Now do all DB operations in one transaction
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [IDB_CONFIG.stores.tracks, IDB_CONFIG.stores.metadata],
      'readwrite'
    )

    const tracksStore = transaction.objectStore(IDB_CONFIG.stores.tracks)
    const metadataStore = transaction.objectStore(IDB_CONFIG.stores.metadata)

    try {
      // Clear old data
      tracksStore.clear()
      metadataStore.clear()

      // Add all new data
      for (const storedTrack of storedTracks) {
        tracksStore.add(storedTrack)
      }
      metadataStore.put(folderInfo, 'folderInfo')

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    } catch (error) {
      reject(error)
    }
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

    // Make requests and convert to promises
    const tracksRequest = transaction.objectStore(IDB_CONFIG.stores.tracks).getAll()
    const metadataRequest = transaction
      .objectStore(IDB_CONFIG.stores.metadata)
      .get('folderInfo')

    // Wait for both requests
    const tracksData = await requestToPromise(tracksRequest)
    const folderData = await requestToPromise(metadataRequest)

    // Wait for transaction to complete
    await new Promise<void>((resolve) => {
      transaction.oncomplete = () => resolve()
    })

    // Map the loaded data
    const tracks: AudioTrack[] = tracksData.map((stored: StoredTrack) => ({
      id: stored.id,
      name: stored.name,
      fileName: stored.fileName,
      file: new Blob([stored.fileData], { type: stored.mimeType }),
      mimeType: stored.mimeType,
      size: stored.size,
    } as AudioTrack))

    return {
      tracks,
      folderInfo: folderData || null,
    }
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
