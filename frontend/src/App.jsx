import { useEffect, useState } from 'react'
import Login from './components/Login'
import Workspace from './ui/Workspace'
import { demoEnabled, demoUser } from './api/demo'
import { getCurrentUser, logout } from './api/api'

export default function App() {
  const [user,setUser]=useState(demoEnabled ? demoUser : null)
  const [loading,setLoading]=useState(!demoEnabled)
  const [error,setError]=useState('')
  useEffect(()=>{
    const expired=()=>setUser(null)
    window.addEventListener('accessgrid:unauthorized',expired)
    let active=true
    if(!demoEnabled) getCurrentUser().then(({data})=>{if(active)setUser(data)}).catch(()=>{}).finally(()=>{if(active)setLoading(false)})
    return ()=>{active=false;window.removeEventListener('accessgrid:unauthorized',expired)}
  },[])
  async function signOut(){
    try{await logout();setUser(null);setError('')}
    catch{setError('Sign-out failed. Please try again.')}
  }
  return <div className="app"><a className="skip-link" href="#main-content">Skip to content</a>
    {error&&<p role="alert">{error}</p>}
    {loading?<main id="main-content" className="empty-state" role="status">Loading your workspace…</main>:user?<Workspace user={user} onLogout={signOut}/>:<Login onLogin={setUser}/>}
  </div>
}
