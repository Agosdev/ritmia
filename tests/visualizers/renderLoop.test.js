import { describe, expect, it, vi } from 'vitest'
import { createRenderLoop } from '../../src/components/visualizer/physical/renderLoop'

function harness() {
  const frames = new Map(), timers = new Map()
  let id = 0
  const state = { playing: true, reduced: false, hidden: false }
  const draw = vi.fn()
  const loop = createRenderLoop({ draw, isPlaying: () => state.playing, isReduced: () => state.reduced, isHidden: () => state.hidden,
    raf: fn => { frames.set(++id, fn); return id }, cancel: key => frames.delete(key),
    later: fn => { timers.set(++id, fn); return id }, clear: key => timers.delete(key), now: () => 200,
  })
  const tick = time => { const [key, fn] = frames.entries().next().value; frames.delete(key); fn(time) }
  return { state, draw, loop, frames, timers, tick }
}

describe('visual loop lifecycle', () => {
  it('caps drawing to 30 Hz and repeated refresh never creates parallel loops', () => {
    const h = harness()
    h.loop.refresh(); h.loop.refresh(); h.loop.refresh()
    expect(h.frames.size).toBe(1)
    h.tick(0); h.tick(16); h.tick(34)
    expect(h.draw).toHaveBeenCalledTimes(2)
    expect(h.frames.size).toBe(1)
    h.loop.dispose(); expect(h.frames.size).toBe(0)
  })
  it('pauses all visual work when the page is hidden and refreshes from the real clock on return', () => {
    const h = harness(); h.loop.refresh(); h.tick(0)
    h.state.hidden = true; h.loop.refresh()
    expect(h.frames.size).toBe(0); expect(h.timers.size).toBe(0)
    h.state.hidden = false; h.loop.refresh(); h.tick(400)
    expect(h.draw).toHaveBeenCalledTimes(2)
  })
  it('uses only low-frequency redraws under reduced motion and clears timers on disposal', () => {
    const h = harness(); h.state.reduced = true; h.loop.refresh(); h.tick(0)
    expect(h.frames.size).toBe(0); expect(h.timers.size).toBe(1)
    h.loop.dispose(); expect(h.timers.size).toBe(0)
    h.loop.refresh(); expect(h.frames.size).toBe(0)
  })
  it('draws once on pause/reset and stops scheduling, even if disposed during draw', () => {
    const h = harness(); h.state.playing = false; h.loop.refresh(); h.tick(0)
    expect(h.draw).toHaveBeenCalledTimes(1); expect(h.frames.size).toBe(0)
    h.state.playing = true; h.draw.mockImplementation(() => h.loop.dispose())
    h.loop.refresh(); h.tick(30); expect(h.frames.size).toBe(0)
  })
})
