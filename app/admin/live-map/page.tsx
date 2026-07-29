'use client'

import { useEffect, useRef, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import Link from 'next/link'

function createVehicleIcon(vehicle: string) {
  const emoji = vehicle === 'motorbike' ? '🏍️' : '🚲'
  return `
    <div style="font-size:40px; filter:drop-shadow(0 4px 8px rgba(0,0,0,0.5)); animation: vehiclePulse 1.5s infinite;">
      ${emoji}
    </div>
    <style>
      @keyframes vehiclePulse {
        0% { transform: scale(1); opacity: 0.9; }
        50% { transform: scale(1.15); opacity: 1; }
        100% { transform: scale(1); opacity: 0.9; }
      }
    </style>
  `
}

export default function LiveMapPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [riders, setRiders] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const riderSnap = await getDocs(query(collection(db, 'riders'), where('status', '==', 'active')))
      const orderSnap = await getDocs(query(collection(db, 'orders'), where('deliveryStatus', 'in', ['assigned', 'picked_up'])))
      setRiders(riderSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setOrders(orderSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    }
    fetchData()
  }, [])

  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.7.1/dist/leaflet.js'
    script.onload = () => setMapLoaded(true)
    document.head.appendChild(script)
  }, [])

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    const L = (window as any).L

    const map = L.map(mapRef.current, {
      center: [-15.4082, 28.2871],
      zoom: 13,
      zoomControl: false,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    riders.forEach((rider) => {
      const vehicle = rider.vehicle || 'bicycle'
      const icon = L.divIcon({
        html: createVehicleIcon(vehicle),
        iconSize: [50, 50],
        iconAnchor: [25, 25],
        className: '',
      })

      const startLat = -15.3875 + Math.random() * 0.04
      const startLng = 28.3228 + Math.random() * 0.04
      const endLat = -15.4167 + Math.random() * 0.04
      const endLng = 28.2833 + Math.random() * 0.04

      L.polyline([[startLat, startLng], [endLat, endLng]], {
        color: '#e33124',
        weight: 4,
        opacity: 0.6,
        dashArray: '10, 10',
      }).addTo(map)

      const marker = L.marker([startLat, startLng], { icon }).addTo(map)
      marker.bindPopup(`<b>${rider.name}</b><br/>${vehicle} · Active`)

      let step = 0
      const steps = 100
      const latDiff = endLat - startLat
      const lngDiff = endLng - startLng
      setInterval(() => {
        step = (step + 1) % steps
        const progress = step / steps
        marker.setLatLng([startLat + latDiff * progress, startLng + lngDiff * progress])
      }, 100)
    })

    orders.forEach((order) => {
      if (order.deliveryLat && order.deliveryLng) {
        L.marker([order.deliveryLat, order.deliveryLng], {
          icon: L.divIcon({
            html: '<div style="font-size:24px; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5))">📍</div>',
            iconSize: [30, 30],
            iconAnchor: [15, 30],
            className: '',
          }),
        }).addTo(map).bindPopup(`<b>${order.productName}</b><br/>${order.buyerName || order.buyerEmail}`)
      }
    })

    return () => map.remove()
  }, [mapLoaded, riders, orders])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, transparent 100%)',
        padding: '16px 20px 30px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Link href="/" style={{ color: '#333', textDecoration: 'none', fontWeight: 700, fontSize: '18px' }}>
          ← Dashboard
        </Link>
        <span style={{ fontWeight: 700, color: '#e33124' }}>Live Map</span>
      </div>
      <div style={{
        position: 'absolute', bottom: '30px', left: '20px', right: '20px', zIndex: 1000,
        display: 'flex', gap: '10px', justifyContent: 'center',
      }}>
        <div style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '12px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Active Riders</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#e33124', margin: 0 }}>{riders.length}</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '12px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Active Deliveries</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#22c55e', margin: 0 }}>{orders.length}</p>
        </div>
      </div>
    </div>
  )
}