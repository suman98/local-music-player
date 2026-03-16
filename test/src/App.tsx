import { useState, useEffect, useRef } from 'react'
import { createMusicLibrary, MusicLibrary, AudioTrack } from '@music-library/core'
import './App.css'

export default function App() {
  const [library, setLibrary] = useState<MusicLibrary | null>(null)
  const [tracks, setTracks] = useState<AudioTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // We'll use a ref for the audio element to control playback
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Initialize music library
    const musicLib = createMusicLibrary({
      debugMode: true,
      autoRestoreLast: true,
    })

    setLibrary(musicLib)
    setTracks(musicLib.tracks)
  }, [])

  // Whenever the track index changes, load and optionally play the next track
  useEffect(() => {
    if (currentTrackIndex !== null && tracks[currentTrackIndex]) {
      // Start playing when the track is set
      if (audioRef.current) {
        audioRef.current.src = getTrackSrc(tracks[currentTrackIndex])
        audioRef.current.play().catch(e => {
          setError('Unable to play track: ' + e.message)
        })
        setIsPlaying(true)
      }
    } else if (audioRef.current) {
      // No track; make sure audio is stopped
      audioRef.current.pause()
      audioRef.current.src = ''
      setIsPlaying(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrackIndex])

  // Handler for when a track ends: go to the next, or stop if at end
  const handleTrackEnded = () => {
    if (
      currentTrackIndex !== null &&
      currentTrackIndex < tracks.length - 1
    ) {
      setCurrentTrackIndex(currentTrackIndex + 1)
    } else {
      setIsPlaying(false)
    }
  }

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      setCurrentTrackIndex(0)
    }
  }

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const handleResume = () => {
    if (audioRef.current) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleTrackSelect = (idx: number) => {
    setCurrentTrackIndex(idx)
  }

  const handleLoadFolder = async () => {
    if (!library) return

    try {
      setError(null)
      setLoading(true)
      const loadedTracks = await library.load()
      setTracks(loadedTracks)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load folder'
      setError(errorMsg)
      console.error(errorMsg, err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (!library) return

    try {
      setError(null)
      setLoading(true)
      const refreshedTracks = await library.refresh()
      setTracks(refreshedTracks)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to refresh'
      setError(errorMsg)
      console.error(errorMsg, err)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    if (!library) return

    try {
      setError(null)
      setLoading(true)
      await library.clear()
      setTracks([])
      setCurrentTrackIndex(null)
      setIsPlaying(false)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to clear'
      setError(errorMsg)
      console.error(errorMsg, err)
    } finally {
      setLoading(false)
    }
  }

  // Utility to obtain track src
  function getTrackSrc(track: AudioTrack): string {
    // If there's a file or blob URL in the track object, return it.
    // Otherwise, fallback to a string or empty.
    // (Implementation may vary depending on AudioTrack type.)
    if (typeof track.url === 'string') return track.url
    // @ts-expect-error
    if (track.file instanceof File) return URL.createObjectURL(track.file)
    return ''
  }

  return (
    <div className="container">
      <div className="card">
        <h1>🎵 Music Library Tester</h1>
        <p className="subtitle">Test the music extension with React</p>

        <div className="section">
          <h2>Controls</h2>
          <div className="button-group">
            <button onClick={handleLoadFolder} disabled={loading} className="btn btn-primary">
              {loading ? 'Loading...' : 'Load Music Folder'}
            </button>
            <button onClick={handleRefresh} disabled={loading} className="btn btn-secondary">
              Refresh
            </button>
            <button onClick={handleClear} className="btn btn-danger">
              Clear Cache
            </button>
            <button
              className="btn btn-success"
              disabled={tracks.length === 0}
              onClick={handlePlayAll}
            >
              ▶️ Play All
            </button>
            <button
              className="btn btn-warning"
              disabled={!isPlaying}
              onClick={handlePause}
            >
              ⏸️ Pause
            </button>
            <button
              className="btn btn-info"
              disabled={isPlaying || currentTrackIndex === null}
              onClick={handleResume}
            >
              ▶️ Resume
            </button>
          </div>
        </div>

        {error && (
          <div className="error">
            <strong>Error:</strong> {error}
          </div>
        )}

        <div className="section">
          <h2>
            Tracks Found <span className="count">{tracks.length}</span>
          </h2>
          {tracks.length > 0 ? (
            <div className="tracks-list">
              {tracks.slice(0, 10).map((track, index) => (
                <div
                  key={index}
                  className={`track-item${currentTrackIndex === index ? ' current' : ''}`}
                  onClick={() => handleTrackSelect(index)}
                  style={{ cursor: 'pointer' }}
                  title="Click to play this track"
                >
                  <div className="track-number">{index + 1}</div>
                  <div className="track-info">
                    <div className="track-title">
                      {track.name}{" "}
                      {currentTrackIndex === index && isPlaying && <span>🔊</span>}
                    </div>
                    <div className="track-meta">
                      {track.duration && <span>{formatTime(track.duration)}</span>}
                      {track.size && <span>{formatFileSize(track.size)}</span>}
                    </div>
                  </div>
                </div>
              ))}
              {tracks.length > 10 && (
                <div className="info-message">
                  ... and {tracks.length - 10} more tracks
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <p>No tracks loaded. Click "Load Music Folder" to get started.</p>
            </div>
          )}
        </div>

        <div className="section">
          <h2>Status</h2>
          <div className="status-grid">
            <div className="status-item">
              <span className="status-label">Total Tracks:</span>
              <span className="status-value">{tracks.length}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Loading:</span>
              <span className="status-value">{loading ? 'Yes' : 'No'}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Library Ready:</span>
              <span className="status-value">{library ? 'Yes' : 'No'}</span>
            </div>
            <div className="status-item">
              <span className="status-label">Now Playing:</span>
              <span className="status-value">
                {currentTrackIndex !== null && tracks[currentTrackIndex]
                  ? tracks[currentTrackIndex].name
                  : 'None'}
                {isPlaying && currentTrackIndex !== null ? ' 🔊' : ''}
              </span>
            </div>
          </div>
        </div>
        {/* Hidden/not visually intrusive audio player for playing tracks */}
        <audio
          ref={audioRef}
          style={{ display: 'none' }}
          onEnded={handleTrackEnded}
          controls={false}
          autoPlay
        />
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`
}
