import { isNumerator, isDenominator, isBpm, isMode } from './validation'

function assertIntegers(a, b) {
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) {
    throw new RangeError('MCD/MCM requieren enteros seguros')
  }
}

export function gcd(a, b) {
  assertIntegers(a, b)
  a = Math.abs(a)
  b = Math.abs(b)
  while (b !== 0) [a, b] = [b, a % b]
  return a
}

export function lcm(a, b) {
  assertIntegers(a, b)
  if (a === 0 || b === 0) return 0
  const result = Math.abs((a / gcd(a, b)) * b)
  if (!Number.isSafeInteger(result)) throw new RangeError('MCM fuera del rango entero seguro')
  return result
}

function reducedRatio(a, b) {
  const divisor = gcd(a, b)
  return { a: a / divisor, b: b / divisor }
}

// Ver docs/musical-domain.md: BPM = negras/min; ticks = fusas escritas.
// Los reencuentros son de inicios de compás, con ambos iniciados juntos.
export function calculateTiming({
  bpm,
  numA,
  denA,
  numB = 5,
  denB = 8,
  mode = 'polirritmia',
  claveMeasures = 1,
}) {
  if (!isBpm(bpm) || !isNumerator(numA) || !isNumerator(numB) ||
      !isDenominator(denA) || !isDenominator(denB) || !isMode(mode) ||
      ![1, 2].includes(claveMeasures) || (mode !== 'clave' && claveMeasures !== 1)) {
    throw new RangeError('Configuración musical inválida')
  }
  const beatSec = 60 / bpm
  const tickSec = beatSec / 8
  const ticksA = numA * (32 / denA)
  const canonicalClaveCycle = mode === 'clave' && claveMeasures === 2
  const ticksB = canonicalClaveCycle ? 64 : numB * (32 / denB)
  const lcmTicks = lcm(ticksA, ticksB)
  const polymeter = mode === 'polimetria'
  const adaptedMeasuresB = mode === 'clave' ? claveMeasures : 1
  // Mantener las fórmulas temporales existentes del motor.
  const measureA = polymeter ? (beatSec * (4 / denA)) * numA : beatSec * numA * (4 / denA)
  const stepA = polymeter ? beatSec * (4 / denA) : measureA / numA
  const measureB = polymeter
    ? beatSec * (4 / denB) * numB
    : canonicalClaveCycle
      ? beatSec * 8
      : measureA * adaptedMeasuresB
  const stepB = polymeter ? beatSec * (4 / denB) : measureB / numB
  const pulseRatio = reducedRatio(numA, numB)

  return {
    stepA, stepB, measureA, measureB, tickSec, ticksA, ticksB, lcmTicks,
    pulseRatio,
    eventRatio: polymeter
      ? reducedRatio(denA, denB)
      : canonicalClaveCycle
        ? reducedRatio(ticksB * numA, ticksA * numB)
        : reducedRatio(numA * adaptedMeasuresB, numB),
    durationRatio: polymeter || canonicalClaveCycle
      ? reducedRatio(ticksA, ticksB)
      : reducedRatio(1, adaptedMeasuresB),
    reunionA: polymeter || canonicalClaveCycle ? lcmTicks / ticksA : adaptedMeasuresB,
    reunionB: polymeter || canonicalClaveCycle ? lcmTicks / ticksB : 1,
    reunionSec: polymeter || canonicalClaveCycle ? lcmTicks * tickSec : measureB,
  }
}
