import styled, { css } from 'styled-components'

export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.6rem;
  border-radius: ${({ theme }) => theme.radii.full};
  font-size: 10px;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-weight: 500;
  white-space: ${({ theme }) => theme.variant === 'lite' ? 'normal' : 'nowrap'};
  max-width: ${({ theme }) => theme.variant === 'lite' ? '100%' : 'none'};
  letter-spacing: 0.05em;

  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'amber':
        return css`
          background: rgba(255, 184, 0, 0.15);
          border: 1px solid rgba(255, 184, 0, 0.35);
          color: ${theme.colors.amberSoft};
        `
      case 'cyan':
        return css`
          background: rgba(0, 229, 255, 0.15);
          border: 1px solid rgba(0, 229, 255, 0.35);
          color: ${theme.colors.cyanSoft};
        `
      case 'emerald':
        return css`
          background: rgba(52, 211, 153, 0.12);
          border: 1px solid rgba(52, 211, 153, 0.3);
          color: ${theme.colors.emeraldSoft};
        `
      case 'red':
        return css`
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: ${theme.colors.redSoft};
        `
      case 'pill':
        return css`
          background: ${theme.colors.panel};
          border: 1px solid ${theme.colors.border};
          color: ${theme.colors.textDim};
        `
      default:
        return css`
          background: ${theme.colors.bg};
          border: 1px solid ${theme.colors.border};
          color: ${theme.colors.textDim};
        `
    }
  }}
`
