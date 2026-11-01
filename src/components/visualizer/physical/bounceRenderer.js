const COLORS = { A: ['#fff0ef', '#edb3b8', '#ff7b88'], B: ['#ecffff', '#9fcfd4', '#45dbe4'] }

export function createBounceRenderer(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) throw new Error('Canvas 2D no disponible')
  return {
    resize(width, height) {
      const dpr = Math.min(window.devicePixelRatio || 1, width < 500 ? 1.5 : 2)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
    },
    draw(frame) {
      ctx.setTransform(canvas.width / 600, 0, 0, canvas.height / 400, 0, 0)
      ctx.fillStyle = '#e9edf0'
      ctx.fillRect(0, 0, 600, 400)
      ctx.textAlign = 'center'
      ctx.font = '600 14px system-ui'
      ctx.fillStyle = '#4c5b69'
      ctx.fillText(frame.tracks.length === 1 ? 'Pista A' : 'Pistas A y B', 300, 35)
      for (const item of frame.tracks) {
        const x = frame.tracks.length === 1 ? 300 : item.track === 'A' ? 170 : 430
        const ground = 285
        const radius = 42
        const y = ground - radius - item.height * 110
        const colors = COLORS[item.track]
        // Diffuse contact shadow, with no large blur or full-frame filtering.
        ctx.save()
        ctx.translate(x + 6, ground + 6)
        ctx.scale(1, .23)
        const shadow = ctx.createRadialGradient(0, 0, 2, 0, 0, 58 - item.height * 13)
        shadow.addColorStop(0, `rgba(52,65,78,${.25 - item.height * .12})`)
        shadow.addColorStop(1, 'rgba(52,65,78,0)')
        ctx.fillStyle = shadow
        ctx.beginPath(); ctx.arc(0, 0, 58 - item.height * 13, 0, Math.PI * 2); ctx.fill()
        ctx.restore()
        ctx.beginPath(); ctx.ellipse(x, ground + 9, 84, 17, 0, 0, Math.PI * 2)
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke()
        ctx.beginPath(); ctx.ellipse(x, ground + 6, 84, 17, 0, 0, Math.PI * 2)
        ctx.strokeStyle = '#bec9d2'; ctx.lineWidth = 2; ctx.stroke()
        if (item.impact > 0) {
          ctx.beginPath(); ctx.ellipse(x, ground + 5, 42 + (1 - item.impact) * 40, 9, 0, 0, Math.PI * 2)
          ctx.strokeStyle = colors[2]; ctx.globalAlpha = item.impact; ctx.lineWidth = 2; ctx.stroke(); ctx.globalAlpha = 1
        }
        ctx.save()
        ctx.translate(x, y); ctx.scale(item.scaleX, item.scaleY)
        const fill = ctx.createRadialGradient(-13, -15, 2, 3, 9, radius * 1.3)
        fill.addColorStop(0, '#fff'); fill.addColorStop(.35, colors[0]); fill.addColorStop(1, colors[1])
        ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill()
        ctx.strokeStyle = '#8795a2'; ctx.lineWidth = .9; ctx.stroke()
        ctx.fillStyle = '#334350'; ctx.font = '700 17px system-ui'; ctx.fillText(item.track, 0, 6)
        ctx.restore()
        for (let i = 0; i < item.count; i++) {
          const px = x - 83 + i / Math.max(1, item.count - 1) * 166
          ctx.beginPath(); ctx.arc(px, 337, item.accents[i] === 2 ? 3.5 : 2.2, 0, Math.PI * 2)
          ctx.fillStyle = item.accents[i] ? '#5d6b78' : '#e9edf0'
          ctx.fill(); ctx.strokeStyle = '#5d6b78'; ctx.lineWidth = .8; ctx.stroke()
          if (!frame.stopped && i === item.position) {
            ctx.strokeStyle = '#334350'; ctx.lineWidth = 1.4; ctx.strokeRect(px - 5, 331, 10, 12)
          }
        }
        ctx.fillStyle = '#4c5b69'; ctx.font = '13px system-ui'
        ctx.fillText(`${item.track} · ${frame.stopped ? 'listo' : `${item.position + 1}/${item.count}`} · ${Math.round(item.gain * 100)}%`, x, 370)
      }
    },
    dispose() { ctx.clearRect(0, 0, canvas.width, canvas.height); canvas.width = canvas.height = 1 },
  }
}
