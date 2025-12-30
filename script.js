// Navigation
import { Analytics } from "@vercel/analytics/next"
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.querySelectorAll('.nav-link').forEach(navLink => {
            navLink.classList.remove('active');
        });
        
        document.getElementById(targetId).classList.add('active');
        link.classList.add('active');
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
});

// Data Storage
let appliances = JSON.parse(localStorage.getItem('appliances')) || [];
let habits = JSON.parse(localStorage.getItem('habits')) || initializeHabits();
let habitProgress = JSON.parse(localStorage.getItem('habitProgress')) || {};

function initializeHabits() {
    return [
        { id: 1, name: 'Bike/walk to work', points: 10, completed: false },
        { id: 2, name: 'Recycle plastic/paper', points: 5, completed: false },
        { id: 3, name: 'Turn off unused lights', points: 5, completed: false },
        { id: 4, name: 'Use reusable bags', points: 5, completed: false },
        { id: 5, name: 'Unplug devices', points: 5, completed: false },
        { id: 6, name: 'Take shorter shower', points: 5, completed: false },
        { id: 7, name: 'Use public transport', points: 10, completed: false },
        { id: 8, name: 'Eat plant-based meal', points: 10, completed: false }
    ];
}

// Energy Calculator
let energyChart = null;

document.getElementById('applianceForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('applianceName').value;
    const watts = parseFloat(document.getElementById('applianceWatts').value);
    const hours = parseFloat(document.getElementById('applianceHours').value);
    
    const appliance = {
        id: Date.now(),
        name,
        watts,
        hours,
        dailyKwh: (watts * hours) / 1000,
        monthlyKwh: (watts * hours * 30) / 1000
    };
    
    appliances.push(appliance);
    localStorage.setItem('appliances', JSON.stringify(appliances));
    
    displayAppliances();
    updateEnergyChart();
    displayEnergyTips();
    updateDashboard();
    
    e.target.reset();
});

function displayAppliances() {
    const list = document.getElementById('applianceList');
    list.innerHTML = '';
    
    let totalDaily = 0;
    let totalMonthly = 0;
    
    appliances.forEach(app => {
        totalDaily += app.dailyKwh;
        totalMonthly += app.monthlyKwh;
        
        const div = document.createElement('div');
        div.className = 'appliance-item';
        div.innerHTML = `
            <div class="appliance-info">
                <strong>${app.name}</strong>
                <small>${app.watts}W × ${app.hours}h/day = ${app.dailyKwh.toFixed(2)} kWh/day</small>
            </div>
            <button class="btn btn-danger" onclick="removeAppliance(${app.id})">Remove</button>
        `;
        list.appendChild(div);
    });
    
    document.getElementById('dailyTotal').textContent = `${totalDaily.toFixed(2)} kWh`;
    document.getElementById('monthlyTotal').textContent = `${totalMonthly.toFixed(2)} kWh`;
}

function removeAppliance(id) {
    appliances = appliances.filter(app => app.id !== id);
    localStorage.setItem('appliances', JSON.stringify(appliances));
    displayAppliances();
    updateEnergyChart();
    displayEnergyTips();
    updateDashboard();
}

function updateEnergyChart() {
    const canvas = document.getElementById('energyChart');
    const ctx = canvas.getContext('2d');
    
    if (energyChart) {
        energyChart.destroy();
    }
    
    if (appliances.length === 0) {
        return;
    }
    
    energyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: appliances.map(a => a.name),
            datasets: [{
                label: 'Daily Energy (kWh)',
                data: appliances.map(a => a.dailyKwh),
                backgroundColor: '#2ecc71',
                borderColor: '#27ae60',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'kWh/day' }
                }
            }
        }
    });
}

function displayEnergyTips() {
    const tipsList = document.getElementById('energyTips');
    const tips = [
        'Switch to LED bulbs to reduce lighting energy by 75%',
        'Unplug chargers and devices when not in use',
        'Use a smart power strip to eliminate phantom loads',
        'Set refrigerator to 3-5°C for optimal efficiency',
        'Run dishwasher and washing machine only when full',
        'Lower water heater temperature to 50°C'
    ];
    
    tipsList.innerHTML = tips.slice(0, 4).map(tip => `<li>${tip}</li>`).join('');
}

