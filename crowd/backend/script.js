// Global variables
let crowdThreshold = 5;
let currentPeopleCount = 0;
let isRecording = false;
let isAlertActive = false;
let backendUrl = 'http://localhost:8000'; // Update this to your backend URL

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    updateLastUpdate();
    loadSettings();
    initializeVideoFeed();
    startDataPolling();
    
    // Update time every second
    setInterval(updateLastUpdate, 1000);
    
    // Poll backend every 2 seconds for new data
    setInterval(fetchCrowdData, 2000);
    
    console.log('Crowd Detection System initialized');
}

// Initialize video feed with error handling
function initializeVideoFeed() {
    const videoFeed = document.getElementById('videoFeed');
    const placeholder = document.getElementById('videoPlaceholder');
    
    videoFeed.onload = function() {
        console.log('Video feed loaded successfully');
        placeholder.style.display = 'none';
        videoFeed.style.display = 'block';
    };
    
    videoFeed.onerror = function() {
        console.log('Video feed failed to load, showing placeholder');
        placeholder.style.display = 'block';
        videoFeed.style.display = 'none';
    };
    
    // Test if video feed is available
    testVideoFeed();
}

// Test video feed availability
function testVideoFeed() {
    fetch('http://127.0.0.1:8000/video_feed')
        .then(response => {
            if (response.ok) {
                console.log('Video feed endpoint is available');
            } else {
                showVideoPlaceholder();
            }
        })
        .catch(error => {
            console.log('Video feed endpoint not available:', error);
            showVideoPlaceholder();
        });
}

// Show video placeholder when feed is not available
function showVideoPlaceholder() {
    const videoFeed = document.getElementById('videoFeed');
    const placeholder = document.getElementById('videoPlaceholder');
    
    videoFeed.style.display = 'none';
    placeholder.style.display = 'block';
}

// Update the last update timestamp
function updateLastUpdate() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour12: true,
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit'
    });
    
    document.getElementById('lastUpdate').textContent = timeString;
}

// Load settings from localStorage
function loadSettings() {
    const savedThreshold = localStorage.getItem('crowdThreshold');
    if (savedThreshold) {
        crowdThreshold = parseInt(savedThreshold);
        document.getElementById('crowdThreshold').value = crowdThreshold;
    }
}

// Save settings to localStorage
function saveSettings() {
    localStorage.setItem('crowdThreshold', crowdThreshold.toString());
}

// Update threshold when user changes it
function updateThreshold() {
    const thresholdInput = document.getElementById('crowdThreshold');
    const newThreshold = parseInt(thresholdInput.value);
    
    if (newThreshold && newThreshold > 0) {
        crowdThreshold = newThreshold;
        saveSettings();
        
        console.log(`Threshold updated to: ${crowdThreshold} people`);
        
        // Show feedback
        const updateBtn = document.querySelector('.btn-update');
        const originalText = updateBtn.textContent;
        updateBtn.textContent = 'Updated!';
        updateBtn.style.background = '#10b981';
        
        setTimeout(() => {
            updateBtn.textContent = originalText;
            updateBtn.style.background = '#0ea5e9';
        }, 1500);
        
        // Check if current count exceeds new threshold
        checkThreshold();
    } else {
        alert('Please enter a valid number greater than 0');
        thresholdInput.value = crowdThreshold;
    }
}

// Start polling for data (placeholder for future integration)
function startDataPolling() {
    console.log('Data polling started');
    
    // Simulate some initial data for demo
    setTimeout(() => {
        updatePeopleCount(3);
    }, 2000);
}

// Fetch crowd data from backend
async function fetchCrowdData() {
    try {
        const response = await fetch(`${backendUrl}/all_data`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Backend data:', data);
            
            // Process data from all cameras
            let totalPeople = 0;
            let latestLocation = null;
            
            for (const cameraId in data) {
                const cameraData = data[cameraId];
                totalPeople += cameraData.people_count;
                
                // Use the first camera's location as reference
                if (!latestLocation) {
                    latestLocation = {
                        lat: cameraData.latitude,
                        lon: cameraData.longitude
                    };
                }
            }
            
            // Update UI with total count
            updatePeopleCount(totalPeople);
            
            // Update location if available
            if (latestLocation) {
                document.getElementById('location').textContent = 
                    `${latestLocation.lat.toFixed(4)}, ${latestLocation.lon.toFixed(4)}`;
            }
            
            // Update network status
            updateNetworkStatus(true);
            
        } else {
            console.error('Failed to fetch data from backend');
            updateNetworkStatus(false);
        }
    } catch (error) {
        console.error('Error fetching crowd data:', error);
        updateNetworkStatus(false);
        
        // Simulate some data for demo when backend is not available
        if (Math.random() < 0.3) { // 30% chance to simulate crowd detection
            const simulatedCount = Math.floor(Math.random() * 15) + 1;
            updatePeopleCount(simulatedCount);
        }
    }
}

