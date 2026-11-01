import React, { useState } from 'react'
import { PhysicalCanvas } from './PhysicalCanvas'
import { createBounceRenderer } from './bounceRenderer'

export default function BounceVisualizer(props) {
  const [error, setError] = useState(null)
  if (error) return <p role="alert">Canvas 2D no disponible. Selecciona Clásico para continuar.</p>
  return <PhysicalCanvas {...props} factory={createBounceRenderer} kind="bounce" onError={setError} />
}
