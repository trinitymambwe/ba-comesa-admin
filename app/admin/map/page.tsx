'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Link from 'next/link'

// Fix Leaflet default marker icons
const markerIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const riderIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#e33124" stroke="white" stroke-width="1.5">
      <circle cx="12" cy="12" r="11" fill="#e33124" stroke="white" stroke-width="2"/>
      <text x="12" y="17" text-anchor="middle" fill="white" font-size="16">🚴</text>
    </svg>
  `),
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
})

const storeIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="#22c55e" stroke="white" stroke-width="1.5">
      <circle cx="12" cy="12" r="11" fill="#22c55e" stroke="white" stroke-width="2"/>
      <text x="12" y="17" text-anchor="middle" fill="white" font-size="16">📍</text>
    </svg>
  `),
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
})

// Rider locations (simulated - Lusaka area)
const riderLocations = [
  { id: 'r1', name: 'John Banda', lat: -15.3875, lng: 28.3228, status: 'active', deliveries: 5 },
  { id: 'r2', name: 'Mary Phiri', lat: -15.4082, lng: 28.2871, status: 'active', deliveries: 3 },
  { id: 'r3', name: 'Peter Mwale', lat: -15.4167, lng: 28.2833, status: 'active', deliveries: 7 },
  { id: 'r4', name: 'Grace Tembo', lat: -15.4250, lng: 28.3167, status: 'active', deliveries: 2 },
  { id: 'r5', name: 'David Zulu', lat: -15.3950, lng: 28.3000, status: 'active', deliveries: 4 },
]

// Delivery routes (simulated)
const deliveryRoutes = [
  { from: [-15.3875, 28.3228], to: [-15.4167, 28.2833], color: '#e33124' },
  { from: [-15.4082, 28.2871], to: [-15.4250, 28.3167], color: '#f97316' },
]

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center])
  return null
}

function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap()
  useEffect(() => {
    map.fitBounds(bounds, { padding: [50, 50] })
  }, [])
  return null
}

export default function MapPage() {
  const [activeRiders, setActiveRiders] = useState<any[]>([])
  const [selectedRider, setSelectedRider] = useState<any>(null)
  const [mapCenter] = useState<[number, number]>([-15.4082, 28.2871])
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    fetchRiders()
    const interval = setInterval(fetchRiders, 15000)
    return () => clearInterval(interval)
  }, [])

  const fetchRiders = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'riders'), where('status', '==', 'active')))
      const riders = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
      // Add simulated coordinates
      const withCoords = riders.map((r: any, i: number) => ({
        ...r,
        lat: riderLocations[i % riderLocations.length].lat + (Math.random() * 0.01 - 0.005),
        lng: riderLocations[i % riderLocations.length].lng + (Math.random() * 0.01 - 0.005),
      }))
      setActiveRiders(withCoords.length > 0 ? withCoords : riderLocations)
    } catch {
      setActiveRiders(riderLocations)
    }
  }

  const mapStyle = darkMode
    ? { filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }
    : {}

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#0d1b2a', position: 'relative', overflow: 'hidden' }}>
      {/* Map */}
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ width: '100%', height: '100%', zIndex: 1 }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={mapCenter} />

        {/* Delivery Routes */}
        {deliveryRoutes.map((route, i) => (
          <Polyline
            key={i}
            positions={[route.from as [number, number], route.to as [number, number]]}
            color={route.color}
            weight={4}
            opacity={0.6}
            dashArray="10, 10"
          />
        ))}

        {/* Rider Markers */}
        {activeRiders.map((r: any) => (
          <Marker key={r.id} position={[r.lat, r.lng]} icon={riderIcon}
            eventHandlers={{ click: () => setSelectedRider(r) }}>
            <Popup>
              <div style={{ fontFamily: 'system-ui', padding: '4px' }}>
                <p style={{ fontWeight: 700, margin: '0 0 4px', fontSize: '14px' }}>{r.name}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>📱 {r.phone || 'N/A'}</p>
                <p style={{ margin: '2px 0', fontSize: '12px', color: '#666' }}>🚲 {r.vehicle || 'Bicycle'}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#22c55e', fontWeight: 600 }}>
                  {r.deliveries || 0} deliveries · K{Number(r.earnings || 0).toLocaleString()}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Store Markers */}
        <Marker position={[-15.4167, 28.2833]} icon={storeIcon}>
          <Popup>
            <p style={{ fontWeight: 700, margin: 0 }}>📦 Pickup Point</p>
            <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0' }}>Lusaka CBD</p>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Dark overlay for styling */}
      <div style={{ ...mapStyle, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2, pointerEvents: 'none' }} />

      {/* TOP BAR */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
        padding: '16px 20px 30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '20px' }}>
          ← baComesa Map
        </Link>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setDarkMode(!darkMode)} style={{
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: 'none',
            color: 'white', padding: '10px 16px', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
          }}>
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </div>

      {/* STATS BAR */}
      <div style={{
        position: 'absolute', top: '90px', left: '16px', right: '16px', zIndex: 10,
        display: 'flex', gap: '10px',
      }}>
        {[
          { label: 'Active Riders', value: activeRiders.length, color: '#22c55e' },
          { label: 'Deliveries Today', value: '12', color: '#f97316' },
          { label: 'Pending', value: '3', color: '#e33124' },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
            borderRadius: '12px', padding: '12px 14px', color: 'white', border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <p style={{ fontSize: '11px', opacity: 0.7, margin: '0 0 2px' }}>{s.label}</p>
            <p style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* SELECTED RIDER CARD */}
      {selectedRider && (
        <div style={{
          position: 'absolute', bottom: '100px', left: '16px', right: '16px', zIndex: 10,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)',
          borderRadius: '20px', padding: '20px', color: 'white', border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: '18px', margin: '0 0 4px' }}>{selectedRider.name}</p>
              <p style={{ opacity: 0.7, fontSize: '13px', margin: '0 0 8px' }}>📱 {selectedRider.phone || 'N/A'} · 🚲 {selectedRider.vehicle || 'Bicycle'}</p>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div>
                  <p style={{ fontSize: '11px', opacity: 0.5, margin: 0 }}>Deliveries</p>
                  <p style={{ fontWeight: 700, color: '#22c55e', margin: 0 }}>{selectedRider.deliveries || 0}</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', opacity: 0.5, margin: 0 }}>Earnings</p>
                  <p style={{ fontWeight: 700, color: '#f97316', margin: 0 }}>K{Number(selectedRider.earnings || 0).toLocaleString()}</p>
                </div>
              </div>
            </div>
            <button onClick={() => setSelectedRider(null)} style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
              borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px',
            }}>✕</button>
          </div>
        </div>
      )}

      {/* ZOOM CONTROLS */}
      <div style={{
        position: 'absolute', right: '16px', bottom: '180px', zIndex: 10,
        display: 'flex', flexDirection: 'column', gap: '4px',
      }}>
        <button onClick={() => {
          const map = document.querySelector('.leaflet-container') as any
          if (map?._leaflet_map) map._leaflet_map.zoomIn()
        }} style={{
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)',
          color: 'white', borderRadius: '12px', width: '40px', height: '40px', cursor: 'pointer', fontSize: '18px', fontWeight: 700,
        }}>+</button>
        <button onClick={() => {
          const map = document.querySelector('.leaflet-container') as any
          if (map?._leaflet_map) map._leaflet_map.zoomOut()
        }} style={{
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)',
          color: 'white', borderRadius: '12px', width: '40px', height: '40px', cursor: 'pointer', fontSize: '18px', fontWeight: 700,
        }}>−</button>
      </div>
    </div>
  )
}