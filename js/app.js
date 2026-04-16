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
        button.textContent = this.soundEnabled ? '?? Sound ON' : '?? Sound OFF';
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

const patientData = {
    name: "Mrs. Eleanor Johnson",
    age: 78,
    phone: "+15559876543",
    caregiverPhone: "+15551234567",
    comorbidities: ["Hypertension", "Diabetes Type 2", "Osteoporosis"],
    medications: [
        {
            id: 1,
            name: "Paracetamol",
            dose: "500mg",
            time: "9:00 AM",
            scheduledTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            frequency: "Daily",
            instructions: "Take with water",
            status: "pending",
            adherence: 100,
            interactions: [],
            smsSent: false
        },
        {
            id: 2,
            name: "Amlodipine",
            dose: "5mg",
            time: "10:00 AM",
            scheduledTime: "2024-01-15T10:00:00",
            frequency: "Daily",
            instructions: "Take with breakfast",
            status: "taken",
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

async function sendSMS(to, message) {
    console.log('?? Sending SMS to:', to);
    console.log('?? Message:', message);

    await new Promise(resolve => setTimeout(resolve, 1500));
    const fakeSid = 'SM' + Math.random().toString(36).substr(2, 8).toUpperCase();

    window.TWILIO_CONFIG = window.TWILIO_CONFIG || { smsHistory: [] };
    window.TWILIO_CONFIG.smsHistory.push({
        to,
        message,
        sid: fakeSid,
        date: new Date().toISOString()
    });

    showSMSStatus(`? SMS sent successfully to ${to} (SID: ${fakeSid})`, 'success');
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
    smsConfig.caregiverPhone = document.getElementById('caregiverPhone')?.value || smsConfig.caregiverPhone;
    smsConfig.patientPhone = document.getElementById('patientPhone')?.value || smsConfig.patientPhone;
    smsConfig.alertThreshold = parseInt(document.getElementById('alertThreshold')?.value, 10) || 2;

    localStorage.setItem('smsConfig', JSON.stringify(smsConfig));
    showSMSStatus('? SMS configuration saved successfully!', 'success');
}

function loadSMSConfig() {
    try {
        const saved = localStorage.getItem('smsConfig');
        if (saved) {
            const config = JSON.parse(saved);
            document.getElementById('caregiverPhone').value = config.caregiverPhone || smsConfig.caregiverPhone;
            document.getElementById('patientPhone').value = config.patientPhone || smsConfig.patientPhone;
            document.getElementById('alertThreshold').value = config.alertThreshold || 2;
            Object.assign(smsConfig, config);
        }
    } catch (e) {
        console.log('No saved SMS config found');
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
        showAlarmAlert('?? ALERT: Medication skipped. Alarm sounding until stopped.');
    }

    med.status = status;
    med.smsSent = false;

    if (status === 'taken') {
        med.adherence = Math.max(70, med.adherence - 2);
    }

    renderMedications();
    checkMultipleMissed();
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
                const message = `?? MEDICATION OVERDUE ??\n${med.name} (${med.time}) is ${hoursLate}hrs late!\nPlease administer immediately.`;
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
            ?? URGENT: ${overdueMeds.length} medication(s) OVERDUE!
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
        const message = `?? URGENT: ${missedCount} doses skipped today!\nImmediate caregiver attention required for ${patientData.name}.`;
        sendSMS(smsConfig.caregiverPhone, message);
    }
}

function renderMedications() {
    const medList = document.getElementById('medList');
    if (!medList) return;

    const now = new Date();
    globalStats = { total: 0, taken: 0, missed: 0, smsSent: (window.TWILIO_CONFIG?.smsHistory?.length || 0) };

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
                ${med.interactions?.length ? `
                    <div class="alert danger">
                        <i class="fas fa-exclamation-triangle"></i>
                        ${med.interactions[0]}
                    </div>
                ` : ''}
                <div class="action-buttons" style="display: ${isTaken || isSkipped ? 'none' : 'flex'};">
                    <button class="btn btn-taken" onclick="logDose(${med.id}, 'taken')">
                        ? Taken
                    </button>
                    <button class="btn btn-skipped" onclick="logDose(${med.id}, 'skipped')">
                        ?? Skipped
                    </button>
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
                ?? Alert: ${pendingCount} pending, ${skippedCount} skipped doses. SMS notifications sent to caregiver.
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
        icon.textContent = '????? Caregiver View';
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

function initializeApp() {
    AudioManager.init();
    addOverdueStyles();

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
