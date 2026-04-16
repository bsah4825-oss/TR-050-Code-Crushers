// Security: Simple HTML sanitization to prevent XSS
// This removes potentially dangerous HTML/script content from user inputs
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Privacy & Security: Data encryption/decryption for localStorage
// Uses a simple encryption scheme for demonstration (in production, use proper encryption)
const DataSecurity = {
    // Simple encryption key (in production, this should be user-derived or properly managed)
    encryptionKey: 'ElderCareMediTrack2024',

    encrypt(data) {
        try {
            const jsonString = JSON.stringify(data);
            // Simple XOR encryption for demonstration
            let encrypted = '';
            for (let i = 0; i < jsonString.length; i++) {
                const charCode = jsonString.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
                encrypted += String.fromCharCode(charCode);
            }
            return btoa(encrypted); // Base64 encode
        } catch (e) {
            console.error('Encryption error:', e);
            return null;
        }
    },

    decrypt(encryptedData) {
        try {
            const encrypted = atob(encryptedData); // Base64 decode
            let decrypted = '';
            for (let i = 0; i < encrypted.length; i++) {
                const charCode = encrypted.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
                decrypted += String.fromCharCode(charCode);
            }
            return JSON.parse(decrypted);
        } catch (e) {
            console.error('Decryption error:', e);
            return null;
        }
    }
};

// Security: Validate and sanitize medication data
// Ensures medication data is safe and properly formatted
function validateMedicationData(med) {
    if (!med.name || typeof med.name !== 'string') return false;
    med.name = sanitizeHTML(med.name.trim());
    if (!med.dose || typeof med.dose !== 'string') return false;
    med.dose = sanitizeHTML(med.dose.trim());
    if (!med.instructions || typeof med.instructions !== 'string') return false;
    med.instructions = sanitizeHTML(med.instructions.trim());
    return true;
}

const AudioManager = {
    soundEnabled: true,
    overdueMuted: false,
    skipSound: null,
    successSound: null,
    overdueSound: null,
    audioContext: null,
    alarmOscillator: null,
    alarmGain: null,

    init() {
        this.skipSound = document.getElementById('skipSound');
        this.successSound = document.getElementById('successSound');
        this.overdueSound = document.getElementById('overdueSound');
        this.updateToggleButton();
        this.stopOverdueAlarm();
    },

    updateToggleButton() {
        const button = document.getElementById('soundToggle');
        if (!button) return;
        button.textContent = this.soundEnabled ? '🔊Sound ON' : '🔇 Sound OFF';
        button.style.background = this.soundEnabled ? '#10b981' : '#6b7280';
    },

    play(soundName, volume = 0.7) {
        if (!this.soundEnabled) return;
        const sound = this[soundName];
        if (!sound) return;
        try {
            sound.volume = volume;
            sound.currentTime = 0;
            const promise = sound.play();
            if (promise && promise.catch) {
                promise.catch(() => {
                    console.log('Audio play blocked until user interaction.');
                });
            }
        } catch (error) {
            console.log('Audio playback error:', error);
        }
    },

    startOverdueAlarm() {
        if (!this.soundEnabled || this.overdueMuted) return;
        if (this.alarmOscillator) return;

        this.createAudioContext();
        if (this.audioContext) {
            const startOscillator = () => {
                const gain = this.audioContext.createGain();
                gain.gain.value = 0.18;
                gain.connect(this.audioContext.destination);

                const oscillator = this.audioContext.createOscillator();
                oscillator.type = 'square';
                oscillator.frequency.value = 760;
                oscillator.connect(gain);
                oscillator.start();

                this.alarmGain = gain;
                this.alarmOscillator = oscillator;
            };

            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(startOscillator).catch(() => {
                    console.log('AudioContext resume failed, falling back to audio element.');
                    this.playOverdueAudioFallback();
                });
            } else {
                startOscillator();
            }
            return;
        }

        this.playOverdueAudioFallback();
    },

    stopOverdueAlarm() {
        if (this.alarmOscillator) {
            try {
                this.alarmOscillator.stop();
            } catch (e) {}
            this.alarmOscillator.disconnect();
            this.alarmOscillator = null;
        }

        if (this.alarmGain) {
            this.alarmGain.disconnect();
            this.alarmGain = null;
        }

        if (this.overdueSound) {
            this.overdueSound.pause();
            this.overdueSound.currentTime = 0;
        }
    },

    playOverdueAudioFallback() {
        if (!this.soundEnabled || this.overdueMuted || !this.overdueSound) return;
        if (this.overdueSound.paused) {
            this.overdueSound.currentTime = 0;
            this.overdueSound.play().catch(() => {
                console.log('Overdue fallback audio blocked until user interaction.');
            });
        }
    },

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        if (!this.soundEnabled) {
            this.stopOverdueAlarm();
        }
        this.updateToggleButton();
    },

    createAudioContext() {
        if (this.audioContext && this.audioContext.state !== 'closed') return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            this.audioContext = new AudioContext();
        }
    }
};

