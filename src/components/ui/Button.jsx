import styled, { css } from 'styled-components'

export const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: ${({ theme, $radius }) => $radius || theme.radii.full};
  font-weight: 600;
  font-size: ${({ $size }) => ($size === 'sm' ? '11px' : $size === 'lg' ? '14px' : '12px')};
  padding: ${({ $size }) =>
    $size === 'sm' ? '0.25rem 0.6rem' : $size === 'lg' ? '0.75rem 1.5rem' : '0.5rem 1.25rem'};
  height: ${({ $height }) => $height || 'auto'};
  transition: ${({ theme }) => theme.transitions.fast};
  cursor: pointer;

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none;
  }

  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'primary':
        return css`
          background: ${theme.colors.textBright};
          color: ${theme.colors.bg};
          &:hover:not(:disabled) {
            background: #ffffff;
            box-shadow: 0 0 12px rgba(255, 255, 255, 0.4);
          }
        `
      case 'accent':
        return css`
          background: ${theme.colors.amber};
          color: #000000;
          &:hover:not(:disabled) {
            filter: brightness(1.1);
            box-shadow: 0 0 14px ${theme.colors.amberGlow};
          }
        `
      case 'cyan':
        return css`
          background: ${theme.colors.cyan};
          color: #000000;
          &:hover:not(:disabled) {
            filter: brightness(1.1);
            box-shadow: 0 0 14px ${theme.colors.cyanGlow};
          }
        `
      case 'outline':
        return css`
          background: transparent;
          border: 1px solid ${theme.colors.border};
          color: ${theme.colors.textDim};
          &:hover:not(:disabled) {
            border-color: ${theme.colors.borderStrong};
            color: ${theme.colors.textBright};
          }
        `
      case 'panel':
        return css`
          background: ${theme.colors.panel2};
          border: 1px solid ${theme.colors.border};
          color: ${theme.colors.textDim};
          &:hover:not(:disabled) {
            border-color: ${theme.colors.borderStrong};
            color: ${theme.colors.textBright};
          }
        `
      case 'ghost':
      default:
        return css`
          background: transparent;
          color: ${theme.colors.textDim};
          &:hover:not(:disabled) {
            color: ${theme.colors.textBright};
          }
        `
    }
  }}
`

export const IconButton = styled(Button)`
  width: ${({ $width }) => $width || '2.75rem'};
  height: ${({ $height }) => $height || '2.75rem'};
  padding: 0;
  border-radius: ${({ theme }) => theme.radii.full};
  background: ${({ theme }) => theme.colors.panel};
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textDim};

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.colors.textBright};
    border-color: ${({ theme }) => theme.colors.borderStrong};
  }
`
