import React, { useState } from 'react'
import { PhysicalCanvas } from './PhysicalCanvas'
import { createOrbitRenderer } from './orbitRenderer'
import BounceVisualizer from './BounceVisualizer'

export default function OrbitVisualizer(props) {
  const [error, setError] = useState(null)
  if (error) return <>
    <p role="status">Órbita 3D no disponible en este dispositivo. Se muestra Rebote 2D.</p>
    <BounceVisualizer {...props} />
  </>
  return <PhysicalCanvas {...props} factory={createOrbitRenderer} kind="orbit" onError={setError} />
}
