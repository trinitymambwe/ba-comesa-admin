'use client'

import { useEffect, useRef, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import Link from 'next/link'

const bikeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="17" r="2"/><circle cx="15" cy="17" r="2"/><path d="M5 17V7h4l3-4h3v5m4 9v-4l-2-4H9"/></svg>`
const motorbikeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="17" r="2"/><circle cx="19" cy="17" r="2"/><path d="M15 5H3v12h4m8-12l4 6h2v6h-2M7 17h10"/></svg>`
const carSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h14M5 17a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-3h8l2 3h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2m-9-7h4"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>`
const packageSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`

function riderIconHtml(vehicle: string) {
  let svg = bikeSvg
  if (vehicle === 'motorbike') svg = motorbikeSvg
  else if (vehicle === 'car') svg = carSvg
  return `<div style="background:#22c55e;color:white;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3)">${svg}</div>`
}

function orderIconHtml() {
  return `<div style="background:#e33124;color:white;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.3)">${packageSvg}</div>`
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

    mapRef.current.style.backgroundColor = '#f0f0f0'

    const map = L.map(mapRef.current, { center: [-15.4082, 28.2871], zoom: 13, zoomControl: false })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors, &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Only show riders online in the last 5 minutes
    const fiveMinAgo = Date.now() - 5 * 60 * 1000
    const onlineRiders = riders.filter((r: any) => {
      if (!r.lat || !r.lng) return false
      if (!r.lastSeen) return false
      return new Date(r.lastSeen).getTime() > fiveMinAgo
    })

    onlineRiders.forEach((rider) => {
      const vehicle = rider.vehicle || 'bicycle'
      L.marker([rider.lat, rider.lng], {
        icon: L.divIcon({ html: riderIconHtml(vehicle), iconSize: [40, 40], iconAnchor: [20, 20], className: '' }),
      }).addTo(map).bindPopup(`<b>${rider.name}</b><br/>${vehicle} · Active`)
    })

    orders.forEach((order) => {
      if (order.deliveryLat == null || order.deliveryLng == null) return
      L.marker([order.deliveryLat, order.deliveryLng], {
        icon: L.divIcon({ html: orderIconHtml(), iconSize: [36, 36], iconAnchor: [18, 18], className: '' }),
      }).addTo(map).bindPopup(`<b>${order.productName}</b><br/>${order.buyerName || order.buyerEmail}`)
    })

    return () => map.remove()
  }, [mapLoaded, riders, orders])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, transparent 100%)', padding: '16px 20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ color: '#333', textDecoration: 'none', fontWeight: 700, fontSize: '18px' }}>← Dashboard</Link>
        <span style={{ fontWeight: 700, color: '#e33124' }}>Live Map · {riders.length} riders</span>
      </div>
      <div style={{ position: 'absolute', bottom: '30px', left: '20px', right: '20px', zIndex: 1000, display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: '20px', padding: '12px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Active Riders</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#22c55e', margin: 0 }}>{riders.length}</p>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: '20px', padding: '12px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Orders</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#e33124', margin: 0 }}>{orders.length}</p>
        </div>
      </div>
    </div>
  )
}