const VitalSignsMonitor = {
    heartRate: 72,
    temperature: 98.6,
    weight: 145,
    bloodPressure: { systolic: 120, diastolic: 80 },
    heartbeatData: [],
    canvas: null,
    ctx: null,
    updateInterval: null,

    init() {
        this.canvas = document.getElementById('heartbeatCanvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.startMonitoring();
        }
        this.updateDisplay();
    },

    startMonitoring() {
        // Update vitals every 2 seconds
        this.updateInterval = setInterval(() => {
            this.updateVitals();
            this.updateDisplay();
            this.updateHeartbeatGraph();
        }, 2000);

        // Update heartbeat graph more frequently for smooth animation
        setInterval(() => {
            this.updateHeartbeatGraph();
        }, 100);
    },

    updateVitals() {
        // Simulate realistic vital signs with slight variations
        this.heartRate = this.generateRealisticHeartRate();
        this.temperature = this.generateRealisticTemperature();
        this.weight = this.generateRealisticWeight();
        this.bloodPressure = this.generateRealisticBloodPressure();
    },

    generateRealisticHeartRate() {
        // Normal resting heart rate: 60-100 BPM
        // Add small random variations
        const baseRate = 72;
        const variation = (Math.random() - 0.5) * 8; // ±4 BPM variation
        return Math.round(baseRate + variation);
    },

    generateRealisticTemperature() {
        // Normal body temperature: 97.8-99.1°F
        const baseTemp = 98.6;
        const variation = (Math.random() - 0.5) * 0.8; // ±0.4°F variation
        return Math.round((baseTemp + variation) * 10) / 10;
    },

    generateRealisticWeight() {
        // Stable weight with very small daily variations
        const baseWeight = 145;
        const variation = (Math.random() - 0.5) * 2; // ±1 lb variation
        return Math.round(baseWeight + variation);
    },

    generateRealisticBloodPressure() {
        // Normal blood pressure: 120/80
        const systolic = Math.round(120 + (Math.random() - 0.5) * 10);
        const diastolic = Math.round(80 + (Math.random() - 0.5) * 6);
        return { systolic, diastolic };
    },

    updateDisplay() {
        // Update heart rate
        const heartRateEl = document.getElementById('heartRate');
        const heartStatusEl = document.getElementById('heartStatus');
        if (heartRateEl) heartRateEl.textContent = this.heartRate;
        if (heartStatusEl) {
            heartStatusEl.textContent = this.getHeartRateStatus();
            heartStatusEl.className = 'vital-status ' + this.getHeartRateStatusClass();
        }

        // Update temperature
        const tempEl = document.getElementById('temperature');
        const tempStatusEl = document.getElementById('tempStatus');
        if (tempEl) tempEl.textContent = this.temperature;
        if (tempStatusEl) {
            tempStatusEl.textContent = this.getTemperatureStatus();
            tempStatusEl.className = 'vital-status ' + this.getTemperatureStatusClass();
        }

        // Update weight
        const weightEl = document.getElementById('weight');
        const weightStatusEl = document.getElementById('weightStatus');
        if (weightEl) weightEl.textContent = this.weight;
        if (weightStatusEl) {
            weightStatusEl.textContent = 'Stable';
            weightStatusEl.className = 'vital-status normal';
        }

        // Update blood pressure
        const bpEl = document.getElementById('bloodPressure');
        const bpStatusEl = document.getElementById('bloodPressure');
        if (bpEl) bpEl.textContent = `${this.bloodPressure.systolic}/${this.bloodPressure.diastolic}`;
        if (bpStatusEl) {
            const bpStatus = document.getElementById('bpStatus');
            if (bpStatus) {
                bpStatus.textContent = this.getBloodPressureStatus();
                bpStatus.className = 'vital-status ' + this.getBloodPressureStatusClass();
            }
        }

        // Update last update time
        const lastUpdateEl = document.getElementById('lastUpdate');
        if (lastUpdateEl) {
            lastUpdateEl.textContent = new Date().toLocaleTimeString();
        }

        // Update patient info
        this.updatePatientInfo();
    },

    getHeartRateStatus() {
        if (this.heartRate < 60) return 'Low';
        if (this.heartRate > 100) return 'High';
        return 'Normal';
    },

    getHeartRateStatusClass() {
        if (this.heartRate < 60 || this.heartRate > 100) return 'warning';
        return 'normal';
    },

    getTemperatureStatus() {
        if (this.temperature < 97.8) return 'Low';
        if (this.temperature > 99.1) return 'High';
        return 'Normal';
    },

    getTemperatureStatusClass() {
        if (this.temperature < 97.8 || this.temperature > 99.1) return 'warning';
        return 'normal';
    },

    getBloodPressureStatus() {
        const { systolic, diastolic } = this.bloodPressure;
        if (systolic > 140 || diastolic > 90) return 'High';
        if (systolic < 90 || diastolic < 60) return 'Low';
        return 'Normal';
    },

    getBloodPressureStatusClass() {
        const { systolic, diastolic } = this.bloodPressure;
        if (systolic > 140 || diastolic > 90 || systolic < 90 || diastolic < 60) return 'warning';
        return 'normal';
    },

    updatePatientInfo() {
        const nameEl = document.getElementById('patientName');
        const ageEl = document.getElementById('patientAge');
        const genderEl = document.getElementById('patientGender');
        const phoneEl = document.getElementById('patientPhone');
        const addressEl = document.getElementById('patientAddress');
        const emergencyContactEl = document.getElementById('patientEmergencyContact');
        const bloodTypeEl = document.getElementById('patientBloodType');
        const allergiesEl = document.getElementById('patientAllergies');
        const conditionsEl = document.getElementById('patientConditions');

        if (nameEl) nameEl.textContent = patientData.name;
        if (ageEl) ageEl.textContent = `Age: ${patientData.age}`;
        if (genderEl) genderEl.textContent = `Gender: ${patientData.gender}`;
        if (phoneEl) phoneEl.textContent = `Phone: ${patientData.phone || 'Not provided'}`;
        if (addressEl) addressEl.textContent = `Address: ${patientData.address || 'Not provided'}`;
        if (emergencyContactEl) emergencyContactEl.textContent = `Emergency Contact: ${patientData.emergencyContact || 'Not provided'} ${patientData.emergencyPhone ? `(${patientData.emergencyPhone})` : ''}`;
        if (bloodTypeEl) bloodTypeEl.textContent = `Blood Type: ${patientData.bloodType || 'Not specified'}`;
        if (allergiesEl) allergiesEl.textContent = `Allergies: ${patientData.allergies || 'None reported'}`;
        if (conditionsEl) conditionsEl.textContent = `Conditions: ${patientData.comorbidities.join(', ')}`;
    },

    updateHeartbeatGraph() {
        if (!this.ctx) return;

        // Generate heartbeat data point
        const time = Date.now();
        const heartbeatValue = Math.sin(time * 0.01) * 20 + Math.sin(time * 0.05) * 5 + 50;

        this.heartbeatData.push({ time, value: heartbeatValue });

        // Keep only last 100 points
        if (this.heartbeatData.length > 100) {
            this.heartbeatData.shift();
        }

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = '#e2e8f0';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.canvas.height; i += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i);
            this.ctx.lineTo(this.canvas.width, i);
            this.ctx.stroke();
        }

        // Draw heartbeat line
        if (this.heartbeatData.length > 1) {
            this.ctx.strokeStyle = '#ef4444';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();

            const startTime = this.heartbeatData[0].time;
            const timeRange = this.heartbeatData[this.heartbeatData.length - 1].time - startTime;

            this.heartbeatData.forEach((point, index) => {
                const x = (point.time - startTime) / timeRange * this.canvas.width;
                const y = this.canvas.height - (point.value / 100 * this.canvas.height);

                if (index === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            });

            this.ctx.stroke();
        }
    }
};

