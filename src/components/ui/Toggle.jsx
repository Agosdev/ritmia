import React from 'react'
import styled from 'styled-components'

const Label = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: ${({ theme }) => theme.colors.panel};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.full};
  padding: 0 0.75rem;
  min-height: 2.75rem;
  font-size: 11px;
  cursor: pointer;
  user-select: none;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderStrong};
  }

  &:focus-within {
    outline: 3px solid ${({ theme }) => theme.colors.amber};
    outline-offset: 3px;
  }
`

const HiddenInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  clip-path: inset(50%);
  opacity: 0;
`

const Dot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ $active, theme, $color }) =>
    $active ? $color || theme.colors.emerald : theme.colors.borderStrong};
  box-shadow: ${({ $active, theme }) => ($active ? `0 0 8px ${theme.colors.emerald}` : 'none')};
  transition: ${({ theme }) => theme.transitions.fast};
`

const Text = styled.span`
  color: ${({ theme }) => theme.colors.text};
`

export function Toggle({ checked, onChange, label, activeColor, id }) {
  return (
    <Label htmlFor={id}>
      <HiddenInput
        id={id}
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
      />
      <Dot $active={checked} $color={activeColor} />
      <Text>{label}</Text>
    </Label>
  )
}
