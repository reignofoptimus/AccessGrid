export default function Reports({ vehicles, logs }) {
  const hours = Array.from({ length: 12 }, (_, i) => i * 2)
  const today = new Date().toDateString()
  const counts = hours.map(hour => logs.filter(log => { const date = new Date(log.timestamp); return date.toDateString() === today && date.getHours() >= hour && date.getHours() < hour + 2 }).length)
  const max = Math.max(1, ...counts)
  const types = [...new Set(vehicles.map(v => v.type))]
  return <div className="analytics-grid">
    <div className="chart-card"><h3>Gate activity today</h3><p className="chart-caption">Entry and exit events in the loaded log · 2-hour intervals</p><div className="report-bars">{counts.map((count, i) => <div className="report-bar-column" key={i}><span>{count}</span><div className="report-bar-track"><div style={{height: `${count / max * 100}%`}} /></div><span>{String(hours[i]).padStart(2, '0')}</span></div>)}</div></div>
    <div className="chart-card"><h3>Registered vehicle mix</h3><p className="chart-caption">{vehicles.length} vehicles in the registry</p><div className="report-distribution">{types.map(type => { const count = vehicles.filter(v => v.type === type).length; return <div key={type}><span>{type}</span><strong>{count}</strong><div><span style={{width: `${count / vehicles.length * 100}%`}} /></div></div> })}</div></div>
  </div>
}
