import { useEffect, useRef, useState } from 'react'
import { getVehicles, getEntryLogs, getParkingZones, addVehicle } from '../api/api'
import { demoEnabled } from '../api/demo'
import Icon from './Icon'
import { Brand, Badge, Button, Panel, Metrics, Notice, Empty } from './shared'
import Parking from './Parking'
import GateConsole from './GateConsole'
import { Activity, LogTable, VehicleRegistry, VehiclePass } from './Records'
import { date, dayKey, initials, parseTime } from './format'

const roleConfig={
  admin:{label:'Administration',title:'Campus overview',description:'A clear view of your campus, in motion.',nav:[['overview','Overview','overview'],['vehicles','Vehicle registry','car'],['parking','Parking zones','parking'],['reports','Reports & activity','activity'],['settings','Workspace settings','settings']]},
  security:{label:'Security desk',title:'Gate control',description:'Every arrival and departure, accounted for.',nav:[['overview','Gate control','overview'],['scan','Vehicle verification','scan'],['logs','Entry & exit logs','clock'],['parking','Parking availability','parking'],['settings','Workspace settings','settings']]},
  student:{label:'Student workspace',title:'Your campus, at a glance',description:'Your vehicle, your visits, and a space to park.',nav:[['overview','My overview','overview'],['vehicle','My vehicle','car'],['history','Travel history','clock'],['parking','Campus parking','parking'],['settings','My account','settings']]},
}

async function loadWorkspace(user) {
  const [vehicleResponse,zoneResponse]=await Promise.all([getVehicles(),getParkingZones()])
  const vehicles=user.role==='student'?vehicleResponse.data.filter(v=>v.ownerId===user.id):vehicleResponse.data
  let logs=[]
  if(user.role==='student') {
    const responses=await Promise.all(vehicles.map(v=>getEntryLogs({vehicle_id:v.id,limit:1000})))
    logs=responses.flatMap(r=>r.data).sort((a,b)=>parseTime(b.timestamp)-parseTime(a.timestamp))
  } else logs=(await getEntryLogs({limit:1000})).data
  return {vehicles,zones:zoneResponse.data,logs}
}

