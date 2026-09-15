import crypto from 'crypto';

export default async function handler(req, res) {
    // รับเฉพาะคำสั่ง POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }
    
    const { public_id } = req.body;
    if (!public_id) {
        return res.status(400).json({ error: 'Missing public_id' });
    }

    // ดึงค่า Environment Variables จาก Vercel
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        return res.status(500).json({ error: 'Missing Cloudinary environment variables in Vercel' });
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // สร้าง Signature สำหรับ Cloudinary
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
        
        // ส่งผลลัพธ์กลับไปให้ฝั่งหน้าเว็บ (ไว้ดูใน Console)
        return res.status(200).json({ 
            sent_public_id: public_id, 
            cloudinary_response: result 
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
