// Twilio Configuration - DEMO MODE (SMS disabled by default)
// SECURITY WARNING: Never expose real API credentials in client-side code!
// For production, move SMS functionality to a secure server-side API.
// To enable: Get credentials from https://console.twilio.com/
// But implement server-side SMS sending to protect your credentials.
window.TWILIO_CONFIG = {
    accountSid: 'YOUR_ACCOUNT_SID_HERE', // ⚠️ SECURITY RISK: Do not put real SID here!
    authToken: 'YOUR_AUTH_TOKEN_HERE',   // ⚠️ SECURITY RISK: Do not put real token here!
    phoneNumber: '+15551234567', // Your Twilio phone number
    enabled: false, // Set to true to enable real SMS (only if server-side implemented)
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