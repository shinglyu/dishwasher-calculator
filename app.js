// Configuration - Edit these arrays to change available options
const TARGET_TIME_OPTIONS = [
    { label: '7:00 AM', value: '07:00' },
    { label: '12:00 PM', value: '12:00' },
    { label: '5:00 PM', value: '17:00' }
];

const RUN_TIME_OPTIONS = [
    { label: '3:50', minutes: 230 },
    { label: '3:22', minutes: 202 },
    { label: '2:20', minutes: 140 }
];

// State
let selectedTargetTime = TARGET_TIME_OPTIONS[0].value;
let selectedRunTimeMinutes = RUN_TIME_OPTIONS[0].minutes;
let isCustomTargetTime = false;
let isCustomRunTime = false;

// DOM Elements
const targetTimeContainer = document.getElementById('targetTimeButtons');
const runTimeContainer = document.getElementById('runTimeButtons');
const customTimeContainer = document.getElementById('customTimeContainer');
const customTimeInput = document.getElementById('customTime');
const customRunTimeContainer = document.getElementById('customRunTimeContainer');
const customRunTimeInput = document.getElementById('customRunTime');
const delayValueEl = document.getElementById('delayValue');
const resultInfoEl = document.getElementById('resultInfo');
const toggleDetailsBtn = document.getElementById('toggleDetails');
const detailsContent = document.getElementById('detailsContent');

// Detail elements
const detailCurrentTime = document.getElementById('detailCurrentTime');
const detailTargetTime = document.getElementById('detailTargetTime');
const detailRunTime = document.getElementById('detailRunTime');
const detailTimeUntil = document.getElementById('detailTimeUntil');
const detailExactDelay = document.getElementById('detailExactDelay');
const detailRoundedDelay = document.getElementById('detailRoundedDelay');
const detailFinishTime = document.getElementById('detailFinishTime');

