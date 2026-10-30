import React from 'react'
import { ThemeProvider } from 'styled-components'
import { theme } from './styles/theme'
import { GlobalStyles } from './styles/GlobalStyles'
import { RitmiaProvider } from './context/RitmiaContext'
import { MainLayout } from './components/layout/MainLayout'
import { ExperimentalRhythmPrototype } from './components/visualizer/ExperimentalRhythmPrototype'

export function App() {
  const showPrototype =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get('prototype') === 'rhythm-a'

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <RitmiaProvider>
        {showPrototype ? <ExperimentalRhythmPrototype /> : <MainLayout />}
      </RitmiaProvider>
    </ThemeProvider>
  )
}

export default App
