import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/jsonDb.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Helper to resolve absolute paths robustly regardless of Passenger/cPanel working directory
function getProjectRoot(): string {
  try {
    if (typeof __dirname !== 'undefined') {
      if (path.basename(__dirname) === 'dist') {
        return path.join(__dirname, '..');
      }
      return __dirname;
    }
  } catch (e) {
    // ignore
  }
  return process.cwd();
}

const PROJECT_ROOT = getProjectRoot();

// Load environment variables
dotenv.config({ path: path.join(PROJECT_ROOT, '.env') });

// Setup Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to strip subfolder path (like /booking) for cPanel subdirectory deployments
app.use((req, res, next) => {
  if (req.url.startsWith('/booking')) {
    req.url = req.url.slice(8) || '/';
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Prevent browser and proxy/CDN caching of all dynamic database endpoints
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// Helper to simulate and/or send real emails via SMTP
async function sendSimulatedEmail(to: string, subject: string, htmlContent: string) {
  // Always log to internal database so it appears on the admin dashboard
  db.addEmailLog({
    to,
    subject,
    html: htmlContent
  });

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser || 'noreply@holidayrentals.com';

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      const info = await transporter.sendMail({
        from: `Holiday Rentals Booking <${smtpFrom}>`,
        to,
        subject,
        html: htmlContent
      });

      console.log(`[EMAIL SENDER] Real email sent to ${to} successfully! Message ID: ${info.messageId}`);
      if (smtpHost.includes('ethereal.email')) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`[EMAIL SENDER] 📬 View Ethereal Demo Email Inbox: ${previewUrl}`);
      }
    } catch (error: any) {
      console.error(`[EMAIL SENDER ERROR] Failed to send real email to ${to}:`, error.message);
    }
  } else {
    console.log(`[EMAIL SIMULATOR] Sent email to ${to} with subject: "${subject}" (Simulation Mode: SMTP credentials not fully configured).`);
  }
}