export default function Workspace({user,onLogout}) {
  const [view,setView]=useState('overview')
  const [data,setData]=useState({vehicles:[],zones:[],logs:[]})
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [search,setSearch]=useState('')
  const [menu,setMenu]=useState(false)
  const [showAdd,setShowAdd]=useState(false)
  const [retry,setRetry]=useState(0)
  const railRef=useRef(null)
  const menuTriggerRef=useRef(null)
  useEffect(()=>{
    if(!menu)return
    const rail=railRef.current
    const trigger=menuTriggerRef.current
    const preview=document.querySelector('.preview-bar')
    const skip=document.querySelector('.skip-link')
    const previousOverflow=document.body.style.overflow
    if(preview)preview.inert=true
    if(skip)skip.inert=true
    document.body.style.overflow='hidden'
    const controls=()=>Array.from(rail.querySelectorAll('button:not([disabled]),a[href]')).filter(el=>el.getClientRects().length)
    controls()[0]?.focus()
    function keydown(event){
      if(event.key==='Escape'){event.preventDefault();setMenu(false)}
      if(event.key==='Tab'){
        const items=controls(),first=items[0],last=items.at(-1)
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
      }
    }
    document.addEventListener('keydown',keydown)
    return ()=>{
      document.removeEventListener('keydown',keydown)
      document.body.style.overflow=previousOverflow
      if(preview)preview.inert=false
      if(skip)skip.inert=false
      trigger?.focus()
    }
  },[menu])
  const config=roleConfig[user.role]
  useEffect(()=>{
    let current=true
    loadWorkspace(user).then(result=>{if(current){setData(result);setError('');setLoading(false)}}).catch(()=>{if(current){setError('Campus data could not be loaded. Check the backend connection and retry.');setLoading(false)}})
    return ()=>{current=false}
  },[user,retry])
  async function refresh() {
    setLoading(true)
    try{setData(await loadWorkspace(user));setError('')}catch{setError('Data could not be refreshed. Your last loaded records are still shown.')}finally{setLoading(false)}
  }
  function navigate(next){setView(next);setMenu(false);setNotice('')}
  const {vehicles,zones,logs}=data
  const filtered=vehicles.filter(v=>`${v.plate} ${v.owner} ${v.department}`.toLowerCase().includes(search.toLowerCase()))
  const today=logs.filter(l=>dayKey(l.timestamp)===dayKey(new Date().toISOString()))
  const totalCapacity=zones.reduce((sum,z)=>sum+z.capacity,0)
  const occupied=zones.reduce((sum,z)=>sum+z.occupied,0)
  const inside=vehicles.filter(v=>v.isInside).length
  const overview=view==='overview'
  const metrics=user.role==='student'?[{label:'Vehicle status',value:inside?'Inside':'Outside',note:'Current campus location'},{label:'Recorded visits',value:logs.filter(l=>l.action==='entry').length,note:'In your loaded history'},{label:'Last visit',value:logs[0]?date(logs[0].timestamp).split(' ').slice(0,2).join(' '):'—',note:'Latest recorded movement'},{label:'Student parking',value:zones.find(z=>z.id==='C')?zones.find(z=>z.id==='C').capacity-zones.find(z=>z.id==='C').occupied:'—',unit:'free',note:'Available in Zone C'}]:user.role==='security'?[{label:'Vehicles inside',value:inside,note:'Currently on campus'},{label:'Entries today',value:today.filter(l=>l.action==='entry').length,note:'Recorded arrivals · IST'},{label:'Exits today',value:today.filter(l=>l.action==='exit').length,note:'Recorded departures · IST'},{label:'Available parking',value:totalCapacity-occupied,unit:'spaces',note:`Across ${zones.length} campus zones`}]:[{label:'Registered vehicles',value:vehicles.length,note:'In the campus registry'},{label:'Vehicles on campus',value:inside,note:'Currently checked in'},{label:'Parking occupancy',value:totalCapacity?Math.round(occupied/totalCapacity*100):0,unit:'%',note:`${occupied} of ${totalCapacity} spaces`},{label:'Gate movements',value:today.length,note:'Entries and exits today · IST'}]
  return <div className="workspace">
    <aside ref={railRef} role={menu?'dialog':undefined} aria-modal={menu?true:undefined} aria-label={menu?'Campus navigation':undefined} className={`rail ${menu?'rail-open':''}`}><div className="rail-brand"><Brand/><button className="icon-button mobile-only" onClick={()=>setMenu(false)} aria-label="Close navigation"><Icon name="close"/></button></div><div className="campus-picker"><span className="campus-monogram">F</span><div><strong>FISAT campus</strong><small>{config.label}</small></div><Icon name="chevron" size={14}/></div><nav aria-label="Main navigation">{config.nav.map(([id,label,icon])=><button key={id} className={view===id?'active':''} onClick={()=>navigate(id)} aria-current={view===id?'page':undefined}><Icon name={icon}/><span>{label}</span>{view===id&&<span className="nav-indicator"/>}</button>)}</nav><div className="rail-bottom"><button className="rail-profile" onClick={()=>navigate('settings')}><span className="avatar">{initials(user.name)}</span><span><strong>{user.name}</strong><small>{config.label}</small></span><Icon name="settings" size={16}/></button><button className="rail-logout" onClick={onLogout}><Icon name="exit" size={16}/>Sign out</button></div></aside>
    {menu&&<button className="rail-backdrop" tabIndex={-1} aria-hidden="true" onClick={()=>setMenu(false)}/>}
    <main inert={menu} className="workspace-main" id="main-content"><header className="utility-bar"><div><button className="icon-button mobile-only" ref={menuTriggerRef} onClick={()=>setMenu(true)} aria-expanded={menu} aria-label="Open navigation"><Icon name="menu"/></button><span className="utility-campus">FISAT campus</span><span className="utility-divider">/</span><span>{config.nav.find(n=>n[0]===view)?.[1]}</span></div><div><span className="utility-date">{date(new Date().toISOString())}</span><button className="icon-button" aria-label="Refresh campus data" onClick={refresh} disabled={loading}><Icon name="refresh"/></button><span className="avatar avatar-small">{initials(user.name)}</span></div></header>
      <div className="workspace-content"><div className="page-heading"><div><h1>{overview?config.title:config.nav.find(n=>n[0]===view)?.[1]}</h1><p>{overview?config.description:({vehicles:'Manage the vehicles registered to your campus.',parking:'Find space across the campus parking zones.',reports:'Understand movement through your campus gates.',scan:'Identify a vehicle and record its next movement.',logs:'The record of arrivals and departures.',vehicle:'Your registered vehicle and campus access.',history:'Every recorded entry and exit, in one place.',settings:'Your account and workspace information.'})[view]}</p></div>{user.role==='admin'&&(overview||view==='vehicles')?<Button variant="primary" icon="plus" onClick={()=>{navigate('vehicles');setShowAdd(true)}}>Register vehicle</Button>:user.role==='security'&&view!=='scan'?<Button variant="primary" icon="scan" onClick={()=>navigate('scan')}>Verify vehicle</Button>:null}</div>
      {error&&<Notice error><span>{error}</span><Button onClick={()=>{setLoading(true);setRetry(r=>r+1)}}>Retry</Button></Notice>}{notice&&<Notice onClose={()=>setNotice('')}>{notice}</Notice>}
      {loading&&!vehicles.length?<div className="workspace-skeleton" aria-label="Loading campus data" role="status"><div/><div/><div/><span>Loading your workspace</span></div>:<div className="view-content" key={view}>
        {overview&&<><Metrics items={metrics}/>{user.role==='admin'?<><div className="overview-grid"><Panel title="Campus parking" description="An overview of the spaces available across campus" action={<button className="text-button" onClick={()=>navigate('parking')}>View zones <Icon name="diagonal" size={15}/></button>}><Parking zones={zones} compact/></Panel><Panel title="Gate activity" description="Latest recorded movements" action={<span className="count-label">{logs.length} records</span>}><Activity logs={logs}/><button className="panel-link" onClick={()=>navigate('reports')}>Open activity report<Icon name="arrow"/></button></Panel></div><Panel title="Vehicle registry" description="Registered vehicles and their current location" action={<button className="text-button" onClick={()=>navigate('vehicles')}>View all vehicles<Icon name="arrow" size={15}/></button>}><VehicleRegistry vehicles={vehicles.slice(0,5)} compact/><div className="panel-footer"><span>{vehicles.length} registered vehicles</span><span>Campus access registry</span></div></Panel></>:user.role==='security'?<><div className="overview-grid security-grid"><GateConsole onRecorded={refresh}/><Panel title="Latest movements" description="The most recent gate records"><Activity logs={logs} limit={5}/><button className="panel-link" onClick={()=>navigate('logs')}>View entry & exit logs<Icon name="arrow"/></button></Panel></div><Panel title="Campus parking" description="Space availability for arriving vehicles"><Parking zones={zones} compact/></Panel></>:<><div className="student-grid">{vehicles[0]?<VehiclePass vehicle={vehicles[0]} user={user} onHistory={()=>navigate('history')}/>:<Panel title="My vehicle"><Empty title="No vehicle registered">Ask your campus administrator to link your vehicle to your account.</Empty></Panel>}<Panel title="Student parking" description="Your campus parking zone"><StudentParking zone={zones.find(z=>z.id==='C')} onView={()=>navigate('parking')}/></Panel></div><div className="overview-grid"><Panel title="Your recent activity" description="The latest movements for your vehicle"><Activity logs={logs}/><button className="panel-link" onClick={()=>navigate('history')}>View travel history<Icon name="arrow"/></button></Panel><Panel title="Your campus account" description="Registration details"><AccountDetails user={user}/></Panel></div></>}</>}
        {view==='vehicles'&&<Panel title="Registered vehicles" description={`${vehicles.length} vehicles in the registry`}><div className="table-tools"><label className="search-field"><Icon name="search"/><input aria-label="Search registered vehicles" placeholder="Search plate, owner or department" value={search} onChange={e=>setSearch(e.target.value)}/></label><span className="count-label">{filtered.length} results</span></div>{showAdd&&<RegisterForm onCancel={()=>setShowAdd(false)} onSaved={async()=>{setShowAdd(false);setNotice('Vehicle registered successfully');await refresh()}}/>}<VehicleRegistry vehicles={filtered}/></Panel>}
        {view==='parking'&&<Panel title="Parking availability" description="Select a zone to inspect its available spaces"><Parking zones={zones} initialZone={user.role==='student'?'C':'A'}/></Panel>}
        {view==='scan'&&<GateConsole onRecorded={refresh}/>}
        {(view==='logs'||view==='history')&&<Panel title={view==='history'?'Your travel history':'Gate movement log'} description="Recorded movements from the loaded history"><LogTable logs={logs}/></Panel>}
        {view==='reports'&&<><Panel title="Movement across the day" description="Today’s loaded gate records, grouped into two-hour intervals (IST)"><MovementChart logs={today}/></Panel><Panel title="Entry & exit records"><LogTable logs={logs}/></Panel></>}
        {view==='vehicle'&&(vehicles.length?vehicles.map(vehicle=><VehiclePass key={vehicle.id} vehicle={vehicle} user={user} onHistory={()=>navigate('history')}/>):<Empty title="No vehicle registered">Contact your campus administrator to register a vehicle.</Empty>)}
        {view==='settings'&&<div className="settings-grid"><Panel title="Your account" description="Details associated with your campus account"><AccountDetails user={user}/></Panel><Panel title="Workspace" description="About this environment"><div className="settings-line"><span>Appearance</span><strong>Dark</strong></div><div className="settings-line"><span>Time zone</span><strong>India Standard Time</strong></div><div className="settings-line"><span>Data source</span><strong>{demoEnabled?'Demo · Sample records':'Campus API'}</strong></div><p className="settings-note">{demoEnabled?'Preview changes last for this session and reset on refresh.':'Contact your campus administrator to update your account.'}</p><Button icon="exit" onClick={onLogout}>Sign out of workspace</Button></Panel></div>}
      </div>}
      <footer className="workspace-footer"><span>AccessGrid <i/> Campus vehicle management</span><span>{demoEnabled?'Demo workspace':'FISAT campus'} <Icon name="shield" size={14}/></span></footer></div>
    </main>
  </div>
}

