'use client'

import { useEffect, useRef, useState } from 'react'

type ColorPickerProps = { value: string; label: string; onChange: (value: string) => void }

function toRgb(hex: string) {
  return [0, 1, 2].map((index) => Number.parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16))
}

function toHex(rgb: number[]) {
  return `#${rgb.map((value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0')).join('')}`
}

export function ColorPicker({ value, label, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false)
  const [hue, setHue] = useState(215)
  const ref = useRef<HTMLDivElement>(null)
  const rgb = toRgb(value)

  useEffect(() => {
    const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  function updateChannel(index: number, next: number) {
    const nextRgb = [...rgb]
    nextRgb[index] = next
    onChange(toHex(nextRgb))
  }

  return <div ref={ref} className="relative">
    <button type="button" aria-label={`Abrir seletor da cor ${label}`} aria-expanded={open} onClick={() => setOpen((current) => !current)} className="h-10 w-full rounded-lg border border-white/10 p-1.5 text-left" style={{ background: `linear-gradient(90deg, ${value}, ${value})` }}><span className="block h-full rounded-md border border-black/10" style={{ backgroundColor: value }} /></button>
    {open && <div className="absolute z-50 mt-2 w-72 rounded-xl border border-white/10 bg-[var(--background-elevated,var(--card))] p-3 shadow-2xl">
      <div className="relative h-32 cursor-crosshair overflow-hidden rounded-lg" style={{ backgroundColor: `hsl(${hue} 100% 50%)`, backgroundImage: 'linear-gradient(to right, #fff, transparent), linear-gradient(to top, #000, transparent)' }} onClick={(event) => { const box = event.currentTarget.getBoundingClientRect(); const saturation = (event.clientX - box.left) / box.width; const lightness = 1 - (event.clientY - box.top) / box.height; const channel = Math.round((saturation * 255 + lightness * 255) / 2); onChange(toHex([channel, channel, channel])) }} />
      <label className="mt-3 block text-[10px] uppercase tracking-wider text-slate-400">Matiz<input aria-label={`Matiz da cor ${label}`} type="range" min="0" max="360" value={hue} onChange={(event) => setHue(Number(event.target.value))} className="mt-1 w-full accent-[var(--primary)]" /></label>
      <div className="mt-3 grid grid-cols-3 gap-2">{(['R', 'G', 'B'] as const).map((channel, index) => <label key={channel} className="text-[10px] uppercase text-slate-400">{channel}<input aria-label={`${channel} da cor ${label}`} type="number" min="0" max="255" value={rgb[index]} onChange={(event) => updateChannel(index, Number(event.target.value))} className="field mt-1 px-2 py-1.5 text-xs" /></label>)}</div>
      <label className="mt-3 block text-[10px] uppercase tracking-wider text-slate-400">HEX<input aria-label={`HEX da cor ${label}`} value={value} onChange={(event) => /^#[0-9A-Fa-f]{6}$/.test(event.target.value) && onChange(event.target.value.toLowerCase())} className="field mt-1 font-mono text-xs uppercase" /></label>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-400"><span className="size-7 rounded-md border border-white/10" style={{ backgroundColor: value }} />{value.toUpperCase()}</div>
    </div>}
  </div>
}
