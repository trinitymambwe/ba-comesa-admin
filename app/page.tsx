'use client'

import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, getDocs, query, orderBy, updateDoc, doc, limit, where } from 'firebase/firestore'

const ADMIN_UID = 'aGp4yilLXHf26EuHV236plJZHoa2'

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [feedback, setFeedback] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [riders, setRiders] = useState<any[]>([])
  const [stats, setStats] = useState({ visits: 0, todayVisits: 0, users: 0, products: 0 })
  const [activeTab, setActiveTab] = useState<'stats' | 'orders' | 'feedback' | 'riders'>('stats')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false) })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!user || user.uid !== ADMIN_UID) return
    fetchData()
  }, [user])

  const fetchData = async () => {
    const fbSnap = await getDocs(query(collection(db, 'feedback'), orderBy('createdAt', 'desc'), limit(50)))
    setFeedback(fbSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })))

    const orderSnap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50)))
    setOrders(orderSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })))

    const riderSnap = await getDocs(query(collection(db, 'riders'), where('status', '==', 'active')))
    setRiders(riderSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })))

    const visitSnap = await getDocs(query(collection(db, 'visits'), limit(200)))
    const visitsData = visitSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
    const today = new Date().toISOString().split('T')[0]
    const userSnap = await getDocs(collection(db, 'profiles'))
    const prodSnap = await getDocs(collection(db, 'products'))
    setStats({
      visits: visitsData.length,
      todayVisits: visitsData.filter((v: any) => v.timestamp?.startsWith(today)).length,
      users: userSnap.size,
      products: prodSnap.size,
    })
  }

  const assignRider = async (orderId: string, riderId: string, riderName: string) => {
    await updateDoc(doc(db, 'orders', orderId), {
      riderId,
      riderName,
      deliveryStatus: 'assigned',
    })
    fetchData()
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    await updateDoc(doc(db, 'orders', orderId), { deliveryStatus: status })
    fetchData()
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      if (result.user.uid !== ADMIN_UID) { await signOut(auth); setLoginError('Unauthorized') }
    } catch (err: any) { setLoginError(err.message) }
    setLoginLoading(false)
  }

  const resolveFeedback = async (id: string) => {
    await updateDoc(doc(db, 'feedback', id), { resolved: true })
    fetchData()
  }

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-red-600">baComesa</h1>
            <p className="text-gray-500">Admin Panel</p>
          </div>
          {loginError && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">{loginError}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Admin Email" required className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500" />
            <button type="submit" disabled={loginLoading} className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700">
              {loginLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (user.uid !== ADMIN_UID) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Access Denied</p>
          <button onClick={() => signOut(auth)} className="bg-red-600 text-white px-6 py-2 rounded-full">Logout</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black text-red-600">baComesa</span>
          <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-bold">ADMIN</span>
        </div>
        <button onClick={() => signOut(auth)} className="text-gray-500 hover:text-red-600 text-sm">Logout</button>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {[
            { key: 'stats' as const, label: '📊 Stats' },
            { key: 'orders' as const, label: `📦 Orders (${orders.length})` },
            { key: 'riders' as const, label: `🚴 Riders (${riders.length})` },
            { key: 'feedback' as const, label: `💬 Feedback (${feedback.filter(f => !f.resolved).length})` },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 rounded-full text-sm font-bold transition ${activeTab === tab.key ? 'bg-red-600 text-white' : 'bg-white text-gray-600 border'}`}
            >{tab.label}</button>
          ))}
        </div>

        {/* STATS */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Visits', value: stats.visits },
              { label: 'Today', value: stats.todayVisits },
              { label: 'Users', value: stats.users },
              { label: 'Products', value: stats.products },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm p-6 border">
                <p className="text-gray-500 text-sm">{s.label}</p>
                <p className="text-3xl font-bold text-gray-900">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl border p-8 text-center text-gray-400">No orders yet.</div>
            ) : (
              orders.map((o: any) => (
                <div key={o.id} className="bg-white rounded-2xl border p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-lg">{o.productName}</p>
                      <p className="text-sm text-gray-500">Buyer: {o.buyerEmail}</p>
                      <p className="text-sm text-gray-500">Seller: {o.sellerName} · 📱 {o.sellerPhone}</p>
                      {o.price && <p className="text-red-600 font-bold mt-1">K{Number(o.price).toLocaleString()}</p>}
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      o.deliveryStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                      o.deliveryStatus === 'assigned' ? 'bg-blue-100 text-blue-700' :
                      o.deliveryStatus === 'picked_up' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {o.deliveryStatus?.replace('_', ' ') || 'pending'}
                    </span>
                  </div>

                  {/* Assign Rider */}
                  {o.deliveryStatus === 'pending' && (
                    <div className="flex gap-2 items-center flex-wrap">
                      <span className="text-sm text-gray-500">Assign rider:</span>
                      <select onChange={(e) => {
                        const [id, name] = e.target.value.split('|')
                        if (id) assignRider(o.id, id, name)
                      }} className="border rounded-lg px-3 py-1.5 text-sm">
                        <option value="">Select rider...</option>
                        {riders.map((r: any) => (
                          <option key={r.id} value={`${r.id}|${r.name}`}>{r.name} · {r.vehicle} · {r.area}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Status updates */}
                  {o.deliveryStatus === 'assigned' && (
                    <div className="flex gap-2">
                      <span className="text-sm text-gray-500">Rider: {o.riderName}</span>
                      <button onClick={() => updateOrderStatus(o.id, 'picked_up')} className="text-xs bg-yellow-500 text-white px-3 py-1 rounded-full">Mark Picked Up</button>
                    </div>
                  )}
                  {o.deliveryStatus === 'picked_up' && (
                    <div className="flex gap-2">
                      <span className="text-sm text-gray-500">Rider: {o.riderName} · In transit</span>
                      <button onClick={() => updateOrderStatus(o.id, 'delivered')} className="text-xs bg-green-500 text-white px-3 py-1 rounded-full">Mark Delivered</button>
                    </div>
                  )}
                  {o.deliveryStatus === 'delivered' && (
                    <p className="text-sm text-green-600">✅ Delivered by {o.riderName}</p>
                  )}

                  <p className="text-xs text-gray-400 mt-2">{new Date(o.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* RIDERS */}
        {activeTab === 'riders' && (
          <div className="space-y-4">
            {riders.length === 0 ? (
              <div className="bg-white rounded-2xl border p-8 text-center text-gray-400">No active riders.</div>
            ) : (
              riders.map((r: any) => (
                <div key={r.id} className="bg-white rounded-2xl border p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold">{r.name}</p>
                    <p className="text-sm text-gray-500">📱 {r.phone} · {r.vehicle} · 📍 {r.area}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-600 font-bold">K{Number(r.earnings || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{r.deliveries || 0} deliveries</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* FEEDBACK */}
        {activeTab === 'feedback' && (
          <div className="space-y-4">
            {feedback.length === 0 ? (
              <div className="bg-white rounded-2xl border p-8 text-center text-gray-400">No feedback yet.</div>
            ) : (
              feedback.map((f: any) => (
                <div key={f.id} className={`bg-white rounded-2xl border p-6 ${f.resolved ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${f.type === 'complaint' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                      {f.type === 'complaint' ? '🚨 Complaint' : '💡 Feedback'}
                    </span>
                    <span className="text-xs text-gray-400">{new Date(f.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-gray-800 mb-2">{f.message}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">{f.userEmail}</p>
                    {!f.resolved && (
                      <button onClick={() => resolveFeedback(f.id)} className="text-xs bg-green-100 text-green-600 px-3 py-1 rounded-full">Mark Resolved</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}