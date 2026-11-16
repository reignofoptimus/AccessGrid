import { useState } from 'react'
import { Badge, Empty } from './shared'
import Icon from './Icon'

export default function Parking({zones, compact=false, initialZone='A'}) {
  const [selected,setSelected] = useState(initialZone)
  if (!zones.length) return <Empty title="Parking zones are not available">Your campus administrator can configure parking zones.</Empty>
  const active=zones.find(z=>z.id===selected) || zones[0]
  const free=zones.reduce((sum,z)=>sum+Math.max(0,z.capacity-z.occupied),0)
  const positions=[[56,48],[360,48],[56,234],[360,234]]
  return <div className={`parking-view ${compact?'parking-compact':''}`}>
    <div className="parking-top"><Badge tone="positive">{free} spaces available</Badge><span>Zone schematic · Not to scale</span></div>
    <div className="parking-canvas">
      <svg viewBox="0 0 650 420" role="img" aria-label={`Campus parking schematic. Selected zone ${active.id}, ${active.capacity-active.occupied} available spaces.`}>
        <defs><pattern id="lotLines" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="currentColor" strokeWidth=".4"/></pattern></defs>
        <rect width="650" height="420" fill="url(#lotLines)" className="map-grid"/>
        <path d="M0 210H650M325 0V420" className="campus-road"/>
        <path d="M0 210H650M325 0V420" className="campus-road-centre"/>
        <path d="m319 386 6-8 6 8m-6-8v24M18 204l8 6-8 6m8-6H4" className="map-arrow"/>
        {zones.slice(0,4).map((zone,i)=>{const [x,y]=positions[i];const count=Math.round(zone.occupied/Math.max(1,zone.capacity)*18);return <g key={zone.id} className={`lot ${active.id===zone.id?'lot-active':''}`}>
          <rect x={x} y={y} width="232" height="138" rx="8" className="lot-surface"/>
          <text x={x+16} y={y+28} className="lot-title">{zone.id}</text><text x={x+42} y={y+27} className="lot-name">{zone.label.replace(' Parking','')}</text>
          {Array.from({length:18},(_,n)=><g key={n}><path className="bay-outline" d={`M${x+14+(n%9)*23} ${y+48+Math.floor(n/9)*46}v30h19v-30`}/>{n<count && <rect className="bay-car" x={x+18+(n%9)*23} y={y+50+Math.floor(n/9)*46} width="11" height="24" rx="3"/>}</g>)}
        </g>})}
        <text x="336" y="409" className="map-entry-label">Access lane</text>
      </svg>
      <div className="map-compass"><Icon name="arrow" size={16}/><span>N</span></div>
      <div className="map-key"><span><i/>Occupied</span><span><i/>Available</span></div>
    </div>
    <div className="zone-tabs" aria-label="Select a parking zone">{zones.map(zone=><button key={zone.id} className={active.id===zone.id?'selected':''} onClick={()=>setSelected(zone.id)} aria-pressed={active.id===zone.id}><span className="zone-id">{zone.id}</span><span><strong>{zone.label.replace(' Parking','')}</strong><small>{zone.capacity-zone.occupied} available</small></span><Icon name="diagonal" size={14}/></button>)}</div>
    {!compact && <div className="zone-detail"><div><h3>{active.name} · {active.label}</h3><p>{active.restricted?'Restricted access — check with campus security':'Campus parking zone'}</p></div><span>{active.occupied} occupied <span className="muted">/ {active.capacity} spaces</span></span></div>}
  </div>
}
