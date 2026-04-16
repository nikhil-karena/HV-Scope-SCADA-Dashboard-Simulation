// --- DOM Elements ---
const timestampEl = document.getElementById('timestamp');
const breaker1Btn = document.getElementById('breaker1-btn');
const breaker2Btn = document.getElementById('breaker2-btn');

const elements = {
    wind: {
        power: document.getElementById('wind-power'),
        voltage: document.getElementById('wind-voltage'),
        status: document.getElementById('wind-status')
    },
    substation: {
        voltage: document.getElementById('sub-voltage'),
        status: document.getElementById('sub-status')
    }
};

// --- State Variables ---
let breaker1Closed = true; 
let breaker2Closed = true; 

let current = {
    windPower: 12.5, 
    windVolt: 33,   
    subVolt: 220    
};

// --- Chart Initialization ---
const ctx = document.getElementById('powerChart').getContext('2d');
const powerChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: Array(15).fill(''), 
        datasets: [{
            label: 'WT1 Generated Power (MW)',
            data: Array(15).fill(0),
            borderColor: '#00e676',
            backgroundColor: 'rgba(0, 230, 118, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointRadius: 0
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 0 }, 
        scales: {
            y: { min: 0, max: 18, grid: { color: '#333344' }, ticks: { color: '#8a8a9e' } },
            x: { grid: { display: false }, ticks: { color: '#8a8a9e' } }
        },
        plugins: { legend: { labels: { color: '#e0e0e0' } } }
    }
});

// --- Breaker Interaction Logic ---
function updateBreakerUI(btn, isClosed) {
    if (isClosed) {
        btn.textContent = "CLOSED (ON)";
        btn.className = "btn-on";
    } else {
        btn.textContent = "OPEN (OFF)";
        btn.className = "btn-off";
    }
}

breaker1Btn.addEventListener('click', () => {
    breaker1Closed = !breaker1Closed;
    updateBreakerUI(breaker1Btn, breaker1Closed);
    updateSCADA();
});

breaker2Btn.addEventListener('click', () => {
    breaker2Closed = !breaker2Closed;
    updateBreakerUI(breaker2Btn, breaker2Closed);
    updateSCADA();
});

// --- Utility Functions ---
function getGradualChange(val, min, max, maxDelta) {
    let change = (Math.random() * maxDelta * 2) - maxDelta;
    let newVal = val + change;
    return Math.max(min, Math.min(max, newVal));
}

function updateVoltageStatus(element, voltage, warningThreshold, alarmThreshold, systemOnline) {
    if (!systemOnline) {
        element.textContent = "OFFLINE";
        element.className = "status-indicator bg-off";
        return;
    }

    if (voltage > alarmThreshold) {
        element.textContent = "ALARM";
        element.className = "status-indicator bg-alarm";
    } else if (voltage >= warningThreshold) {
        element.textContent = "WARNING";
        element.className = "status-indicator bg-warning";
    } else {
        element.textContent = "OK";
        element.className = "status-indicator bg-ok";
    }
}

// --- Main Simulation Loop ---
function updateSCADA() {
    const now = new Date();
    timestampEl.textContent = `LAST UPDATED: ${now.toLocaleTimeString()}`;

    // System is only online if BOTH breakers are closed
    const systemOnline = breaker1Closed && breaker2Closed;

    if (systemOnline) {
        current.windPower = getGradualChange(current.windPower, 8, 15, 0.6);
        current.windVolt = getGradualChange(current.windVolt, 32, 35, 0.5);
        current.subVolt = getGradualChange(current.subVolt, 215, 245, 3);
    } else {
        current.windPower = 0;
        current.windVolt = 0;
        current.subVolt = 0;
    }

    elements.wind.power.textContent = current.windPower.toFixed(2);
    elements.wind.voltage.textContent = current.windVolt.toFixed(2);
    elements.substation.voltage.textContent = current.subVolt.toFixed(2);

    updateVoltageStatus(elements.wind.status, current.windVolt, 34, 34.5, systemOnline);
    updateVoltageStatus(elements.substation.status, current.subVolt, 235, 242, systemOnline);

    const timeLabel = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    powerChart.data.labels.push(timeLabel);
    powerChart.data.datasets[0].data.push(current.windPower);
    
    if (powerChart.data.labels.length > 15) {
        powerChart.data.labels.shift();
        powerChart.data.datasets[0].data.shift();
    }
    
    powerChart.update();
}

updateSCADA();
setInterval(updateSCADA, 2500);