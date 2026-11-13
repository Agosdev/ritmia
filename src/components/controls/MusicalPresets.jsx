import React, { useState, useRef, useEffect, useId, useCallback } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { MUSICAL_PRESETS } from '../../music/presets'
import { useRitmia } from '../../context/RitmiaContext'

// ─── Colores de familia ────────────────────────────────────────────────────────
// Paleta local del selector y su chip de selección.
// Criterio: texto oscuro sobre fondo claro para garantizar contraste >= 4.5:1
// en la variante lite. Los valores de opacidad en hover/selected se intensifican.
export const FAMILY_COLORS = {
  libre:    { bg: '#eeeeef',   border: '#000000',   text: '#1e1e28', label: 'Libre'    },
  flamenco: { bg: '#fce4e4',  border: '#ef2424',  text: '#991b1b', label: 'Flamenco' },
  arabe:    { bg: '#fff0ce',  border: '#f5a400',  text: '#92400e', label: 'Árabe'    },
  tango:    { bg: '#f6e2e6',  border: 'rgba(120,15,30,0.40)',  text: '#78101e', label: 'Tango'    },
  pop: { bg: '#fbe2ef', border: '#b44b83', text: '#85234f', label: 'Pop' },
  jazz: { bg: '#daf2ef', border: '#147d78', text: '#075a56', label: 'Jazz' },
  funk: { bg: '#edf6d7', border: '#8caf21', text: '#3d5710', label: 'Funk' },
  rock:     { bg: '#eee4fc', border: 'rgba(109,40,217,0.40)', text: '#5b21b6', label: 'Rock'     },
  blues:    { bg: '#e4ebfc',  border: 'rgba(29,78,216,0.40)',  text: '#1e40af', label: 'Blues'    },
}

function familyColor(family) {
  return FAMILY_COLORS[family] ?? FAMILY_COLORS.libre
}

// ─── Styled components ─────────────────────────────────────────────────────────

const Explanation = styled.div`
  min-width: 0;
  font-size: 12px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.textDim};
  p + p { margin-top: .5rem; }
  strong { color: ${({ theme }) => theme.colors.text}; }
`

// Wrapper posicional del selector custom; reemplaza el antiguo SelectControl + select nativo.
const ComboWrapper = styled.div`
  position: relative;
  min-width: 0;
  min-height: 52px;
`

const ComboButton = styled.input`
  && {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  height: 52px;
  padding: .4rem ${({ $hasPreset }) => $hasPreset ? '3.4rem' : '2.4rem'} .4rem ${({ $hasPreset }) => $hasPreset ? '3rem' : '.75rem'};
  appearance: none;
  border-radius: 16px;
  font-size: clamp(12px, 2.7vw, 13px);
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  text-align: right;
  cursor: pointer;
  font-weight: ${({ $free }) => $free ? 800 : 500};
  background: ${({ theme }) => theme.gradients.preset};
  border: 1px solid ${({ theme }) => theme.glass.rim};
  color: ${({ theme }) => theme.colors.text};
  box-shadow: ${({ theme }) => theme.physical.elevated};

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.glass.focus};
    outline-offset: 2px;
  }

  }
`

const ComboChevron = styled.span`
  position: absolute;
  right: .8rem;
  top: calc(50% - 3px);
  width: 6px;
  height: 6px;
  border: solid currentColor;
  border-width: 0 1.5px 1.5px 0;
  transform: rotate(45deg);
  pointer-events: none;
`

const SearchIcon = styled.svg.attrs({ 'data-testid': 'preset-search-icon' })`
  position: absolute;
  left: 1rem;
  top: 50%;
  width: 16px;
  height: 16px;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.textDim};
  pointer-events: none;
`

const PresetPopup = styled.div.attrs({ 'data-preset-popup': '' })`
  position: fixed;
  z-index: 1000;
  left: var(--preset-popup-left, 8px);
  bottom: var(--preset-popup-bottom, 120px);
  width: var(--preset-popup-width, min(24rem, calc(100vw - 16px)));
  display: flex;
  flex-direction: column;
  min-width: 0;
  max-width: calc(100vw - 16px);
  max-height: var(--preset-popup-max-height, min(60vh, 380px));
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.glass.rim};
  background: ${({ theme }) => theme.glass.fallback};
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: ${({ theme }) => theme.physical.shell};
`

const SearchField = styled.div`
  position: relative;
  display: block;
  min-width: 0;
  flex: 0 0 auto;
  padding: 6px;
  border-bottom: 1px solid ${({ theme }) => theme.glass.rim};
`

