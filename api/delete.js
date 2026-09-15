import crypto from 'crypto';

export default async function handler(req, res) {
    // รับเฉพาะคำสั่ง POST
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    
    const { public_id } = req.body;
    if (!public_id) return res.status(400).json({ error: 'Missing public_id' });

    // ดึงรหัสผ่านจาก Vercel Environment Variables
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // สร้างลายเซ็นดิจิทัล (Signature) เพื่อยืนยันสิทธิ์กับ Cloudinary
    const stringToSign = `public_id=${public_id}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

    // เตรียมข้อมูลส่งไปลบ
    const formData = new URLSearchParams();
    formData.append('public_id', public_id);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);

    try {
        // ยิงคำสั่งทำลายไฟล์ (Destroy) ไปที่ Cloudinary
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}