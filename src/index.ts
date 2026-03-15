import {
    AudioTrack,
    FolderInfo,
    MusicLibrary,
    MusicLibraryConfig,
    MusicLibraryEvent,
    MusicLibraryListener,
  } from './types'
  import { DEFAULT_CONFIG, SUPPORTED_AUDIO_FORMATS } from './utils/constants'
  import { isSupportedAudio, formatDuration } from './utils/audio'
  import { saveTracksToIDB, loadTracksFromIDB, clearIDB } from './storage/idb'
  import {
    saveFolderHandleRef,
    getFolderHandleRef,
    clearFolderHandleRef,
  } from './storage/localStorage'
  import { loadFromDesktopFolder, openFolderPicker } from './scanner/desktop'
  import { loadFromMobileFolder, openFilePicker } from './scanner/mobile'
  
  /**
   * Create Music Library Instance
   */
  export function createMusicLibrary(
    config: MusicLibraryConfig = {}
  ): MusicLibrary {
    const finalConfig = { ...DEFAULT_CONFIG, ...config }
  
    let tracks: AudioTrack[] = []
    let folderInfo: FolderInfo | null = null
    let isLoading = false
    let error: string | null = null
    let dirHandleRef: FileSystemDirectoryHandle | null = null
  
    const listeners: MusicLibraryListener[] = []
  
    /**
     * Emit events to listeners
     */
    function emit(event: MusicLibraryEvent, data?: any) {
      if (finalConfig.debugMode) {
        console.log(`[MusicLibrary] Event: ${event}`, data)
      }
      listeners.forEach(listener => listener(event, data))
    }
  
    /**
     * Load music from folder (desktop)
     */
    async function loadFromDesktop(
      dirHandle?: FileSystemDirectoryHandle
    ): Promise<AudioTrack[]> {
      try {
        isLoading = true
        error = null
  
        if (!dirHandle) {
          dirHandle = await openFolderPicker()
        }
  
        const { tracks: newTracks, folderInfo: newFolderInfo } =
          await loadFromDesktopFolder(dirHandle)
  
        tracks = newTracks
        folderInfo = newFolderInfo
        dirHandleRef = dirHandle
  
        // Save to localStorage for next session
        saveFolderHandleRef(finalConfig.storageKey!, dirHandle)
  
        // Save to IndexedDB for offline access
        await saveTracksToIDB(tracks, folderInfo)
  
        emit('load', { trackCount: tracks.length, folderName: folderInfo.name })
  
        return tracks
      } catch (err) {
        error = err instanceof Error ? err.message : String(err)
        emit('error', error)
        throw err
      } finally {
        isLoading = false
      }
    }
  
    /**
     * Load music from folder (mobile)
     */
    async function loadFromMobile(): Promise<AudioTrack[]> {
      try {
        isLoading = true
        error = null
  
        const files = await openFilePicker()
  
        if (files.length === 0) {
          throw new Error('No files selected')
        }
  
        const { tracks: newTracks, folderInfo: newFolderInfo } =
          await loadFromMobileFolder(files)
  
        tracks = newTracks
        folderInfo = newFolderInfo
  
        // Save to IndexedDB for persistence
        await saveTracksToIDB(tracks, folderInfo)
  
        emit('load', { trackCount: tracks.length, folderName: folderInfo.name })
  
        return tracks
      } catch (err) {
        error = err instanceof Error ? err.message : String(err)
        emit('error', error)
        throw err
      } finally {
        isLoading = false
      }
    }
  
    /**
     * Load music (auto-detect platform)
     */
    async function load(folderPath?: string): Promise<AudioTrack[]> {
      if (finalConfig.debugMode) {
        console.log('[MusicLibrary] Loading...', { folderPath })
      }
  
      const isDesktop =
        'showDirectoryPicker' in window && !folderPath?.startsWith('mobile://')
  
      if (isDesktop) {
        return loadFromDesktop()
      } else {
        return loadFromMobile()
      }
    }
  
    /**
     * Restore last loaded folder (if available)
     */
    async function restoreLastFolder(): Promise<boolean> {
      try {
        if (!finalConfig.autoRestoreLast) return false
  
        // Try IndexedDB first (works on all platforms)
        const { tracks: idbTracks, folderInfo: idbFolderInfo } =
          await loadTracksFromIDB()
  
        if (idbTracks.length > 0 && idbFolderInfo) {
          tracks = idbTracks
          folderInfo = idbFolderInfo
  
          if (finalConfig.debugMode) {
            console.log(
              '[MusicLibrary] Restored from IndexedDB:',
              idbTracks.length,
              'tracks'
            )
          }
  
          emit('load', {
            trackCount: tracks.length,
            folderName: folderInfo.name,
            restored: true,
          })
  
          return true
        }
  
        return false
      } catch (err) {
        console.error('[MusicLibrary] Restore error:', err)
        return false
      }
    }
  
    /**
     * Refresh folder (re-scan)
     */
    async function refresh(): Promise<AudioTrack[]> {
      try {
        isLoading = true
        error = null
  
        if (!dirHandleRef) {
          throw new Error('No folder selected. Call load() first.')
        }
  
        // Check if permission still granted
        const permission = await dirHandleRef.queryPermission({ mode: 'read' })
  
        if (permission !== 'granted') {
          throw new Error('Permission denied. Re-select the folder.')
        }
  
        const { tracks: newTracks, folderInfo: newFolderInfo } =
          await loadFromDesktopFolder(dirHandleRef)
  
        tracks = newTracks
        folderInfo = newFolderInfo
  
        // Update IndexedDB
        await saveTracksToIDB(tracks, folderInfo)
  
        emit('refresh', { trackCount: tracks.length })
  
        return tracks
      } catch (err) {
        error = err instanceof Error ? err.message : String(err)
        emit('error', error)
        throw err
      } finally {
        isLoading = false
      }
    }
  
    /**
     * Get single track
     */
    function getTrack(index: number): AudioTrack | null {
      return tracks[index] || null
    }
  
    /**
     * Get track blob URL (for playback)
     */
    function getTrackBlob(trackId: string): Blob | null {
      const track = tracks.find(t => t.id === trackId)
      return track?.file || null
    }
  
    /**
     * Clear all data
     */
    async function clear(): Promise<void> {
      try {
        tracks = []
        folderInfo = null
        dirHandleRef = null
        error = null
  
        clearFolderHandleRef(finalConfig.storageKey!)
        await clearIDB()
  
        emit('clear')
      } catch (err) {
        console.error('[MusicLibrary] Clear error:', err)
      }
    }
  
    /**
     * Export as JSON
     */
    async function exportAsJSON(): Promise<Blob> {
      const data = {
        version: '1.0.0',
        timestamp: Date.now(),
        folderInfo,
        tracks: tracks.map(t => ({
          id: t.id,
          name: t.name,
          fileName: t.fileName,
          duration: t.duration,
          size: t.size,
          mimeType: t.mimeType,
        })),
      }
  
      return new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
    }
  
    /**
     * Get statistics
     */
    function getStats() {
      return {
        totalTracks: tracks.length,
        totalSize: tracks.reduce((sum, t) => sum + (t.size || 0), 0),
        lastUpdated: folderInfo ? new Date(folderInfo.timestamp) : null,
        averageDuration: tracks.length
          ? tracks.reduce((sum, t) => sum + (t.duration || 0), 0) /
            tracks.length
          : 0,
        supportedFormats: SUPPORTED_AUDIO_FORMATS,
      }
    }
  
    /**
     * Subscribe to events
     */
    function on(listener: MusicLibraryListener) {
      listeners.push(listener)
      return () => {
        const idx = listeners.indexOf(listener)
        if (idx > -1) listeners.splice(idx, 1)
      }
    }
  
    /**
     * Auto-restore on initialization
     */
    restoreLastFolder()
  
    // Return public API
    const library: MusicLibrary = {
      get tracks() {
        return [...tracks]
      },
      get folderInfo() {
        return folderInfo
      },
      get isLoading() {
        return isLoading
      },
      get error() {
        return error
      },
      load,
      refresh,
      getTrack,
      getTrackBlob,
      clear,
      export: exportAsJSON,
      getStats,
    }
  
    // Add event subscription to library
    ;(library as any).on = on
  
    return library
  }
  
  // Default export
  export default createMusicLibrary
  
  // Named exports
  export { createMusicLibrary as musicLibrary }
  export * from './types'
  