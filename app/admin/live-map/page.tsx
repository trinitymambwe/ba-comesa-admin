'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { GoogleMap, LoadScript, Marker, Polyline, InfoWindow } from '@react-google-maps/api'
import Link from 'next/link'

const containerStyle = { width: '100vw', height: '100vh' }
const center = { lat: -15.4082, lng: 28.2871 }

export default function LiveMapPage() {
  const [riders, setRiders] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [selectedRider, setSelectedRider] = useState<any>(null)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      const riderSnap = await getDocs(query(collection(db, 'riders'), where('status', '==', 'active')))
      const orderSnap = await getDocs(query(collection(db, 'orders'), where('deliveryStatus', 'in', ['assigned', 'picked_up'])))
      setRiders(riderSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setOrders(orderSnap.docs.map(d => ({ id: d.id, ...d.data() })))
    }
    fetchData()
  }, [])

  const riderSvg = (type: string) => ({
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="11" fill="#22c55e" stroke="white" stroke-width="2"/>
        <text x="12" y="17" text-anchor="middle" fill="white" font-size="15">${type === 'motorbike' ? '🏍️' : type === 'car' ? '🚗' : '🚲'}</text>
      </svg>
    `)}`,
    scaledSize: { width: 44, height: 44 } as google.maps.Size,
    anchor: { x: 22, y: 22 } as google.maps.Point,
  })

  const orderSvg = {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="11" fill="#e33124" stroke="white" stroke-width="2"/>
        <text x="12" y="17" text-anchor="middle" fill="white" font-size="13">📦</text>
      </svg>
    `)}`,
    scaledSize: { width: 36, height: 36 } as google.maps.Size,
    anchor: { x: 18, y: 18 } as google.maps.Point,
  }

  return (
    <LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!}>
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={14}
        options={{ mapTypeId: 'satellite', streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}>

        {/* Route lines */}
        {orders.map((order) => {
          const rider = riders.find(r => r.id === order.riderId)
          if (!rider?.lat || !rider?.lng || !order.deliveryLat || !order.deliveryLng) return null
          return (
            <Polyline key={order.id}
              path={[{ lat: rider.lat, lng: rider.lng }, { lat: order.deliveryLat, lng: order.deliveryLng }]}
              options={{ strokeColor: '#22c55e', strokeWeight: 4, strokeOpacity: 0.8 }}
            />
          )
        })}

        {/* Rider markers */}
        {riders.map((rider) => {
          if (!rider.lat || !rider.lng) return null
          return (
            <Marker key={rider.id} position={{ lat: rider.lat, lng: rider.lng }}
              icon={riderSvg(rider.vehicle || 'bicycle')}
              onClick={() => { setSelectedRider(rider); setSelectedOrder(null) }}
            />
          )
        })}

        {/* Order markers */}
        {orders.map((order) => {
          if (!order.deliveryLat || !order.deliveryLng) return null
          return (
            <Marker key={order.id} position={{ lat: order.deliveryLat, lng: order.deliveryLng }}
              icon={orderSvg}
              onClick={() => { setSelectedOrder(order); setSelectedRider(null) }}
            />
          )
        })}

        {/* Rider InfoWindow */}
        {selectedRider && (
          <InfoWindow position={{ lat: selectedRider.lat, lng: selectedRider.lng }} onCloseClick={() => setSelectedRider(null)}>
            <div style={{ color: '#333', fontSize: '13px' }}>
              <p style={{ fontWeight: 700, margin: '0 0 4px' }}>{selectedRider.name}</p>
              <p style={{ margin: 0 }}>{selectedRider.vehicle || 'Bicycle'} · {selectedRider.phone || ''}</p>
              <p style={{ margin: 0, color: '#22c55e', fontWeight: 700 }}>Active</p>
            </div>
          </InfoWindow>
        )}

        {/* Order InfoWindow */}
        {selectedOrder && (
          <InfoWindow position={{ lat: selectedOrder.deliveryLat, lng: selectedOrder.deliveryLng }} onCloseClick={() => setSelectedOrder(null)}>
            <div style={{ color: '#333', fontSize: '13px' }}>
              <p style={{ fontWeight: 700, margin: '0 0 4px' }}>{selectedOrder.productName}</p>
              <p style={{ margin: 0 }}>{selectedOrder.buyerName || selectedOrder.buyerEmail}</p>
              <p style={{ margin: 0, color: '#e33124', fontWeight: 700 }}>{selectedOrder.deliveryStatus?.replace('_', ' ')}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)', padding: '16px 20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '18px' }}>← Dashboard</Link>
        <span style={{ fontWeight: 700, color: '#22c55e' }}>Live Map</span>
      </div>

      {/* Bottom stats */}
      <div style={{ position: 'absolute', bottom: '30px', left: '20px', right: '20px', zIndex: 1000, display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '12px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>Active Riders</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#22c55e', margin: 0 }}>{riders.length}</p>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', borderRadius: '20px', padding: '12px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>Active Deliveries</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: '#e33124', margin: 0 }}>{orders.length}</p>
        </div>
      </div>
    </LoadScript>
  )
}