// Habit Tracker
function displayHabits() {
    const grid = document.getElementById('habitsGrid');
    grid.innerHTML = '';
    
    let totalPoints = 0;
    
    habits.forEach(habit => {
        if (habit.completed) totalPoints += habit.points;
        
        const div = document.createElement('div');
        div.className = `habit-item ${habit.completed ? 'completed' : ''}`;
        div.innerHTML = `
            <input type="checkbox" id="habit-${habit.id}" ${habit.completed ? 'checked' : ''} 
                   onchange="toggleHabit(${habit.id})">
            <label for="habit-${habit.id}">${habit.name}</label>
            <span class="habit-points">+${habit.points}</span>
        `;
        grid.appendChild(div);
    });
    
    document.getElementById('weeklyScore').textContent = totalPoints;
    document.getElementById('progressFill').style.width = `${Math.min((totalPoints / 70) * 100, 100)}%`;
    
    updateHabitsChart();
    updateDashboard();
}

function toggleHabit(id) {
    const habit = habits.find(h => h.id === id);
    habit.completed = !habit.completed;
    localStorage.setItem('habits', JSON.stringify(habits));
    displayHabits();
}

function resetWeek() {
    if (confirm('Reset this week\'s progress?')) {
        habits.forEach(h => h.completed = false);
        localStorage.setItem('habits', JSON.stringify(habits));
        displayHabits();
    }
}

let habitsChart = null;

function updateHabitsChart() {
    const canvas = document.getElementById('habitsChart');
    const ctx = canvas.getContext('2d');
    
    if (habitsChart) {
        habitsChart.destroy();
    }
    
    const completed = habits.filter(h => h.completed).length;
    const remaining = habits.length - completed;
    
    habitsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Remaining'],
            datasets: [{
                data: [completed, remaining],
                backgroundColor: ['#2ecc71', '#ecf0f1'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// Carbon Footprint Calculator
let carbonChart = null;

document.getElementById('carbonForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const electricity = parseFloat(document.getElementById('electricityKwh').value) || 0;
    const carKm = parseFloat(document.getElementById('carKm').value) || 0;
    const diet = parseFloat(document.getElementById('dietType').value);
    const flights = parseFloat(document.getElementById('flightHours').value) || 0;
    
    const electricityCO2 = electricity * 0.233;
    const carCO2 = carKm * 0.17;
    const dietCO2 = diet;
    const flightCO2 = flights * 90;
    
    const totalCO2 = (electricityCO2 + carCO2 + dietCO2 + flightCO2) / 1000;
    
    document.getElementById('totalCO2Result').textContent = totalCO2.toFixed(2);
    document.getElementById('carbonResults').style.display = 'block';
    
    updateCarbonChart(electricityCO2, carCO2, dietCO2, flightCO2);
    displayCarbonTips(totalCO2);
    
    localStorage.setItem('carbonFootprint', totalCO2.toFixed(2));
    updateDashboard();
});

function updateCarbonChart(elec, car, diet, flight) {
    const canvas = document.getElementById('carbonChart');
    const ctx = canvas.getContext('2d');
    
    if (carbonChart) {
        carbonChart.destroy();
    }
    
    carbonChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Electricity', 'Car Travel', 'Diet', 'Flights'],
            datasets: [{
                data: [elec, car, diet, flight],
                backgroundColor: ['#3498db', '#e74c3c', '#f39c12', '#9b59b6']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { position: 'right' }
            }
        }
    });
}

function displayCarbonTips(total) {
    const tipsList = document.getElementById('carbonTips');
    const tips = [];
    
    if (total > 10) {
        tips.push('Your footprint is above average. Consider major lifestyle changes.');
    }
    tips.push('Switch to renewable energy sources or purchase green energy');
    tips.push('Reduce car travel: carpool, use public transit, or bike');
    tips.push('Eat more plant-based meals to reduce dietary emissions');
    tips.push('Fly less or purchase carbon offsets for necessary flights');
    tips.push('Improve home insulation to reduce heating/cooling needs');
    
    tipsList.innerHTML = tips.map(tip => `<li>${tip}</li>`).join('');
}

// Commute Planner
let commuteChart = null;

document.getElementById('commuteForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const distance = parseFloat(document.getElementById('tripDistance').value);
    
    const modes = [
        { name: 'Car (petrol)', factor: 170, icon: '🚗' },
        { name: 'Bus/Train', factor: 35, icon: '🚌' },
        { name: 'Electric Car', factor: 50, icon: '⚡' },
        { name: 'Bike/Walk', factor: 0, icon: '🚴' }
    ];
    
    const results = modes.map(mode => ({
        ...mode,
        emission: (distance * mode.factor / 1000).toFixed(2)
    }));
    
    displayCommuteResults(results);
    updateCommuteChart(results);
});

function displayCommuteResults(results) {
    const container = document.getElementById('commuteComparison');
    const minEmission = Math.min(...results.map(r => parseFloat(r.emission)));
    
    container.innerHTML = results.map(r => `
        <div class="transport-mode">
            <span class="mode-name">${r.icon} ${r.name}</span>
            <span class="mode-emission ${parseFloat(r.emission) === minEmission ? 'best' : ''}">
                ${r.emission} kg CO₂
            </span>
        </div>
    `).join('');
    
    document.getElementById('commuteResults').style.display = 'block';
}