// Format time for display (12-hour format)
function formatTime12(hours, minutes) {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${period}`;
}

// Format duration (hours and minutes)
function formatDuration(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) {
        return `${minutes} min`;
    }
    if (minutes === 0) {
        return `${hours} hr`;
    }
    return `${hours} hr ${minutes} min`;
}

// Parse time string (HH:MM) to minutes since midnight
function parseTimeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// Calculate the delay needed
function calculateDelay() {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const targetMinutes = parseTimeToMinutes(selectedTargetTime);
    
    // Calculate time until target (handle next day)
    let timeUntilTarget = targetMinutes - currentMinutes;
    if (timeUntilTarget <= 0) {
        timeUntilTarget += 24 * 60; // Add 24 hours if target is tomorrow
    }
    
    // Calculate required delay
    // delay + runtime = timeUntilTarget
    // delay = timeUntilTarget - runtime
    const exactDelayMinutes = timeUntilTarget - selectedRunTimeMinutes;
    
    // Round down to full hours (never later than target)
    const delayHours = Math.floor(exactDelayMinutes / 60);
    
    // Calculate actual finish time with rounded delay
    const actualDelayMinutes = delayHours * 60;
    const finishMinutes = (currentMinutes + actualDelayMinutes + selectedRunTimeMinutes) % (24 * 60);
    const finishHours = Math.floor(finishMinutes / 60);
    const finishMins = finishMinutes % 60;
    
    return {
        currentTime: now,
        targetMinutes,
        timeUntilTarget,
        exactDelayMinutes,
        delayHours: Math.max(0, delayHours),
        finishHours,
        finishMins,
        isValid: delayHours >= 0
    };
}

// Update the display
function updateDisplay() {
    const result = calculateDelay();
    
    if (result.isValid) {
        delayValueEl.textContent = result.delayHours;
        
        const finishTimeStr = formatTime12(result.finishHours, result.finishMins);
        resultInfoEl.textContent = `Dishwasher will finish at approximately ${finishTimeStr}`;
    } else {
        delayValueEl.textContent = '0';
        resultInfoEl.textContent = 'Start now! Target time is too soon for a delay.';
    }
    
    // Update details
    const currentHours = result.currentTime.getHours();
    const currentMins = result.currentTime.getMinutes();
    detailCurrentTime.textContent = formatTime12(currentHours, currentMins);
    
    const targetHours = Math.floor(result.targetMinutes / 60);
    const targetMins = result.targetMinutes % 60;
    detailTargetTime.textContent = formatTime12(targetHours, targetMins);
    
    detailRunTime.textContent = formatDuration(selectedRunTimeMinutes);
    detailTimeUntil.textContent = formatDuration(result.timeUntilTarget);
    detailExactDelay.textContent = formatDuration(Math.max(0, result.exactDelayMinutes));
    detailRoundedDelay.textContent = `${Math.max(0, result.delayHours)} hours`;
    detailFinishTime.textContent = formatTime12(result.finishHours, result.finishMins);
}

// Generate target time buttons
function initTargetTimeButtons() {
    targetTimeContainer.innerHTML = '';
    
    // Add preset options
    TARGET_TIME_OPTIONS.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn' + (index === 0 ? ' active' : '');
        btn.dataset.time = option.value;
        btn.textContent = option.label;
        btn.addEventListener('click', () => selectTargetTime(btn, option.value, false));
        targetTimeContainer.appendChild(btn);
    });
    
    // Add custom option
    const customBtn = document.createElement('button');
    customBtn.className = 'option-btn';
    customBtn.dataset.time = 'custom';
    customBtn.textContent = 'Custom';
    customBtn.addEventListener('click', () => selectTargetTime(customBtn, customTimeInput.value, true));
    targetTimeContainer.appendChild(customBtn);
}

// Generate run time buttons
function initRunTimeButtons() {
    runTimeContainer.innerHTML = '';
    
    // Add preset options
    RUN_TIME_OPTIONS.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn' + (index === 0 ? ' active' : '');
        btn.dataset.minutes = option.minutes;
        btn.textContent = option.label;
        btn.addEventListener('click', () => selectRunTime(btn, option.minutes, false));
        runTimeContainer.appendChild(btn);
    });
    
    // Add custom option
    const customBtn = document.createElement('button');
    customBtn.className = 'option-btn';
    customBtn.dataset.minutes = 'custom';
    customBtn.textContent = 'Custom';
    customBtn.addEventListener('click', () => selectRunTime(customBtn, parseRunTimeInput(), true));
    runTimeContainer.appendChild(customBtn);
}

// Select target time
function selectTargetTime(btn, value, isCustom) {
    const buttons = targetTimeContainer.querySelectorAll('.option-btn');
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    isCustomTargetTime = isCustom;
    if (isCustom) {
        customTimeContainer.classList.remove('hidden');
        selectedTargetTime = customTimeInput.value;
    } else {
        customTimeContainer.classList.add('hidden');
        selectedTargetTime = value;
    }
    
    updateDisplay();
}

// Select run time
function selectRunTime(btn, minutes, isCustom) {
    const buttons = runTimeContainer.querySelectorAll('.option-btn');
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    isCustomRunTime = isCustom;
    if (isCustom) {
        customRunTimeContainer.classList.remove('hidden');
        selectedRunTimeMinutes = parseRunTimeInput();
    } else {
        customRunTimeContainer.classList.add('hidden');
        selectedRunTimeMinutes = minutes;
    }
    
    updateDisplay();
}

// Parse run time input (HH:MM format) to minutes
function parseRunTimeInput() {
    const value = customRunTimeInput.value;
    if (!value) return RUN_TIME_OPTIONS[0].minutes;
    const [hours, minutes] = value.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
}

// Event Listeners
customTimeInput.addEventListener('change', () => {
    if (isCustomTargetTime) {
        selectedTargetTime = customTimeInput.value;
        updateDisplay();
    }
});

customRunTimeInput.addEventListener('change', () => {
    if (isCustomRunTime) {
        selectedRunTimeMinutes = parseRunTimeInput();
        updateDisplay();
    }
});

toggleDetailsBtn.addEventListener('click', () => {
    toggleDetailsBtn.classList.toggle('expanded');
    detailsContent.classList.toggle('hidden');
    
    const labelSpan = toggleDetailsBtn.querySelector('span:first-child');
    if (detailsContent.classList.contains('hidden')) {
        labelSpan.textContent = 'Show detailed calculation';
    } else {
        labelSpan.textContent = 'Hide detailed calculation';
    }
});

// Initialize the app
function init() {
    initTargetTimeButtons();
    initRunTimeButtons();
    updateDisplay();
}

// Update every minute
setInterval(updateDisplay, 60000);

// Start the app
init();

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registered:', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}
