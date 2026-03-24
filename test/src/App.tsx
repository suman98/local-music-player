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
