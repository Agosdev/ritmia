import React from 'react'
import styled from 'styled-components'

const Label = styled.label`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: ${({ theme }) => theme.gradients.secondary};
  border: 1px solid ${({ theme }) => theme.glass.rim};
  border-radius: ${({ theme }) => theme.radii.full};
  padding: 0 0.85rem;
  min-height: 2.75rem;
  box-shadow: ${({ theme }) => theme.variant === 'lite' ? theme.physical.elevated : 'none'};
  font-size: 11px;
  cursor: pointer;
  user-select: none;
  transition: box-shadow 180ms ease, transform 160ms cubic-bezier(.2,.8,.25,1);

  @supports ((mask-composite: exclude) or (-webkit-mask-composite: xor)) {
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      padding: 1.25px;
      background: ${({ theme }) => theme.glass.edge};
      pointer-events: none;
      -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
      mask-composite: exclude;
    }
  }

  &:hover {
    box-shadow: ${({ theme }) => theme.variant === 'lite' ? theme.physical.hover : 'none'};
  }

  &:focus-within {
    outline: 3px solid ${({ theme }) => theme.glass.focus};
    outline-offset: 3px;
  }
  ${({ theme, $checked }) => theme.variant === 'lite' && $checked && `
    --control-surface: ${theme.gradients.primary};
    background: ${theme.gradients.primary};
    box-shadow: ${theme.physical.selected};
  `}
  @media (prefers-reduced-motion: reduce) {
    transition: none;
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
    $active ? $color || (theme.variant === 'lite' ? theme.colors.cyan : theme.colors.emerald) : theme.colors.borderStrong};
  box-shadow: ${({ $active, theme }) => ($active
    ? theme.variant === 'lite' ? `0 0 0 2px ${theme.colors.panel}, 0 0 0 3px ${theme.colors.cyan}` : `0 0 8px ${theme.colors.emerald}`
    : 'none')};
  transition: ${({ theme }) => theme.transitions.fast};
  ${({ theme, $active }) => theme.variant === 'lite' && `
    width: 12px; height: 12px;
    border: 1px solid ${$active ? theme.glass.rim : theme.colors.borderStrong};
    border-radius: 4px;
    background: ${$active ? theme.gradients.primary : theme.glass.field};
    box-shadow: inset 0 1px 0 #ffffffee, 0 1px 2px #3a4a6814;
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
