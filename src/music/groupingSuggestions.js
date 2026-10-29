import { isNumerator } from './validation'
import { MAX_NUM } from './constants'

/**
 * Parsea un string de agrupación como "3+2+2" en un array de números [3, 2, 2].
 * Retorna null si es inválido.
 */
export function parseGrouping(str) {
  if (!str || typeof str !== 'string' || !str.trim()) return null
  const tokens = str.trim().split('+').map(s => s.trim())
  if (tokens.length > MAX_NUM || tokens.some(token => !/^\d+$/.test(token))) return null
  const parts = tokens.map(Number)
  return parts.every(isNumerator) ? parts : null
}

/**
 * Valida si la suma del agrupamiento coincide exactamente con el numerador.
 */
export function isGroupingValid(groupingArray, targetNum) {
  if (!isNumerator(targetNum) || !Array.isArray(groupingArray) ||
      groupingArray.length === 0 || groupingArray.length > MAX_NUM ||
      !Array.from(groupingArray).every(isNumerator)) return false
  const sum = groupingArray.reduce((acc, curr) => acc + curr, 0)
  return sum === targetNum
}

export function getGroupingStatus(text, num) {
  if (typeof text !== 'string') return 'invalid'
  const trimmed = text.trim()
  if (!trimmed) return 'empty'
  if (trimmed.endsWith('+') && parseGrouping(trimmed.slice(0, -1))) return 'incomplete'
  const parsed = parseGrouping(trimmed)
  if (!parsed) return 'invalid'
  return isGroupingValid(parsed, num) ? 'valid' : 'sum-mismatch'
}

export function groupingFeedback(status, num, applied) {
  if (status === 'valid') return `válida suma=${num}`
  const reason = {
    empty: 'texto vacío', incomplete: 'texto incompleto',
    invalid: 'formato inválido', 'sum-mismatch': `suma distinta de ${num}`,
  }[status]
  return `${reason}; ${applied ? `se conserva ${applied.join('+')}` : 'sin agrupación aplicada'}`
}

/**
 * Encuentra el índice de grupo correspondiente a un pulso específico (0-indexed).
 */
export function groupIndexForBeat(beatIndex, groupingArray) {
  if (!groupingArray || groupingArray.length === 0) return 0
  let accumulated = 0
  for (let i = 0; i < groupingArray.length; i++) {
    accumulated += groupingArray[i]
    if (beatIndex < accumulated) return i
  }
  return groupingArray.length - 1
}

/**
 * Genera sugerencias automáticas de agrupación rítmica para un número dado de pulsos.
 */
export function getGroupingSuggestions(num) {
  if (!isNumerator(num) || num < 2) return []

  // Presets pedagógicos clásicos para compases irregulares comunes
  if (num === 5) return ['3+2', '2+3']
  if (num === 7) return ['3+2+2', '2+2+3', '2+3+2']
  if (num === 8) return ['3+3+2', '2+3+3', '4+4']
  if (num === 9) return ['3+3+3', '2+2+2+3']
  if (num === 10) return ['3+3+2+2', '2+3+3+2', '5+5']
  if (num === 11) return ['3+3+3+2', '2+2+3+2+2', '3+2+3+3']
  if (num === 12) return ['3+3+3+3', '4+4+4', '2+2+2+2+2+2', '6+6', '3+3+2+2+2', '4+4+2+2']
  if (num === 15) return ['3+3+3+3+3', '5+5+5', '3+3+3+2+2+2', '5+4+3+3', '6+3+3+3']

  const suggestions = []
  const add = (pattern) => {
    if (!pattern) return
    if (suggestions.includes(pattern)) return
    const sum = pattern.split('+').reduce((acc, n) => acc + (parseInt(n, 10) || 0), 0)
    if (sum === num) suggestions.push(pattern)
  }

  // Divisores uniformes
  if (num % 3 === 0) add(Array(num / 3).fill(3).join('+'))
  if (num % 4 === 0) add(Array(num / 4).fill(4).join('+'))
  if (num % 2 === 0) add(Array(num / 2).fill(2).join('+'))
  if (num % 5 === 0) add(Array(num / 5).fill(5).join('+'))
  if (num % 6 === 0) add(Array(num / 6).fill(6).join('+'))
  if (num % 8 === 0) add(Array(num / 8).fill(8).join('+'))

  // Combinaciones de 3s y 2s
  for (let r = Math.floor(num / 3); r >= 0; r--) {
    const rem = num - r * 3
    if (rem >= 0 && rem % 2 === 0) {
      const twos = rem / 2
      if (r + twos > 1 && r + twos <= 16) {
        const pat = [...Array(r).fill(3), ...Array(twos).fill(2)].join('+')
        add(pat)
        if (suggestions.length >= 6) break
      }
    }
  }

  // Combinaciones de 4s y 3s
  for (let r = Math.floor(num / 4); r >= 0; r--) {
    const rem = num - r * 4
    if (rem >= 0 && rem % 3 === 0) {
      const threes = rem / 3
      if (r + threes > 1 && r + threes <= 16) {
        const pat = [...Array(r).fill(4), ...Array(threes).fill(3)].join('+')
        add(pat)
        if (suggestions.length >= 8) break
      }
    }
  }

  return suggestions.slice(0, 6)
}
