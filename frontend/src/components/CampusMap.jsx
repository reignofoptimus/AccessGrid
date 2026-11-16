// A zone diagram, not a geographic map of the campus.
export default function CampusMap({ zones = [], selected, onSelect }) {
  const positions = [[44, 40], [252, 40], [44, 188], [252, 188]];
  return <div className="campus-map">
    <div className="map-caption"><span>Campus parking</span><span>Zone schematic</span></div>
    <svg viewBox="0 0 460 340" role="img" aria-label="Schematic of campus parking zones A through D, connected by an access lane">
      <rect className="map-ground" width="460" height="340" rx="12" />
      <path className="map-road" d="M0 164H460M230 0V340" />
      <path className="map-road-line" d="M0 164H460M230 0V340" />
      {positions.map(([x, y], i) => {
        const zone = zones[i];
        const id = zone?.id || String.fromCharCode(65 + i);
        const occupied = zone ? Math.round(zone.occupied / Math.max(1, zone.capacity) * 12) : 0;
        return <g key={id} className={`map-zone ${selected === id ? 'selected' : ''}`}>
          <rect x={x} y={y} width="164" height="108" rx="6" />
          <text x={x + 12} y={y + 26} className="map-zone-letter">{id}</text>
          <text x={x + 40} y={y + 25}>{zone?.label?.replace(' Parking', '') || 'Parking'}</text>
          {Array.from({ length: 12 }, (_, spot) => <rect key={spot} className={`map-space ${spot < occupied ? 'occupied' : ''}`} x={x + 12 + (spot % 6) * 24} y={y + 40 + Math.floor(spot / 6) * 28} width="16" height="20" rx="2" />)}
        </g>;
      })}
      <path className="map-direction" d="M224 310l6-8 6 8M230 302v22" />
    </svg>
    {onSelect && <div className="map-controls" aria-label="Select parking zone">{zones.map(zone => <button key={zone.id} onClick={() => onSelect(zone.id)} aria-pressed={selected === zone.id}>Zone {zone.id}</button>)}</div>}
    <div className="map-legend"><span><i />Occupied</span><span><i />Available</span><span>Not to scale</span></div>
  </div>;
}