function updateCommuteChart(results) {
    const canvas = document.getElementById('commuteChart');
    const ctx = canvas.getContext('2d');
    
    if (commuteChart) {
        commuteChart.destroy();
    }
    
    commuteChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: results.map(r => r.name),
            datasets: [{
                label: 'CO₂ Emissions (kg)',
                data: results.map(r => r.emission),
                backgroundColor: ['#e74c3c', '#3498db', '#f39c12', '#2ecc71']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            indexAxis: 'y',
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Solar ROI Calculator
let solarChart = null;

document.getElementById('solarForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const cost = parseFloat(document.getElementById('systemCost').value);
    const size = parseFloat(document.getElementById('systemSize').value);
    const sunHours = parseFloat(document.getElementById('sunHours').value);
    const rate = parseFloat(document.getElementById('electricityRate').value);
    
    const annualProduction = size * sunHours * 365;
    const annualSavings = annualProduction * rate;
    const paybackYears = cost / annualSavings;
    const lifetimeSavings = (annualSavings * 25) - cost;
    
    document.getElementById('annualProduction').textContent = `${annualProduction.toFixed(0)} kWh`;
    document.getElementById('annualSavings').textContent = `$${annualSavings.toFixed(2)}`;
    document.getElementById('paybackYears').textContent = paybackYears.toFixed(1);
    document.getElementById('lifetimeSavings').textContent = `$${lifetimeSavings.toFixed(2)}`;
    
    document.getElementById('solarResults').style.display = 'block';
    
    updateSolarChart(cost, annualSavings);
});

function updateSolarChart(cost, annualSavings) {
    const canvas = document.getElementById('solarChart');
    const ctx = canvas.getContext('2d');
    
    if (solarChart) {
        solarChart.destroy();
    }
    
    const years = [];
    const savings = [];
    let cumulative = -cost;
    
    for (let i = 0; i <= 25; i++) {
        years.push(`Year ${i}`);
        cumulative += annualSavings;
        savings.push(cumulative);
    }
    
    solarChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years.filter((_, i) => i % 5 === 0),
            datasets: [{
                label: 'Cumulative Savings ($)',
                data: savings.filter((_, i) => i % 5 === 0),
                borderColor: '#f39c12',
                backgroundColor: 'rgba(243, 156, 18, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: true }
            },
            scales: {
                y: {
                    title: { display: true, text: 'Cumulative Savings ($)' }
                }
            }
        }
    });
}

// Dashboard Updates
let dashEnergyChart = null;
let dashHabitsChart = null;

function updateDashboard() {
    const totalDaily = appliances.reduce((sum, app) => sum + app.dailyKwh, 0);
    const totalMonthly = appliances.reduce((sum, app) => sum + app.monthlyKwh, 0);
    const greenPoints = habits.filter(h => h.completed).reduce((sum, h) => sum + h.points, 0);
    const co2 = localStorage.getItem('carbonFootprint') || '0';
    
    document.getElementById('totalDailyEnergy').textContent = totalDaily.toFixed(1);
    document.getElementById('totalMonthlyEnergy').textContent = totalMonthly.toFixed(1);
    document.getElementById('totalGreenPoints').textContent = greenPoints;
    document.getElementById('totalCO2').textContent = co2;
    
    updateDashboardCharts();
}

function updateDashboardCharts() {
    const energyCanvas = document.getElementById('dashboardEnergyChart');
    const habitsCanvas = document.getElementById('dashboardHabitsChart');
    
    if (dashEnergyChart) dashEnergyChart.destroy();
    if (dashHabitsChart) dashHabitsChart.destroy();
    
    if (appliances.length > 0) {
        dashEnergyChart = new Chart(energyCanvas, {
            type: 'doughnut',
            data: {
                labels: appliances.map(a => a.name),
                datasets: [{
                    data: appliances.map(a => a.dailyKwh),
                    backgroundColor: ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6', '#1abc9c']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { position: 'right' } }
            }
        });
    }
    
    const completed = habits.filter(h => h.completed).length;
    dashHabitsChart = new Chart(habitsCanvas, {
        type: 'bar',
        data: {
            labels: ['Completed', 'Remaining'],
            datasets: [{
                label: 'Habits',
                data: [completed, habits.length - completed],
                backgroundColor: ['#2ecc71', '#ecf0f1']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { display: false } }
        }
    });
}

// Initialize
displayAppliances();
displayHabits();
displayEnergyTips();
updateDashboard();