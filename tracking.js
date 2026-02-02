// tracking.js
// تأكد أن هذا الرابط هو رابط السيرفر الخاص بك
// محلياً: http://localhost:5000/api/track
// VPS: http://IP_ADDRESS:5000/api/track
const SERVER_URL = "http://localhost:5000/api/track";

async function sendTracking() {
    let ipInfo = { ip: 'Unknown', country_name: '-', city: '-' };
    
    try {
        const res = await fetch('https://ipapi.co/json/');
        if(res.ok) ipInfo = await res.json();
    } catch(e) {}

    const payload = {
        ip: ipInfo.ip,
        country: ipInfo.country_name,
        city: ipInfo.city,
        page: document.title
    };

    fetch(SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(err => console.log('Server Offline'));
}

// تشغيل التتبع عند فتح الصفحة
sendTracking();
