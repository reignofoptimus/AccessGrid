import { useState } from 'react'
import CampusMap from './CampusMap'
export default function ParkingZones({ zones, compact, showRestricted, studentZone }) {
  const [selected, setSelected] = useState(studentZone || null)
  const capacity = zones.reduce((sum, z) => sum + z.capacity, 0)
  const occupied = zones.reduce((sum, z) => sum + z.occupied, 0)
  return <div className={`parking-zones ${compact ? 'compact' : ''}`}>
    <div className="parking-total"><div><strong>{capacity - occupied}</strong><span>spaces available</span></div><span>{occupied} / {capacity} occupied</span></div>
    <CampusMap zones={zones} selected={selected} onSelect={setSelected} />
    <div className="parking-zone-list">{zones.map(zone => <button className={`parking-zone-row ${selected === zone.id ? 'selected' : ''}`} key={zone.id} onClick={() => setSelected(zone.id)} aria-pressed={selected === zone.id}>
      <span className="zone-letter">{zone.id}</span>
      <span className="zone-description"><strong>{zone.label}</strong><span>{zone.restricted && showRestricted ? 'Restricted access' : studentZone === zone.id ? 'Student zone' : `${zone.occupied} of ${zone.capacity} occupied`}</span></span>
      <span className="zone-free"><strong>{zone.capacity - zone.occupied}</strong><span>free</span></span>
      <span className="zone-meter"><span style={{ transform: `scaleX(${zone.capacity ? Math.min(1, zone.occupied / zone.capacity) : 0})` }} /></span>
    </button>)}</div>
    {!zones.length && <p className="empty-state">No parking zones available</p>}
  </div>
}