// Update network status indicator
function updateNetworkStatus(connected) {
    const networkStatus = document.getElementById('networkStatus');
    const systemStatus = document.getElementById('systemStatus');
    
    if (connected) {
        networkStatus.textContent = 'Connected';
        networkStatus.className = 'status-value connected';
    } else {
        networkStatus.textContent = 'Disconnected';
        networkStatus.className = 'status-value';
        networkStatus.style.color = '#ef4444';
    }
}

// Update people count and trigger alerts if necessary
function updatePeopleCount(count) {
    currentPeopleCount = count;
    document.getElementById('currentCount').textContent = count;
    
    console.log(`People count updated: ${count}`);
    
    // Check threshold and trigger alert if needed
    checkThreshold();
}

// Check if current count exceeds threshold
function checkThreshold() {
    if (currentPeopleCount > crowdThreshold) {
        if (!isAlertActive) {
            triggerCrowdAlert();
        }
        updateSystemStatus('warning');
        
        // Auto-start recording if not already recording
        if (!isRecording) {
            startRecording();
        }
    } else {
        if (isAlertActive) {
            clearCrowdAlert();
        }
        updateSystemStatus('normal');
    }
}

// Trigger crowd alert
function triggerCrowdAlert() {
    isAlertActive = true;
    
    const alertBox = document.getElementById('alertBox');
    const alertMessage = document.getElementById('alertMessage');
    
    alertMessage.textContent = `${currentPeopleCount} people detected. Consider crowd management measures.`;
    alertBox.style.display = 'block';
    
    console.log(`ALERT: Crowd threshold exceeded! Count: ${currentPeopleCount}, Threshold: ${crowdThreshold}`);
    
    // You can add additional alert mechanisms here:
    // - Send notification to management system
    // - Trigger audio alarm
    // - Send SMS/Email alerts
}

// Clear crowd alert
function clearCrowdAlert() {
    isAlertActive = false;
    
    const alertBox = document.getElementById('alertBox');
    alertBox.style.display = 'none';
    
    console.log('Alert cleared - crowd below threshold');
}

// Update system status
function updateSystemStatus(status) {
    const systemStatus = document.getElementById('systemStatus');
    
    // Remove existing status classes
    systemStatus.className = 'status-item';
    
    if (status === 'warning') {
        systemStatus.classList.add('warning');
        systemStatus.innerHTML = '<span class="status-dot"></span><span>Warning</span>';
    } else {
        systemStatus.style.background = 'rgba(16, 185, 129, 0.2)';
        systemStatus.style.borderColor = '#10b981';
        systemStatus.style.color = '#10b981';
        systemStatus.innerHTML = '<span class="status-dot"></span><span>Normal</span>';
    }
}

// Toggle recording
function toggleRecording() {
    const recordingBtn = document.getElementById('recordingBtn');
    const recordingStatus = document.getElementById('recordingStatus');
    
    if (isRecording) {
        // Stop recording
        isRecording = false;
        recordingBtn.innerHTML = '📹 Start Recording';
        recordingBtn.className = 'btn-primary';
        recordingStatus.textContent = 'Standby';
        
        console.log('Recording stopped');
    } else {
        // Start recording
        startRecording();
    }
}

// Start recording
function startRecording() {
    isRecording = true;
    const recordingBtn = document.getElementById('recordingBtn');
    const recordingStatus = document.getElementById('recordingStatus');
    
    recordingBtn.innerHTML = '⏹️ Stop Recording';
    recordingBtn.className = 'btn-warning';
    recordingStatus.textContent = 'Recording';
    recordingStatus.style.color = '#ef4444';
    
    console.log('Recording started');
    
    // Here you would integrate with your actual recording system
    // For example: send a request to start recording to your backend
}

