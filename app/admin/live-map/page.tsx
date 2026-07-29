'use client'

import { useEffect, useRef, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import Link from 'next/link'

const riderSvg = (color: string) => `
<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="11" fill="${color}" stroke="white" stroke-width="2"/>
  <text x="12" y="17" text-anchor="middle" fill="white" font-size="14">🚴</text>
</svg>`

const packageSvg = `
<svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="11" fill="#22c55e" stroke="white" stroke-width="2"/>
  <text x="12" y="17" text-anchor="middle" fill="white" font-size="14">📦</text>
</svg>`

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

    const map = L.map(mapRef.current, { center: [-15.4082, 28.2871], zoom: 13, zoomControl: false })

    L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/light-v10/tiles/256/{z}/{x}/{y}@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`, {
      attribution: '&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> contributors',
      tileSize: 512, zoomOffset: -1, maxZoom: 19,
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    orders.forEach((order) => {
      if (!order.deliveryLat || !order.deliveryLng) return
      const rider = riders.find(r => r.id === order.riderId)
      if (rider && rider.lat && rider.lng) {
        L.polyline([[rider.lat, rider.lng], [order.deliveryLat, order.deliveryLng]], {
          color: '#22c55e', weight: 5, opacity: 0.7, dashArray: '10, 10',
        }).addTo(map)
      }
    })

    riders.forEach((rider) => {
      if (rider.lat == null || rider.lng == null) return
      L.marker([rider.lat, rider.lng], {
        icon: L.divIcon({ html: riderSvg('#e33124'), iconSize: [40, 40], iconAnchor: [20, 20], className: '' }),
      }).addTo(map).bindPopup(`<b>${rider.name}</b><br/>${rider.vehicle || 'Bicycle'} · Active`)
    })

    orders.forEach((order) => {
      if (order.deliveryLat == null || order.deliveryLng == null) return
      L.marker([order.deliveryLat, order.deliveryLng], {
        icon: L.divIcon({ html: packageSvg, iconSize: [40, 40], iconAnchor: [20, 20], className: '' }),
      }).addTo(map).bindPopup(`<b>${order.productName}</b><br/>${order.buyerName || order.buyerEmail}`)
    })

    const allLatLngs = [
      ...riders.filter(r => r.lat && r.lng).map(r => [r.lat, r.lng]),
      ...orders.filter(o => o.deliveryLat && o.deliveryLng).map(o => [o.deliveryLat, o.deliveryLng]),
    ]
    if (allLatLngs.length > 0) map.fitBounds(L.latLngBounds(allLatLngs), { padding: [30, 30] })

    return () => map.remove()
  }, [mapLoaded, riders, orders])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, transparent 100%)', padding: '16px 20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ color: '#333', textDecoration: 'none', fontWeight: 700, fontSize: '18px' }}>← Dashboard</Link>
        <span style={{ fontWeight: 700, color: '#e33124' }}>Live Map</span>
      </div>
      <div style={{ position: 'absolute', bottom: '30px', left: '20px', right: '20px', zIndex: 1000, display: 'flex', gap: '10px', justifyContent: 'center' }}>
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