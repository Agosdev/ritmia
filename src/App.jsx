import React from 'react'
import { ThemeProvider } from 'styled-components'
import { theme } from './styles/theme'
import { GlobalStyles } from './styles/GlobalStyles'
import { RitmiaProvider } from './context/RitmiaContext'
import { MainLayout } from './components/layout/MainLayout'

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <RitmiaProvider>
        <MainLayout />
      </RitmiaProvider>
    </ThemeProvider>
  )
}

export default App
