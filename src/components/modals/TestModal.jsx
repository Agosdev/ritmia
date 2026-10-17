import React from 'react'
import styled from 'styled-components'
import { useRitmia } from '../../context/RitmiaContext'
import { Panel, Panel2 } from '../ui/Card'
import { Button } from '../ui/Button'

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: grid;
  place-items: center;
  padding: 1rem;
`

const ModalCard = styled(Panel)`
  width: 100%;
  max-width: 520px;
  padding: 1.5rem;
  border-radius: 20px;
`

const Title = styled.h3`
  font-family: ${({ theme }) => theme.fonts.serif};
  font-size: 18px;
`

const QuestionText = styled.p`
  margin-top: 0.75rem;
  font-size: 13px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.text};
`

const OptionsList = styled.div`
  margin-top: 1rem;
  display: grid;
  gap: 0.5rem;
`

const OptionBtn = styled.button`
  height: 2.75rem;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bg};
  text-align: left;
  padding: 0 1rem;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.text};
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.amber};
  }
`

const FeedbackBox = styled(Panel2)`
  margin-top: 1rem;
  background: rgba(255, 184, 0, 0.15);
  border-color: rgba(255, 184, 0, 0.35);
  color: ${({ theme }) => theme.colors.amberSoft};
  font-size: 12px;
  font-weight: 500;
`

const BottomActions = styled.div`
  margin-top: 1.25rem;
  display: flex;
  justify-content: flex-end;
`

export function TestModal() {
  const {
    level,
    isTestOpen,
    setIsTestOpen,
    testData,
    testFeedback,
    setTestFeedback,
  } = useRitmia()

  if (!isTestOpen || !testData) return null

  const handleSelectOption = opt => {
    if (opt === testData.a) {
      setTestFeedback(`¡Correcto! ${testData.a}`)
    } else {
      setTestFeedback(`Casi — la respuesta correcta es: ${testData.a}`)
    }
  }

  return (
    <ModalOverlay onClick={() => setIsTestOpen(false)}>
      <ModalCard onClick={e => e.stopPropagation()}>
        <Title>Test de Nivel {level}</Title>
        <QuestionText>{testData.q}</QuestionText>

        <OptionsList>
          {testData.options.map((opt, i) => (
            <OptionBtn
              key={`opt-${i}`}
              type="button"
              onClick={() => handleSelectOption(opt)}
            >
              {opt}
            </OptionBtn>
          ))}
        </OptionsList>

        {testFeedback && <FeedbackBox>{testFeedback}</FeedbackBox>}

        <BottomActions>
          <Button
            $variant="primary"
            $height="2.5rem"
            onClick={() => setIsTestOpen(false)}
          >
            Cerrar
          </Button>
        </BottomActions>
      </ModalCard>
    </ModalOverlay>
  )
}
