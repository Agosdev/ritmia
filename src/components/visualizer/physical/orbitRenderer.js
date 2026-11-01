export async function createOrbitRenderer(canvas, signal) {
  // This is the only Three.js import in the product. It runs after 3D activation.
  const THREE = await import('three')
  if (signal.aborted) return null
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: true, powerPreference: 'low-power', stencil: false })
  if (!gl) throw new Error('WebGL 2 no disponible')
  const resources = new Set()
  const keep = resource => { resources.add(resource); return resource }
  let renderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas, context: gl, antialias: true, powerPreference: 'low-power' })
    renderer.setClearColor('#e9edf0')
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1.5, .1, 30)
    camera.position.set(0, 2.1, 6.7)
    camera.lookAt(0, 0, 0)
    scene.add(new THREE.HemisphereLight('#ffffff', '#8c9da9', 2.4))
    const light = new THREE.DirectionalLight('#ffffff', 3)
    light.position.set(-3, 5, 4); scene.add(light)
    const sphere = keep(new THREE.SphereGeometry(1, 24, 16))
    const bead = keep(new THREE.SphereGeometry(1, 10, 8))
    const markerMaterial = keep(new THREE.MeshStandardMaterial({ color: '#687b8a', metalness: .35, roughness: .42 }))
    const circle = keep(new THREE.CircleGeometry(1, 48))
    const matrix = new THREE.Matrix4()
    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const scale = new THREE.Vector3()
    const tracks = ['A', 'B'].map((name, index) => {
      const radius = index ? 1.7 : 1.28
      const color = index ? '#83d6de' : '#efafb6'
      const group = new THREE.Group()
      group.rotation.set(index ? -.6 : .65, index ? .35 : -.32, index ? -.2 : .18)
      scene.add(group)
      const ringGeometry = keep(new THREE.TorusGeometry(radius, .027, 8, 96))
      const ringMaterial = keep(new THREE.MeshStandardMaterial({ color: '#c2cdd5', metalness: .65, roughness: .3 }))
      group.add(new THREE.Mesh(ringGeometry, ringMaterial))
      const material = keep(new THREE.MeshStandardMaterial({ color, metalness: .22, roughness: .28, emissive: color, emissiveIntensity: 0, transparent: true }))
      const ball = new THREE.Mesh(sphere, material)
      group.add(ball)
      const markers = new THREE.InstancedMesh(bead, markerMaterial, 32)
      markers.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
      group.add(markers)
      const impactMaterial = keep(new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false }))
      const impact = new THREE.Mesh(keep(new THREE.TorusGeometry(.29, .012, 6, 48)), impactMaterial)
      group.add(impact)
      const shadow = new THREE.Mesh(circle, keep(new THREE.MeshBasicMaterial({ color: '#647683', transparent: true, opacity: .12, depthWrite: false })))
      shadow.rotation.x = -Math.PI / 2
      shadow.position.set(index ? .6 : -.5, -1.85, index ? -.2 : .15)
      shadow.scale.set(.9, .6, 1); scene.add(shadow)
      return { name, group, ball, markers, radius, material, impact, shadow, accents: null, count: 0 }
    })
    return {
      resize(width, height) {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 500 ? 1.25 : 1.5))
        renderer.setSize(width, height, false)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
      },
      draw(frame) {
        tracks.forEach((track, index) => {
          const item = frame.tracks[index]
          track.group.visible = track.shadow.visible = !!item
          if (!item) return
          if (track.accents !== item.accents || track.count !== item.count) {
            track.count = item.count; track.accents = item.accents; track.markers.count = item.count
            for (let i = 0; i < item.count; i++) {
              const angle = i / item.count * Math.PI * 2 - Math.PI / 2
              position.set(Math.cos(angle) * track.radius, Math.sin(angle) * track.radius, 0)
              scale.setScalar(item.accents[i] === 2 ? .055 : item.accents[i] === 1 ? .036 : .018)
              matrix.compose(position, quaternion, scale)
              track.markers.setMatrixAt(i, matrix)
            }
            track.markers.instanceMatrix.needsUpdate = true
            track.markers.computeBoundingSphere()
          }
          const phase = frame.reduceMotion ? (index ? .3 : .72) : item.phase
          const angle = phase * Math.PI * 2 - Math.PI / 2
          track.ball.position.set(Math.cos(angle) * track.radius, Math.sin(angle) * track.radius, item.height * .35)
          const radius = item.accent === 1 ? .19 : .23
          track.ball.scale.set(radius * item.scaleX, radius * item.scaleY, radius)
          track.material.opacity = .35 + item.gain * .65
          track.material.emissiveIntensity = item.impact * 1.4
          track.impact.visible = item.impact > 0
          track.impact.position.copy(track.ball.position)
          track.impact.scale.setScalar(1 + (1 - item.impact) * 1.4)
          track.impact.material.opacity = item.impact * .6
          track.group.rotation.z = (index ? -.2 : .18) + (frame.reduceMotion || frame.stopped ? 0 : Math.sin(frame.time * .17) * .055)
        })
        renderer.render(scene, camera)
      },
      resources: () => ({ geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures, drawCalls: renderer.info.render.calls }),
      dispose() {
        tracks.forEach(track => track.markers.dispose())
        for (const resource of resources) resource.dispose()
        resources.clear()
        scene.clear()
        renderer.renderLists.dispose()
        renderer.dispose()
        renderer.forceContextLoss()
        canvas.width = canvas.height = 1
      },
    }
  } catch (error) {
    for (const resource of resources) resource.dispose()
    renderer?.dispose()
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    throw error
  }
}
