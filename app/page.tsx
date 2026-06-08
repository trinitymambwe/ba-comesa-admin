'use client'

import { useState, useEffect } from 'react'
import { auth, db } from '@/lib/firebase'
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth'
import { collection, getDocs, query, orderBy, updateDoc, doc, limit } from 'firebase/firestore'

const ADMIN_UID = 'aGp4yilLXHf26EuHV236plJZHoa2'

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [feedback, setFeedback] = useState<any[]>([])
  const [stats, setStats] = useState({ visits: 0, todayVisits: 0, users: 0, products: 0 })
  const [activeTab, setActiveTab] = useState<'stats' | 'feedback'>('stats')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!user || user.uid !== ADMIN_UID) return
    fetchData()
  }, [user])

  const fetchData = async () => {
    const fbSnap = await getDocs(query(collection(db, 'feedback'), orderBy('createdAt', 'desc'), limit(50)))
    setFeedback(fbSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })))

    const visitSnap = await getDocs(query(collection(db, 'visits'), orderBy('timestamp', 'desc'), limit(200)))
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      if (result.user.uid !== ADMIN_UID) {
        await signOut(auth)
        setLoginError('Unauthorized')
      }
    } catch (err: any) {
      setLoginError(err.message)
    }
    setLoginLoading(false)
  }

  const resolveFeedback = async (id: string) => {
    await updateDoc(doc(db, 'feedback', id), { resolved: true })
    fetchData()
  }

  if (loading) return <div className="min-h-screen bg-[#0d1b2a] flex items-center justify-center text-white">Loading...</div>

  // LOGIN SCREEN
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0d1b2a] flex items-center justify-center px-4">
        <div className="bg-[#0a1628] border border-[#1e3a5f] rounded-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-white">
              <span className="text-orange-500">●</span> ba<span className="text-orange-500">Comesa</span>
            </h1>
            <p className="text-gray-400 mt-2">Admin Panel</p>
          </div>

          {loginError && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">{loginError}</div>}

          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Admin Email" required className="w-full bg-[#0d1b2a] border border-[#1e3a5f] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="w-full bg-[#0d1b2a] border border-[#1e3a5f] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500" />
            <button type="submit" disabled={loginLoading} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition">
              {loginLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // WRONG USER
  if (user.uid !== ADMIN_UID) {
    return (
      <div className="min-h-screen bg-[#0d1b2a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Access Denied</p>
          <button onClick={() => signOut(auth)} className="bg-orange-500 text-white px-6 py-2 rounded-full">Logout</button>
        </div>
      </div>
    )
  }

  // ADMIN DASHBOARD
  return (
    <div className="min-h-screen bg-[#0d1b2a] text-gray-200">
      <header className="bg-[#0a1628] border-b border-[#1e3a5f] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black"><span className="text-orange-500">●</span> <span className="text-white">ba</span><span className="text-orange-500">Comesa</span></span>
          <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold">ADMIN</span>
        </div>
        <button onClick={() => signOut(auth)} className="text-gray-400 hover:text-white text-sm">Logout</button>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-4 mb-8">
          <button onClick={() => setActiveTab('stats')} className={`px-6 py-3 rounded-xl font-bold text-sm transition ${activeTab === 'stats' ? 'bg-orange-500 text-white' : 'bg-[#0a1628] text-gray-400 border border-[#1e3a5f]'}`}>📊 Stats</button>
          <button onClick={() => setActiveTab('feedback')} className={`px-6 py-3 rounded-xl font-bold text-sm transition ${activeTab === 'feedback' ? 'bg-orange-500 text-white' : 'bg-[#0a1628] text-gray-400 border border-[#1e3a5f]'}`}>
            💬 Feedback ({feedback.filter(f => !f.resolved).length})
          </button>
        </div>

        {activeTab === 'stats' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Visits', value: stats.visits, color: 'white' },
              { label: 'Today', value: stats.todayVisits, color: 'text-orange-500' },
              { label: 'Users', value: stats.users, color: 'white' },
              { label: 'Products', value: stats.products, color: 'text-orange-500' },
            ].map((s, i) => (
              <div key={i} className="bg-[#0a1628] border border-[#1e3a5f] rounded-2xl p-6">
                <p className="text-gray-400 text-sm mb-1">{s.label}</p>
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="space-y-4">
            {feedback.length === 0 ? (
              <div className="bg-[#0a1628] border border-[#1e3a5f] rounded-2xl p-8 text-center text-gray-400">No feedback yet.</div>
            ) : (
              feedback.map((f: any) => (
                <div key={f.id} className={`bg-[#0a1628] border rounded-2xl p-6 ${f.resolved ? 'border-gray-700 opacity-50' : 'border-[#1e3a5f]'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${f.type === 'complaint' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {f.type === 'complaint' ? '🚨 Complaint' : '💡 Feedback'}
                    </span>
                    <span className="text-xs text-gray-500">{new Date(f.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-white mb-2">{f.message}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">{f.userEmail}</p>
                    {!f.resolved && (
                      <button onClick={() => resolveFeedback(f.id)} className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full hover:bg-green-500/30">Mark Resolved</button>
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