'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

const MapContent = dynamic(() => import('./MapContent'), { ssr: false })

export default function MapPage() {
  const [selectedRider, setSelectedRider] = useState<any>(null)
  const [darkMode, setDarkMode] = useState(true)

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#0d1b2a', position: 'relative', overflow: 'hidden' }}>
      {/* Map */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <MapContent onSelectRider={setSelectedRider} />
      </div>

      {/* Dark overlay */}
      {darkMode && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }} />
      )}

      {/* TOP BAR */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)', padding: '16px 20px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '20px' }}>← baComesa Map</Link>
        <button onClick={() => setDarkMode(!darkMode)} style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: 'none', color: 'white', padding: '10px 16px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>

      {/* STATS */}
      <div style={{ position: 'absolute', top: '90px', left: '16px', right: '16px', zIndex: 10, display: 'flex', gap: '10px' }}>
        {[{ label: 'Active Riders', value: 5, color: '#22c55e' }, { label: 'Deliveries Today', value: '12', color: '#f97316' }, { label: 'Pending', value: '3', color: '#e33124' }].map((s, i) => (
          <div key={i} style={{ flex: 1, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', borderRadius: '12px', padding: '12px 14px', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ fontSize: '11px', opacity: 0.7, margin: '0 0 2px' }}>{s.label}</p>
            <p style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* SELECTED RIDER */}
      {selectedRider && (
        <div style={{ position: 'absolute', bottom: '100px', left: '16px', right: '16px', zIndex: 10, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', borderRadius: '20px', padding: '20px', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: '18px', margin: '0 0 4px' }}>{selectedRider.name}</p>
              <p style={{ opacity: 0.7, fontSize: '13px', margin: 0 }}>🚲 Bicycle · Active</p>
              <p style={{ fontWeight: 700, color: '#22c55e', marginTop: '8px' }}>{selectedRider.deliveries} deliveries</p>
            </div>
            <button onClick={() => setSelectedRider(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>
        </div>
      )}

      {/* ZOOM */}
      <div style={{ position: 'absolute', right: '16px', bottom: '180px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button onClick={() => { const m = (document.querySelector('.leaflet-container') as any)?._leaflet_map; if (m) m.zoomIn() }} style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: '12px', width: '40px', height: '40px', cursor: 'pointer', fontSize: '18px' }}>+</button>
        <button onClick={() => { const m = (document.querySelector('.leaflet-container') as any)?._leaflet_map; if (m) m.zoomOut() }} style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: '12px', width: '40px', height: '40px', cursor: 'pointer', fontSize: '18px' }}>−</button>
      </div>
    </div>
  )
}