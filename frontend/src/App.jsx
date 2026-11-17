import { useEffect, useState } from 'react'
import Login from './components/Login'
import Workspace from './ui/Workspace'
import { demoEnabled, demoUser } from './api/demo'
import { getCurrentUser, logout } from './api/api'
import StartupScreen from './components/StartupScreen'

export default function App() {
  const [user,setUser]=useState(demoEnabled ? demoUser : null)
  const [loading,setLoading]=useState(!demoEnabled)
  const [error,setError]=useState('')
  const [startupFailed,setStartupFailed]=useState(false)
  const [connectionAttempt,setConnectionAttempt]=useState(0)
  useEffect(()=>{
    const expired=()=>setUser(null)
    window.addEventListener('accessgrid:unauthorized',expired)
    let active=true
    const controller=new AbortController()
    let retryTimer
    let attempts=0
    async function connect(){
      attempts+=1
      try{
        const {data}=await getCurrentUser({signal:controller.signal,timeout:15000})
        if(active){setUser(data);setLoading(false)}
      }catch(err){
        if(!active)return
        if(err.response?.status===401){setLoading(false);return}
        if(attempts<6)retryTimer=setTimeout(connect,2500)
        else setStartupFailed(true)
      }
    }
    if(!demoEnabled)connect()
    return ()=>{active=false;controller.abort();clearTimeout(retryTimer);window.removeEventListener('accessgrid:unauthorized',expired)}
  },[connectionAttempt])
  async function signOut(){
    if(demoEnabled){window.location.assign(window.location.pathname);return}
    try{await logout();setUser(null);setError('')}
    catch{setError('Sign-out failed. Please try again.')}
  }
  return <div className={`app ${demoEnabled?'preview-active':''}`}><a className="skip-link" href="#main-content">Skip to content</a>
    {demoEnabled&&<div className="preview-bar"><span><i/>Sample demo</span><nav aria-label="Switch demo workspace">{['admin','security','student'].map(role=><a key={role} href={`?demo=${role}`} aria-current={user?.role===role?'page':undefined}>{role[0].toUpperCase()+role.slice(1)}</a>)}<a href={window.location.pathname}>Exit</a></nav></div>}
    {error&&<p role="alert">{error}</p>}
    {loading?<StartupScreen key={connectionAttempt} failed={startupFailed} onRetry={()=>{setStartupFailed(false);setConnectionAttempt(value=>value+1)}}/>:user?<Workspace user={user} onLogout={signOut}/>:<Login onLogin={setUser}/>}
  </div>
}