// Generate beautiful HTML templates for booking notifications
function generateBookingConfirmationHTML(booking: any, guest: any, room: any, property: any, payment?: any) {
  const isPartial = booking.payment_status === 'Partially Paid';
  const totalAmount = booking.total_amount;
  const paidAmount = payment ? payment.amount : booking.total_amount;
  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  return `
    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="color: #1e3a8a; margin: 0; font-size: 24px;">Holiday Rentals Booking Engine</h1>
        <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px;">Instant Booking Confirmation</p>
      </div>

      <p style="font-size: 16px; color: #334155;">Dear <strong>${guest.name}</strong>,</p>
      <p style="font-size: 15px; color: #475569; line-height: 1.5;">
        Thank you for booking with us! Your reservation is confirmed. Below are the details of your upcoming stay at <strong>${property.name}</strong>.
      </p>

      <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin: 24px 0; border: 1px solid #f1f5f9;">
        <h3 style="color: #0f172a; margin-top: 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Reservation Summary</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
          <tr>
            <td style="padding: 6px 0; font-weight: 600;">Booking ID:</td>
            <td style="padding: 6px 0; text-align: right; font-family: monospace; color: #2563eb; font-weight: bold;">${booking.id}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600;">Property:</td>
            <td style="padding: 6px 0; text-align: right;">${property.name}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600;">Address:</td>
            <td style="padding: 6px 0; text-align: right; color: #64748b; font-size: 12px;">${property.address}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600;">Room Type:</td>
            <td style="padding: 6px 0; text-align: right;">${room.name} (${room.type})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600;">Check-in Date:</td>
            <td style="padding: 6px 0; text-align: right; color: #16a34a; font-weight: 600;">${booking.check_in} (from 14:00)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600;">Check-out Date:</td>
            <td style="padding: 6px 0; text-align: right; color: #dc2626; font-weight: 600;">${booking.check_out} (by 11:00)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600;">Guests:</td>
            <td style="padding: 6px 0; text-align: right;">${booking.guests_count.adults} Adults, ${booking.guests_count.children} Children</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 16px; margin: 24px 0; border: 1px solid #dcfce7;">
        <h3 style="color: #166534; margin-top: 0; border-bottom: 1px solid #bbf7d0; padding-bottom: 8px;">Payment Details</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
          <tr>
            <td style="padding: 6px 0;">Total Room Charges:</td>
            <td style="padding: 6px 0; text-align: right;">₹${(booking.total_amount + booking.discount_amount).toFixed(2)}</td>
          </tr>
          ${booking.discount_amount > 0 ? `
          <tr>
            <td style="padding: 6px 0; color: #166534;">Promo Discount:</td>
            <td style="padding: 6px 0; text-align: right; color: #166534;">-₹${booking.discount_amount.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr style="border-top: 1px solid #bbf7d0; font-size: 15px; font-weight: bold; color: #14532d;">
            <td style="padding: 10px 0 6px 0;">Total Booking Cost:</td>
            <td style="padding: 10px 0 6px 0; text-align: right;">₹${booking.total_amount.toFixed(2)}</td>
          </tr>
          <tr style="border-top: 1px dashed #bbf7d0; font-size: 16px; font-weight: bold; color: #166534;">
            <td style="padding: 8px 0 4px 0;">Amount Paid:</td>
            <td style="padding: 8px 0 4px 0; text-align: right; color: #16a34a;">₹${paidAmount.toFixed(2)}</td>
          </tr>
          ${isPartial ? `
          <tr style="font-size: 15px; font-weight: bold; color: #b45309;">
            <td style="padding: 4px 0 4px 0;">Remaining Balance:</td>
            <td style="padding: 4px 0 4px 0; text-align: right;">₹${remainingAmount.toFixed(2)}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 8px 0 0 0; font-size: 11px; color: #166534; font-weight: 600;">Payment Status:</td>
            <td style="padding: 8px 0 0 0; text-align: right; font-size: 11px; font-weight: bold;">
              ${isPartial 
                ? `<span style="color: #b45309; background-color: #fef3c7; padding: 2px 8px; border-radius: 4px;">PARTIALLY PAID (Pay balance at check-in)</span>` 
                : `<span style="color: #15803d; background-color: #dcfce7; padding: 2px 8px; border-radius: 4px;">PAID IN FULL via Razorpay</span>`
              }
            </td>
          </tr>
        </table>
      </div>

      <p style="font-size: 14px; color: #64748b; line-height: 1.5; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px;">
        If you need to make modifications or cancel your booking, please call us at <strong>${property.contact_phone}</strong> or reply to this email at <strong>${property.contact_email}</strong>.
      </p>

      <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #94a3b8;">
        &copy; 2026 Holiday Rentals Max Channel & Booking Engine. Secured Relational Persistence System.
      </div>
    </div>
  `;
}

function generateBookingCancellationHTML(booking: any, guest: any, room: any, property: any) {
  return `
    <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #fecaca; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; border-bottom: 2px solid #ef4444; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="color: #991b1b; margin: 0; font-size: 24px;">Holiday Rentals Booking Engine</h1>
        <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Booking Cancelled</p>
      </div>

      <p style="font-size: 16px; color: #334155;">Dear <strong>${guest.name}</strong>,</p>
      <p style="font-size: 15px; color: #475569; line-height: 1.5;">
        As requested, your booking <strong>${booking.id}</strong> at <strong>${property.name}</strong> has been cancelled successfully.
      </p>

      <div style="background-color: #fef2f2; border-radius: 8px; padding: 16px; margin: 24px 0; border: 1px solid #fee2e2; font-size: 14px; color: #991b1b;">
        <strong>Refund Status:</strong> The full amount of <strong>₹${booking.total_amount.toFixed(2)}</strong> has been initiated for refund via your original Razorpay payment method. It will reflect in your account within 5-7 business days.
      </div>

      <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin: 24px 0; border: 1px solid #f1f5f9;">
        <h3 style="color: #0f172a; margin-top: 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Cancelled Reservation Summary</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
          <tr>
            <td style="padding: 6px 0; font-weight: 600;">Booking ID:</td>
            <td style="padding: 6px 0; text-align: right; font-family: monospace; color: #ef4444;">${booking.id}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600;">Property:</td>
            <td style="padding: 6px 0; text-align: right;">${property.name}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600;">Room Type:</td>
            <td style="padding: 6px 0; text-align: right;">${room.name}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: 600;">Check-in / Check-out:</td>
            <td style="padding: 6px 0; text-align: right;">${booking.check_in} to ${booking.check_out}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #94a3b8;">
        &copy; 2026 Holiday Rentals Max Channel & Booking Engine.
      </div>
    </div>
  `;
}

// --- API ENDPOINTS ---

// PROPERTIES
app.get('/api/properties', async (req, res) => {
  try {
    res.json(await db.getProperties());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/properties', async (req, res) => {
  try {
    const { name, location, address, description, image_url, contact_email, contact_phone, amenities, owner_id, map_url } = req.body;
    if (!name || !location || !address || !contact_email || !contact_phone) {
      return res.status(400).json({ error: 'Missing required property details.' });
    }
    const prop = await db.addProperty({
      name,
      location,
      address,
      description: description || '',
      image_url: image_url || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800',
      contact_email,
      contact_phone,
      amenities: amenities || [],
      owner_id: owner_id || null,
      map_url: map_url || ''
    });
    res.status(201).json(prop);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/properties/:id', async (req, res) => {
  try {
    const prop = await db.updateProperty(req.params.id, req.body);
    res.json(prop);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

app.delete('/api/properties/:id', async (req, res) => {
  try {
    await db.deleteProperty(req.params.id);
    res.json({ success: true, message: 'Property deleted and associated rooms deleted.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// IMAGE UPLOAD API (supports browsing & uploading images)
app.post('/api/upload', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Expecting base64 string like "data:image/jpeg;base64,..."
    const matches = image.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid image format. Must be base64 data URL.' });
    }

    const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const dirPath = path.join(PROJECT_ROOT, 'src/assets/images');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const filename = `uploaded_${Date.now()}_${Math.floor(Math.random() * 1000)}.${extension}`;
    const filePath = path.join(dirPath, filename);

    fs.writeFileSync(filePath, buffer);

    res.json({ url: `/src/assets/images/${filename}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// OWNERS
app.get('/api/owners', async (req, res) => {
  try {
    res.json(await db.getOwners());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/owners', async (req, res) => {
  try {
    const { name, email, phone, company } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Owner name and email are required.' });
    }
    const owner = await db.addOwner({
      name,
      email,
      phone: phone || '',
      company: company || ''
    });
    res.status(201).json(owner);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/owners/:id', async (req, res) => {
  try {
    const owner = await db.updateOwner(req.params.id, req.body);
    res.json(owner);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

app.delete('/api/owners/:id', async (req, res) => {
  try {
    await db.deleteOwner(req.params.id);
    res.json({ success: true, message: 'Owner deleted.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ROOMS
app.get('/api/rooms', async (req, res) => {
  try {
    res.json(await db.getRooms());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/rooms', async (req, res) => {
  try {
    const { property_id, name, type, base_price, capacity_adults, capacity_children, total_inventory, description, amenities, images } = req.body;
    if (!property_id || !name || !type || !base_price || !total_inventory) {
      return res.status(400).json({ error: 'Missing required room fields.' });
    }
    const room = await db.addRoom({
      property_id,
      name,
      type,
      base_price: Number(base_price),
      capacity_adults: Number(capacity_adults || 2),
      capacity_children: Number(capacity_children || 0),
      total_inventory: Number(total_inventory),
      description: description || '',
      amenities: amenities || [],
      images: images || ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=800']
    });
    res.status(201).json(room);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/rooms/:id', async (req, res) => {
  try {
    const room = await db.updateRoom(req.params.id, req.body);
    res.json(room);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

app.delete('/api/rooms/:id', async (req, res) => {
  try {
    await db.deleteRoom(req.params.id);
    res.json({ success: true, message: 'Room type deleted and overrides cleaned.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// RESTORE & SYNC ENHANCED PERSISTENCE
app.post('/api/restore-db', async (req, res) => {
  try {
    await db.restoreDatabase(req.body);
    res.json({ success: true, message: 'Database state successfully restored and synced on server.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reset-db', async (req, res) => {
  try {
    await db.resetToDefaults();
    res.json({ success: true, message: 'Database state successfully reset to original seed defaults.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// BOOKINGS
app.get('/api/bookings', async (req, res) => {
  try {
    res.json(await db.getBookings());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create atomic booking (Includes Razorpay mock verification)
app.post('/api/bookings', async (req, res) => {
  try {
    const result = await db.createBooking(req.body);

    if (!result.success) {
      return res.status(400).json({ error: 'Failed to create booking.' });
    }

    // Trigger confirmation email
    const booking = result.booking!;
    const guest = result.guest!;
    const rooms = await db.getRooms();
    const room = rooms.find(r => r.id === booking.room_id)!;
    const properties = await db.getProperties();
    const property = properties.find(p => p.id === booking.property_id)!;

    const emailHTML = generateBookingConfirmationHTML(booking, guest, room, property, result.payment);
    sendSimulatedEmail(guest.email, `Booking Confirmation: ${property.name} (#${booking.id})`, emailHTML);

    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/bookings/:id/status', async (req, res) => {
  try {
    const { status, payment_status } = req.body;
    const updated = await db.updateBookingStatus(req.params.id, status, payment_status);

    const guests = await db.getGuests();
    const guest = guests.find(g => g.id === updated.guest_id);
    if (guest) {
      const rooms = await db.getRooms();
      const room = rooms.find(r => r.id === updated.room_id)!;
      const properties = await db.getProperties();
      const property = properties.find(p => p.id === updated.property_id)!;

      if (status === 'Cancelled') {
        const emailHTML = generateBookingCancellationHTML(updated, guest, room, property);
        sendSimulatedEmail(guest.email, `Booking Cancelled: ${property.name} (#${updated.id})`, emailHTML);
      } else {
        // Trigger generic alert
        sendSimulatedEmail(
          guest.email,
          `Booking Status Update: ${property.name} (#${updated.id})`,
          `<h3>Hello ${guest.name},</h3><p>Your booking status has been updated to: <b>${status}</b>.</p><p>Thank you!</p>`
        );
      }
    }

    res.json(updated);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// GUESTS
app.get('/api/guests', async (req, res) => {
  try {
    res.json(await db.getGuests());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PAYMENTS
app.get('/api/payments', async (req, res) => {
  try {
    res.json(await db.getPayments());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// COUPONS
app.get('/api/coupons', async (req, res) => {
  try {
    res.json(await db.getCoupons());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/coupons', async (req, res) => {
  try {
    const coupon = await db.addCoupon(req.body);
    res.status(201).json(coupon);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/coupons/:id', async (req, res) => {
  try {
    await db.deleteCoupon(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// AVAILABILITY & OVERRIDES
app.get('/api/availability-overrides', async (req, res) => {
  try {
    res.json(await db.getAvailabilityOverrides());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/availability-overrides', async (req, res) => {
  try {
    const override = await db.setAvailabilityOverride(req.body);
    res.status(200).json(override);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CHANNEL SYNC
app.get('/api/sync-channels', async (req, res) => {
  try {
    res.json(await db.getSyncChannels());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sync-channels', async (req, res) => {
  try {
    const chan = await db.addSyncChannel(req.body);
    res.status(201).json(chan);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/sync-channels/:id', async (req, res) => {
  try {
    await db.deleteSyncChannel(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sync-channels/:id/trigger', async (req, res) => {
  try {
    const channel = await db.triggerSyncChannel(req.params.id);
    res.json(channel);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// EMAIL LOGS
app.get('/api/email-logs', async (req, res) => {
  try {
    res.json(await db.getEmailLogs());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// BOOKING STATS FOR DASHBOARD
app.get('/api/stats', async (req, res) => {
  try {
    res.json(await db.getBookingStats());
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ATOMIC ROOM AVAILABILITY FOR A SPECIFIC ROOM TYPE
app.get('/api/check-availability', async (req, res) => {
  const { roomId, checkIn, checkOut } = req.query;
  if (!roomId || !checkIn || !checkOut) {
    return res.status(400).json({ error: 'Missing parameters roomId, checkIn, checkOut.' });
  }
  try {
    const result = await db.checkRoomAvailability(roomId as string, checkIn as string, checkOut as string);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// MASTER SEARCH ENDPOINT (Multi-property and single-property search engine)
app.get('/api/search-rooms', async (req, res) => {
  try {
    const { propertyId, checkIn, checkOut, adults, children, couponCode } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({ error: 'Check-in and Check-out dates are required.' });
    }

    const rooms = await db.getRooms();
    const filteredRooms = rooms.filter(room => {
      // Filter by property if propertyId is provided (and not 'all')
      if (propertyId && propertyId !== 'all' && room.property_id !== propertyId) {
        return false;
      }
      // Capacity check
      const reqAdults = Number(adults || 1);
      const reqChildren = Number(children || 0);
      return room.capacity_adults >= reqAdults && (room.capacity_adults + room.capacity_children) >= (reqAdults + reqChildren);
    });

    // Check availability and pricing for each room type
    const results = await Promise.all(filteredRooms.map(async room => {
      const availCheck = await db.checkRoomAvailability(room.id, checkIn as string, checkOut as string);
      
      // Compute coupon discount if applicable
      let couponValid = false;
      let couponError = '';
      let discountAmount = 0;
      let finalPrice = availCheck.totalFinalPrice;

      if (couponCode) {
        const coupons = await db.getCoupons();
        const coupon = coupons.find(
          c => c.code.toUpperCase() === (couponCode as string).toUpperCase() && c.active
        );
        if (!coupon) {
          couponError = 'Invalid promo code.';
        } else {
          const todayStr = new Date().toISOString().split('T')[0];
          if (todayStr < coupon.start_date || todayStr > coupon.end_date) {
            couponError = 'Promo code expired or not active yet.';
          } else if (availCheck.totalFinalPrice < coupon.min_booking_amount) {
            couponError = `Minimum stay purchase amount of ₹${coupon.min_booking_amount} required.`;
          } else {
            couponValid = true;
            if (coupon.discount_type === 'Percentage') {
              discountAmount = parseFloat(((availCheck.totalFinalPrice * coupon.discount_value) / 100).toFixed(2));
            } else {
              discountAmount = coupon.discount_value;
            }
            finalPrice = Math.max(0, availCheck.totalFinalPrice - discountAmount);
          }
        }
      }

      return {
        room,
        isAvailable: availCheck.available,
        datesDetails: availCheck.datesDetails,
        totalBasePrice: availCheck.totalBasePrice,
        totalOriginalPrice: availCheck.totalFinalPrice, // before coupon
        discountAmount,
        totalFinalPrice: finalPrice, // after coupon
        couponValid,
        couponError,
        errors: availCheck.errors
      };
    }));

    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// RAZORPAY MOCK TRANSACTION CREATION
app.post('/api/razorpay/create-order', (req, res) => {
  const { amount, currency } = req.body;
  if (!amount) {
    return res.status(400).json({ error: 'Amount is required' });
  }
  const orderId = `order_rzp_${Date.now()}`;
  res.json({
    id: orderId,
    entity: 'order',
    amount: amount * 100, // paisa
    amount_paid: 0,
    amount_due: amount * 100,
    currency: currency || 'USD',
    receipt: `rcpt_${Date.now()}`,
    status: 'created',
    created_at: Math.floor(Date.now() / 1000)
  });
});

// VITE MIDDLEWARE CONFIGURATION FOR FULL-STACK
async function startServer() {
  // Serve the generated images and assets under /src/assets
  app.use('/src/assets', express.static(path.join(PROJECT_ROOT, 'src/assets')));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(PROJECT_ROOT, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (typeof PORT === 'string' && isNaN(Number(PORT))) {
    // Unix socket or pipe (common on cPanel / Passenger hosting)
    app.listen(PORT, () => {
      console.log(`Server running on Unix socket: ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  } else {
    // Standard TCP port
    const portNumber = typeof PORT === 'number' ? PORT : parseInt(PORT, 10);
    app.listen(portNumber, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${portNumber} in ${process.env.NODE_ENV || 'development'} mode`);
    });
  }
}

startServer();