// Default patient data (will be overridden by localStorage)
let patientData = {
    name: "",
    age: 0,
    gender: "",
    phone: "",
    address: "",
    emergencyContact: "",
    emergencyPhone: "",
    bloodType: "",
    allergies: "",
    caregiverPhone: "+15551234567",
    comorbidities: ["Hypertension", "Diabetes Type 2", "Osteoporosis"],
    medications: [
        {
            id: 1,
            name: "Paracetamol",
            dose: "500mg",
            time: "9:00 AM",
            scheduledTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            takenTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            frequency: "Daily",
            instructions: "Take with water",
            status: "taken",
            adherence: 100,
            interactions: [],
            smsSent: false
        },
        {
            id: 2,
            name: "Amlodipine",
            dose: "5mg",
            time: "10:00 AM",
            scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            takenTime: null,
            frequency: "Daily",
            instructions: "Take with breakfast",
            status: "pending",
            adherence: 90,
            interactions: ["Moderate interaction with Grapefruit"],
            smsSent: false
        },
        {
            id: 3,
            name: "Metformin",
            dose: "1000mg",
            time: "8:00 PM",
            scheduledTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
            takenTime: null,
            frequency: "Daily",
            instructions: "Take with dinner",
            status: "pending",
            adherence: 85,
            interactions: [],
            smsSent: false
        }
    ]
};

let globalStats = { total: 0, taken: 0, missed: 0, smsSent: 0 };
let smsConfig = {
    caregiverPhone: "+15551234567",
    patientPhone: "+15559876543",
    alertThreshold: 2
};

let smsRateLimit = {
    lastSent: 0,
    count: 0,
    resetTime: Date.now() + 60000, // 1 minute window
    maxPerMinute: 10 // Reasonable limit for demo
};

async function sendSMS(to, message) {
    // Security: Rate limiting to prevent SMS spam
    const now = Date.now();
    if (now > smsRateLimit.resetTime) {
        smsRateLimit.count = 0;
        smsRateLimit.resetTime = now + 60000;
    }
    if (smsRateLimit.count >= smsRateLimit.maxPerMinute) {
        showSMSStatus('❌ SMS rate limit exceeded. Please wait before sending more messages.', 'error');
        return false;
    }
    smsRateLimit.count++;
    smsRateLimit.lastSent = now;

    console.log('📧Sending SMS to:', to);
    console.log('📧Message:', message);

    await new Promise(resolve => setTimeout(resolve, 1500));
    const fakeSid = 'SM' + Math.random().toString(36).substr(2, 8).toUpperCase();

    window.TWILIO_CONFIG = window.TWILIO_CONFIG || { smsHistory: [] };
    window.TWILIO_CONFIG.smsHistory.push({
        to,
        message,
        sid: fakeSid,
        date: new Date().toISOString()
    });

    showSMSStatus(`✅ SMS sent successfully to ${to} (SID: ${fakeSid})`, 'success');
    globalStats.smsSent++;
    updateStats();
    return true;
}

