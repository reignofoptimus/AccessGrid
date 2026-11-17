// Public showcase uses isolated sample data. It never grants a server session.
const selectedDemo = new URLSearchParams(window.location.search).get('demo');
export let demoEnabled = ['admin', 'security', 'student'].includes(selectedDemo);
export const demoUsers = {
  admin: { id: 1, username: 'admin', role: 'admin', name: 'Sample Administrator', department: 'Administration' },
  security: { id: 2, username: 'security', role: 'security', name: 'Sample Security Operator', department: 'Security' },
  student: { id: 3, username: 'student', role: 'student', name: 'Sample Student', department: 'Computer Science', studentId: 'DEMO-STUDENT-001' },
};
export let demoUser = demoEnabled ? demoUsers[selectedDemo] : null;

let vehicles = [
  { id: 1, plate: 'KL-07-AB-1234', type: 'Staff', owner: 'Sample Administrator', ownerId: 1, department: 'Computer Science', status: 'active', isInside: true },
  { id: 2, plate: 'KL-07-CD-5678', type: 'Staff', owner: 'Sample Staff One', department: 'Electronics', status: 'active', isInside: true },
  { id: 3, plate: 'KL-08-EF-9012', type: 'Staff', owner: 'Sample Staff Two', department: 'Mechanical', status: 'active', isInside: false },
  { id: 4, plate: 'KL-09-IJ-7890', type: 'HOD', owner: 'Sample Department Head', department: 'Computer Science', status: 'active', isInside: false },
  { id: 5, plate: 'KL-07-ST-4521', type: 'Student', owner: 'Sample Student', ownerId: 3, department: 'Computer Science', status: 'active', isInside: true },
];
const zones = [
  { id: 'A', name: 'Zone A', label: 'Staff Parking', capacity: 50, occupied: 38, restricted: false, color: '#22c55e' },
  { id: 'B', name: 'Zone B', label: 'Faculty Parking', capacity: 30, occupied: 24, restricted: false, color: '#6366f1' },
  { id: 'C', name: 'Zone C', label: 'Student Parking', capacity: 100, occupied: 72, restricted: false, color: '#f59e0b' },
  { id: 'D', name: 'Zone D', label: 'Visitor Parking', capacity: 20, occupied: 8, restricted: true, color: '#8b5cf6' },
];
const makeLog = (vehicle, action, minutes, id) => ({ id, vehicleId: vehicle.id, plate: vehicle.plate, owner: vehicle.owner, type: vehicle.type, action, gate: 'Main Gate', timestamp: new Date(Date.now() - minutes * 60000).toISOString() });
let logs = [makeLog(vehicles[4], 'entry', 20, 5), makeLog(vehicles[2], 'exit', 45, 4), makeLog(vehicles[1], 'entry', 60, 3), makeLog(vehicles[0], 'entry', 90, 2), makeLog(vehicles[2], 'entry', 180, 1)];
const normalize = plate => plate.replace(/[^a-z0-9]/gi, '').toUpperCase();
const stat = (title, value, icon) => ({ title, value: String(value), icon, change: '', trend: 'neutral' });
const initialVehicles = structuredClone(vehicles);
const initialLogs = structuredClone(logs);

export function enterDemo(role) {
  if (!Object.hasOwn(demoUsers, role)) throw new Error('Choose Admin, Security, or Student.');
  vehicles = structuredClone(initialVehicles);
  logs = structuredClone(initialLogs);
  demoEnabled = true;
  demoUser = demoUsers[role];
  return demoUser;
}

export function leaveDemo() {
  demoEnabled = false;
  demoUser = null;
}

export async function demoAdapter(config) {
  const path = config.url.replace(/\/$/, '');
  const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {};
  let data;
  const fail = (message, status = 400) => { throw Object.assign(new Error(message), { response: { data: { error: message }, status } }); };
  if (path === '/auth/login') {
    const user = demoUsers[body.username];
    if (!user) fail('Invalid sample role', 401);
    data = user;
  } else if (path === '/vehicles' && config.method === 'post') {
    if (!body.plate?.trim() || !body.owner?.trim() || !body.type) fail('Plate, owner and type are required');
    if (vehicles.some(v => normalize(v.plate) === normalize(body.plate))) fail('Plate number already registered', 409);
    data = { ...body, id: vehicles.length + 1, status: 'active', isInside: false };
    vehicles = [...vehicles, data];
  } else if (path === '/vehicles') {
    data = vehicles;
  } else if (path.startsWith('/vehicles/')) {
    data = vehicles.find(v => normalize(v.plate) === normalize(decodeURIComponent(path.slice(10))));
    if (!data) fail('Vehicle not found', 404);
  } else if (path === '/parking/zones') {
    data = zones;
  } else if (path === '/gate/logs') {
    data = logs.filter(log => !config.params?.vehicle_id || log.vehicleId === config.params.vehicle_id).slice(0, config.params?.limit || 50);
  } else if (path === '/gate/entry' || path === '/gate/exit') {
    if (!body.plate?.trim()) fail('Plate is required');
    let vehicle = vehicles.find(v => normalize(v.plate) === normalize(body.plate));
    if (!vehicle && path.endsWith('exit')) fail('Vehicle not found', 404);
    if (!vehicle) {
      vehicle = { id: vehicles.length + 1, plate: body.plate, type: body.type || 'Visitor', owner: body.owner || 'Guest', status: 'active' };
      vehicles.push(vehicle);
    }
    vehicle.isInside = path.endsWith('entry');
    const log = makeLog(vehicle, vehicle.isInside ? 'entry' : 'exit', 0, logs.length + 1);
    logs = [log, ...logs];
    data = { message: 'Demo activity recorded', log };
  } else if (path === '/stats') {
    const inside = vehicles.filter(v => v.isInside).length;
    if (config.params?.role === 'security') {
      data = [stat('Vehicles Inside', inside, 'car'), stat('Entries Today', logs.filter(l => l.action === 'entry').length, 'entry'), stat('Exits Today', logs.filter(l => l.action === 'exit').length, 'exit'), stat('Pending Scans', 0, 'alert')];
    } else if (config.params?.role === 'student') {
      const vehicle = vehicles.find(v => v.ownerId === 3);
      data = [stat('Total Visits', logs.filter(l => l.vehicleId === vehicle.id && l.action === 'entry').length, 'car'), stat('Avg. Duration', '-', 'clock'), stat('Late Entries', 0, 'alert'), stat('Current Status', vehicle.isInside ? 'Inside' : 'Outside', 'check')];
    } else {
      data = [stat('Total Registered', vehicles.length, 'car'), stat('Staff Vehicles', vehicles.filter(v => v.type === 'Staff').length, 'users'), stat('Parking Capacity', '71%', 'parking'), stat('Active Sessions', inside, 'clock')];
    }
  } else {
    fail('This feature requires the live backend. Use manual plate entry in the demo.');
  }
  return { data: structuredClone(data), status: 200, statusText: 'OK', headers: {}, config };
}
