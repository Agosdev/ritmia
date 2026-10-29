// Modelo determinista del grafo: usa los instrumentos reales, registra sus
// conexiones y simula start/stop/onended al avanzar el reloj explícitamente.
const BaseAudioContext = window.AudioContext

export function controlledAudioContext({ suspended = false } = {}) {
  return class ControlledAudioContext extends BaseAudioContext {
    static instances = []

    constructor() {
      super()
      this.state = suspended ? 'suspended' : 'running'
      this.nodes = []
      this.sources = []
      this.resumeResolvers = []
      this.constructor.instances.push(this)
    }

    record(node, source = false) {
      node.connections = new Set()
      node.connect = vi.fn(destination => node.connections.add(destination))
      node.disconnect = vi.fn(() => node.connections.clear())
      this.nodes.push(node)
      if (source) {
        node.startTime = null
        node.stopTime = Infinity
        node.ended = false
        node.start = vi.fn(time => { node.startTime = time })
        node.stop = vi.fn(time => { node.stopTime = time })
        this.sources.push(node)
      }
      return node
    }

    createGain() { return this.record(super.createGain()) }
    createBiquadFilter() { return this.record(super.createBiquadFilter()) }
    createDynamicsCompressor() { return this.record(super.createDynamicsCompressor()) }
    createOscillator() { return this.record(super.createOscillator(), true) }
    createBufferSource() { return this.record(super.createBufferSource(), true) }

    resume() {
      if (!suspended) return super.resume()
      return new Promise(resolve => this.resumeResolvers.push(() => {
        if (this.state !== 'closed') this.state = 'running'
        resolve()
      }))
    }

    advanceTo(time) {
      this.currentTime = time
      for (const source of this.sources) {
        if (!source.ended && source.stopTime <= time) {
          source.ended = true
          source.onended?.()
        }
      }
    }

    audibleAt(time) {
      const reachesOutput = (node, visited = new Set()) => {
        if (node === this.destination) return true
        if (visited.has(node)) return false
        visited.add(node)
        return [...node.connections].some(next => reachesOutput(next, visited))
      }
      return this.sources.filter(source => this.state === 'running' &&
        source.startTime !== null && source.startTime <= time &&
        source.stopTime > time && reachesOutput(source))
    }
  }
}
