const crypto = require('crypto');

module.exports = async function handler(req, res) {
    // รับเฉพาะคำสั่ง POST เท่านั้น
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    const { public_id } = req.body;
    if (!public_id) {
        return res.status(400).json({ error: 'Missing public_id' });
    }

    // ดึงรหัสผ่านจาก Vercel Environment Variables
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // ถ้าหาตัวแปรไม่เจอ ให้แจ้ง Error บอกสาเหตุ
    if (!cloudName || !apiKey || !apiSecret) {
        return res.status(500).json({ 
            error: 'Server Error: ไม่พบรหัสผ่าน Cloudinary. กรุณาเช็ก Environment Variables ใน Vercel และกด Redeploy' 
        });
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // สร้าง Signature ดิจิทัล
    const stringToSign = `public_id=${public_id}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    const formData = new URLSearchParams();
    formData.append('public_id', public_id);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);

    try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        
        return res.status(200).json({ 
            sent_public_id: public_id, 
            cloudinary_response: result 
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