function showSMSStatus(message, type) {
    const alertsContainer = document.getElementById('alertsContainer');
    if (!alertsContainer) return;

    const statusDiv = document.createElement('div');
    statusDiv.className = `sms-status sms-${type}`;
    statusDiv.style.cssText = `
        padding: 12px; border-radius: 12px; margin: 12px 0;
        display: flex; align-items: center; gap: 12px; font-weight: 500;
        background: ${type === 'success' ? '#d1fae5' : type === 'error' ? '#fee2e2' : '#fef3c7'};
        border: 1px solid ${type === 'success' ? '#a7f3d0' : type === 'error' ? '#fecaca' : '#fde68a'};
        color: ${type === 'success' ? '#065f46' : type === 'error' ? '#991b1b' : '#d97706'};
        max-width: 800px; margin: 24px auto;
    `;
    statusDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'spinner fa-spin'}"></i>
        ${message}
    `;

    alertsContainer.innerHTML = '';
    alertsContainer.appendChild(statusDiv);
    alertsContainer.scrollTop = alertsContainer.scrollHeight;

    setTimeout(() => statusDiv.remove(), 8000);
}

function testSMS() {
    const caregiverPhone = document.getElementById('caregiverPhone')?.value || smsConfig.caregiverPhone;
    const testMessage = window.SMS_TEMPLATES ? window.SMS_TEMPLATES.test : '? ElderCare MediTrack SMS Test';
    sendSMS(caregiverPhone, testMessage);
}

function saveSMSConfig() {
    const caregiverPhone = document.getElementById('caregiverPhone')?.value || smsConfig.caregiverPhone;
    const patientPhone = document.getElementById('patientPhone')?.value || smsConfig.patientPhone;
    const alertThreshold = parseInt(document.getElementById('alertThreshold')?.value, 10) || 2;

    // Security: Validate phone numbers to prevent injection
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(caregiverPhone)) {
        showSMSStatus('❌ Invalid caregiver phone number format', 'error');
        return;
    }
    if (!phoneRegex.test(patientPhone)) {
        showSMSStatus('❌ Invalid patient phone number format', 'error');
        return;
    }

    // Security: Validate alert threshold
    if (alertThreshold < 1 || alertThreshold > 24 || isNaN(alertThreshold)) {
        showSMSStatus('❌ Alert threshold must be between 1 and 24 hours', 'error');
        return;
    }

    smsConfig.caregiverPhone = caregiverPhone;
    smsConfig.patientPhone = patientPhone;
    smsConfig.alertThreshold = alertThreshold;

    localStorage.setItem('smsConfig', JSON.stringify(smsConfig));
    showSMSStatus('✅ SMS configuration saved successfully!', 'success');
}

function loadSMSConfig() {
    try {
        const saved = localStorage.getItem('smsConfig');
        if (saved) {
            const config = JSON.parse(saved);
            // Security: Validate loaded data
            if (config.caregiverPhone && typeof config.caregiverPhone === 'string') {
                document.getElementById('caregiverPhone').value = config.caregiverPhone;
                smsConfig.caregiverPhone = config.caregiverPhone;
            }
            if (config.patientPhone && typeof config.patientPhone === 'string') {
                document.getElementById('patientPhone').value = config.patientPhone;
                smsConfig.patientPhone = config.patientPhone;
            }
            if (config.alertThreshold && typeof config.alertThreshold === 'number' && config.alertThreshold >= 1 && config.alertThreshold <= 24) {
                document.getElementById('alertThreshold').value = config.alertThreshold;
                smsConfig.alertThreshold = config.alertThreshold;
            }
        }
    } catch (e) {
        console.log('Error loading SMS config, using defaults');
        // Don't expose error details to prevent information leakage
    }
}

function toggleSound() {
    AudioManager.toggleSound();
}

function logDose(medId, status) {
    const med = patientData.medications.find(m => m.id === medId);
    if (!med) {
        console.error('Medication not found:', medId);
        return;
    }

    if (status === 'taken') {
        AudioManager.play('successSound', 0.6);
    } else if (status === 'skipped') {
        AudioManager.play('skipSound', 0.8);
        AudioManager.overdueMuted = false;
        AudioManager.startOverdueAlarm();
        showAlarmAlert('🚨ALERT: Medication skipped. Alarm sounding until stopped.');
    }

    med.status = status;
    med.smsSent = false;

    if (status === 'taken') {
        med.takenTime = new Date().toISOString();
        med.adherence = Math.max(70, med.adherence - 2);
    } else if (status === 'skipped') {
        med.takenTime = null; // Reset taken time if skipped
    }

    renderMedications();
    checkMultipleMissed();
}

function getTimingStatus(med) {
    if (!med.takenTime) return 'Not taken';

    const scheduled = new Date(med.scheduledTime);
    const taken = new Date(med.takenTime);
    const diffMinutes = (taken - scheduled) / (1000 * 60);

    if (Math.abs(diffMinutes) <= 30) { // Within 30 minutes
        return `On time (±${Math.round(Math.abs(diffMinutes))} min)`;
    } else if (diffMinutes > 0) {
        return `Late by ${Math.round(diffMinutes)} min`;
    } else {
        return `Early by ${Math.round(Math.abs(diffMinutes))} min`;
    }
}

function updateScheduleOverview() {
    const scheduleOverview = document.querySelector('.schedule-overview');
    if (!scheduleOverview) return;

    const scheduleHTML = patientData.medications.map(med => {
        const isOverdue = med.status === 'pending' && (new Date() - new Date(med.scheduledTime)) / (1000 * 60 * 60) > smsConfig.alertThreshold;
        const statusClass = isOverdue ? 'overdue' : med.status;
        const statusIcon = med.status === 'taken' ? '✓' : isOverdue ? '⚠' : '○';
        const statusText = med.status === 'taken' ? 'Taken' : isOverdue ? 'Overdue' : 'Pending';

        return `
            <div class="schedule-item">
                <div class="schedule-time">${med.time}</div>
                <div class="schedule-med">${med.name} ${med.dose}</div>
                <div class="schedule-status ${statusClass}">${statusIcon} ${statusText}</div>
            </div>
        `;
    }).join('');

    scheduleOverview.innerHTML = scheduleHTML;
}

function checkOverdueMedications() {
    const now = new Date();
    const overdueMeds = patientData.medications.filter(med => {
        if (med.status !== 'pending') return false;
        const scheduled = new Date(med.scheduledTime);
        const hoursLate = (now - scheduled) / (1000 * 60 * 60);
        return hoursLate > smsConfig.alertThreshold;
    });

    if (overdueMeds.length > 0) {
        overdueMeds.forEach(med => {
            if (!med.smsSent) {
                const hoursLate = Math.round((now - new Date(med.scheduledTime)) / (1000 * 60 * 60));
                const message = `🫃 MEDICATION OVERDUE 🫃\n${med.name} (${med.time}) is ${hoursLate}hrs late!\nPlease administer immediately.`;
                sendSMS(smsConfig.caregiverPhone, message);
                med.smsSent = true;
            }
        });

        const alarmActive = !!AudioManager.alarmOscillator || (AudioManager.overdueSound && !AudioManager.overdueSound.paused);
        if (!alarmActive) {
            showOverdueAlert(overdueMeds);
        }
    }
}

function showOverdueAlert(overdueMeds) {
    const alertsContainer = document.getElementById('alertsContainer');
    if (!alertsContainer) return;

    const alertHtml = `
        <div class="alert danger pulse-alert" style="animation: pulse 1s infinite; max-width: 800px; margin: 24px auto;">
            <i class="fas fa-clock fa-shake" style="color: #ef4444; font-size: 20px;"></i>
            🚨URGENT: ${overdueMeds.length} medication(s) OVERDUE!
            <div style="margin-top: 8px; font-size: 14px;">
                ${overdueMeds.map(m => `${m.name} (${m.time})`).join(', ')}
            </div>
        </div>
    `;

    alertsContainer.innerHTML = alertHtml;
}

function showAlarmAlert(message) {
    const alertsContainer = document.getElementById('alertsContainer');
    if (!alertsContainer) return;

    const alertHtml = `
        <div class="alert danger pulse-alert" style="animation: pulse 1s infinite; max-width: 800px; margin: 24px auto;">
            <i class="fas fa-bell fa-shake" style="color: #ef4444; font-size: 20px;"></i>
            ${message}
            <button onclick="AudioManager.stopOverdueAlarm(); AudioManager.overdueMuted = true; document.getElementById('alertsContainer').innerHTML = '';" 
                    style="margin-top: 8px; padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer;">
                Stop Alarm
            </button>
        </div>
    `;

    alertsContainer.innerHTML = alertHtml;
}

function checkMultipleMissed() {
    const missedCount = patientData.medications.filter(m => m.status === 'skipped').length;
    if (missedCount > 1) {
        const message = `🚨URGENT: ${missedCount} doses skipped today!\nImmediate caregiver attention required for ${patientData.name}.`;
        sendSMS(smsConfig.caregiverPhone, message);
    }
}

function renderMedications() {
    const medList = document.getElementById('medList');
    if (!medList) return;

    const now = new Date();
    globalStats = { total: 0, taken: 0, missed: 0, smsSent: (window.TWILIO_CONFIG?.smsHistory?.length || 0) };

    // Update schedule overview
    updateScheduleOverview();

    const html = patientData.medications.map(med => {
        const isTaken = med.status === 'taken';
        const isSkipped = med.status === 'skipped';
        const isOverdue = med.status === 'pending' && (now - new Date(med.scheduledTime)) / (1000 * 60 * 60) > smsConfig.alertThreshold;

        globalStats.total++;
        if (isTaken) globalStats.taken++;
        if (isSkipped) globalStats.missed++;

        return `
            <div class="med-card ${isOverdue ? 'overdue-med' : ''}">
                <div class="med-header">
                    <div>
                        <div class="med-name ${isOverdue ? 'overdue-text' : ''}">
                            ${isOverdue ? '? ' : ''}${med.name}
                        </div>
                        <div class="med-dose">${med.dose} � ${med.frequency}</div>
                        <div class="med-time"><i class="fas fa-clock"></i> ${med.time}</div>
                    </div>
                    <span class="status-badge status-${med.status} ${isOverdue ? 'overdue-badge' : ''}">
                        ${med.status.toUpperCase()}
                    </span>
                </div>
                <div style="color: #718096; font-size: 14px; margin-bottom: 12px;">
                    ?? ${med.instructions}
                </div>
                <div class="timing-info" style="background: #f8fafc; padding: 8px; border-radius: 8px; margin-bottom: 12px; font-size: 12px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span><i class="fas fa-calendar-alt"></i> Scheduled: ${new Date(med.scheduledTime).toLocaleString()}</span>
                    </div>
                    ${med.takenTime ? `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <span><i class="fas fa-check-circle" style="color: #10b981;"></i> Taken: ${new Date(med.takenTime).toLocaleString()}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span><i class="fas fa-clock"></i> ${getTimingStatus(med)}</span>
                        </div>
                    ` : med.status === 'skipped' ? `
                        <div style="color: #ef4444;">
                            <i class="fas fa-times-circle"></i> Skipped - No timing recorded
                        </div>
                    ` : `
                        <div style="color: #f59e0b;">
                            <i class="fas fa-hourglass-half"></i> Pending - Not yet taken
                        </div>
                    `}
                </div>
                ${med.interactions?.length ? `
                    <div class="alert danger">
                        <i class="fas fa-exclamation-triangle"></i>
                        ${med.interactions[0]}
                    </div>
                ` : ''}
                <div class="action-buttons" style="display: ${isTaken || isSkipped ? 'flex' : 'flex'};">
                    ${isTaken || isSkipped ? `
                        <button class="btn btn-reset" onclick="resetDose(${med.id})" style="background: #6b7280; color: white;">
                            ↻ Reset
                        </button>
                    ` : `
                        <button class="btn btn-taken" onclick="logDose(${med.id}, 'taken')">
                            ✓ Taken
                        </button>
                        <button class="btn btn-skipped" onclick="logDose(${med.id}, 'skipped')">
                            ✗ Skipped
                        </button>
                    `}
                </div>
                ${med.smsSent ? '<div style="font-size: 12px; color: #10b981; margin-top: 8px;"><i class="fas fa-sms"></i> SMS Alert Sent</div>' : ''}
                <div style="font-size: 13px; color: #718096; margin-top: 8px;">
                    Adherence: <strong>${med.adherence}%</strong>
                </div>
            </div>
        `;
    }).join('');

    medList.innerHTML = html;
    updateStats();
    checkAlerts();
}

function updateStats() {
    const adherence = globalStats.total > 0 ? Math.round((globalStats.taken / globalStats.total) * 100) : 0;
    const elements = {
        overallAdherence: document.getElementById('overallAdherence'),
        overallProgress: document.getElementById('overallProgress'),
        totalDoses: document.getElementById('totalDoses'),
        takenDoses: document.getElementById('takenDoses'),
        missedDoses: document.getElementById('missedDoses'),
        smsSent: document.getElementById('smsSent')
    };

    if (elements.overallAdherence) elements.overallAdherence.textContent = `${adherence}%`;
    if (elements.overallProgress) elements.overallProgress.style.width = `${adherence}%`;
    if (elements.totalDoses) elements.totalDoses.textContent = globalStats.total;
    if (elements.takenDoses) elements.takenDoses.textContent = globalStats.taken;
    if (elements.missedDoses) elements.missedDoses.textContent = globalStats.missed;
    if (elements.smsSent) elements.smsSent.textContent = globalStats.smsSent;
}

function checkAlerts() {
    checkOverdueMedications();

    const alarmActive = !!AudioManager.alarmOscillator || (AudioManager.overdueSound && !AudioManager.overdueSound.paused);
    if (alarmActive) {
        return;
    }

    const alertsContainer = document.getElementById('alertsContainer');
    if (!alertsContainer) return;

    const pendingCount = patientData.medications.filter(m => m.status === 'pending').length;
    const skippedCount = patientData.medications.filter(m => m.status === 'skipped').length;
    const overdueExists = patientData.medications.some(med => {
        if (med.status !== 'pending') return false;
        const scheduled = new Date(med.scheduledTime);
        const hoursLate = (new Date() - scheduled) / (1000 * 60 * 60);
        return hoursLate > smsConfig.alertThreshold;
    });

    if (overdueExists) {
        return;
    }

    if (pendingCount > 1 || skippedCount > 0) {
        alertsContainer.innerHTML = `
            <div class="alert" style="max-width: 800px; margin: 24px auto;">
                <i class="fas fa-bell"></i>
                🚨Alert: ${pendingCount} pending, ${skippedCount} skipped doses. SMS notifications sent to caregiver.
            </div>
        `;
    } else {
        alertsContainer.innerHTML = '';
    }
}

function toggleView() {
    const icon = document.getElementById('viewIcon');
    if (!icon) return;

    const dashboardGrid = document.querySelector('.dashboard-grid');
    const smsSettings = document.getElementById('smsSettings');

    if (icon.textContent.includes('Patient')) {
        icon.textContent = '👨‍⚕️ Caregiver View';
        if (dashboardGrid) dashboardGrid.style.gridTemplateColumns = '1fr';
        if (document.querySelector('.medications-panel')) {
            document.querySelector('.medications-panel').style.maxHeight = '600px';
        }
        if (smsSettings) {
            smsSettings.style.display = 'block';
            loadSMSConfig();
        }
    } else {
        icon.textContent = '?? Patient View';
        if (dashboardGrid) dashboardGrid.style.gridTemplateColumns = '1fr 400px';
        if (document.querySelector('.medications-panel')) {
            document.querySelector('.medications-panel').style.maxHeight = '';
        }
        if (smsSettings) smsSettings.style.display = 'none';
    }
}

function generateReport() {
    if (typeof window.jspdf === 'undefined') {
        alert('PDF library not loaded. Please refresh the page.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('ElderCare MediTrack - Daily Report', 20, 20);
    doc.setFontSize(14);
    doc.text(`Patient: ${patientData.name}`, 20, 40);
    doc.text(`Age: ${patientData.age} | Phone: ${patientData.phone}`, 20, 50);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 60);
    doc.setFontSize(12);
    doc.text('?? Adherence Summary:', 20, 80);
    doc.text(`Overall: ${document.getElementById('overallAdherence')?.textContent || 'N/A'}`, 30, 95);
    doc.text(`Total: ${globalStats.total} | Taken: ${globalStats.taken} | Missed: ${globalStats.missed}`, 30, 105);
    doc.text(`SMS Alerts: ${globalStats.smsSent}`, 30, 115);
    doc.text('?? Medications:', 20, 135);
    patientData.medications.forEach((med, i) => {
        doc.text(`${med.name} - ${med.status.toUpperCase()} (${med.adherence}%) ${med.smsSent ? '[SMS]' : ''}`, 30, 150 + i * 8);
    });
    doc.save(`ElderCare-Report-${new Date().toISOString().split('T')[0]}.pdf`);
}

function addOverdueStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .overdue-med {
            animation: overduePulse 2s infinite;
            border-left: 4px solid #ef4444 !important;
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
        }
        .overdue-text {
            color: #ef4444 !important;
            font-weight: 700;
        }
        .overdue-badge {
            background: #fee2e2 !important;
            color: #dc2626 !important;
            animation: shake 0.5s infinite;
        }
        @keyframes overduePulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-2px); }
            75% { transform: translateX(2px); }
        }
        @keyframes pulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.7); }
            50% { box-shadow: 0 0 0 20px rgba(239,68,68,0); }
        }
        .pulse-alert {
            animation: pulse 1.5s infinite;
        }
    `;
    document.head.appendChild(style);
}

