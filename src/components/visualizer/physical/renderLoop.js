// One bounded visual loop. Audio scheduling remains owned by AudioEngine.
export function createRenderLoop({ draw, isPlaying, isReduced, isHidden = () => document.hidden,
  raf = requestAnimationFrame, cancel = cancelAnimationFrame,
  later = setTimeout, clear = clearTimeout, now = () => performance.now(),
}) {
  let frame = null
  let timer = null
  let disposed = false
  let last = -Infinity
  function cancelPending() {
    if (frame !== null) cancel(frame)
    if (timer !== null) clear(timer)
    frame = timer = null
  }
  function tick(timestamp = now()) {
    frame = timer = null
    if (disposed || isHidden()) return
    if (timestamp - last >= 1000 / 30 - .5 || !isPlaying() || isReduced()) {
      draw()
      last = timestamp
    }
    if (disposed || isHidden()) return
    if (isPlaying()) {
      if (isReduced()) timer = later(() => tick(now()), 150)
      else frame = raf(tick)
    }
  }
  return {
    refresh() {
      if (disposed) return
      cancelPending()
      last = -Infinity
      if (!isHidden()) frame = raf(tick)
    },
    dispose() { disposed = true; cancelPending() },
  }
}
