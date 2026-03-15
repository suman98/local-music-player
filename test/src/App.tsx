import { useState, useEffect } from 'react'
import { createMusicLibrary, MusicLibrary, AudioTrack } from '@music-library/core'
import './App.css'

export default function App() {
  const [library, setLibrary] = useState<MusicLibrary | null>(null)
  const [tracks, setTracks] = useState<AudioTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Initialize music library
    const musicLib = createMusicLibrary({
      debugMode: true,
      autoRestoreLast: true,
    })

    setLibrary(musicLib)
    setTracks(musicLib.tracks)
  }, [])

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
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to clear'
      setError(errorMsg)
      console.error(errorMsg, err)
    } finally {
      setLoading(false)
    }
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
                <div key={index} className="track-item">
                  <div className="track-number">{index + 1}</div>
                  <div className="track-info">
                    <div className="track-title">{track.name}</div>
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
          </div>
        </div>
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
