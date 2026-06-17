// Sound notifications using Web Audio API
// No external audio files needed - generates tones programmatically

type SoundType = 'message' | 'task_accepted' | 'success' | 'error'

// Lazy initialization to avoid hydration issues
let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (e) {
      return null
    }
  }
  return audioContext
}

function generateTone(frequency: number, duration: number, volume: number = 0.3): AudioBuffer | null {
  const ctx = getAudioContext()
  if (!ctx) return null

  const sampleRate = ctx.sampleRate
  const samples = duration * sampleRate
  const buffer = ctx.createBuffer(1, samples, sampleRate)
  const data = buffer.getChannelData(0)

  const omega = (2 * Math.PI * frequency) / sampleRate
  for (let i = 0; i < samples; i++) {
    // Fade in/out to prevent clicks
    const envelope = i < samples * 0.05 ? i / (samples * 0.05) : i > samples * 0.95 ? (samples - i) / (samples * 0.05) : 1
    data[i] = Math.sin(omega * i) * envelope * volume
  }

  return buffer
}

function playSoundTone(frequency: number, duration: number) {
  const ctx = getAudioContext()
  if (!ctx) return

  const buffer = generateTone(frequency, duration)
  if (!buffer) return

  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.connect(ctx.destination)
  source.start(ctx.currentTime)
}

export function playSound(type: SoundType) {
  // Check if user has enabled sound notifications
  if (typeof window !== 'undefined') {
    const soundEnabled = localStorage.getItem('soundNotificationsEnabled') !== 'false'
    if (!soundEnabled) return
  }

  // Resume audio context if needed (browser autoplay policy)
  const ctx = getAudioContext()
  if (ctx && ctx.state === 'suspended') {
    ctx.resume()
  }

  // Play different sound patterns for different event types
  switch (type) {
    case 'message':
      // Double beep for new message
      playSoundTone(800, 0.1)
      setTimeout(() => playSoundTone(1000, 0.1), 150)
      vibrate([100, 50, 100])
      break

    case 'task_accepted':
      // Rising tones for task acceptance
      playSoundTone(700, 0.15)
      setTimeout(() => playSoundTone(900, 0.15), 180)
      setTimeout(() => playSoundTone(1100, 0.15), 360)
      vibrate([50, 50, 50, 50, 100])
      break

    case 'success':
      // Single pleasant tone
      playSoundTone(1200, 0.2)
      vibrate([100])
      break

    case 'error':
      // Low warning tone
      playSoundTone(400, 0.3)
      vibrate([200, 100, 200])
      break
  }
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return

  try {
    navigator.vibrate(pattern)
  } catch (e) {
    // Vibration not supported or permission denied
  }
}

export function isSoundSupported(): boolean {
  const ctx = getAudioContext()
  return ctx !== null && ctx.state !== 'closed'
}
