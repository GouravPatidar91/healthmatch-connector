import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Manual PNG decoder - parse IDAT chunks and inflate to get raw pixel data
async function decodePNG(buffer: ArrayBuffer): Promise<{ width: number; height: number; data: Uint8ClampedArray } | null> {
  try {
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);
    
    // Verify PNG signature
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    for (let i = 0; i < 8; i++) {
      if (bytes[i] !== signature[i]) {
        console.log('Not a valid PNG file');
        return null;
      }
    }

    let offset = 8;
    let width = 0;
    let height = 0;
    let bitDepth = 0;
    let colorType = 0;
    const idatChunks: Uint8Array[] = [];

    while (offset < bytes.length) {
      const length = view.getUint32(offset);
      const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);

      if (type === 'IHDR') {
        width = view.getUint32(offset + 8);
        height = view.getUint32(offset + 12);
        bitDepth = bytes[offset + 16];
        colorType = bytes[offset + 17];
        console.log(`PNG IHDR: ${width}x${height}, bitDepth=${bitDepth}, colorType=${colorType}`);
      } else if (type === 'IDAT') {
        idatChunks.push(bytes.slice(offset + 8, offset + 8 + length));
      } else if (type === 'IEND') {
        break;
      }

      offset += 12 + length; // 4 (length) + 4 (type) + data + 4 (crc)
    }

    if (width === 0 || height === 0 || idatChunks.length === 0) {
      console.log('Missing PNG data');
      return null;
    }

    // Concatenate IDAT chunks
    const totalLen = idatChunks.reduce((s, c) => s + c.length, 0);
    const compressed = new Uint8Array(totalLen);
    let pos = 0;
    for (const chunk of idatChunks) {
      compressed.set(chunk, pos);
      pos += chunk.length;
    }

    // Decompress using DecompressionStream (available in Deno)
    const ds = new DecompressionStream('deflate');
    const writer = ds.writable.getWriter();
    const reader = ds.readable.getReader();

    // Write compressed data (skip zlib header - first 2 bytes)
    // Actually, 'deflate' format in DecompressionStream handles raw deflate,
    // but PNG uses zlib (deflate with zlib wrapper). Let's try 'deflate' which 
    // should handle zlib-wrapped data in most runtimes.
    
    const readAll = async () => {
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      const total = chunks.reduce((s, c) => s + c.length, 0);
      const result = new Uint8Array(total);
      let o = 0;
      for (const c of chunks) {
        result.set(c, o);
        o += c.length;
      }
      return result;
    };

    writer.write(compressed);
    writer.close();
    const decompressed = await readAll();

    console.log(`Decompressed ${decompressed.length} bytes for ${width}x${height} image`);

    // Determine bytes per pixel
    let bpp: number;
    switch (colorType) {
      case 0: bpp = 1; break; // Grayscale
      case 2: bpp = 3; break; // RGB
      case 4: bpp = 2; break; // Grayscale + Alpha
      case 6: bpp = 4; break; // RGBA
      default:
        console.log(`Unsupported color type: ${colorType}`);
        return null;
    }
    if (bitDepth !== 8) {
      console.log(`Unsupported bit depth: ${bitDepth}`);
      return null;
    }

    const scanlineBytes = width * bpp;
    const rgba = new Uint8ClampedArray(width * height * 4);

    // Unfilter scanlines
    const prevRow = new Uint8Array(scanlineBytes);
    let srcOffset = 0;

    for (let y = 0; y < height; y++) {
      const filterType = decompressed[srcOffset++];
      const row = decompressed.slice(srcOffset, srcOffset + scanlineBytes);
      srcOffset += scanlineBytes;

      // Apply filter
      for (let x = 0; x < scanlineBytes; x++) {
        const a = x >= bpp ? row[x - bpp] : 0;
        const b = prevRow[x];
        const c = (x >= bpp) ? prevRow[x - bpp] : 0;

        switch (filterType) {
          case 0: break; // None
          case 1: row[x] = (row[x] + a) & 0xFF; break; // Sub
          case 2: row[x] = (row[x] + b) & 0xFF; break; // Up
          case 3: row[x] = (row[x] + Math.floor((a + b) / 2)) & 0xFF; break; // Average
          case 4: { // Paeth
            const p = a + b - c;
            const pa = Math.abs(p - a);
            const pb = Math.abs(p - b);
            const pc = Math.abs(p - c);
            const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
            row[x] = (row[x] + pr) & 0xFF;
            break;
          }
        }
      }

      prevRow.set(row);

      // Convert to RGBA
      for (let x = 0; x < width; x++) {
        const dstIdx = (y * width + x) * 4;
        if (colorType === 6) { // RGBA
          rgba[dstIdx] = row[x * 4];
          rgba[dstIdx + 1] = row[x * 4 + 1];
          rgba[dstIdx + 2] = row[x * 4 + 2];
          rgba[dstIdx + 3] = row[x * 4 + 3];
        } else if (colorType === 2) { // RGB
          rgba[dstIdx] = row[x * 3];
          rgba[dstIdx + 1] = row[x * 3 + 1];
          rgba[dstIdx + 2] = row[x * 3 + 2];
          rgba[dstIdx + 3] = 255;
        } else if (colorType === 0) { // Grayscale
          rgba[dstIdx] = rgba[dstIdx + 1] = rgba[dstIdx + 2] = row[x];
          rgba[dstIdx + 3] = 255;
        } else if (colorType === 4) { // Grayscale + Alpha
          rgba[dstIdx] = rgba[dstIdx + 1] = rgba[dstIdx + 2] = row[x * 2];
          rgba[dstIdx + 3] = row[x * 2 + 1];
        }
      }
    }

    return { width, height, data: rgba };
  } catch (e) {
    console.error('PNG decode error:', e);
    return null;
  }
}

