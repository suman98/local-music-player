export const SUPPORTED_AUDIO_FORMATS = [
    'mp3',
    'wav',
    'ogg',
    'flac',
    'aac',
    'm4a',
    'opus',
    'weba',
    'webm',
    'ape',
    'alac',
  ]
  
  export const MIME_TYPE_MAP: Record<string, string> = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    flac: 'audio/flac',
    aac: 'audio/aac',
    m4a: 'audio/mp4',
    opus: 'audio/opus',
    weba: 'audio/webp',
    webm: 'audio/webm',
    ape: 'audio/ape',
    alac: 'audio/x-m4a',
  }
  
  export const IDB_CONFIG = {
    dbName: 'MusicLibraryDB',
    version: 1,
    stores: {
      tracks: 'tracks',
      metadata: 'metadata',
    },
  }
  
  export const DEFAULT_CONFIG = {
    storageKey: '@music-library/folder-handle',
    maxCacheSize: 1024 * 1024 * 500, // 500MB
    autoRestoreLast: true,
    debugMode: false,
  }
  