import axios from 'axios';
import { demoEnabled, demoAdapter } from './demo';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 120000, // Allow the Render free service to wake; never auto-replay mutations.
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Cookies authenticate the server; browser-stored profile data never grants access.
API.interceptors.request.use(async config => {
  if (demoEnabled) config.adapter = demoAdapter;
  if (!demoEnabled && !['get','head','options'].includes((config.method || 'get').toLowerCase())) {
    const { data } = await API.get('/auth/csrf');
    config.headers['X-CSRF-Token'] = data.csrfToken;
  }
  return config;
});
API.interceptors.response.use(response => response, error => {
  if (!demoEnabled && error.response?.status === 401 && error.config?.url !== '/auth/login') {
    window.dispatchEvent(new Event('accessgrid:unauthorized'));
  }
  return Promise.reject(error);
});
export const getCurrentUser = (config) => API.get('/auth/me', config);
export const logout = () => demoEnabled ? Promise.resolve() : API.post('/auth/logout');

// ── Auth ──────────────────────────────────────────────
export const login = (username, password) =>
  API.post('/auth/login', { username, password });

export const register = (data) =>
  API.post('/auth/register', data);

// ── Vehicles ──────────────────────────────────────────
export const getVehicles = () =>
  API.get('/vehicles');

export const addVehicle = (data) =>
  API.post('/vehicles', data);

export const getVehicleByPlate = async (plate) => {
  // The supplied backend exposes the registry, but no per-plate endpoint.
  const response = await getVehicles();
  const normalize = value => value.replace(/[^a-z0-9]/gi, '').toUpperCase();
  const vehicle = response.data.find(item => normalize(item.plate) === normalize(plate));
  if (!vehicle) throw Object.assign(new Error('Vehicle not found'), { response: { status: 404, data: { error: 'Vehicle not found' } } });
  return { ...response, data: vehicle };
};

// ── Gate ───────────────────────────────────────────────
export const scanVehicle = (formData) =>
  API.post('/gate/scan', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const recordEntry = (data) =>
  API.post('/gate/entry', data);

export const recordExit = (data) =>
  API.post('/gate/exit', data);

export const getEntryLogs = (params = {}) =>
  API.get('/gate/logs', { params });

// ── Parking ───────────────────────────────────────────
export const getParkingZones = () =>
  API.get('/parking/zones');

// ── Stats ─────────────────────────────────────────────
export const getStats = (role) =>
  API.get('/stats', { params: { role } });

// ── ANPR ──────────────────────────────────────────────
export const detectPlate = async (file) => {
  if (demoEnabled) throw new Error('Image recognition needs the live backend. Enter a plate manually in this demo.');

  const formData = new FormData();
  formData.append("image", file);

  const response = await API.post('/anpr',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

  return response.data.plate;
};

export default API;