const NoResults = styled.div`
  flex: 0 0 auto;
  padding: 9px 10px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 13px;
`

const SearchInput = styled.input`
  && {
  display: block;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 0;
  max-height: 48px;
  height: 44px;
  padding: 0 3rem 0 2.4rem;
  border: 1px solid ${({ theme }) => theme.glass.rim};
  border-radius: 12px;
  background: ${({ theme }) => theme.glass.field};
  color: ${({ theme }) => theme.colors.text};
  font: inherit;
  font-size: 13px;
  line-height: 20px;
  }
  &:focus-visible { outline: 3px solid ${({ theme }) => theme.glass.focus}; outline-offset: 1px; }
`

const ClearSearch = styled.button.attrs({ 'data-testid': 'preset-search-clear' })`
  &&& {
  position: absolute;
  top: 50%;
  right: 13px;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 40px;
  height: 40px;
  min-height: 40px;
  max-height: 40px;
  min-width: 40px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  box-shadow: none;
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  &:hover { background: rgba(255,255,255,.4); }
  &:focus-visible { outline: 3px solid ${({ theme }) => theme.glass.focus}; outline-offset: 1px; }
  }
`

const ClearInCombo = styled.button`
  && {
  position: absolute;
  inset: 4px auto auto 4px;
  background: transparent;
  border: 0;
  box-shadow: none;
  width: 44px;
  height: 44px;
  min-height: 44px;
  z-index: 1;
  border-radius: 50%;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textDim};

  &:hover { background: rgba(255,255,255,0.4); }
  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.glass.focus};
    outline-offset: 2px;
  }
  }
`

const Listbox = styled.ul`
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  margin: 0;
  padding: 4px;
  list-style: none;
  max-height: none;
  overflow-y: auto;
  overscroll-behavior: contain;

  /* scrollbar sutil */
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: ${({ theme }) => theme.glass.rim}; border-radius: 4px; }
`

const ListboxOption = styled.li`
  min-height: 44px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  cursor: pointer;
  font-size: clamp(12px, 2.7vw, 13px);
  font-weight: ${({ $isFree }) => $isFree ? 700 : 400};
  color: ${({ theme }) => theme.colors.text};
  transition: background 100ms ease;
  outline: none;

  /* Focus teclado */
  &[aria-selected='true'] {
    background: ${({ theme }) => theme.gradients.preset};
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.7);
  }

  &[data-focused='true'] {
    background: ${({ theme }) => theme.glass.field};
    box-shadow: inset 0 0 0 2px ${({ theme }) => theme.glass.focus};
  }

  &:hover {
    background: ${({ theme }) => theme.glass.field};
  }
`

const FamilyBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 9px;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
  /* Colores inyectados por prop $colors */
  background: ${({ $colors }) => $colors.bg};
  border: 1px solid ${({ $colors }) => $colors.border};
  color: ${({ $colors }) => $colors.text};
`

const FamilyDot = styled.span`
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $colors }) => $colors.border};
  flex-shrink: 0;
  /* aria-hidden se añade en JSX */
`

const CurrentFamilyDot = styled(FamilyDot)`
  position: absolute;
  right: 2rem;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
`

const GroupSeparator = styled.li`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px 4px;
  font-size: 9px;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textMuted};
  user-select: none;
  pointer-events: none;
  margin-top: 2px;

  &::before {
    content: '';
    display: block;
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.glass.rim};
    max-width: 1rem;
  }
  &::after {
    content: '';
    display: block;
    flex: 1;
    height: 1px;
    background: ${({ theme }) => theme.glass.rim};
  }
