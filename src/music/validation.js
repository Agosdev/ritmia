import { MAX_NUM, MIN_BPM, MAX_BPM, DENOMINATORS, MODES } from './constants'

export const isNumerator = value => Number.isInteger(value) && value >= 1 && value <= MAX_NUM
export const isDenominator = value => DENOMINATORS.includes(value)
export const isBpm = value => Number.isInteger(value) && value >= MIN_BPM && value <= MAX_BPM
export const isMode = value => MODES.includes(value)
export const isUnitValue = value => Number.isFinite(value) && value >= 0 && value <= 1
export const isAccentArray = value => Array.isArray(value) && value.length >= 1 &&
  value.length <= MAX_NUM && Array.from(value).every(accent => [0, 1, 2].includes(accent))

export const isLevel = value => [1, 2, 3].includes(value)
export const isText = value => typeof value === 'string'
