import styled from 'styled-components'

export const Panel = styled.div`
  background: ${({ theme }) => theme.colors.panel};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme, $radius }) => $radius || theme.radii.xl};
  padding: ${({ $padding }) => $padding || '1.25rem'};
  box-shadow: ${({ theme }) => theme.shadows.md};
  transition: ${({ theme }) => theme.transitions.fast};
  ${({ theme }) => theme.variant === 'lite' && `
    border-color: ${theme.colors.panelLight};
  `}
`

export const Panel2 = styled.div`
  background: ${({ theme }) => theme.colors.panel2};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme, $radius }) => $radius || theme.radii.lg};
  padding: ${({ $padding }) => $padding || '0.75rem'};
  box-shadow: ${({ theme }) => theme.variant === 'lite' ? theme.shadows.sm : 'none'};
`
