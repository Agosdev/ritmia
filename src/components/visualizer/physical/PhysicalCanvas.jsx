import React, { useEffect } from 'react'
import { usePhysicalRenderer } from './usePhysicalRenderer'

export function PhysicalCanvas({ factory, kind, showTrackB, reduceMotion, onError }) {
  const { canvasRef, error } = usePhysicalRenderer(factory, { showTrackB, reduceMotion })
  useEffect(() => { if (error) onError(error) }, [error, onError])
  return <canvas ref={canvasRef} data-testid={`physical-${kind}`} role="img"
    aria-label={`${kind === 'orbit' ? 'Órbita 3D' : 'Rebote 2D'}: ciclos de A${showTrackB ? ' y B' : ''}. Los impactos indican golpes audibles; los silencios no generan impactos.`} />
}
