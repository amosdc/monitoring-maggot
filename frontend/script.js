// Configuration
const BACKEND_URL = 'http://localhost:3001'; // Ganti dengan URL Railway nanti (misal: 'https://xxx.up.railway.app')

// DOM Elements
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const tempValue = document.getElementById('temp-value');
const humValue = document.getElementById('hum-value');
const deviceId = document.getElementById('device-id');
const lastUpdated = document.getElementById('last-updated');
const alertsList = document.getElementById('alerts-list');

// Initialize Socket.IO
const socket = io(BACKEND_URL);

// Socket Event: Connect
socket.on('connect', () => {
  statusIndicator.classList.add('connected');
  statusText.innerText = 'Connected';
  statusText.style.color = 'var(--accent-green)';
});

// Socket Event: Disconnect
socket.on('disconnect', () => {
  statusIndicator.classList.remove('connected');
  statusText.innerText = 'Disconnected';
  statusText.style.color = 'var(--accent-red)';
});

// Socket Event: Receive Data
socket.on('sensor_data', (data) => {
  updateDashboard(data);
});

// Fetch Latest Data on Load
async function fetchLatestData() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/latest`);
    if (response.ok) {
      const data = await response.json();
      if (data && data.temp !== undefined) {
        updateDashboard(data);
      }
    }
  } catch (error) {
    console.error('Failed to fetch latest data:', error);
  }
}

// Update DOM logic
function updateDashboard(data) {
  // Add animation class
  tempValue.classList.remove('updating');
  humValue.classList.remove('updating');
  
  // Force reflow
  void tempValue.offsetWidth;
  
  // Update values
  tempValue.innerText = data.temp.toFixed(1);
  humValue.innerText = data.hum.toFixed(1);
  
  tempValue.classList.add('updating');
  humValue.classList.add('updating');

  // Update meta
  deviceId.innerText = data.device_id || 'Unknown';
  
  // Format Date
  const date = new Date(data.timestamp || Date.now());
  lastUpdated.innerText = date.toLocaleString();

  // Update Alerts
  alertsList.innerHTML = '';
  if (data.alerts && data.alerts.length > 0) {
    data.alerts.forEach(alert => {
      const li = document.createElement('li');
      li.innerText = alert;
      alertsList.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.className = 'no-alerts';
    li.innerText = 'No active alerts';
    alertsList.appendChild(li);
  }
}

// Initial Fetch
fetchLatestData();
