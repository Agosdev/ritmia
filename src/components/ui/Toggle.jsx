import React from 'react'
import styled from 'styled-components'

const Label = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: ${({ theme }) => theme.gradients.softWash};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.full};
  padding: 0 0.75rem;
  min-height: 2.75rem;
  box-shadow: ${({ theme }) => theme.variant === 'lite' ? theme.shadows.sm : 'none'};
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
  ${({ theme, $checked }) => theme.variant === 'lite' && `
    box-shadow: ${$checked ? theme.physical.selected : theme.physical.elevated};
    border-color: ${theme.colors.borderLight};
  `}

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
    $active ? $color || (theme.variant === 'lite' ? theme.colors.cyan : theme.colors.emerald) : theme.colors.borderStrong};
  box-shadow: ${({ $active, theme }) => ($active
    ? theme.variant === 'lite' ? `0 0 0 2px ${theme.colors.panel}, 0 0 0 3px ${theme.colors.cyan}` : `0 0 8px ${theme.colors.emerald}`
    : 'none')};
  transition: ${({ theme }) => theme.transitions.fast};
  ${({ theme, $active }) => theme.variant === 'lite' && `
    width: 12px; height: 12px;
    border: 1px solid ${theme.colors.textDim};
    border-radius: 3px;
    background: ${theme.colors.panel};
    box-shadow: none;
    &::after {
      content: '${$active ? '✓' : ''}'; display: block; color: ${theme.colors.text};
      font-size: 10px; line-height: 10px; font-weight: 800;
    }
  `}

`

const Text = styled.span`
  color: ${({ theme }) => theme.colors.text};
`

export function Toggle({ checked, onChange, label, activeColor, id }) {
  return (
    <Label htmlFor={id} $checked={checked}>
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
