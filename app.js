// State
let selectedTargetTime = '07:00';
let selectedRunTimeMinutes = 200; // 3:20 in minutes

// DOM Elements
const timeButtons = document.querySelectorAll('.option-btn:not(.runtime-btn)');
const runtimeButtons = document.querySelectorAll('.runtime-btn');
const customTimeContainer = document.getElementById('customTimeContainer');
const customTimeInput = document.getElementById('customTime');
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

// Event Listeners
timeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        timeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const time = btn.dataset.time;
        if (time === 'custom') {
            customTimeContainer.classList.remove('hidden');
            selectedTargetTime = customTimeInput.value;
        } else {
            customTimeContainer.classList.add('hidden');
            selectedTargetTime = time;
        }
        
        updateDisplay();
    });
});

runtimeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        runtimeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedRunTimeMinutes = parseInt(btn.dataset.minutes);
        updateDisplay();
    });
});

customTimeInput.addEventListener('change', () => {
    selectedTargetTime = customTimeInput.value;
    updateDisplay();
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

// Update every minute
setInterval(updateDisplay, 60000);

// Initial calculation
updateDisplay();

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