// Minimal jsQR implementation - scan for QR finder patterns and decode
// Since jsQR via esm.sh fails in Deno, we use a different strategy:
// Import jsQR with ?bundle flag for proper CJS bundling
let jsQR: any = null;
try {
  const mod = await import("https://esm.sh/jsqr@1.4.0?bundle&target=deno");
  jsQR = mod.default || mod;
  console.log('jsQR loaded successfully, type:', typeof jsQR);
} catch (e) {
  console.error('Failed to load jsQR:', e);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, appointment_id, doctor_name, patient_name } = await req.json();

    if (!amount || !appointment_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID');
    const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured');
    }

    const authHeader = 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

    // Create Razorpay QR Code
    const response = await fetch('https://api.razorpay.com/v1/payments/qr_codes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        type: 'upi_qr',
        name: `Dr. ${doctor_name || 'Doctor'} - Consultation`,
        usage: 'single_use',
        fixed_amount: true,
        payment_amount: Math.round(amount * 100),
        description: `Consultation fee for ${patient_name || 'Patient'}`,
        customer_id: undefined,
        close_by: Math.floor(Date.now() / 1000) + 1800,
        notes: {
          appointment_id,
          type: 'clinic_qr_payment',
          doctor_name: doctor_name || '',
          patient_name: patient_name || '',
        },
      }),
    });

    const qrCode = await response.json();

    if (!response.ok) {
      console.error('Razorpay QR Code creation failed:', qrCode);
      throw new Error(qrCode.error?.description || 'Failed to create QR code');
    }

    console.log('Razorpay QR Code created:', qrCode.id);

    // === DECODE BRANDED QR IMAGE TO EXTRACT RAW UPI STRING ===
    let qrContent = '';

    // Method 1: Decode the branded PNG image
    try {
      console.log('Fetching QR image from:', qrCode.image_url);
      const imgRes = await fetch(qrCode.image_url);
      
      if (!imgRes.ok) {
        console.log('Image fetch failed:', imgRes.status);
      } else {
        const imgBuffer = await imgRes.arrayBuffer();
        console.log('Image fetched, size:', imgBuffer.byteLength, 'bytes');

        const decoded = await decodePNG(imgBuffer);
        
        if (decoded && jsQR) {
          console.log(`Decoded PNG: ${decoded.width}x${decoded.height}, pixel data length: ${decoded.data.length}`);
          const result = jsQR(decoded.data, decoded.width, decoded.height);
          
          if (result && result.data) {
            qrContent = result.data;
            console.log('SUCCESS - Decoded QR content:', qrContent.substring(0, 100));
          } else {
            console.log('jsQR returned no result from decoded image');
          }
        } else {
          console.log('PNG decode or jsQR unavailable. decoded:', !!decoded, 'jsQR:', !!jsQR);
        }
      }
    } catch (e) {
      console.error('Method 1 (image decode) failed:', e);
    }

    // Method 2: If image decode failed, try fetching QR details from Razorpay
    if (!qrContent) {
      try {
        console.log('Method 2: Fetching QR details from Razorpay API...');
        const detailRes = await fetch(`https://api.razorpay.com/v1/payments/qr_codes/${qrCode.id}`, {
          headers: { 'Authorization': authHeader },
        });
        const detail = await detailRes.json();
        console.log('QR detail fields:', JSON.stringify(Object.keys(detail)));
        
        // Check if there's any content/payload field
        if (detail.content) {
          qrContent = detail.content;
          console.log('Got qr_content from detail.content');
        } else if (detail.qr_string) {
          qrContent = detail.qr_string;
          console.log('Got qr_content from detail.qr_string');
        }
      } catch (e) {
        console.error('Method 2 (API detail) failed:', e);
      }
    }

    console.log('Final qr_content available:', qrContent ? 'YES' : 'NO', qrContent ? `(${qrContent.length} chars)` : '');

    // Store the QR code ID on the appointment
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, supabaseKey);

    await supabase
      .from('appointments')
      .update({
        razorpay_order_id: qrCode.id,
        payment_amount: amount,
      })
      .eq('id', appointment_id);

    return new Response(JSON.stringify({
      qr_code_id: qrCode.id,
      image_url: qrCode.image_url,
      qr_content: qrContent,
      amount: qrCode.payment_amount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
