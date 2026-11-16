import { Fragment, useState } from 'react'
export default function VehicleTable({ vehicles, expanded, showDepartment, showVerified }) {
  const [open, setOpen] = useState(null)
  const columns = 5 + Number(!!showVerified) + Number(!!expanded)
  return <div className="vehicle-table-wrapper"><table className="vehicle-table">
    <thead><tr><th>Vehicle plate</th><th>Type</th><th>Owner</th>{showDepartment && <th>Department</th>}<th>Status</th>{!showDepartment && <th>Time</th>}{showVerified && <th>Verified</th>}{expanded && <th><span className="sr-only">Details</span></th>}</tr></thead>
    <tbody>{vehicles.map(vehicle => <Fragment key={vehicle.id}><tr>
      <td className="plate-cell"><code>{vehicle.plate}</code></td><td><span className="vehicle-type">{vehicle.type}</span></td><td>{vehicle.owner}</td>
      {showDepartment && <td className="dept-cell">{vehicle.department || '—'}</td>}
      <td><span className={`status-badge ${vehicle.status}`}>{({inside: 'Inside', exited: 'Exited', active: 'Active', inactive: 'Inactive', pending: 'Pending'})[vehicle.status] || vehicle.status}</span></td>
      {!showDepartment && <td className="time-cell">{vehicle.time || '—'}</td>}
      {showVerified && <td><span className="verification-text">{vehicle.verified ? 'Yes' : 'No'}</span></td>}
      {expanded && <td><button className="table-detail-button" aria-label={`Details for ${vehicle.plate}`} aria-expanded={open === vehicle.id} onClick={() => setOpen(open === vehicle.id ? null : vehicle.id)}>{open === vehicle.id ? '−' : '+'}</button></td>}
    </tr>{open === vehicle.id && <tr className="vehicle-detail-row"><td colSpan={columns}>{vehicle.plate} · {vehicle.owner} · {vehicle.department || vehicle.type}{vehicle.isInside !== undefined && ` · ${vehicle.isInside ? 'Inside campus' : 'Outside campus'}`}</td></tr>}</Fragment>)}
    {!vehicles.length && <tr><td colSpan={columns} className="empty-state">No vehicles to display</td></tr>}</tbody>
  </table></div>
}
