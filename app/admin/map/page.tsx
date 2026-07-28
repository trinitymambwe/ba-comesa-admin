'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function MapPage() {
  const [darkMode, setDarkMode] = useState(true)
  const [selectedRider, setSelectedRider] = useState<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  const riders = [
    { id: 'r1', name: 'John Banda', lat: -15.3875, lng: 28.3228, deliveries: 5, phone: '0977123456' },
    { id: 'r2', name: 'Mary Phiri', lat: -15.4082, lng: 28.2871, deliveries: 3, phone: '0977234567' },
    { id: 'r3', name: 'Peter Mwale', lat: -15.4167, lng: 28.2833, deliveries: 7, phone: '0977345678' },
    { id: 'r4', name: 'Grace Tembo', lat: -15.4250, lng: 28.3167, deliveries: 2, phone: '0977456789' },
    { id: 'r5', name: 'David Zulu', lat: -15.3950, lng: 28.3000, deliveries: 4, phone: '0977567890' },
  ]

  useEffect(() => {
    // Load Leaflet CSS and JS dynamically
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js'
    script.onload = () => {
      setMapLoaded(true)
    }
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!mapLoaded) return

    const L = (window as any).L
    if (!L) return

    const map = L.map('map-container').setView([-15.4082, 28.2871], 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)

    // Dark filter
    if (darkMode) {
      const filter = L.tileLayer('', {}).addTo(map)
    }

    // Rider markers
    riders.forEach((r) => {
      const marker = L.marker([r.lat, r.lng], {
        icon: L.divIcon({
          html: `<div style="background:#e33124;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;border:2px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3)">🚴</div>`,
          iconSize: [36, 36],
          className: '',
        }),
      }).addTo(map)

      marker.on('click', () => setSelectedRider(r))
      marker.bindPopup(`<b>${r.name}</b><br/>📱 ${r.phone}<br/>✅ ${r.deliveries} deliveries`)
    })

    // Pickup point
    L.marker([-15.4167, 28.2833], {
      icon: L.divIcon({
        html: `<div style="background:#22c55e;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:18px;border:2px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.3)">📍</div>`,
        iconSize: [36, 36],
        className: '',
      }),
    }).addTo(map).bindPopup('<b>Pickup Point</b><br/>Lusaka CBD')

    // Route lines
    const routes = [
      { from: [-15.3875, 28.3228], to: [-15.4167, 28.2833], color: '#e33124' },
      { from: [-15.4082, 28.2871], to: [-15.4250, 28.3167], color: '#f97316' },
    ]
    routes.forEach(route => {
      L.polyline([route.from, route.to], { color: route.color, weight: 4, opacity: 0.6, dashArray: '10, 10' }).addTo(map)
    })

    return () => map.remove()
  }, [mapLoaded])

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#0d1b2a', position: 'relative', overflow: 'hidden' }}>
      {/* Map Container */}
      <div id="map-container" style={{ width: '100%', height: '100%', filter: darkMode ? 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' : 'none' }} />

      {/* TOP BAR */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)', padding: '16px 20px 30px', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '20px' }}>← baComesa Map</Link>
        <button onClick={() => setDarkMode(!darkMode)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '10px 16px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>

      {/* STATS */}
      <div style={{ position: 'absolute', top: '90px', left: '16px', right: '16px', zIndex: 1000, display: 'flex', gap: '10px' }}>
        {[{ label: 'Active Riders', value: riders.length, color: '#22c55e' }, { label: 'Deliveries Today', value: '12', color: '#f97316' }, { label: 'Pending', value: '3', color: '#e33124' }].map((s, i) => (
          <div key={i} style={{ flex: 1, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', borderRadius: '12px', padding: '12px 14px', color: 'white' }}>
            <p style={{ fontSize: '11px', opacity: 0.7, margin: '0 0 2px' }}>{s.label}</p>
            <p style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* SELECTED RIDER */}
      {selectedRider && (
        <div style={{ position: 'absolute', bottom: '100px', left: '16px', right: '16px', zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)', borderRadius: '20px', padding: '20px', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: '18px', margin: '0 0 4px' }}>{selectedRider.name}</p>
              <p style={{ opacity: 0.7, fontSize: '13px', margin: 0 }}>📱 {selectedRider.phone} · 🚲 Bicycle</p>
              <p style={{ fontWeight: 700, color: '#22c55e', marginTop: '8px' }}>{selectedRider.deliveries} deliveries</p>
            </div>
            <button onClick={() => setSelectedRider(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer' }}>✕</button>
          </div>
        </div>
      )}
    </div>
  )
}