`

// ─── Helpers ───────────────────────────────────────────────────────────────────

// Agrupa los presets por familia preservando el orden de inserción
function groupPresets(presets) {
  const groups = new Map()
  for (const preset of presets) {
    const fam = preset.family ?? 'libre'
    if (!groups.has(fam)) groups.set(fam, [])
    groups.get(fam).push(preset)
  }
  return groups
}

function normalizeSearch(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es')
}

function clearAndFocus(clearPreset, triggerId) {
  clearPreset()
  document.getElementById(triggerId)?.focus()
}

// ─── Componente principal: PresetSelect ────────────────────────────────────────

export function PresetSelect() {
  const { applyPreset, clearPreset, presetId } = useRitmia()
  const preset = MUSICAL_PRESETS.find(p => p.id === presetId)
  const isFree = !preset
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const listboxId = useId()
  const buttonId = 'musical-preset'
  const wrapperRef = useRef(null)
  const popupRef = useRef(null)
  const listboxRef = useRef(null)
  const searchRef = useRef(null)
  const triggerRef = useRef(null)
  const restoreTriggerFocus = useRef(false)
  const [popupStyle, setPopupStyle] = useState(null)
  const normalizedQuery = normalizeSearch(query.trim())
  const filteredPresets = normalizedQuery
    ? MUSICAL_PRESETS.filter(item => normalizeSearch(`${item.name} ${item.family ?? 'libre'} ${familyColor(item.family).label}`).includes(normalizedQuery))
    : MUSICAL_PRESETS
  const showFree = !normalizedQuery || normalizeSearch('Compás libre Libre').includes(normalizedQuery)
  const visibleOptions = [...(showFree ? [null] : []), ...filteredPresets]
  const groupedPresets = groupPresets(filteredPresets)

  const updatePopupPosition = useCallback(() => {
    const anchor = wrapperRef.current?.getBoundingClientRect()
    if (!anchor) return
    const viewport = window.visualViewport
    const viewportTop = viewport?.offsetTop ?? 0
    const viewportHeight = viewport?.height ?? window.innerHeight
    const viewportWidth = viewport?.width ?? window.innerWidth
    const dockBounds = document.querySelector('[data-testid="lite-mobile-transport"]')?.getBoundingClientRect()
    const aboveAnchor = dockBounds?.top ?? anchor.top
    const roomAbove = Math.max(0, aboveAnchor - viewportTop - 12)
    const roomBelow = Math.max(0, viewportTop + viewportHeight - anchor.bottom - 12)
    const openAbove = roomAbove >= Math.min(180, roomBelow) || roomAbove >= roomBelow
    const available = openAbove ? roomAbove : roomBelow
    const containerLeft = dockBounds?.left ?? 8
    const containerRight = dockBounds?.right ?? viewportWidth - 8
    const availableWidth = Math.max(0, Math.min(containerRight, viewportWidth - 8) - Math.max(containerLeft, 8))
    const width = Math.min(availableWidth, Math.max(anchor.width, Math.min(360, availableWidth)))
    const left = Math.max(Math.max(containerLeft, 8), Math.min(anchor.right - width, Math.min(containerRight - width, viewportWidth - width - 8)))
    setPopupStyle({
      '--preset-popup-left': `${left}px`,
      '--preset-popup-width': `${width}px`,
      '--preset-popup-max-height': `${Math.max(96, Math.min(380, viewportHeight - 16, available))}px`,
      '--preset-popup-bottom': openAbove
        ? `${Math.max(0, window.innerHeight - aboveAnchor + 6)}px`
        : `${Math.max(0, window.innerHeight - anchor.bottom - 6)}px`,
      ...(openAbove ? {} : { top: `${Math.max(viewportTop + 8, anchor.bottom + 6)}px`, bottom: 'auto' }),
    })
  }, [])

  useEffect(() => {
    if (open) {
      updatePopupPosition()
      searchRef.current?.focus({ preventScroll: true })
      const index = visibleOptions.findIndex(item => (item?.id ?? '') === presetId)
      setFocusedIndex(index >= 0 ? index : (visibleOptions.length ? 0 : -1))
    } else if (restoreTriggerFocus.current) {
      triggerRef.current?.focus()
      restoreTriggerFocus.current = false
    }
  }, [open, updatePopupPosition]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return
    const handler = event => {
      if (!wrapperRef.current?.contains(event.target) && !popupRef.current?.contains(event.target)) closePopup()
    }
    document.addEventListener('pointerdown', handler)
    const reposition = () => requestAnimationFrame(updatePopupPosition)
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    window.visualViewport?.addEventListener('resize', reposition)
    window.visualViewport?.addEventListener('scroll', reposition)
    return () => {
      document.removeEventListener('pointerdown', handler)
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
      window.visualViewport?.removeEventListener('resize', reposition)
      window.visualViewport?.removeEventListener('scroll', reposition)
    }
  }, [open, updatePopupPosition]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || focusedIndex < 0) return
    listboxRef.current?.querySelector('[data-focused="true"]')?.scrollIntoView?.({ block: 'nearest' })
  }, [focusedIndex, open])

  const closePopup = () => {
    setOpen(false)
    setQuery('')
    setFocusedIndex(-1)
  }
  const openPopup = () => {
    setQuery('')
    updatePopupPosition()
    setOpen(true)
  }
  const selectOption = id => {
    if (id) applyPreset(id)
    else clearPreset()
    restoreTriggerFocus.current = true
    closePopup()
  }
  const handleQueryChange = event => {
    const value = event.target.value
    const normalized = normalizeSearch(value.trim())
    const matches = normalized
      ? MUSICAL_PRESETS.filter(item => normalizeSearch(`${item.name} ${item.family ?? 'libre'} ${familyColor(item.family).label}`).includes(normalized))
      : MUSICAL_PRESETS
    const hasFree = !normalized || normalizeSearch('Compás libre Libre').includes(normalized)
    setQuery(value)
    setFocusedIndex(matches.length || hasFree ? 0 : -1)
  }
  const handleKeyDown = event => {
    if (!open) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault()
        openPopup()
      }
      return
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        if (visibleOptions.length) setFocusedIndex(index => Math.min(Math.max(index, 0) + 1, visibleOptions.length - 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        if (visibleOptions.length) setFocusedIndex(index => Math.max(index - 1, 0))
        break
      case 'Home':
        event.preventDefault()
        setFocusedIndex(visibleOptions.length ? 0 : -1)
        break
      case 'End':
        event.preventDefault()
        setFocusedIndex(visibleOptions.length - 1)
        break
      case 'Enter':
        event.preventDefault()
        if (focusedIndex >= 0) {
          const option = visibleOptions[focusedIndex]
          if (option === null) selectOption('')
          else if (option) selectOption(option.id)
        }
        break
      case 'Escape':
        event.preventDefault()
        event.stopPropagation()
        restoreTriggerFocus.current = true
        closePopup()
        break
      case 'Tab':
        if (!query || event.shiftKey) setTimeout(closePopup, 0)
        break
    }
  }

  const buttonLabel = preset ? preset.name : 'Compás libre'
  const selectedId = presetId || ''
  const activeFamilyColors = familyColor(preset?.family ?? 'libre')
  const optionId = index => `${listboxId}-opt-${index}`

  return (
    <ComboWrapper ref={wrapperRef} data-preset-control onBlur={event => {
      if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget) && !popupRef.current?.contains(event.relatedTarget)) closePopup()
    }}>
      {open ? (
        createPortal(<PresetPopup ref={popupRef} style={popupStyle ?? undefined}>
          <SearchField>
            <SearchIcon viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" />
            </SearchIcon>
            <SearchInput
              ref={searchRef}
              id={buttonId}
              type="text"
              role="combobox"
              aria-label="Preset"
              aria-describedby="preset-editing-help"
              aria-autocomplete="list"
              aria-expanded="true"
              aria-controls={listboxId}
              aria-activedescendant={focusedIndex >= 0 ? optionId(focusedIndex) : undefined}
              placeholder="Buscar ritmo o estilo..."
              value={query}
              onChange={handleQueryChange}
              onKeyDown={handleKeyDown}
            />
            {query && <ClearSearch type="button" aria-label="Limpiar búsqueda" title="Limpiar búsqueda"
              onKeyDown={event => {
                if (event.key === 'Escape') {
                  event.preventDefault()
                  restoreTriggerFocus.current = true
                  closePopup()
                }
                if (event.key === 'Tab') setTimeout(closePopup, 0)
              }}
              onMouseDown={event => event.preventDefault()}
              onClick={() => { setQuery(''); setFocusedIndex(0); searchRef.current?.focus() }}>×</ClearSearch>}
          </SearchField>
          <Listbox ref={listboxRef} id={listboxId} role="listbox" aria-label="Presets">
            {showFree && <ListboxOption
              data-preset-id=""
              id={optionId(0)}
              role="option"
              aria-selected={selectedId === ''}
              data-focused={focusedIndex === 0 ? 'true' : 'false'}
              $isFree
              onMouseDown={event => event.preventDefault()}
              onMouseMove={() => setFocusedIndex(0)}
              onClick={() => selectOption('')}
            >
              <FamilyBadge $colors={FAMILY_COLORS.libre}>Libre</FamilyBadge>
              Compás libre
            </ListboxOption>}
            {[...groupedPresets.entries()].map(([family, familyPresets]) => {
              const colors = familyColor(family)
              const familyLabel = colors.label
              return <React.Fragment key={family}>
                <GroupSeparator role="presentation" aria-hidden="true">{familyLabel}</GroupSeparator>
                {familyPresets.map(item => {
                  const index = visibleOptions.indexOf(item)
                  const isSelected = item.id === selectedId
                  return <ListboxOption
                    key={item.id}
                    data-preset-id={item.id}
                    id={optionId(index)}
                    role="option"
                    aria-selected={isSelected}
                    data-focused={focusedIndex === index ? 'true' : 'false'}
                    onMouseDown={event => event.preventDefault()}
                    onMouseMove={() => setFocusedIndex(index)}
                    onClick={() => selectOption(item.id)}
                  >
                    <FamilyBadge $colors={colors}>
                      <FamilyDot $colors={colors} aria-hidden="true" />
                      {familyLabel}
                    </FamilyBadge>
                    {item.name}
                  </ListboxOption>
                })}
              </React.Fragment>
            })}
          </Listbox>
          {!visibleOptions.length && <NoResults role="status">No se encontraron ritmos</NoResults>}
        </PresetPopup>, document.body)
      ) : (
        <>
        <ComboButton
            ref={triggerRef}
            id={buttonId}
            type="text"
            role="combobox"
            aria-haspopup="listbox"
            aria-autocomplete="list"
            aria-expanded="false"
            aria-label="Preset"
            aria-describedby="preset-editing-help"
            readOnly
            value={buttonLabel}
            $free={isFree}
            $hasPreset={!!preset}
            onClick={openPopup}
            onKeyDown={handleKeyDown}
          />
          {preset && <CurrentFamilyDot $colors={activeFamilyColors} aria-hidden="true" />}
          <ComboChevron aria-hidden="true" />
        </>
      )}
      {preset && <ClearInCombo
        type="button"
        aria-label="Quitar preset desde el selector"
        title="Volver a Compás libre"
        onClick={() => {
          clearPreset()
          if (open) {
            restoreTriggerFocus.current = true
            closePopup()
          } else {
            setQuery('')
            setFocusedIndex(-1)
            setTimeout(() => triggerRef.current?.focus({ preventScroll: true }), 0)
          }
        }}
      >×</ClearInCombo>}
    </ComboWrapper>
  )
}

// ─── PresetChip ────────────────────────────────────────────────────────────────

const Chip = styled.div`
  position: relative;
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  max-width: 100%;
  gap: .3rem;
  border: 1px solid ${({ theme }) => theme.glass.rim};
  border-radius: 999px;
  padding: .2rem .85rem .2rem ${({ $free }) => $free ? '.85rem' : '.2rem'};
  background: ${({ theme }) => theme.gradients.secondary};
  box-shadow: ${({ theme }) => theme.physical.elevated};
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
  scroll-margin-top: 7rem;
  color: ${({ theme }) => theme.colors.text};
  font-size: 12px;
  strong { overflow-wrap: anywhere; }
  span { white-space: nowrap; font-family: ${({ theme }) => theme.fonts.mono}; }
