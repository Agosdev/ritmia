import React from 'react'
import { ThemeProvider } from 'styled-components'
import { artTheme, theme } from './styles/theme'
import { GlobalStyles } from './styles/GlobalStyles'
import { RitmiaProvider } from './context/RitmiaContext'
import { MainLayout } from './components/layout/MainLayout'
import { ExperimentalRhythmPrototype } from './components/visualizer/ExperimentalRhythmPrototype'
import { RitmiaArt } from './components/layout/RitmiaArt'

export function App() {
  const prototype = new URLSearchParams(window.location.search).get('prototype')
  const showArt = import.meta.env.DEV && prototype === 'rhythm-art'
  const showPrototype = import.meta.env.DEV && prototype === 'rhythm-a'

  return (
    <ThemeProvider theme={showArt ? artTheme : theme}>
      <GlobalStyles />
      <RitmiaProvider>
        {showArt
          ? <RitmiaArt />
          : showPrototype
            ? <ExperimentalRhythmPrototype />
            : <MainLayout />}
      </RitmiaProvider>
    </ThemeProvider>
  )
}

export default App
