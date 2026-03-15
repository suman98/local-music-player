# 🎵 Music Extension Test App

A React test application for testing the music library extension.

## Quick Start

### Installation

```bash
cd test
npm install
```

### Development

```bash
npm run dev
```

This will start the development server at `http://localhost:5173` and automatically open it in your browser.

### Build

```bash
npm run build
```

Creates an optimized production build in the `dist` folder.

### Preview

```bash
npm run preview
```

Preview the production build locally.

## Features

- **Load Music Folder**: Open a folder picker and load music files from your computer
- **View Track List**: See all loaded tracks with metadata (duration, file size)
- **Refresh**: Sync changes from the folder
- **Clear Cache**: Remove all stored tracks and start fresh
- **Real-time Status**: Monitor loading state and track count
- **Error Handling**: Display errors in a user-friendly format

## How to Use

1. **Load Music Folder**: Click the "Load Music Folder" button to open a folder picker
2. **Select Folder**: Choose a folder containing music files (MP3, WAV, OGG, etc.)
3. **View Results**: The app displays all found tracks with their metadata
4. **Manage**: Use Refresh or Clear buttons to manage the loaded data

## Supported Audio Formats

The music library supports the following formats:
- MP3 (.mp3)
- WAV (.wav)
- OGG Vorbis (.ogg)
- OPUS (.opus)
- FLAC (.flac)
- AAC (.aac)
- M4A (.m4a)

## Testing on Different Platforms

### Desktop
- Works with Chrome, Edge, Firefox on macOS, Windows, Linux
- Uses the File System API for folder access

### Mobile
- Works on iOS Safari and Chrome on Android
- Uses webkitdirectory for folder access

## Architecture

- **React 18**: Modern UI framework
- **Vite**: Fast build tool and dev server
- **TypeScript**: Type-safe development
- **Music Library**: Core audio file scanner and manager

## Project Structure

```
test/
├── public/
│   └── index.html          # HTML entry point
├── src/
│   ├── App.tsx             # Main React component
│   ├── App.css             # Styling
│   └── index.tsx           # React root
├── package.json            # Dependencies
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
└── README.md              # This file
```

## Notes

- The app uses IndexedDB for persistence - tracks remain cached even after refresh
- localStorage is used to store folder references
- Debug mode is enabled by default - check your browser console for detailed logs
- The app can work offline once tracks are cached

## Troubleshooting

**Folder picker doesn't open?**
- Ensure you're using a modern browser (Chrome 86+, Edge 86+, Safari 16.1+)
- Check browser console for any error messages

**Tracks not showing up?**
- Verify the folder contains supported audio formats
- Check browser console logs
- Try clicking "Refresh" to re-scan the folder

**Storage issues?**
- Clear browser cache and reload
- Use "Clear Cache" button to reset the app state
