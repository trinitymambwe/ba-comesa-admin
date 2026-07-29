'use client'

import { useEffect, useRef, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import Link from 'next/link'
import { Bike, Car, Package, MapPin } from 'lucide-react'

const vehicleIcon = (type: string) => {
  const color = '#22c55e'
  if (type === 'motorbike') {
    return `<div style="background:${color};color:white;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="5" cy="17" r="2"/><circle cx="19" cy="17" r="2"/><path d="M15 5H3v12h4m8-12l4 6h2v6h-2M7 17h10"/></svg></div>`
  }
  if (type === 'car') {
    return `<div style="background:${color};color:white;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M5 17h14M5 17a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-3h8l2 3h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2m-9-7h4"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg></div>`
  }
  return `<div style="background:${color};color:white;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="5" cy="17" r="2"/><circle cx="15" cy="17" r="2"/><path d="M5 17V7h4l3-4h3v5m4 9v-4l-2-4H9"/></svg></div>`
}

const orderIcon = `<div style="background:#e33124;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>`

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
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
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
    const map = L.map(mapRef.current, { center: [-15.4082, 28.2871], zoom: 14, zoomControl: false })

    L.tileLayer(`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`, {
      attribution: '© Mapbox', tileSize: 512, zoomOffset: -1, maxZoom: 19,
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    riders.forEach((rider) => {
      if (!rider.lat || !rider.lng) return
      L.marker([rider.lat, rider.lng], {
        icon: L.divIcon({ html: vehicleIcon(rider.vehicle || 'bicycle'), iconSize: [40, 40], iconAnchor: [20, 20], className: '' }),
      }).addTo(map).bindPopup(`<b>${rider.name}</b><br/>${rider.vehicle || 'Bicycle'} · Active`)
    })

    orders.forEach((order) => {
      if (!order.deliveryLat || !order.deliveryLng) return
      L.marker([order.deliveryLat, order.deliveryLng], {
        icon: L.divIcon({ html: orderIcon, iconSize: [36, 36], iconAnchor: [18, 18], className: '' }),
      }).addTo(map).bindPopup(`<b>${order.productName}</b><br/>${order.buyerName || order.buyerEmail}`)
    })

    orders.forEach((order) => {
      if (!order.deliveryLat || !order.deliveryLng) return
      const rider = riders.find(r => r.id === order.riderId)
      if (rider?.lat && rider?.lng) {
        L.polyline([[rider.lat, rider.lng], [order.deliveryLat, order.deliveryLng]], {
          color: '#22c55e', weight: 4, opacity: 0.7,
        }).addTo(map)
      }
    })

    return () => map.remove()
  }, [mapLoaded, riders, orders])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, transparent 100%)', padding: '16px 20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ color: '#333', textDecoration: 'none', fontWeight: 700, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          ← Dashboard
        </Link>
        <span style={{ fontWeight: 700, color: '#e33124', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={18} color="#e33124" /> Live Map
        </span>
      </div>
      <div style={{ position: 'absolute', bottom: '30px', left: '20px', right: '20px', zIndex: 1000, display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '12px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Bike size={20} color="#22c55e" />
          <div>
            <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Active Riders</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#22c55e', margin: 0 }}>{riders.filter(r => r.lat && r.lng).length}</p>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '12px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Package size={20} color="#e33124" />
          <div>
            <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Active Deliveries</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#e33124', margin: 0 }}>{orders.length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}