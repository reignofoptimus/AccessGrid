const labels = { 'Total Registered': 'Registered vehicles', 'Staff Vehicles': 'Staff vehicles', 'Parking Capacity': 'Parking occupancy', 'Active Sessions': 'Vehicles on campus', 'Vehicles Inside': 'Vehicles on campus', 'Entries Today': 'Entries today', 'Exits Today': 'Exits today', 'Pending Scans': 'Pending scans', 'Total Visits': 'Campus visits', 'Avg. Duration': 'Average duration', 'Late Entries': 'Late entries', 'Current Status': 'Vehicle status' }
export default function StatsCard({ title, value, change, trend }) {
  return <div className="stats-card"><span className="stats-title">{labels[title] || title}</span><span className="stats-value">{value}</span>{change && change !== '0' && <span className={`stats-change ${trend}`}>{change}</span>}</div>
}
