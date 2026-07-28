'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const riderIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24">
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
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="11" fill="#22c55e" stroke="white" stroke-width="2"/>
      <text x="12" y="17" text-anchor="middle" fill="white" font-size="16">📍</text>
    </svg>
  `),
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
})

const riderLocations = [
  { id: 'r1', name: 'John Banda', lat: -15.3875, lng: 28.3228, deliveries: 5 },
  { id: 'r2', name: 'Mary Phiri', lat: -15.4082, lng: 28.2871, deliveries: 3 },
  { id: 'r3', name: 'Peter Mwale', lat: -15.4167, lng: 28.2833, deliveries: 7 },
  { id: 'r4', name: 'Grace Tembo', lat: -15.4250, lng: 28.3167, deliveries: 2 },
  { id: 'r5', name: 'David Zulu', lat: -15.3950, lng: 28.3000, deliveries: 4 },
]

const deliveryRoutes = [
  { from: [-15.3875, 28.3228] as [number, number], to: [-15.4167, 28.2833] as [number, number], color: '#e33124' },
  { from: [-15.4082, 28.2871] as [number, number], to: [-15.4250, 28.3167] as [number, number], color: '#f97316' },
]

export default function MapContent({ onSelectRider }: { onSelectRider: (r: any) => void }) {
  return (
    <MapContainer center={[-15.4082, 28.2871]} zoom={13} style={{ width: '100%', height: '100%' }} zoomControl={false}>
      <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {deliveryRoutes.map((route, i) => (
        <Polyline key={i} positions={[route.from, route.to]} color={route.color} weight={4} opacity={0.6} dashArray="10, 10" />
      ))}
      {riderLocations.map((r: any) => (
        <Marker key={r.id} position={[r.lat, r.lng]} icon={riderIcon} eventHandlers={{ click: () => onSelectRider(r) }}>
          <Popup>
            <div style={{ fontFamily: 'system-ui', padding: '4px' }}>
              <p style={{ fontWeight: 700, margin: '0 0 4px', fontSize: '14px' }}>{r.name}</p>
              <p style={{ margin: '2px 0', fontSize: '12px', color: '#666' }}>🚲 Bicycle</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#22c55e', fontWeight: 600 }}>{r.deliveries} deliveries</p>
            </div>
          </Popup>
        </Marker>
      ))}
      <Marker position={[-15.4167, 28.2833]} icon={storeIcon}>
        <Popup><p style={{ fontWeight: 700, margin: 0 }}>📦 Pickup Point</p></Popup>
      </Marker>
    </MapContainer>
  )
}