function AccountDetails({user}) {return <dl className="account-details">{[['Name',user.name],['Department',user.department],['Username',user.username],['Role',user.role],...(user.studentId?[['Student ID',user.studentId]]:[])].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value||'Not specified'}</dd></div>)}</dl>}
function StudentParking({zone,onView}) {if(!zone)return <Empty title="Student parking not configured">Check with campus security for parking guidance.</Empty>;return <div className="student-parking"><div className="student-zone-symbol"><Icon name="parking" size={48}/><span>Zone {zone.id}</span></div><div><strong>{zone.capacity-zone.occupied}<span> spaces available</span></strong><p>{zone.occupied} of {zone.capacity} spaces occupied</p></div><button className="panel-link" onClick={onView}>Explore campus parking<Icon name="arrow"/></button></div>}
function RegisterForm({onCancel,onSaved}) {
  const [form,setForm]=useState({plate:'',owner:'',department:'',type:'Staff'});const [busy,setBusy]=useState(false);const [error,setError]=useState('')
  async function submit(e){e.preventDefault();setBusy(true);setError('');try{await addVehicle({...form,plate:form.plate.trim().toUpperCase(),owner:form.owner.trim(),department:form.department.trim()});await onSaved()}catch(err){setError(err.response?.data?.error||'Registration failed. Check your connection and try again.')}finally{setBusy(false)}}
  return <form className="register-form" onSubmit={submit}><div className="register-title"><h3>Register a vehicle</h3><button type="button" className="icon-button" aria-label="Close registration form" onClick={onCancel}><Icon name="close"/></button></div><div className="form-grid">{[['plate','Plate number','KL-07-AB-1234',20],['owner','Owner name','Full name',64],['department','Department','Department name',64]].map(([key,label,placeholder,maxLength])=><label className="field" key={key}>{label}<input required maxLength={maxLength} value={form[key]} placeholder={placeholder} onChange={e=>setForm({...form,[key]:e.target.value})}/></label>)}<label className="field">Category<select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{['Staff','HOD','Principal','Student','Visitor'].map(type=><option key={type}>{type}</option>)}</select></label></div>{error&&<Notice error>{error}</Notice>}<div className="form-actions"><Button type="button" onClick={onCancel}>Cancel</Button><Button type="submit" variant="primary" icon="plus" disabled={busy}>{busy?'Registering…':'Register vehicle'}</Button></div></form>
}
function MovementChart({logs}) {
  const buckets=Array.from({length:12},(_,i)=>{const entries=logs.filter(l=>Number(parseTime(l.timestamp).toLocaleTimeString('en-GB',{hour:'2-digit',hour12:false,timeZone:'Asia/Kolkata'}))>=i*2&&Number(parseTime(l.timestamp).toLocaleTimeString('en-GB',{hour:'2-digit',hour12:false,timeZone:'Asia/Kolkata'}))<i*2+2);return {label:String(i*2).padStart(2,'0'),entry:entries.filter(l=>l.action==='entry').length,exit:entries.filter(l=>l.action==='exit').length}})
  const max=Math.max(1,...buckets.flatMap(b=>[b.entry,b.exit]))
  return <><div className="chart-legend"><span><i/>Entries</span><span><i/>Exits</span></div><div className="movement-chart">{buckets.map(b=><div className="chart-bucket" key={b.label} aria-label={`${b.label}:00: ${b.entry} entries, ${b.exit} exits`}><div className="chart-values"><span>{b.entry}</span><span>{b.exit}</span></div><div className="bar-pair"><span style={{height:`${b.entry/max*100}%`}}/><span style={{height:`${b.exit/max*100}%`}}/></div><span>{b.label}:00</span></div>)}</div></>
}
