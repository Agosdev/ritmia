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
  height: 2.25rem;
  font-size: 11px;
  cursor: pointer;
  user-select: none;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.borderStrong};
  }
`

const HiddenInput = styled.input`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
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