// Send emergency alert
function sendAlert() {
    console.log('Emergency alert sent!');
    
    const alertBtn = document.querySelector('.btn-warning');
    const originalText = alertBtn.innerHTML;
    
    alertBtn.innerHTML = '✓ Alert Sent!';
    alertBtn.style.background = '#10b981';
    
    setTimeout(() => {
        alertBtn.innerHTML = originalText;
        alertBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
    }, 2000);
    
    // Here you would integrate with your messaging system:
    // - Send SMS alerts to security team
    // - Send email notifications
    // - Trigger emergency protocols
    // - Alert local authorities if needed
}

// Export data
function exportData() {
    console.log('Exporting data...');
    
    const data = {
        timestamp: new Date().toISOString(),
        currentCount: currentPeopleCount,
        threshold: crowdThreshold,
        isAlertActive: isAlertActive,
        isRecording: isRecording,
        location: document.getElementById('location').textContent
    };
    
    // Create and download JSON file
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `crowd_data_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    // Show feedback
    const exportBtn = document.querySelector('.btn-secondary');
    const originalText = exportBtn.innerHTML;
    
    exportBtn.innerHTML = '✓ Exported!';
    exportBtn.style.background = '#10b981';
    
    setTimeout(() => {
        exportBtn.innerHTML = originalText;
        exportBtn.style.background = 'rgba(100, 116, 139, 0.3)';
    }, 2000);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Ctrl/Cmd + R: Toggle recording
    if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        toggleRecording();
    }
    
    // Ctrl/Cmd + A: Send alert
    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault();
        sendAlert();
    }
    
    // Ctrl/Cmd + E: Export data
    if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        exportData();
    }
});

// Handle threshold input changes
document.getElementById('crowdThreshold').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        updateThreshold();
    }
});

// Simulate crowd detection for demo purposes (remove this in production)
function simulateCrowdDetection() {
    setInterval(() => {
        // Generate random people count between 0 and 15
        const randomCount = Math.floor(Math.random() * 16);
        updatePeopleCount(randomCount);
        
        console.log(`Simulated count: ${randomCount}`);
    }, 5000); // Update every 5 seconds
}

// Audio alert function
function playAlertSound() {
    // Create audio context for alert sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create oscillator for beep sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

// Enhanced alert system with sound
function triggerCrowdAlertWithSound() {
    triggerCrowdAlert();
    
    // Play alert sound
    try {
        playAlertSound();
    } catch (error) {
        console.log('Audio alert not supported or blocked');
    }
    
    // Flash the browser tab title
    flashTabTitle();
}

// Flash browser tab title for attention
function flashTabTitle() {
    const originalTitle = document.title;
    let flashCount = 0;
    const maxFlashes = 10;
    
    const flashInterval = setInterval(() => {
        if (flashCount % 2 === 0) {
            document.title = '🚨 CROWD ALERT! 🚨';
        } else {
            document.title = originalTitle;
        }
        
        flashCount++;
        
        if (flashCount >= maxFlashes) {
            clearInterval(flashInterval);
            document.title = originalTitle;
        }
    }, 500);
}

// Update checkThreshold function to use enhanced alerts
function checkThreshold() {
    if (currentPeopleCount > crowdThreshold) {
        if (!isAlertActive) {
            triggerCrowdAlertWithSound();
        }
        updateSystemStatus('warning');
        
        // Auto-start recording if not already recording
        if (!isRecording) {
            startRecording();
        }
    } else {
        if (isAlertActive) {
            clearCrowdAlert();
        }
        updateSystemStatus('normal');
    }
}

// Test functions for development
function testAlert() {
    console.log('Testing alert system...');
    updatePeopleCount(crowdThreshold + 1);
}

function testNormalCount() {
    console.log('Testing normal count...');
    updatePeopleCount(Math.max(0, crowdThreshold - 1));
}

// Add test buttons to console for development
console.log('Development functions available:');
console.log('- testAlert(): Trigger a crowd alert');
console.log('- testNormalCount(): Set count below threshold'); 
console.log('- simulateCrowdDetection(): Start simulation mode');
console.log('- updatePeopleCount(number): Manually set people count');

// Auto-start simulation in demo mode (comment out for production)
setTimeout(() => {
    console.log('Starting demo simulation...');
    simulateCrowdDetection();
}, 5000);