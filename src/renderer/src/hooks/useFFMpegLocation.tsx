import { useSyncExternalStore } from 'react'

const subscribe = (listener: () => void) => {
  window.addEventListener('ffmpegLocation', listener)
  return () => void window.removeEventListener('ffmpegLocation', listener)
}

const getSnapshot = () => {
  return null
}

const useFFMpegLocation = () => {
  useSyncExternalStore(subscribe, getSnapshot)
}

export default useFFMpegLocation
