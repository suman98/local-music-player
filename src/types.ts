/**
 * Audio file metadata
 */
export interface AudioTrack {
    id: string
    name: string
    fileName: string
    file: Blob | File
    duration?: number
    size?: number
    mimeType?: string
  }
  
  /**
   * Folder information
   */
  export interface FolderInfo {
    name: string
    path?: string
    timestamp: number
    trackCount: number
    isDesktop: boolean
  }
  
  /**
   * Music library configuration
   */
  export interface MusicLibraryConfig {
    storageKey?: string
    maxCacheSize?: number
    autoRestoreLast?: boolean
    debugMode?: boolean
  }
  
  /**
   * Music library return type
   */
  export interface MusicLibrary {
    tracks: AudioTrack[]
    folderInfo: FolderInfo | null
    isLoading: boolean
    error: string | null
    load: (folderPath?: string) => Promise<AudioTrack[]>
    refresh: () => Promise<AudioTrack[]>
    getTrack: (index: number) => AudioTrack | null
    getTrackBlob: (trackId: string) => Blob | null
    clear: () => Promise<void>
    export: () => Promise<Blob>
    getStats: () => {
      totalTracks: number
      totalSize: number
      lastUpdated: Date | null
    }
  }
  
  /**
   * Internal storage format
   */
  export interface StoredTrack {
    id: string
    name: string
    fileName: string
    fileData: ArrayBuffer
    mimeType: string
    size: number
  }
  
  /**
   * Event types for library changes
   */
  export type MusicLibraryEvent = 'load' | 'refresh' | 'error' | 'clear'
  
  export interface MusicLibraryListener {
    (event: MusicLibraryEvent, data?: any): void
  }
  