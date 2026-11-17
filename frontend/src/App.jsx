import { useEffect, useRef, useState } from 'react'
import Login from './components/Login'
import Workspace from './ui/Workspace'
import { demoEnabled, demoUser, leaveDemo } from './api/demo'
import { getCurrentUser } from './api/api'
import StartupScreen from './components/StartupScreen'

export default function App() {
  const [user,setUser]=useState(demoEnabled ? demoUser : null)
  const [loading,setLoading]=useState(false)
  const cancelConnection=useRef(()=>{})
  const [startupFailed,setStartupFailed]=useState(false)
  const [connectionAttempt,setConnectionAttempt]=useState(0)
  useEffect(()=>{
    if(demoEnabled)return
    let active=true
    const controller=new AbortController()
    let retryTimer
    // A warm server never replaces the login with a loading screen.
    const revealTimer=setTimeout(()=>{if(active)setLoading(true)},2000)
    let attempts=0
    function ready(){clearTimeout(revealTimer);setLoading(false)}
    async function connect(){
      attempts+=1
      try{
        await getCurrentUser({signal:controller.signal,timeout:15000})
        if(active)ready()
      }catch(err){
        if(!active)return
        if(err.response?.status===401){ready();return}
        if(attempts<6)retryTimer=setTimeout(connect,2500)
        else setStartupFailed(true)
      }
    }
    cancelConnection.current=()=>{active=false;controller.abort();clearTimeout(retryTimer);clearTimeout(revealTimer)}
    connect()
    return ()=>cancelConnection.current()
  },[connectionAttempt])
  function signIn(account){cancelConnection.current();setLoading(false);setUser(account)}
  function signOut(){
    cancelConnection.current()
    leaveDemo()
    const url=new URL(window.location.href)
    url.searchParams.delete('demo')
    window.history.replaceState(null,'',url.pathname+url.search+url.hash)
    setUser(null)
    setLoading(false)
  }
  return <div className="app"><a className="skip-link" href="#main-content">Skip to content</a>
    {loading?<StartupScreen key={connectionAttempt} failed={startupFailed} onContinue={()=>{cancelConnection.current();setLoading(false)}} onRetry={()=>{setStartupFailed(false);setConnectionAttempt(value=>value+1)}}/>:user?<Workspace user={user} onLogout={signOut}/>:<Login onLogin={signIn}/>}
  </div>
}
