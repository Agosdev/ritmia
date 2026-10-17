import { MAX_LCM } from './constants'

/**
 * Máximo Común Divisor (Greatest Common Divisor) usando el algoritmo de Euclides.
 */
export function gcd(a, b) {
  if (b === 0) return Math.abs(a)
  return gcd(b, a % b)
}

/**
 * Mínimo Común Múltiplo (Least Common Multiple).
 */
export function lcm(a, b) {
  if (a === 0 || b === 0) return 0
  return Math.abs(a * b) / (gcd(a, b) || 1)
}

/**
 * LCM limitado a MAX_LCM para evitar congelamientos o cálculos exorbitantes.
 */
export function cappedLcm(a, b, cap = MAX_LCM) {
  const result = lcm(a, b)
  return result > cap ? cap : result
}

/**
 * Calcula con precisión absoluta el timing musical de ambos compases y su relación.
 *
 * @param {Object} options
 * @param {number} options.bpm - Tempo en pulsos por minuto (negra = bpm)
 * @param {number} options.numA - Numerador de Compás A (1-32)
 * @param {number} options.denA - Denominador de Compás A (1, 2, 4, 8, 16)
 * @param {number} [options.numB=5] - Numerador de Compás B (1-32)
 * @param {number} [options.denB=8] - Denominador de Compás B (1, 2, 4, 8, 16)
 * @param {string} [options.mode='polirritmia'] - 'polirritmia' | 'polimetria' | 'morph' | 'clave'
 * @returns {Object} Parámetros de timing calculados
 */
export function calculateTiming({
  bpm,
  numA,
  denA,
  numB = 5,
  denB = 8,
  mode = 'polirritmia',
}) {
  const safeBpm = Math.max(20, Math.min(300, bpm || 92))
  const beatSec = 60 / safeBpm
  const tickSec = beatSec * 0.125 // 32nd note grid

  const ticksA = numA * (32 / denA)
  const ticksB = numB * (32 / denB)
  const exactLcm = lcm(ticksA, ticksB)
  const isCapped = exactLcm > MAX_LCM
  const effectiveLcm = isCapped ? MAX_LCM : exactLcm

  if (mode === 'polimetria') {
    // En polimetría, las figuras musicales tienen valor temporal absoluto independiente (corchea = corchea)
    const stepA = beatSec * (4 / denA)
    const stepB = beatSec * (4 / denB)
    const measureA = stepA * numA
    const measureB = stepB * numB

    return {
      stepA,
      stepB,
      measureA,
      measureB,
      ticksA,
      ticksB,
      ratio: ticksA / ticksB,
      lcmTicks: effectiveLcm,
      reunionA: effectiveLcm / ticksA,
      reunionB: effectiveLcm / ticksB,
      tickSec,
      capped: isCapped,
    }
  } else {
    // Polirritmia / Morph / Clave:
    // Ambos compases comparten la misma ventana de tiempo absoluto (measureB = measureA)
    const measureA = beatSec * numA * (4 / denA)
    const measureB = measureA
    const stepA = measureA / numA
    const stepB = measureB / numB

    return {
      stepA,
      stepB,
      measureA,
      measureB,
      ticksA,
      ticksB,
      ratio: ticksA / ticksB,
      lcmTicks: effectiveLcm,
      reunionA: effectiveLcm / ticksA,
      reunionB: effectiveLcm / ticksB,
      tickSec,
      capped: isCapped,
    }
  }
}