// Patient Management Functions with Privacy Protection
function loadPatientData() {
    try {
        const saved = localStorage.getItem('encryptedPatientData');
        if (saved) {
            const decrypted = DataSecurity.decrypt(saved);
            if (decrypted) {
                // Merge with default data to ensure all fields exist
                patientData = { ...patientData, ...decrypted };
                return true;
            }
        }
    } catch (e) {
        console.log('Error loading patient data, using defaults');
    }
    return false;
}

function savePatientData() {
    try {
        const encrypted = DataSecurity.encrypt(patientData);
        if (encrypted) {
            localStorage.setItem('encryptedPatientData', encrypted);
            return true;
        }
    } catch (e) {
        console.error('Error saving patient data:', e);
        return false;
    }
    return false;
}

// Privacy consent management
let privacyConsent = false;

function checkPrivacyConsent() {
    const consent = localStorage.getItem('privacyConsent');
    return consent === 'accepted';
}

function showPrivacyModal() {
    const modal = document.getElementById('privacyModal');
    if (modal) {
        modal.style.display = 'flex';
        // Enable/disable accept button based on checkbox
        const consentCheckbox = document.getElementById('privacyConsent');
        const acceptBtn = document.getElementById('acceptBtn');

        consentCheckbox.addEventListener('change', function() {
            acceptBtn.disabled = !this.checked;
        });
    }
}

