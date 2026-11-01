import React from 'react'
import { ThemeProvider } from 'styled-components'
import { liteTheme } from './styles/theme'
import { GlobalStyles } from './styles/GlobalStyles'
import { RitmiaProvider } from './context/RitmiaContext'
import { RitmiaLite } from './components/layout/RitmiaLite'

export function App() {
  return <ThemeProvider theme={liteTheme}><GlobalStyles /><RitmiaProvider><RitmiaLite /></RitmiaProvider></ThemeProvider>
}
export default App
