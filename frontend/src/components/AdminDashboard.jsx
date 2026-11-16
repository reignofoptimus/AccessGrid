import { useState, useEffect } from 'react'
import { getVehicles, addVehicle, getParkingZones, getStats, getEntryLogs } from '../api/api'
import Sidebar from './Sidebar'
import StatsCard from './StatsCard'
import VehicleTable from './VehicleTable'
import ParkingZones from './ParkingZones'
import './Dashboard.css'
import Reports from './Reports'

const AdminDashboard = ({ user, onLogout, theme, toggleTheme }) => {
    const [activeView, setActiveView] = useState('overview')
    const [showAddVehicle, setShowAddVehicle] = useState(false)
    const [newVehicle, setNewVehicle] = useState({ plate: '', type: 'Staff', owner: '', department: '' })
    const [stats, setStats] = useState([])
    const [registeredVehicles, setRegisteredVehicles] = useState([])
    const [parkingZones, setParkingZones] = useState([])
    const [loading, setLoading] = useState(true)
    const [logs, setLogs] = useState([])
    const [search, setSearch] = useState('')
    const filteredVehicles = registeredVehicles.filter(v => [v.plate, v.owner, v.department].some(value => value?.toLowerCase().includes(search.toLowerCase())))

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [vehiclesRes, zonesRes, statsRes, logsRes] = await Promise.all([
                getVehicles(),
                getParkingZones(),
                getStats('admin'),
                getEntryLogs({ limit: 1000 }),
            ])
            setRegisteredVehicles(vehiclesRes.data)
            setParkingZones(zonesRes.data)
            setStats(statsRes.data)
            setLogs(logsRes.data)
        } catch (err) {
            console.error('Failed to fetch data:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleAddVehicle = async (e) => {
        e.preventDefault()
        try {
            await addVehicle(newVehicle)
            setNewVehicle({ plate: '', type: 'Staff', owner: '', department: '' })
            setShowAddVehicle(false)
            // Refresh vehicles & stats
            const [vehiclesRes, statsRes] = await Promise.all([getVehicles(), getStats('admin')])
            setRegisteredVehicles(vehiclesRes.data)
            setStats(statsRes.data)
        } catch (err) {
            console.error('Failed to add vehicle:', err)
            alert(err.response?.data?.error || 'Failed to add vehicle')
        }
    }

    const menuItems = [
        { id: 'overview', label: 'Overview', icon: 'grid' },
        { id: 'vehicles', label: 'Registered vehicles', icon: 'car' },
        { id: 'parking', label: 'Parking zones', icon: 'parking' },
        { id: 'reports', label: 'Reports', icon: 'chart' },
        { id: 'settings', label: 'Settings', icon: 'settings' },
    ]

    return (
        <div className="dashboard">
            <Sidebar
                menuItems={menuItems}
                activeView={activeView}
                setActiveView={setActiveView}
                onLogout={onLogout}
                theme={theme}
                toggleTheme={toggleTheme}
                user={user}
            />

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div className="header-left"><span className="context-label">Workspace / Administration</span>
                        <h1 className="page-title">
                            {activeView === 'overview' && 'Campus overview'}
                            {activeView === 'vehicles' && 'Registered vehicles'}
                            {activeView === 'parking' && 'Parking management'}
                            {activeView === 'reports' && 'Reports & analytics'}
                            {activeView === 'settings' && 'Settings'}
                        </h1>
                        <p className="page-subtitle">
                            Vehicle access and parking across FISAT campus
                        </p>
                    </div>
                    <div className="header-right">
                        <div className="search-box">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
                            </svg>
                            <input type="search" aria-label="Search vehicles" placeholder="Search vehicles" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <div className="user-avatar">
                            <span>AD</span>
                        </div>
                    </div>
                </header>

                <div className="dashboard-content fade-in">
                    {loading && <p className="loading-state" role="status">Loading campus data?</p>}
                    {activeView === 'overview' && (
                        <>
                            <section className="stats-section">
                                {stats.map((stat, index) => (
                                    <StatsCard key={index} {...stat} />
                                ))}
                            </section>

                            <div className="main-grid">
                                <section className="vehicle-section">
                                    <div className="section-header">
                                        <h2>Vehicle registry</h2>
                                        <button className="view-all-btn" onClick={() => setActiveView('vehicles')}>
                                            View registry
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                    </div>
                                    <p className="section-description">Registered vehicles and their access status</p><VehicleTable vehicles={filteredVehicles.slice(0, 5)} showDepartment /><div className="table-footer"><span>{filteredVehicles.length} registered vehicles</span><span>FISAT campus registry</span></div>
                                </section>

                                <section className="activity-section">
                                    <div className="section-header">
                                        <h2>Parking availability</h2>
                                    </div>
                                    <ParkingZones zones={parkingZones} compact />
                                </section>
                            </div>
                        </>
                    )}

                    {activeView === 'vehicles' && (
                        <section className="full-section">
                            <div className="section-header">
                                <h2>Registered vehicles</h2>
                                <button className="add-btn" onClick={() => setShowAddVehicle(true)}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                                    </svg>
                                    Add vehicle
                                </button>
                            </div>

                            {showAddVehicle && (
                                <div className="add-vehicle-form slide-up">
                                    <h3>Register a vehicle</h3>
                                    <form onSubmit={handleAddVehicle}>
                                        <div className="form-grid">
                                            <div className="form-group">
                                                <label>Plate number</label>
                                                <input
                                                    type="text"
                                                    placeholder="KL-XX-AB-1234"
                                                    value={newVehicle.plate}
                                                    onChange={(e) => setNewVehicle({ ...newVehicle, plate: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Type</label>
                                                <select
                                                    value={newVehicle.type}
                                                    onChange={(e) => setNewVehicle({ ...newVehicle, type: e.target.value })}
                                                >
                                                    <option value="Staff">Staff</option>
                                                    <option value="HOD">HOD</option>
                                                    <option value="Principal">Principal</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Owner name</label>
                                                <input
                                                    type="text"
                                                    placeholder="Full name"
                                                    value={newVehicle.owner}
                                                    onChange={(e) => setNewVehicle({ ...newVehicle, owner: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label>Department</label>
                                                <input
                                                    type="text"
                                                    placeholder="Department"
                                                    value={newVehicle.department}
                                                    onChange={(e) => setNewVehicle({ ...newVehicle, department: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="form-actions">
                                            <button type="button" className="cancel-btn" onClick={() => setShowAddVehicle(false)}>Cancel</button>
                                            <button type="submit" className="submit-btn">Register vehicle</button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <VehicleTable vehicles={filteredVehicles} showDepartment expanded />
                        </section>
                    )}

                    {activeView === 'parking' && (
                        <section className="full-section">
                            <div className="section-header">
                                <h2>Parking Zone Management</h2>
                            </div>
                            <ParkingZones zones={parkingZones} />
                        </section>
                    )}

                    {activeView === 'reports' && (
                        <section className="full-section">
                            <div className="section-header">
                                <h2>Reports</h2>
                            </div>
                            <Reports vehicles={registeredVehicles} logs={logs} />
                        </section>
                    )}

                    {activeView === 'settings' && (
                        <section className="full-section">
                            <div className="section-header">
                                <h2>System settings</h2>
                            </div>
                            <div className="settings-content">
                                <div className="settings-group">
                                    <h3>Appearance</h3>
                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <span className="setting-label">Dark mode</span>
                                            <span className="setting-desc">Toggle between light and dark themes</span>
                                        </div>
                                        <button
                                            aria-label="Dark mode" aria-pressed={theme === 'dark'} className={`toggle-switch ${theme === 'dark' ? 'active' : ''}`}
                                            onClick={toggleTheme}
                                        >
                                            <span className="toggle-knob"></span>
                                        </button>
                                    </div>
                                </div>
                                <div className="settings-group">
                                    <h3>Notifications</h3>
                                    <div className="setting-item">
                                        <div className="setting-info">
                                            <span className="setting-label">New vehicle alerts</span>
                                            <span className="setting-desc">Get notified when new vehicles are registered</span>
                                        </div>
                                        <button className="toggle-switch" disabled aria-label="Setting not connected" title="This setting is not connected yet">
                                            <span className="toggle-knob"></span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </div>
    )
}

export default AdminDashboard