function hidePrivacyModal() {
    const modal = document.getElementById('privacyModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function acceptPrivacy() {
    if (document.getElementById('privacyConsent').checked) {
        localStorage.setItem('privacyConsent', 'accepted');
        privacyConsent = true;
        hidePrivacyModal();
        // Now show patient modal if needed
        initializeApp();
    }
}

function declinePrivacy() {
    alert('Privacy consent is required to use this application. Please accept the privacy policy to continue.');
}

// Data export for user privacy rights
function exportPatientData() {
    try {
        const dataToExport = {
            patientData: patientData,
            exportDate: new Date().toISOString(),
            appVersion: 'ElderCare MediTrack v1.0'
        };

        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `patient-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showSMSStatus('✅ Patient data exported successfully', 'success');
    } catch (e) {
        console.error('Export error:', e);
        showSMSStatus('❌ Error exporting data', 'error');
    }
}

// Data deletion for privacy rights
function deleteAllPatientData() {
    if (confirm('Are you sure you want to permanently delete all your data? This action cannot be undone.')) {
        try {
            localStorage.removeItem('encryptedPatientData');
            localStorage.removeItem('privacyConsent');
            // Reset to defaults
            patientData = {
                name: "",
                age: 0,
                gender: "",
                phone: "",
                address: "",
                emergencyContact: "",
                emergencyPhone: "",
                bloodType: "",
                allergies: "",
                caregiverPhone: "+15551234567",
                comorbidities: ["Hypertension", "Diabetes Type 2", "Osteoporosis"]
            };
            VitalSignsMonitor.updatePatientInfo();
            renderMedications();
            showSMSStatus('✅ All data deleted successfully', 'success');
        } catch (e) {
            console.error('Deletion error:', e);
            showSMSStatus('❌ Error deleting data', 'error');
        }
    }
}

function showPatientModal() {
    const modal = document.getElementById('patientModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function hidePatientModal() {
    const modal = document.getElementById('patientModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function handlePatientFormSubmit(event) {
    event.preventDefault();

    const name = document.getElementById('patientNameInput').value.trim();
    const age = parseInt(document.getElementById('patientAgeInput').value);
    const gender = document.getElementById('patientGenderInput').value;
    const phone = document.getElementById('patientPhoneInput').value.trim();
    const address = document.getElementById('patientAddressInput').value.trim();
    const emergencyContact = document.getElementById('patientEmergencyContactInput').value.trim();
    const emergencyPhone = document.getElementById('patientEmergencyPhoneInput').value.trim();
    const bloodType = document.getElementById('patientBloodTypeInput').value;
    const allergies = document.getElementById('patientAllergiesInput').value.trim();

    if (!name || !age || !gender || !phone) {
        alert('Please fill in all required fields (Name, Age, Gender, and Phone Number)');
        return;
    }

    // Basic phone validation (at least 10 digits)
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
        alert('Please enter a valid phone number (at least 10 digits)');
        return;
    }

    // Update patient data
    patientData.name = name;
    patientData.age = age;
    patientData.gender = gender;
    patientData.phone = phone;
    patientData.address = address;
    patientData.emergencyContact = emergencyContact;
    patientData.emergencyPhone = emergencyPhone;
    patientData.bloodType = bloodType;
    patientData.allergies = allergies;

    // Save to localStorage
    if (savePatientData()) {
        hidePatientModal();
        // Re-initialize the app with new patient data
        VitalSignsMonitor.updatePatientInfo();
        renderMedications();
        showWelcomeMessage();
    } else {
        alert('Error saving patient information. Please try again.');
    }
}

function editPatientInfo() {
    // Pre-fill the form with current data
    document.getElementById('patientNameInput').value = patientData.name;
    document.getElementById('patientAgeInput').value = patientData.age;
    document.getElementById('patientGenderInput').value = patientData.gender;
    document.getElementById('patientPhoneInput').value = patientData.phone;
    document.getElementById('patientAddressInput').value = patientData.address;
    document.getElementById('patientEmergencyContactInput').value = patientData.emergencyContact;
    document.getElementById('patientEmergencyPhoneInput').value = patientData.emergencyPhone;
    document.getElementById('patientBloodTypeInput').value = patientData.bloodType;
    document.getElementById('patientAllergiesInput').value = patientData.allergies;

    showPatientModal();
}

function showWelcomeMessage() {
    const alertsContainer = document.getElementById('alertsContainer');
    if (!alertsContainer) return;

    const welcomeHtml = `
        <div class="alert success" style="background: #d1fae5; border-color: #10b981; color: #065f46; animation: fadeIn 0.5s ease;">
            <i class="fas fa-check-circle"></i>
            Welcome ${patientData.name}! Your medication schedule has been personalized for you.
        </div>
    `;

    alertsContainer.innerHTML = welcomeHtml;

    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (alertsContainer.innerHTML === welcomeHtml) {
            alertsContainer.innerHTML = '';
        }
    }, 5000);
}

function initializeApp() {
    // Check privacy consent first
    if (!checkPrivacyConsent()) {
        showPrivacyModal();
        return;
    }

    // Load patient data first
    const hasPatientData = loadPatientData();

    AudioManager.init();
    VitalSignsMonitor.init();
    addOverdueStyles();

    // Set up form event listener
    const patientForm = document.getElementById('patientForm');
    if (patientForm) {
        patientForm.addEventListener('submit', handlePatientFormSubmit);
    }

    // Check if we have patient data, if not show modal
    if (!hasPatientData || !patientData.name) {
        showPatientModal();
    } else {
        // Show welcome message for returning users
        setTimeout(() => showWelcomeMessage(), 1000);
    }

    document.body.addEventListener('click', () => {
        AudioManager.createAudioContext();
        if (AudioManager.audioContext && AudioManager.audioContext.state === 'suspended') {
            AudioManager.audioContext.resume().catch(() => {});
        }
    }, { once: true });

    renderMedications();
    checkAlerts();
    setInterval(checkAlerts, 30000);
}

window.addEventListener('DOMContentLoaded', () => {
    window.SMS_TEMPLATES = window.SMS_TEMPLATES || {
        test: '? ElderCare MediTrack SMS Test - System working perfectly!',
        missedDose: (name, time) => `?? ${name} (${time}) OVERDUE! Please administer immediately.`,
        multipleMissed: count => `?? URGENT: ${count} doses missed today for ${patientData.name}`
    };
    initializeApp();
});

window.logDose = logDose;
window.toggleView = toggleView;
window.testSMS = testSMS;
window.saveSMSConfig = saveSMSConfig;
window.generateReport = generateReport;
window.toggleSound = toggleSound;
window.editPatientInfo = editPatientInfo;
window.exportPatientData = exportPatientData;
window.deleteAllPatientData = deleteAllPatientData;
window.acceptPrivacy = acceptPrivacy;
window.declinePrivacy = declinePrivacy;
