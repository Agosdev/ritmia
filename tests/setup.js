import '@testing-library/jest-dom'

// Mock de Web Audio API para entornos jsdom
class MockAudioNode {
  constructor() {
    this.connect = vi.fn()
    this.disconnect = vi.fn()
  }
}

class MockAudioParam {
  constructor(defaultValue = 1) {
    this.value = defaultValue
    this.setValueAtTime = vi.fn()
    this.linearRampToValueAtTime = vi.fn()
    this.exponentialRampToValueAtTime = vi.fn()
  }
}

class MockGainNode extends MockAudioNode {
  constructor() {
    super()
    this.gain = new MockAudioParam(1)
  }
}

class MockOscillatorNode extends MockAudioNode {
  constructor() {
    super()
    this.type = 'sine'
    this.frequency = new MockAudioParam(440)
    this.start = vi.fn()
    this.stop = vi.fn()
  }
}

class MockBiquadFilterNode extends MockAudioNode {
  constructor() {
    super()
    this.type = 'lowpass'
    this.frequency = new MockAudioParam(1000)
    this.Q = new MockAudioParam(1)
  }
}

class MockDynamicsCompressorNode extends MockAudioNode {
  constructor() {
    super()
    this.threshold = new MockAudioParam(-20)
    this.ratio = new MockAudioParam(6)
    this.knee = new MockAudioParam(20)
    this.attack = new MockAudioParam(0.003)
    this.release = new MockAudioParam(0.2)
  }
}

class MockBufferSourceNode extends MockAudioNode {
  constructor() {
    super()
    this.buffer = null
    this.playbackRate = new MockAudioParam(1)
    this.start = vi.fn()
    this.stop = vi.fn()
  }
}

class MockAudioContext {
  constructor() {
    this.currentTime = 0
    this.sampleRate = 44100
    this.state = 'running'
    this.destination = new MockAudioNode()
  }

  createGain() {
    return new MockGainNode()
  }

  createOscillator() {
    return new MockOscillatorNode()
  }

  createBiquadFilter() {
    return new MockBiquadFilterNode()
  }

  createDynamicsCompressor() {
    return new MockDynamicsCompressorNode()
  }

  createBufferSource() {
    return new MockBufferSourceNode()
  }

  createBuffer(channels, length, sampleRate) {
    return {
      channels,
      length,
      sampleRate,
      duration: length / sampleRate,
      getChannelData: vi.fn(() => new Float32Array(length)),
    }
  }

  resume() {
    this.state = 'running'
    return Promise.resolve()
  }

  close() {
    this.state = 'closed'
    return Promise.resolve()
  }
}

window.AudioContext = MockAudioContext
window.webkitAudioContext = MockAudioContext

// Unit tests never access the network; real WAV decoding is covered in browser tests.
beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })))
})
