import React, { useEffect, useRef, useState } from 'react'
import { ThemeProvider } from 'styled-components'
import { artTheme, liteTheme, theme } from './styles/theme'
import { GlobalStyles } from './styles/GlobalStyles'
import { RitmiaProvider } from './context/RitmiaContext'
import { MainLayout } from './components/layout/MainLayout'
import { ExperimentalRhythmPrototype } from './components/visualizer/ExperimentalRhythmPrototype'
import { RitmiaLite } from './components/layout/RitmiaLite'
import { RitmiaArt } from './components/layout/RitmiaArt'

export function App() {
  const prototype = new URLSearchParams(window.location.search).get('prototype')
  const [presentation, setPresentation] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('interface') === 'art' || params.get('prototype') === 'rhythm-art') return 'art'
    if (params.get('interface') === 'lite') return 'lite'
    return 'lite'
  })
  const initialPresentation = useRef(presentation)
  const showArt = presentation === 'art'
  const showPrototype = import.meta.env.DEV && prototype === 'rhythm-a'
  const showLegacyLab = prototype === 'lab'

  useEffect(() => {
    const syncPresentation = () => {
      initialPresentation.current = null
      const params = new URLSearchParams(window.location.search)
      setPresentation(params.get('interface') === 'art' || params.get('prototype') === 'rhythm-art' ? 'art' : 'lite')
    }
    window.addEventListener('popstate', syncPresentation)
    return () => window.removeEventListener('popstate', syncPresentation)
  }, [])

  const changePresentation = next => {
    initialPresentation.current = null
    const url = new URL(window.location.href)
    url.searchParams.delete('prototype')
    url.searchParams.set('interface', next)
    window.history.pushState({}, '', url)
    setPresentation(next)
  }

  return (
    <ThemeProvider theme={showArt ? artTheme : presentation === 'lite' && !showPrototype && !showLegacyLab ? liteTheme : theme}>
      <GlobalStyles />
      <RitmiaProvider>
        {showArt
          ? <RitmiaArt variant="art" initializePattern={initialPresentation.current === 'art'} onPresentationChange={changePresentation} />
          : showPrototype
            ? <ExperimentalRhythmPrototype />
            : showLegacyLab
              ? <MainLayout />
              : <RitmiaLite onPresentationChange={import.meta.env.DEV && new URLSearchParams(window.location.search).get('dev') === '1' ? changePresentation : undefined} />}
      </RitmiaProvider>
    </ThemeProvider>
  )
}

export default App
