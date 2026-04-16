// Twilio Configuration - DEMO MODE (SMS disabled by default)
// To enable: Get credentials from https://console.twilio.com/
window.TWILIO_CONFIG = {
    accountSid: 'YOUR_ACCOUNT_SID_HERE',
    authToken: 'YOUR_AUTH_TOKEN_HERE',
    phoneNumber: '+15551234567', // Your Twilio phone number
    enabled: false, // Set to true to enable real SMS
    smsHistory: []
};

// SMS Message Templates (fallback)
if (!window.SMS_TEMPLATES) {
    window.SMS_TEMPLATES = {
        missedDose: (medName, time) => 
            `🚨 MEDICATION ALERT 🚨\n${medName} (${time}) is now overdue.\nPlease take medication immediately.`,
        multipleMissed: (count) => 
            `🚨 URGENT ALERT 🚨\n${count} doses missed today.\nPlease check on patient immediately.`,
        test: '✅ ElderCare MediTrack SMS Test - System working correctly!'
    };
}