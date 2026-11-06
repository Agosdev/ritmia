import styled from 'styled-components'

// The fill follows the actual value; timing and gain stay in their existing handlers.
export const RangeInput = styled.input.attrs(({ min = 0, max = 1, value = 0, style }) => ({
  type: 'range',
  style: { ...style, '--range-progress': `${Math.max(0, Math.min(100, 100 * (Number(value) - Number(min)) / (Number(max) - Number(min))))}%` },
}))``
