# 🎵 Music Library - Universal Audio File Manager

A lightweight, platform-agnostic JavaScript library for loading and managing music files in web applications. Works seamlessly on **desktop** (Chrome, Edge, Firefox) and **mobile** (iOS Safari, Chrome Android) with automatic persistence.

## Features

✅ **Cross-platform**: Desktop (File System API) & Mobile (webkitdirectory)  
✅ **Auto-persistence**: IndexedDB + localStorage  
✅ **Zero dependencies**: Pure JavaScript/TypeScript  
✅ **Offline support**: Works without network  
✅ **TypeScript**: Full type safety  
✅ **Event-driven**: Real-time updates  
✅ **Small footprint**: ~15KB minified  

## Installation

```bash
npm install @music-library/core
```

```js
import { createMusicLibrary } from '@music-library/core'

// Create an instance of the music library
const library = createMusicLibrary({
  debugMode: true,       // Enable logging for development
  autoRestoreLast: true, // Auto-load previous session if available
})

// Load music files from a folder (prompts user to select a folder)
async function loadMusicFolder() {
  const tracks = await library.load()
  // tracks is an array of AudioTrack
  console.log(tracks)
}

// Example: Playing a loaded track
async function playFirstTrack() {
  const tracks = await library.load()
  const track = tracks[0]
  if (!track) return;

  const audio = new Audio()
  audio.src = typeof track.url === 'string' ? track.url : URL.createObjectURL(track.file)
  audio.play()
}
```



## Example: Using `@music-library/core` in React

Below is a complete React component that demonstrates how to use `@music-library/core` to build a simple music player:

```tsx
import { useState, useEffect, useRef } from 'react'
import { createMusicLibrary, MusicLibrary, AudioTrack } from '@music-library/core'

export default function App() {
  const [library, setLibrary] = useState<MusicLibrary | null>(null)
  const [tracks, setTracks] = useState<AudioTrack[]>([])
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const initLibrary = async () => {
      const musicLib = await createMusicLibrary({
        debugMode: true,
        autoRestoreLast: true,
      })
      setLibrary(musicLib)
      setTracks(musicLib.tracks)
    }
    initLibrary()
  }, [])

  useEffect(() => {
    if (currentTrackIndex !== null && tracks[currentTrackIndex]) {
      if (audioRef.current) {
        audioRef.current.src = getTrackSrc(tracks[currentTrackIndex])
        audioRef.current.play().catch(console.error)
        setIsPlaying(true)
      }
    }
  }, [currentTrackIndex, tracks])

  const handleTrackEnded = () => {
    if (currentTrackIndex !== null && currentTrackIndex < tracks.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1)
    } else {
      setIsPlaying(false)
    }
  }

  const handleLoadFolder = async () => {
    if (!library) return
    try {
      const loadedTracks = await library.load()
      setTracks(loadedTracks)
    } catch (err) {
      console.error('Failed to load folder', err)
    }
  }

  function getTrackSrc(track: AudioTrack): string {
    if (typeof track.url === 'string') return track.url
    // Handle both Blob and File (File is a subclass of Blob)
    if (track.file instanceof Blob) return URL.createObjectURL(track.file)
    return ''
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>🎵 Music Library Test</h1>

      <button onClick={handleLoadFolder}>Load Music Folder</button>

      {tracks.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
          {tracks.map((track, i) => (
            <li
              key={i}
              onClick={() => setCurrentTrackIndex(i)}
              style={{
                padding: '0.5rem',
                cursor: 'pointer',
                background: currentTrackIndex === i ? '#e0e0e0' : 'transparent',
              }}
            >
              {currentTrackIndex === i && isPlaying ? '🔊 ' : '▶️ '}
              {track.name}
            </li>
          ))}
        </ul>
      )}

      <audio ref={audioRef} onEnded={handleTrackEnded} style={{ display: 'none' }} />
    </div>
  )
}
```

Simply copy this component into your React app. Click "Load Music Folder" to select a directory of music files, and click a track name to play it. The current track will auto-advance when finished.

_This example uses TypeScript, but works in plain JS by omitting type annotations._


