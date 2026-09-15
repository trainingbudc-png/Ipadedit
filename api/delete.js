const crypto = require('crypto');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    const { public_id } = req.body;
    
    // 🔍 พิมพ์เช็กว่าได้รับชื่อไฟล์มาถูกต้องไหม
    console.log("👉 1. กำลังพยายามลบไฟล์ (public_id):", public_id || "ไม่ได้รับค่า");

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // 🔍 พิมพ์เช็กว่า Vercel มองเห็นรหัสผ่านไหม (ถ้าเห็นจะขึ้น OK ถ้าไม่เห็นจะขึ้น MISSING)
    console.log("👉 2. เช็ก Environment Variables:");
    console.log("- Cloud Name:", cloudName ? "✅ OK" : "❌ MISSING");
    console.log("- API Key:", apiKey ? "✅ OK" : "❌ MISSING");
    console.log("- API Secret:", apiSecret ? "✅ OK" : "❌ MISSING");

    if (!cloudName || !apiKey || !apiSecret) {
        console.error("🚨 สรุป: Vercel หา Environment Variables ไม่เจอครับ!");
        return res.status(500).json({ error: 'Missing Cloudinary Environment Variables' });
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const stringToSign = `public_id=${public_id}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    const formData = new URLSearchParams();
    formData.append('public_id', public_id);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);

    try {
        console.log("👉 3. กำลังส่งคำสั่งไปที่ Cloudinary...");
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        
        console.log("👉 4. ผลลัพธ์จาก Cloudinary:", result);
        return res.status(200).json({ sent_public_id: public_id, cloudinary_response: result });
    } catch (error) {
        console.error("🚨 Error ตอนยิง Fetch:", error.message);
        return res.status(500).json({ error: error.message });
    }
}