`

const ChipClearButton = styled.button`
  flex: 0 0 44px;
  width: 44px;
  min-height: 44px;
  border-radius: 50%;
  &[aria-label] { min-height: 44px; font-size: 18px; padding: 0; }
  font-size: 18px;
  line-height: 1;
`

export function PresetChip() {
  const { presetId, clearPreset, numA, denA } = useRitmia()
  const preset = MUSICAL_PRESETS.find(p => p.id === presetId)
  const colors = preset ? familyColor(preset.family) : null
  return (
    <Chip role="group" aria-label="Compás elegido" $free={!preset}>
      {preset && (
        <ChipClearButton
          type="button"
          aria-label="Quitar preset desde el chip"
          title="Volver a Compás libre"
          onClick={() => clearAndFocus(clearPreset, 'musical-preset')}
        >
          ×
        </ChipClearButton>
      )}
      {colors && (
        <FamilyBadge $colors={colors} style={{ fontSize: '9px' }}>
          <FamilyDot $colors={colors} aria-hidden="true" />
          {colors.label}
        </FamilyBadge>
      )}
      <strong>{preset?.name ?? 'Compás libre'}</strong>
      <span>· {numA}/{denA}</span>
    </Chip>
  )
}

// ─── PresetExplanation ─────────────────────────────────────────────────────────

export function PresetExplanation() {
  const { presetId, presetModified } = useRitmia()
  const preset = MUSICAL_PRESETS.find(p => p.id === presetId)
  return (
    <Explanation>
      <p id="preset-editing-help" role="status">
        {preset
          ? <><strong>Patrón A bloqueado · {preset.name}.</strong> Elegí Compás libre en la barra inferior para editar compás, acentos y grupos. BPM y volumen disponibles.{presetModified ? ' Tempo ajustado.' : ''}</>
          : <><strong>Edición libre de A.</strong> Cambiá compás, acentos y grupos. Elegir un preset en la barra inferior carga su patrón y tempo; conserva B y el modo.</>}
      </p>
      {preset && <p>{preset.description}</p>}
      {preset?.strokes && <p>Esqueleto: <code>{preset.strokes.join(' ')}</code> · D = DUM, T = TAK, K = KA, guion = silencio.</p>}
    </Explanation>
  )
}
