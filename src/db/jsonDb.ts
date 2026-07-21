import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';
import mysql from 'mysql2/promise';
import {
  Property,
  Room,
  Guest,
  Booking,
  Payment,
  Coupon,
  AvailabilityOverride,
  CalendarSyncChannel,
  EmailLog,
  BookingStatus,
  PaymentStatus,
  BookingStats,
  Owner
} from '../types';

interface DBStructure {
  properties: Property[];
  rooms: Room[];
  guests: Guest[];
  bookings: Booking[];
  payments: Payment[];
  coupons: Coupon[];
  availabilityOverrides: AvailabilityOverride[];
  syncChannels: CalendarSyncChannel[];
  emailLogs: EmailLog[];
  owners?: Owner[];
}

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

const DB_FILE_PATH = path.join(PROJECT_ROOT, 'db.json');

// Auto-cleanup helper for base64 image strings to convert them to static files
function cleanBase64Image(imgStr: string): string {
  if (!imgStr || !imgStr.startsWith('data:image/')) {
    return imgStr;
  }
  try {
    const matches = imgStr.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return imgStr;
    }
    const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const dirPath = path.join(PROJECT_ROOT, 'src/assets/images');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const filename = `uploaded_converted_${Date.now()}_${Math.floor(Math.random() * 1000)}.${extension}`;
    const filePath = path.join(dirPath, filename);

    fs.writeFileSync(filePath, buffer);
    console.log(`[DATABASE AUTO-CLEANUP] Converted base64 image to static file: /src/assets/images/${filename}`);
    return `/src/assets/images/${filename}`;
  } catch (err: any) {
    console.error('[DATABASE AUTO-CLEANUP] Failed to convert base64 image:', err.message);
    return imgStr;
  }
}

function cleanPropertyImageUrl(imageUrl: string): string {
  if (!imageUrl) return '';
  const urls = imageUrl.split(',');
  const cleanedUrls = urls.map(url => cleanBase64Image(url.trim()));
  return cleanedUrls.join(',');
}

function cleanRoomImages(images: string[]): string[] {
  if (!images || !Array.isArray(images)) return [];
  return images.map(url => cleanBase64Image(url));
}

// MySQL Table Schemas
const SCHEMA_QUERIES = [
  // 1. owners
  `CREATE TABLE IF NOT EXISTS owners (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    password VARCHAR(255) NULL
  )`,
  
  // 2. properties
  `CREATE TABLE IF NOT EXISTS properties (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(255) NOT NULL,
    amenities TEXT NOT NULL,
    owner_id VARCHAR(255) NULL,
    map_url TEXT NULL,
    FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE SET NULL
  )`,

  // 3. rooms
  `CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(255) PRIMARY KEY,
    property_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    capacity_adults INT NOT NULL,
    capacity_children INT NOT NULL,
    total_inventory INT NOT NULL,
    description TEXT NOT NULL,
    amenities TEXT NOT NULL,
    images TEXT NOT NULL,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
  )`,

  // 4. guests
  `CREATE TABLE IF NOT EXISTS guests (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    address TEXT NOT NULL
  )`,

  // 5. coupons
  `CREATE TABLE IF NOT EXISTS coupons (
    id VARCHAR(255) PRIMARY KEY,
    code VARCHAR(255) NOT NULL,
    discount_type VARCHAR(50) NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    min_booking_amount DECIMAL(10,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    active BOOLEAN NOT NULL,
    UNIQUE(code)
  )`,

  // 6. bookings
  `CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(255) PRIMARY KEY,
    property_id VARCHAR(255) NOT NULL,
    room_id VARCHAR(255) NOT NULL,
    guest_id VARCHAR(255) NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    coupon_id VARCHAR(255) NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) NOT NULL,
    guests_count TEXT NOT NULL,
    created_at VARCHAR(255) NOT NULL,
    notes TEXT NOT NULL,
    sync_source VARCHAR(255) NULL,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (guest_id) REFERENCES guests(id) ON DELETE CASCADE
  )`,

  // 7. payments
  `CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(255) PRIMARY KEY,
    booking_id VARCHAR(255) NOT NULL,
    gateway_payment_id VARCHAR(255) NOT NULL,
    gateway_order_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    method VARCHAR(50) NOT NULL,
    created_at VARCHAR(255) NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
  )`,

  // 8. availability_overrides
  `CREATE TABLE IF NOT EXISTS availability_overrides (
    id VARCHAR(255) PRIMARY KEY,
    room_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    price_override DECIMAL(10,2) NULL,
    is_blackout BOOLEAN NOT NULL,
    notes TEXT NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    UNIQUE KEY room_date (room_id, date)
  )`,

  // 9. sync_channels
  `CREATE TABLE IF NOT EXISTS sync_channels (
    id VARCHAR(255) PRIMARY KEY,
    room_id VARCHAR(255) NOT NULL,
    channel_name VARCHAR(255) NOT NULL,
    ical_url TEXT NOT NULL,
    last_sync_time VARCHAR(255) NULL,
    sync_status VARCHAR(50) NULL,
    sync_logs TEXT NOT NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
  )`,

  // 10. email_logs
  `CREATE TABLE IF NOT EXISTS email_logs (
    id VARCHAR(255) PRIMARY KEY,
    \`to\` VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    html TEXT NOT NULL,
    sent_at VARCHAR(255) NOT NULL
  )`
];

// Helper to safely format Date fields coming from MySQL
function formatDate(d: any): string {
  if (!d) return '';
  if (typeof d === 'string') {
    return d.split('T')[0];
  }
  if (d instanceof Date) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(d);
}

class Database {
  private data: DBStructure;
  private pool: mysql.Pool | null = null;
  public useMySQL = false;

  constructor() {
    this.data = {
      properties: [],
      rooms: [],
      guests: [],
      bookings: [],
      payments: [],
      coupons: [],
      availabilityOverrides: [],
      syncChannels: [],
      emailLogs: [],
      owners: []
    };

    const mysqlHost = process.env.MYSQL_HOST || process.env.DB_HOST;
    if (mysqlHost) {
      console.log(`[DATABASE] Found MySQL Host: ${mysqlHost}. Attempting connection...`);
      try {
        this.pool = mysql.createPool({
          host: mysqlHost,
          port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306,
          user: process.env.MYSQL_USER || 'root',
          password: process.env.MYSQL_PASSWORD || '',
          database: process.env.MYSQL_DATABASE || 'holidayrentals',
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        });
        this.useMySQL = true;
        this.initMySQL();
      } catch (err: any) {
        console.error('[DATABASE ERROR] Failed to connect to MySQL, falling back to JSON:', err.message);
        this.useMySQL = false;
        this.loadJSON();
      }
    } else {
      console.log('[DATABASE] MySQL not configured. Running in JSON persistence mode.');
      this.useMySQL = false;
      this.loadJSON();
    }
  }

  // --- MYSQL INITIALIZATION ---
  private async initMySQL() {
    try {
      console.log('[DATABASE] Initializing MySQL tables and running migrations...');
      for (const sql of SCHEMA_QUERIES) {
        await this.pool!.query(sql);
      }
      console.log('[DATABASE] MySQL tables initialized successfully.');
      await this.seedMySQLIfNeeded();
      await this.cleanMySQLBase64Images();
    } catch (err: any) {
      console.error('[DATABASE ERROR] Failed to initialize MySQL schema:', err.message);
      console.log('[DATABASE] Falling back to JSON local file mode.');
      this.useMySQL = false;
      this.loadJSON();
    }
  }

  private async cleanMySQLBase64Images() {
    try {
      console.log('[DATABASE] Scanning MySQL tables for legacy base64 images...');
      // 1. Clean properties image_url
      const [properties]: any = await this.pool!.query('SELECT id, image_url FROM properties');
      for (const p of properties) {
        if (p.image_url && p.image_url.includes('data:image/')) {
          const cleaned = cleanPropertyImageUrl(p.image_url);
          if (cleaned !== p.image_url) {
            await this.pool!.query('UPDATE properties SET image_url = ? WHERE id = ?', [cleaned, p.id]);
          }
        }
      }

      // 2. Clean rooms images
      const [rooms]: any = await this.pool!.query('SELECT id, images FROM rooms');
      for (const r of rooms) {
        let imagesList: string[] = [];
        try {
          imagesList = typeof r.images === 'string' ? JSON.parse(r.images) : r.images;
        } catch {
          // fallback
        }
        if (imagesList && Array.isArray(imagesList) && imagesList.some(img => img.startsWith('data:image/'))) {
          const cleaned = cleanRoomImages(imagesList);
          await this.pool!.query('UPDATE rooms SET images = ? WHERE id = ?', [JSON.stringify(cleaned), r.id]);
        }
      }
      console.log('[DATABASE] MySQL image cleanup scan completed.');
    } catch (err: any) {
      console.error('[DATABASE AUTO-CLEANUP] MySQL image cleanup failed:', err.message);
    }
  }

  private async seedMySQLIfNeeded() {
    try {
      const [rows]: any = await this.pool!.query('SELECT COUNT(*) as count FROM properties');
      if (rows && rows[0] && rows[0].count === 0) {
        console.log('[DATABASE] MySQL tables are empty. Seeding initial data from db.json...');
        
        let fileData: DBStructure | null = null;
        if (fs.existsSync(DB_FILE_PATH)) {
          try {
            const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf8');
            fileData = JSON.parse(fileContent);
          } catch (e) {
            console.error('[DATABASE] Failed to read db.json for seeding:', e);
          }
        }

        if (!fileData) {
          console.log('[DATABASE] No db.json found. Creating default seed data...');
          // Seed local memory then save it to fetch from
          this.seed();
          fileData = this.data;
        }

        // Seed owners
        if (fileData.owners) {
          for (const owner of fileData.owners) {
            await this.pool!.query(
              'INSERT INTO owners (id, name, email, phone, company, password) VALUES (?, ?, ?, ?, ?, ?)',
              [owner.id, owner.name, owner.email, owner.phone, owner.company, owner.password || null]
            );
          }
        } else {
          // Seed default owners
          const defaultOwners = [
            { id: 'owner-digikee', name: 'Web Digikee', email: 'web.digikee@gmail.com', phone: '+91 9876543210', company: 'Digikee Technologies', password: 'web@1234' },
            { id: 'owner-1', name: 'Alex Rivera', email: 'alex@riverahospitality.com', phone: '+1 305-555-0101', company: 'Rivera Hospitality Group' },
            { id: 'owner-2', name: 'Elena Rostova', email: 'elena@alpinecoast.com', phone: '+1 970-555-0202', company: 'Alpine & Coast Escapes' }
          ];
          for (const owner of defaultOwners) {
            await this.pool!.query(
              'INSERT INTO owners (id, name, email, phone, company, password) VALUES (?, ?, ?, ?, ?, ?)',
              [owner.id, owner.name, owner.email, owner.phone, owner.company, owner.password || null]
            );
          }
        }

        // Seed properties
        if (fileData.properties) {
          for (const prop of fileData.properties) {
            await this.pool!.query(
              'INSERT INTO properties (id, name, location, address, description, image_url, contact_email, contact_phone, amenities, owner_id, map_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [
                prop.id,
                prop.name,
                prop.location,
                prop.address,
                prop.description,
                prop.image_url,
                prop.contact_email,
                prop.contact_phone,
                JSON.stringify(prop.amenities),
                prop.owner_id || null,
                prop.map_url || null
              ]
            );
          }
        }

        // Seed rooms
        if (fileData.rooms) {
          for (const room of fileData.rooms) {
            await this.pool!.query(
              'INSERT INTO rooms (id, property_id, name, type, base_price, capacity_adults, capacity_children, total_inventory, description, amenities, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [
                room.id,
                room.property_id,
                room.name,
                room.type,
                room.base_price,
                room.capacity_adults,
                room.capacity_children,
                room.total_inventory,
                room.description,
                JSON.stringify(room.amenities),
                JSON.stringify(room.images)
              ]
            );
          }
        }

        // Seed guests
        if (fileData.guests) {
          for (const guest of fileData.guests) {
            await this.pool!.query(
              'INSERT INTO guests (id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)',
              [guest.id, guest.name, guest.email, guest.phone, guest.address]
            );
          }
        }

        // Seed coupons
        if (fileData.coupons) {
          for (const cp of fileData.coupons) {
            await this.pool!.query(
              'INSERT INTO coupons (id, code, discount_type, discount_value, min_booking_amount, start_date, end_date, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [cp.id, cp.code, cp.discount_type, cp.discount_value, cp.min_booking_amount, cp.start_date, cp.end_date, cp.active ? 1 : 0]
            );
          }
        }

        // Seed bookings
        if (fileData.bookings) {
          for (const b of fileData.bookings) {
            await this.pool!.query(
              'INSERT INTO bookings (id, property_id, room_id, guest_id, check_in, check_out, total_amount, coupon_id, discount_amount, status, payment_status, guests_count, created_at, notes, sync_source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [
                b.id,
                b.property_id,
                b.room_id,
                b.guest_id,
                b.check_in,
                b.check_out,
                b.total_amount,
                b.coupon_id || null,
                b.discount_amount,
                b.status,
                b.payment_status,
                JSON.stringify(b.guests_count),
                b.created_at,
                b.notes || '',
                b.sync_source || null
              ]
            );
          }
        }

        // Seed payments
        if (fileData.payments) {
          for (const p of fileData.payments) {
            await this.pool!.query(
              'INSERT INTO payments (id, booking_id, gateway_payment_id, gateway_order_id, amount, status, method, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [p.id, p.booking_id, p.gateway_payment_id, p.gateway_order_id, p.amount, p.status, p.method, p.created_at]
            );
          }
        }

        // Seed availabilityOverrides
        if (fileData.availabilityOverrides) {
          for (const av of fileData.availabilityOverrides) {
            await this.pool!.query(
              'INSERT INTO availability_overrides (id, room_id, date, price_override, is_blackout, notes) VALUES (?, ?, ?, ?, ?, ?)',
              [av.id, av.room_id, av.date, av.price_override, av.is_blackout ? 1 : 0, av.notes]
            );
          }
        }

        // Seed syncChannels
        if (fileData.syncChannels) {
          for (const sc of fileData.syncChannels) {
            await this.pool!.query(
              'INSERT INTO sync_channels (id, room_id, channel_name, ical_url, last_sync_time, sync_status, sync_logs) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [sc.id, sc.room_id, sc.channel_name, sc.ical_url, sc.last_sync_time, sc.sync_status, sc.sync_logs]
            );
          }
        }

        // Seed emailLogs
        if (fileData.emailLogs) {
          for (const em of fileData.emailLogs) {
            await this.pool!.query(
              'INSERT INTO email_logs (id, `to`, subject, html, sent_at) VALUES (?, ?, ?, ?, ?)',
              [em.id, em.to, em.subject, em.html, em.sent_at]
            );
          }
        }

        console.log('[DATABASE] MySQL tables populated successfully with initial data.');
      }
    } catch (e: any) {
      console.error('[DATABASE ERROR] Failed to seed MySQL tables:', e.message);
    }
  }

  // --- JSON LOCAL FILE PERSISTENCE ---
  private loadJSON() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf8');
        this.data = JSON.parse(fileContent);

        // Auto-cleanup any base64 image strings stored in properties or rooms
        let dbCleaned = false;
        if (this.data.properties && this.data.properties.length > 0) {
          this.data.properties.forEach(p => {
            const cleaned = cleanPropertyImageUrl(p.image_url);
            if (cleaned !== p.image_url) {
              p.image_url = cleaned;
              dbCleaned = true;
            }
          });
        }
        if (this.data.rooms && this.data.rooms.length > 0) {
          this.data.rooms.forEach(r => {
            const cleaned = cleanRoomImages(r.images);
            if (JSON.stringify(cleaned) !== JSON.stringify(r.images)) {
              r.images = cleaned;
              dbCleaned = true;
            }
          });
        }
        if (dbCleaned) {
          console.log('[DATABASE AUTO-CLEANUP] Cleaned legacy base64 images and converted them to files.');
          this.saveJSON();
        }
        if (!this.data.owners || this.data.owners.length === 0) {
          this.seedOwners();
          this.saveJSON();
        } else {
          const hasDigikee = this.data.owners.some(o => o.email.toLowerCase() === 'web.digikee@gmail.com');
          if (!hasDigikee) {
            this.data.owners.push({
              id: 'owner-digikee',
              name: 'Web Digikee',
              email: 'web.digikee@gmail.com',
              phone: '+91 9876543210',
              company: 'Digikee Technologies',
              password: 'web@1234'
            });
            if (this.data.properties && this.data.properties.length > 0) {
              this.data.properties.forEach(p => {
                if (!p.owner_id || p.owner_id === 'owner-1') {
                  p.owner_id = 'owner-digikee';
                }
              });
            }
            this.saveJSON();
          }
        }
      } else {
        this.seed();
        this.saveJSON();
      }
    } catch (error) {
      console.error('Error loading JSON database, seeding fallback:', error);
      this.seed();
      this.saveJSON();
    }
  }

  private seedOwners() {
    const defaultOwners: Owner[] = [
      {
        id: 'owner-digikee',
        name: 'Web Digikee',
        email: 'web.digikee@gmail.com',
        phone: '+91 9876543210',
        company: 'Digikee Technologies',
        password: 'web@1234'
      },
      {
        id: 'owner-1',
        name: 'Alex Rivera',
        email: 'alex@riverahospitality.com',
        phone: '+1 305-555-0101',
        company: 'Rivera Hospitality Group'
      },
      {
        id: 'owner-2',
        name: 'Elena Rostova',
        email: 'elena@alpinecoast.com',
        phone: '+1 970-555-0202',
        company: 'Alpine & Coast Escapes'
      }
    ];
    this.data.owners = defaultOwners;

    if (this.data.properties && this.data.properties.length > 0) {
      if (this.data.properties[0]) this.data.properties[0].owner_id = 'owner-digikee';
      if (this.data.properties[1]) this.data.properties[1].owner_id = 'owner-digikee';
      if (this.data.properties[2]) this.data.properties[2].owner_id = 'owner-2';
    }
  }

  private saveJSON() {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving JSON database:', error);
    }
  }

  public async restoreDatabase(newData: DBStructure): Promise<void> {
    console.log('[DATABASE] Restoring database state...');
    
    // Always update JSON memory and save to file
    this.data = {
      properties: newData.properties || [],
      rooms: newData.rooms || [],
      guests: newData.guests || [],
      bookings: newData.bookings || [],
      payments: newData.payments || [],
      coupons: newData.coupons || [],
      availabilityOverrides: newData.availabilityOverrides || [],
      syncChannels: newData.syncChannels || [],
      emailLogs: newData.emailLogs || [],
      owners: newData.owners || []
    };
    this.saveJSON();

    if (this.useMySQL) {
      try {
        console.log('[DATABASE] MySQL is active. Re-seeding tables for restored state...');
        // Clear tables
        await this.pool!.query('DELETE FROM email_logs');
        await this.pool!.query('DELETE FROM sync_channels');
        await this.pool!.query('DELETE FROM availability_overrides');
        await this.pool!.query('DELETE FROM payments');
        await this.pool!.query('DELETE FROM bookings');
        await this.pool!.query('DELETE FROM coupons');
        await this.pool!.query('DELETE FROM guests');
        await this.pool!.query('DELETE FROM rooms');
        await this.pool!.query('DELETE FROM properties');
        await this.pool!.query('DELETE FROM owners');

        // Re-seed with new data
        // 1. Owners
        if (this.data.owners) {
          for (const owner of this.data.owners) {
            await this.pool!.query(
              'INSERT INTO owners (id, name, email, phone, company, password) VALUES (?, ?, ?, ?, ?, ?)',
              [owner.id, owner.name, owner.email, owner.phone, owner.company, owner.password || null]
            );
          }
        }
        // 2. Properties
        if (this.data.properties) {
          for (const prop of this.data.properties) {
            await this.pool!.query(
              'INSERT INTO properties (id, name, location, address, description, image_url, contact_email, contact_phone, amenities, owner_id, map_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [
                prop.id,
                prop.name,
                prop.location,
                prop.address,
                prop.description,
                prop.image_url,
                prop.contact_email,
                prop.contact_phone,
                JSON.stringify(prop.amenities),
                prop.owner_id || null,
                prop.map_url || null
              ]
            );
          }
        }
        // 3. Rooms
        if (this.data.rooms) {
          for (const room of this.data.rooms) {
            await this.pool!.query(
              'INSERT INTO rooms (id, property_id, name, type, base_price, capacity_adults, capacity_children, total_inventory, description, amenities, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [
                room.id,
                room.property_id,
                room.name,
                room.type,
                room.base_price,
                room.capacity_adults,
                room.capacity_children,
                room.total_inventory,
                room.description,
                JSON.stringify(room.amenities),
                JSON.stringify(room.images)
              ]
            );
          }
        }
        // 4. Guests
        if (this.data.guests) {
          for (const guest of this.data.guests) {
            await this.pool!.query(
              'INSERT INTO guests (id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)',
              [guest.id, guest.name, guest.email, guest.phone, guest.address]
            );
          }
        }
        // 5. Coupons
        if (this.data.coupons) {
          for (const cp of this.data.coupons) {
            await this.pool!.query(
              'INSERT INTO coupons (id, code, discount_type, discount_value, min_booking_amount, start_date, end_date, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [cp.id, cp.code, cp.discount_type, cp.discount_value, cp.min_booking_amount, cp.start_date, cp.end_date, cp.active ? 1 : 0]
            );
          }
        }
        // 6. Bookings
        if (this.data.bookings) {
          for (const b of this.data.bookings) {
            await this.pool!.query(
              'INSERT INTO bookings (id, property_id, room_id, guest_id, check_in, check_out, total_amount, coupon_id, discount_amount, status, payment_status, guests_count, created_at, notes, sync_source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [
                b.id,
                b.property_id,
                b.room_id,
                b.guest_id,
                b.check_in,
                b.check_out,
                b.total_amount,
                b.coupon_id || null,
                b.discount_amount,
                b.status,
                b.payment_status,
                JSON.stringify(b.guests_count),
                b.created_at,
                b.notes || '',
                b.sync_source || null
              ]
            );
          }
        }
        // 7. Payments
        if (this.data.payments) {
          for (const p of this.data.payments) {
            await this.pool!.query(
              'INSERT INTO payments (id, booking_id, gateway_payment_id, gateway_order_id, amount, status, method, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              [p.id, p.booking_id, p.gateway_payment_id, p.gateway_order_id, p.amount, p.status, p.method, p.created_at]
            );
          }
        }
        // 8. Overrides
        if (this.data.availabilityOverrides) {
          for (const av of this.data.availabilityOverrides) {
            await this.pool!.query(
              'INSERT INTO availability_overrides (id, room_id, date, price_override, is_blackout, notes) VALUES (?, ?, ?, ?, ?, ?)',
              [av.id, av.room_id, av.date, av.price_override, av.is_blackout ? 1 : 0, av.notes]
            );
          }
        }
        // 9. Sync Channels
        if (this.data.syncChannels) {
          for (const sc of this.data.syncChannels) {
            await this.pool!.query(
              'INSERT INTO sync_channels (id, room_id, channel_name, ical_url, last_sync_time, sync_status, sync_logs) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [sc.id, sc.room_id, sc.channel_name, sc.ical_url, sc.last_sync_time, sc.sync_status, sc.sync_logs]
            );
          }
        }
        // 10. Email Logs
        if (this.data.emailLogs) {
          for (const em of this.data.emailLogs) {
            await this.pool!.query(
              'INSERT INTO email_logs (id, `to`, subject, html, sent_at) VALUES (?, ?, ?, ?, ?)',
              [em.id, em.to, em.subject, em.html, em.sent_at]
            );
          }
        }
        console.log('[DATABASE] MySQL tables successfully synchronized with restored state.');
      } catch (err: any) {
        console.error('[DATABASE] MySQL error during restore:', err.message);
      }
    }
  }

  public async resetToDefaults(): Promise<void> {
    console.log('[DATABASE] Resetting database to default seeds...');
    if (this.useMySQL) {
      try {
        await this.pool!.query('DELETE FROM email_logs');
        await this.pool!.query('DELETE FROM sync_channels');
        await this.pool!.query('DELETE FROM availability_overrides');
        await this.pool!.query('DELETE FROM payments');
        await this.pool!.query('DELETE FROM bookings');
        await this.pool!.query('DELETE FROM coupons');
        await this.pool!.query('DELETE FROM guests');
        await this.pool!.query('DELETE FROM rooms');
        await this.pool!.query('DELETE FROM properties');
        await this.pool!.query('DELETE FROM owners');
      } catch (err: any) {
        console.error('[DATABASE] MySQL clean error during reset:', err.message);
      }
    }

    this.data = {
      properties: [],
      rooms: [],
      guests: [],
      bookings: [],
      payments: [],
      coupons: [],
      availabilityOverrides: [],
      syncChannels: [],
      emailLogs: [],
      owners: []
    };

    this.seed();
    this.seedOwners();
    this.saveJSON();

    if (this.useMySQL) {
      await this.seedMySQLIfNeeded();
    }
  }

  private seed() {
    const properties: Property[] = [
      {
        id: 'prop-1783406831137',
        name: 'Amber Moon – Your Private Luxury Holiday Rental Retreat',
        location: ' Haripur, Himachal Pradesh 173209',
        address: 'Amber Moon, V2XR+6M8, Haripur, Himachal Pradesh 173209',
        description: 'The property features 3 beautifully furnished bedrooms and comfortably accommodates up to 8–10 guests, making it ideal for weekend getaways, celebrations, workations, and relaxing vacations.',
        image_url: '/src/assets/images/amber_moon_retreat_1783409576594.jpg, /src/assets/images/amber_moon_ext_1784095924737.jpg, /src/assets/images/amber_moon_bed_1784095937887.jpg, /src/assets/images/amber_moon_lounge_1784095949092.jpg, /src/assets/images/amber_moon_garden_1784095963061.jpg',
        contact_email: 'web.digikee@gmail.com',
        contact_phone: '0987654321',
        amenities: [
          'Air Conditioning',
          'Attached Bathroom',
          'Bar',
          'Family rooms',
          'Free Car Parking',
          'Free Wifi',
          'Fully Furnished',
          'Home Cooked Indian Cuisine',
          'Kids Play Area',
          'Billiards Table'
        ],
        owner_id: 'owner-digikee',
        map_url: 'https://www.google.com/maps?cid=6902260040436143863&g_mp=CiVnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLkdldFBsYWNlEAMYASAF&hl=en-US&source=embed'
      },
      {
        id: 'prop-1783417200358',
        name: 'The White Rose',
        location: ' Dagshai, Himachal Pradesh 173229',
        address: 'The White Rose, Village Anhech, Area, Dagshai, Himachal Pradesh 173229',
        description: 'With 4 beautifully appointed bedrooms, the villa comfortably accommodates up to 12 guests, offering the perfect blend of comfort, privacy, and scenic beauty.',
        image_url: '/src/assets/images/white_rose_ext_1784095978792.jpg, /src/assets/images/white_rose_bed_1784095989454.jpg, /src/assets/images/white_rose_balcony_1784096001928.jpg, /src/assets/images/white_rose_dining_1784096012734.jpg, /src/assets/images/white_rose_garden_1784096024112.jpg',
        contact_email: 'web.digikee@gmail.com',
        contact_phone: '0987654321',
        amenities: [
          'Air Conditioning',
          'Attached Bathroom',
          'Bar',
          'Family rooms',
          'Free Car Parking',
          'Free Wifi',
          'Fully Furnished',
          'Home Cooked Indian Cuisine',
          'Kids Play Area',
          'Billiards Table'
        ],
        owner_id: 'owner-digikee',
        map_url: 'https://www.google.com/maps?cid=17840905776697739174&g_mp=CiVnb29nbGUubWFwcy5wbGFjZXMudjEuUGxhY2VzLkdldFBsYWNlEAMYASAF&hl=en-US&source=embed'
      }
    ];

    const rooms: Room[] = [
      {
        id: 'room-1783417331396',
        property_id: 'prop-1783406831137',
        name: 'Vocational Villa',
        type: 'Villa',
        base_price: 30000,
        capacity_adults: 9,
        capacity_children: 0,
        total_inventory: 1,
        description: 'Nestled in a peaceful and scenic setting, Amber Moon is an exclusive holiday rental designed for families, friends, and small groups seeking comfort, privacy, and modern amenities.',
        amenities: ['Private Garden', 'Bar', 'High-speed Wi-Fi', 'Billiards Table', 'Spacious Lounge'],
        images: [
          '/src/assets/images/amber_moon_retreat_1783409576594.jpg',
          '/src/assets/images/amber_moon_ext_1784095924737.jpg',
          '/src/assets/images/amber_moon_bed_1784095937887.jpg',
          '/src/assets/images/amber_moon_lounge_1784095949092.jpg',
          '/src/assets/images/amber_moon_garden_1784095963061.jpg'
        ]
      },
      {
        id: 'room-1783417421007',
        property_id: 'prop-1783417200358',
        name: 'Ground Floor',
        type: 'Villa',
        base_price: 25000,
        capacity_adults: 5,
        capacity_children: 0,
        total_inventory: 1,
        description: 'Located on the ground floor of The White Rose, featuring beautifully appointed bedrooms, a spacious layout, cozy common spaces, and a picturesque mountain backdrop.',
        amenities: ['Scenic Balcony', 'Spacious Rooms', 'Private Kitchen', 'Free Parking'],
        images: [
          '/src/assets/images/white_rose_ext_1784095978792.jpg',
          '/src/assets/images/white_rose_bed_1784095989454.jpg',
          '/src/assets/images/white_rose_balcony_1784096001928.jpg',
          '/src/assets/images/white_rose_dining_1784096012734.jpg',
          '/src/assets/images/white_rose_garden_1784096024112.jpg'
        ]
      },
      {
        id: 'room-1783417592486',
        property_id: 'prop-1783417200358',
        name: 'First Floor',
        type: 'Villa',
        base_price: 25000,
        capacity_adults: 5,
        capacity_children: 0,
        total_inventory: 1,
        description: 'Located on the first floor of The White Rose, featuring elegant bedrooms, private balcony access with panoramic valley vistas, and spacious modern amenities.',
        amenities: ['Valley View Balcony', 'Executive Bed', 'Modern Dining', 'Free Parking'],
        images: [
          '/src/assets/images/white_rose_bed_1784095989454.jpg',
          '/src/assets/images/white_rose_balcony_1784096001928.jpg',
          '/src/assets/images/white_rose_dining_1784096012734.jpg',
          '/src/assets/images/white_rose_ext_1784095978792.jpg',
          '/src/assets/images/white_rose_garden_1784096024112.jpg'
        ]
      }
    ];

    const guests: Guest[] = [
      { id: 'gst-1', name: 'Jane Smith', email: 'jane.smith@example.com', phone: '+1 555-0192', address: '123 Pine St, Seattle, WA' },
      { id: 'gst-2', name: 'Riya Rawat', email: 'web.digikee@gmail.com', phone: '+91 9876543210', address: 'Delhi, India' }
    ];

    const bookings: Booking[] = [
      {
        id: 'bk-1001',
        property_id: 'prop-1783406831137',
        room_id: 'room-1783417331396',
        guest_id: 'gst-1',
        check_in: '2026-07-01',
        check_out: '2026-07-05',
        total_amount: 120000,
        coupon_id: null,
        discount_amount: 0,
        status: 'Confirmed',
        payment_status: 'Paid',
        guests_count: { adults: 2, children: 1 },
        created_at: '2026-06-15T14:30:00Z',
        notes: 'Needs home cooked vegetarian dinner.',
        sync_source: null
      }
    ];

    const payments: Payment[] = [
      {
        id: 'pay-1',
        booking_id: 'bk-1001',
        gateway_payment_id: 'pay_HjK920saKlq',
        gateway_order_id: 'order_HjK830slqA',
        amount: 120000,
        status: 'Success',
        method: 'Razorpay',
        created_at: '2026-06-15T14:32:00Z'
      }
    ];

    const coupons: Coupon[] = [
      {
        id: 'coupon-1',
        code: 'WELCOME20',
        discount_type: 'Percentage',
        discount_value: 20,
        min_booking_amount: 200,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        active: true
      },
      {
        id: 'coupon-2',
        code: 'HOLIDAYMAX',
        discount_type: 'Fixed',
        discount_value: 50,
        min_booking_amount: 300,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        active: true
      },
      {
        id: 'coupon-3',
        code: 'HOLIDAY10',
        discount_type: 'Percentage',
        discount_value: 10,
        min_booking_amount: 0,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        active: true
      }
    ];

    const syncChannels: CalendarSyncChannel[] = [
      {
        id: 'chan-1',
        room_id: 'room-1783417331396',
        channel_name: 'Airbnb',
        ical_url: 'https://www.airbnb.com/calendar/ical/room101.ics',
        last_sync_time: '2026-07-06T18:00:00Z',
        sync_status: 'Success',
        sync_logs: 'Successfully parsed iCal URL feed. 3 external blackout dates imported.'
      }
    ];

    const emailLogs: EmailLog[] = [
      {
        id: 'em-1',
        to: 'jane.smith@example.com',
        subject: 'Booking Confirmation: Amber Moon Retreat (#bk-1001)',
        html: '<h3>Dear Jane,</h3><p>Your booking <b>bk-1001</b> has been confirmed!</p><p><b>Property:</b> Amber Moon Retreat<br><b>Room:</b> Vocational Villa<br><b>Check-in:</b> 2026-07-01<br><b>Check-out:</b> 2026-07-05</p><p>Thank you for choosing Holiday Rentals!</p>',
        sent_at: '2026-06-15T14:32:15Z'
      }
    ];

    this.data = {
      properties,
      rooms,
      guests,
      bookings,
      payments,
      coupons,
      availabilityOverrides: [],
      syncChannels,
      emailLogs,
      owners: []
    };
    this.seedOwners();
  }

  // --- PROPERTIES CRUD ---
  public async getProperties(): Promise<Property[]> {
    if (this.useMySQL) {
      const [rows]: any = await this.pool!.query('SELECT * FROM properties');
      return rows.map((r: any) => ({
        ...r,
        amenities: typeof r.amenities === 'string' ? JSON.parse(r.amenities) : r.amenities
      }));
    }
    return this.data.properties;
  }

  public async addProperty(property: Omit<Property, 'id'>): Promise<Property> {
    const id = `prop-${Date.now()}`;
    const newProperty: Property = { ...property, id };

    if (this.useMySQL) {
      await this.pool!.query(
        'INSERT INTO properties (id, name, location, address, description, image_url, contact_email, contact_phone, amenities, owner_id, map_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          id,
          property.name,
          property.location,
          property.address,
          property.description,
          property.image_url,
          property.contact_email,
          property.contact_phone,
          JSON.stringify(property.amenities),
          property.owner_id || null,
          property.map_url || null
        ]
      );
      return newProperty;
    }

    this.data.properties.push(newProperty);
    this.saveJSON();
    return newProperty;
  }

  public async updateProperty(id: string, updated: Partial<Property>): Promise<Property> {
    if (this.useMySQL) {
      const keys = Object.keys(updated).filter(k => k !== 'id');
      if (keys.length > 0) {
        const sets = keys.map(k => `\`${k}\` = ?`).join(', ');
        const values = keys.map(k => {
          const val = (updated as any)[k];
          if (k === 'amenities') return JSON.stringify(val);
          return val === undefined ? null : val;
        });
        await this.pool!.query(`UPDATE properties SET ${sets} WHERE id = ?`, [...values, id]);
      }
      const [rows]: any = await this.pool!.query('SELECT * FROM properties WHERE id = ?', [id]);
      if (rows.length === 0) throw new Error('Property not found');
      return {
        ...rows[0],
        amenities: typeof rows[0].amenities === 'string' ? JSON.parse(rows[0].amenities) : rows[0].amenities
      };
    }

    const idx = this.data.properties.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Property not found');
    this.data.properties[idx] = { ...this.data.properties[idx], ...updated };
    this.saveJSON();
    return this.data.properties[idx];
  }

  public async deleteProperty(id: string): Promise<void> {
    if (this.useMySQL) {
      await this.pool!.query('DELETE FROM properties WHERE id = ?', [id]);
      return;
    }

    this.data.properties = this.data.properties.filter(p => p.id !== id);
    // Cascade delete rooms
    const propertyRooms = this.data.rooms.filter(r => r.property_id === id);
    for (const r of propertyRooms) {
      await this.deleteRoom(r.id);
    }
    this.saveJSON();
  }

  // --- ROOMS CRUD ---
  public async getRooms(): Promise<Room[]> {
    if (this.useMySQL) {
      const [rows]: any = await this.pool!.query('SELECT * FROM rooms');
      return rows.map((r: any) => ({
        ...r,
        base_price: Number(r.base_price),
        amenities: typeof r.amenities === 'string' ? JSON.parse(r.amenities) : r.amenities,
        images: typeof r.images === 'string' ? JSON.parse(r.images) : r.images
      }));
    }
    return this.data.rooms;
  }

  public async addRoom(room: Omit<Room, 'id'>): Promise<Room> {
    const id = `room-${Date.now()}`;
    const newRoom: Room = { ...room, id };

    if (this.useMySQL) {
      await this.pool!.query(
        'INSERT INTO rooms (id, property_id, name, type, base_price, capacity_adults, capacity_children, total_inventory, description, amenities, images) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          id,
          room.property_id,
          room.name,
          room.type,
          room.base_price,
          room.capacity_adults,
          room.capacity_children,
          room.total_inventory,
          room.description,
          JSON.stringify(room.amenities),
          JSON.stringify(room.images)
        ]
      );
      return newRoom;
    }

    this.data.rooms.push(newRoom);
    this.saveJSON();
    return newRoom;
  }

  public async updateRoom(id: string, updated: Partial<Room>): Promise<Room> {
    if (this.useMySQL) {
      const keys = Object.keys(updated).filter(k => k !== 'id');
      if (keys.length > 0) {
        const sets = keys.map(k => `\`${k}\` = ?`).join(', ');
        const values = keys.map(k => {
          const val = (updated as any)[k];
          if (k === 'amenities' || k === 'images') return JSON.stringify(val);
          return val === undefined ? null : val;
        });
        await this.pool!.query(`UPDATE rooms SET ${sets} WHERE id = ?`, [...values, id]);
      }
      const [rows]: any = await this.pool!.query('SELECT * FROM rooms WHERE id = ?', [id]);
      if (rows.length === 0) throw new Error('Room not found');
      return {
        ...rows[0],
        base_price: Number(rows[0].base_price),
        amenities: typeof rows[0].amenities === 'string' ? JSON.parse(rows[0].amenities) : rows[0].amenities,
        images: typeof rows[0].images === 'string' ? JSON.parse(rows[0].images) : rows[0].images
      };
    }

    const idx = this.data.rooms.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Room not found');
    this.data.rooms[idx] = { ...this.data.rooms[idx], ...updated };
    this.saveJSON();
    return this.data.rooms[idx];
  }

  public async deleteRoom(id: string): Promise<void> {
    if (this.useMySQL) {
      await this.pool!.query('DELETE FROM rooms WHERE id = ?', [id]);
      return;
    }

    this.data.rooms = this.data.rooms.filter(r => r.id !== id);
    this.data.availabilityOverrides = this.data.availabilityOverrides.filter(o => o.room_id !== id);
    this.data.syncChannels = this.data.syncChannels.filter(c => c.room_id !== id);
    this.saveJSON();
  }

  // --- BOOKINGS & GUESTS ---
  public async getBookings(): Promise<Booking[]> {
    if (this.useMySQL) {
      const [rows]: any = await this.pool!.query('SELECT * FROM bookings');
      return rows.map((r: any) => ({
        ...r,
        check_in: formatDate(r.check_in),
        check_out: formatDate(r.check_out),
        total_amount: Number(r.total_amount),
        discount_amount: Number(r.discount_amount),
        guests_count: typeof r.guests_count === 'string' ? JSON.parse(r.guests_count) : r.guests_count
      }));
    }
    return this.data.bookings;
  }

  public async getGuests(): Promise<Guest[]> {
    if (this.useMySQL) {
      const [rows]: any = await this.pool!.query('SELECT * FROM guests');
      return rows;
    }
    return this.data.guests;
  }

  public async getPayments(): Promise<Payment[]> {
    if (this.useMySQL) {
      const [rows]: any = await this.pool!.query('SELECT * FROM payments');
      return rows.map((r: any) => ({
        ...r,
        amount: Number(r.amount)
      }));
    }
    return this.data.payments;
  }

  // --- COUPONS ---
  public async getCoupons(): Promise<Coupon[]> {
    if (this.useMySQL) {
      const [rows]: any = await this.pool!.query('SELECT * FROM coupons');
      return rows.map((r: any) => ({
        ...r,
        discount_value: Number(r.discount_value),
        min_booking_amount: Number(r.min_booking_amount),
        start_date: formatDate(r.start_date),
        end_date: formatDate(r.end_date),
        active: Boolean(r.active)
      }));
    }
    return this.data.coupons;
  }

  public async addCoupon(coupon: Omit<Coupon, 'id'>): Promise<Coupon> {
    const id = `coupon-${Date.now()}`;
    const newCoupon: Coupon = { ...coupon, id };

    if (this.useMySQL) {
      await this.pool!.query(
        'INSERT INTO coupons (id, code, discount_type, discount_value, min_booking_amount, start_date, end_date, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          id,
          coupon.code,
          coupon.discount_type,
          coupon.discount_value,
          coupon.min_booking_amount,
          coupon.start_date,
          coupon.end_date,
          coupon.active ? 1 : 0
        ]
      );
      return newCoupon;
    }

    this.data.coupons.push(newCoupon);
    this.saveJSON();
    return newCoupon;
  }

  public async deleteCoupon(id: string): Promise<void> {
    if (this.useMySQL) {
      await this.pool!.query('DELETE FROM coupons WHERE id = ?', [id]);
      return;
    }

    this.data.coupons = this.data.coupons.filter(c => c.id !== id);
    this.saveJSON();
  }

  // --- AVAILABILITY GRID / TRANSACTIONS ---
  public async getAvailabilityOverrides(): Promise<AvailabilityOverride[]> {
    if (this.useMySQL) {
      const [rows]: any = await this.pool!.query('SELECT * FROM availability_overrides');
      return rows.map((r: any) => ({
        ...r,
        date: formatDate(r.date),
        price_override: r.price_override !== null ? Number(r.price_override) : null,
        is_blackout: Boolean(r.is_blackout)
      }));
    }
    return this.data.availabilityOverrides;
  }

  public async setAvailabilityOverride(override: Omit<AvailabilityOverride, 'id'>): Promise<AvailabilityOverride> {
    if (this.useMySQL) {
      const id = `ov-${Date.now()}`;
      await this.pool!.query(
        'INSERT INTO availability_overrides (id, room_id, date, price_override, is_blackout, notes) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE price_override = VALUES(price_override), is_blackout = VALUES(is_blackout), notes = VALUES(notes)',
        [
          id,
          override.room_id,
          override.date,
          override.price_override,
          override.is_blackout ? 1 : 0,
          override.notes || null
        ]
      );

      const [rows]: any = await this.pool!.query('SELECT * FROM availability_overrides WHERE room_id = ? AND date = ?', [override.room_id, override.date]);
      return {
        ...rows[0],
        date: formatDate(rows[0].date),
        price_override: rows[0].price_override !== null ? Number(rows[0].price_override) : null,
        is_blackout: Boolean(rows[0].is_blackout)
      };
    }

    const existingIdx = this.data.availabilityOverrides.findIndex(
      o => o.room_id === override.room_id && o.date === override.date
    );

    if (existingIdx !== -1) {
      this.data.availabilityOverrides[existingIdx] = {
        ...this.data.availabilityOverrides[existingIdx],
        price_override: override.price_override,
        is_blackout: override.is_blackout,
        notes: override.notes
      };
      this.saveJSON();
      return this.data.availabilityOverrides[existingIdx];
    } else {
      const newOverride: AvailabilityOverride = {
        ...override,
        id: `ov-${Date.now()}`
      };
      this.data.availabilityOverrides.push(newOverride);
      this.saveJSON();
      return newOverride;
    }
  }

  public async deleteAvailabilityOverride(id: string): Promise<void> {
    if (this.useMySQL) {
      await this.pool!.query('DELETE FROM availability_overrides WHERE id = ?', [id]);
      return;
    }

    this.data.availabilityOverrides = this.data.availabilityOverrides.filter(o => o.id !== id);
    this.saveJSON();
  }

  public generateDatesArray(checkInStr: string, checkOutStr: string): string[] {
    const dates: string[] = [];
    const checkIn = new Date(checkInStr);
    const checkOut = new Date(checkOutStr);

    let current = new Date(checkIn);
    while (current < checkOut) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  // Live Inventory & Overbooking Checker
  public async checkRoomAvailability(roomId: string, checkInStr: string, checkOutStr: string): Promise<{
    available: boolean;
    totalBasePrice: number;
    totalFinalPrice: number;
    datesDetails: Array<{
      date: string;
      basePrice: number;
      finalPrice: number;
      isBlackout: boolean;
      totalInventory: number;
      bookedCount: number;
      availableInventory: number;
      priceOverride: number | null;
    }>;
    errors: string[];
  }> {
    if (this.useMySQL) {
      const [roomsRows]: any = await this.pool!.query('SELECT * FROM rooms WHERE id = ?', [roomId]);
      const room = roomsRows[0];
      if (!room) {
        return { available: false, totalBasePrice: 0, totalFinalPrice: 0, datesDetails: [], errors: ['Room type not found.'] };
      }

      const requestedDates = this.generateDatesArray(checkInStr, checkOutStr);
      if (requestedDates.length === 0) {
        return { available: false, totalBasePrice: 0, totalFinalPrice: 0, datesDetails: [], errors: ['Invalid check-in/check-out dates.'] };
      }

      const errors: string[] = [];
      let isAvailable = true;
      let totalBasePrice = 0;
      let totalFinalPrice = 0;

      // Fetch all overrides and active bookings for this room type
      const [overridesRows]: any = await this.pool!.query(
        'SELECT * FROM availability_overrides WHERE room_id = ? AND date IN (?)',
        [roomId, requestedDates.length > 0 ? requestedDates : ['1970-01-01']]
      );
      
      const [bookingsRows]: any = await this.pool!.query(
        'SELECT * FROM bookings WHERE room_id = ? AND status != "Cancelled"',
        [roomId]
      );

      const parsedBookings = bookingsRows.map((b: any) => ({
        ...b,
        check_in: formatDate(b.check_in),
        check_out: formatDate(b.check_out)
      }));

      const datesDetails = requestedDates.map(date => {
        const basePrice = Number(room.base_price);
        const totalInventory = Number(room.total_inventory);

        const override = overridesRows.find((o: any) => formatDate(o.date) === date);

        const isBlackout = override ? Boolean(override.is_blackout) : false;
        const priceOverride = override && override.price_override !== null ? Number(override.price_override) : null;
        const finalPrice = priceOverride !== null ? priceOverride : basePrice;

        const bookedCount = parsedBookings.filter((b: any) => {
          return date >= b.check_in && date < b.check_out;
        }).length;

        const availableInventory = isBlackout ? 0 : totalInventory - bookedCount;

        if (isBlackout) {
          isAvailable = false;
          errors.push(`Room is blocked for maintenance/blackout on ${date}.`);
        } else if (availableInventory <= 0) {
          isAvailable = false;
          errors.push(`No rooms available on ${date}. Fully booked.`);
        }

        totalBasePrice += basePrice;
        totalFinalPrice += finalPrice;

        return {
          date,
          basePrice,
          finalPrice,
          isBlackout,
          totalInventory,
          bookedCount,
          availableInventory,
          priceOverride
        };
      });

      return {
        available: isAvailable,
        totalBasePrice,
        totalFinalPrice,
        datesDetails,
        errors
      };
    }

    // JSON Local Fallback
    const room = this.data.rooms.find(r => r.id === roomId);
    if (!room) {
      return { available: false, totalBasePrice: 0, totalFinalPrice: 0, datesDetails: [], errors: ['Room type not found.'] };
    }

    const requestedDates = this.generateDatesArray(checkInStr, checkOutStr);
    if (requestedDates.length === 0) {
      return { available: false, totalBasePrice: 0, totalFinalPrice: 0, datesDetails: [], errors: ['Invalid check-in/check-out dates.'] };
    }

    const errors: string[] = [];
    let isAvailable = true;
    let totalBasePrice = 0;
    let totalFinalPrice = 0;

    const datesDetails = requestedDates.map(date => {
      const basePrice = room.base_price;
      const totalInventory = room.total_inventory;

      const override = this.data.availabilityOverrides.find(
        o => o.room_id === roomId && o.date === date
      );

      const isBlackout = override ? override.is_blackout : false;
      const priceOverride = override ? override.price_override : null;
      const finalPrice = priceOverride !== null ? priceOverride : basePrice;

      const bookedCount = this.data.bookings.filter(b => {
        if (b.room_id !== roomId) return false;
        if (b.status === 'Cancelled') return false;
        return date >= b.check_in && date < b.check_out;
      }).length;

      const availableInventory = isBlackout ? 0 : totalInventory - bookedCount;

      if (isBlackout) {
        isAvailable = false;
        errors.push(`Room is blocked for maintenance/blackout on ${date}.`);
      } else if (availableInventory <= 0) {
        isAvailable = false;
        errors.push(`No rooms available on ${date}. Fully booked.`);
      }

      totalBasePrice += basePrice;
      totalFinalPrice += finalPrice;

      return {
        date,
        basePrice,
        finalPrice,
        isBlackout,
        totalInventory,
        bookedCount,
        availableInventory,
        priceOverride
      };
    });

    return {
      available: isAvailable,
      totalBasePrice,
      totalFinalPrice,
      datesDetails,
      errors
    };
  }

  // Transaction-safe booking creation to prevent double booking!
  public async createBooking(bookingData: {
    property_id: string;
    room_id: string;
    check_in: string;
    check_out: string;
    guest: Omit<Guest, 'id'>;
    coupon_id: string | null;
    payment_method: string;
    gateway_payment_id?: string;
    gateway_order_id?: string;
    notes?: string;
    sync_source?: string;
    payment_status?: PaymentStatus;
    paid_amount?: number;
  }): Promise<{
    success: boolean;
    booking: Booking;
    guest: Guest;
    payment: Payment;
  }> {
    if (this.useMySQL) {
      const conn = await this.pool!.getConnection();
      try {
        await conn.beginTransaction();

        // 1. Double check room availability inside transaction
        const [roomsRows]: any = await conn.query('SELECT * FROM rooms WHERE id = ? FOR UPDATE', [bookingData.room_id]);
        const room = roomsRows[0];
        if (!room) throw new Error('Room type not found.');

        const requestedDates = this.generateDatesArray(bookingData.check_in, bookingData.check_out);
        if (requestedDates.length === 0) throw new Error('Invalid dates.');

        // Get Overrides
        const [overridesRows]: any = await conn.query(
          'SELECT * FROM availability_overrides WHERE room_id = ? AND date IN (?)',
          [bookingData.room_id, requestedDates]
        );

        // Get Active Bookings
        const [bookingsRows]: any = await conn.query(
          'SELECT * FROM bookings WHERE room_id = ? AND status != "Cancelled"',
          [bookingData.room_id]
        );

        const parsedBookings = bookingsRows.map((b: any) => ({
          ...b,
          check_in: formatDate(b.check_in),
          check_out: formatDate(b.check_out)
        }));

        let isAvailable = true;
        let totalFinalPrice = 0;

        for (const date of requestedDates) {
          const override = overridesRows.find((o: any) => formatDate(o.date) === date);
          const isBlackout = override ? Boolean(override.is_blackout) : false;
          const priceOverride = override && override.price_override !== null ? Number(override.price_override) : null;
          const finalPrice = priceOverride !== null ? priceOverride : Number(room.base_price);

          const bookedCount = parsedBookings.filter((b: any) => {
            return date >= b.check_in && date < b.check_out;
          }).length;

          const availableInventory = isBlackout ? 0 : Number(room.total_inventory) - bookedCount;

          if (isBlackout || availableInventory <= 0) {
            isAvailable = false;
            break;
          }
          totalFinalPrice += finalPrice;
        }

        if (!isAvailable) {
          throw new Error('Room is no longer available for the requested dates. Please choose different dates or rooms.');
        }

        // 2. Validate Coupon
        let discountAmount = 0;
        if (bookingData.coupon_id) {
          const [couponRows]: any = await conn.query('SELECT * FROM coupons WHERE id = ?', [bookingData.coupon_id]);
          const coupon = couponRows[0];
          if (coupon && coupon.active && totalFinalPrice >= Number(coupon.min_booking_amount)) {
            if (coupon.discount_type === 'Percentage') {
              discountAmount = (totalFinalPrice * Number(coupon.discount_value)) / 100;
            } else {
              discountAmount = Number(coupon.discount_value);
            }
          }
        }
        const finalAmount = Math.max(0, totalFinalPrice - discountAmount);

        // 3. Insert or Get Guest
        const guestId = `gst-${Date.now()}`;
        // Let's search by email to avoid duplicating guests
        const [existingGuests]: any = await conn.query('SELECT * FROM guests WHERE email = ?', [bookingData.guest.email]);
        let guestRecord: Guest;

        if (existingGuests.length > 0) {
          guestRecord = existingGuests[0];
          await conn.query(
            'UPDATE guests SET name = ?, phone = ?, address = ? WHERE id = ?',
            [bookingData.guest.name, bookingData.guest.phone, bookingData.guest.address, guestRecord.id]
          );
          guestRecord = { ...guestRecord, ...bookingData.guest };
        } else {
          guestRecord = { id: guestId, ...bookingData.guest };
          await conn.query(
            'INSERT INTO guests (id, name, email, phone, address) VALUES (?, ?, ?, ?, ?)',
            [guestRecord.id, guestRecord.name, guestRecord.email, guestRecord.phone, guestRecord.address]
          );
        }

        // 4. Create Booking
        const bookingId = `bk-${Date.now()}`;
        const newBooking: Booking = {
          id: bookingId,
          property_id: bookingData.property_id,
          room_id: bookingData.room_id,
          guest_id: guestRecord.id,
          check_in: bookingData.check_in,
          check_out: bookingData.check_out,
          total_amount: finalAmount,
          coupon_id: bookingData.coupon_id,
          discount_amount: discountAmount,
          status: 'Confirmed',
          payment_status: bookingData.payment_status || 'Paid',
          guests_count: { adults: 2, children: 0 }, // fallback or use input if available
          created_at: new Date().toISOString(),
          notes: bookingData.notes || '',
          sync_source: bookingData.sync_source || null
        };

        await conn.query(
          'INSERT INTO bookings (id, property_id, room_id, guest_id, check_in, check_out, total_amount, coupon_id, discount_amount, status, payment_status, guests_count, created_at, notes, sync_source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            newBooking.id,
            newBooking.property_id,
            newBooking.room_id,
            newBooking.guest_id,
            newBooking.check_in,
            newBooking.check_out,
            newBooking.total_amount,
            newBooking.coupon_id,
            newBooking.discount_amount,
            newBooking.status,
            newBooking.payment_status,
            JSON.stringify(newBooking.guests_count),
            newBooking.created_at,
            newBooking.notes,
            newBooking.sync_source
          ]
        );

        // 5. Create Payment
        const paymentId = `pay-${Date.now()}`;
        const newPayment: Payment = {
          id: paymentId,
          booking_id: bookingId,
          gateway_payment_id: bookingData.gateway_payment_id || `pay_sim_${Date.now()}`,
          gateway_order_id: bookingData.gateway_order_id || `order_sim_${Date.now()}`,
          amount: bookingData.paid_amount !== undefined ? bookingData.paid_amount : finalAmount,
          status: 'Success',
          method: bookingData.payment_method,
          created_at: new Date().toISOString()
        };

        await conn.query(
          'INSERT INTO payments (id, booking_id, gateway_payment_id, gateway_order_id, amount, status, method, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            newPayment.id,
            newPayment.booking_id,
            newPayment.gateway_payment_id,
            newPayment.gateway_order_id,
            newPayment.amount,
            newPayment.status,
            newPayment.method,
            newPayment.created_at
          ]
        );

        await conn.commit();
        return {
          success: true,
          booking: newBooking,
          guest: guestRecord,
          payment: newPayment
        };
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    }

    // JSON local fallback
    const availResult = await this.checkRoomAvailability(bookingData.room_id, bookingData.check_in, bookingData.check_out);
    if (!availResult.available) {
      throw new Error(availResult.errors.join(' ') || 'Selected dates are no longer available.');
    }

    const totalFinalPrice = availResult.totalFinalPrice;

    // 2. Validate Coupon
    let discountAmount = 0;
    if (bookingData.coupon_id) {
      const coupon = this.data.coupons.find(c => c.id === bookingData.coupon_id && c.active);
      if (coupon && totalFinalPrice >= coupon.min_booking_amount) {
        if (coupon.discount_type === 'Percentage') {
          discountAmount = (totalFinalPrice * coupon.discount_value) / 100;
        } else {
          discountAmount = coupon.discount_value;
        }
      }
    }

    const finalAmount = Math.max(0, totalFinalPrice - discountAmount);

    // 3. Find or Create Guest
    let guestRecord = this.data.guests.find(g => g.email.toLowerCase() === bookingData.guest.email.toLowerCase());
    if (guestRecord) {
      guestRecord.name = bookingData.guest.name;
      guestRecord.phone = bookingData.guest.phone;
      guestRecord.address = bookingData.guest.address;
    } else {
      guestRecord = {
        id: `gst-${Date.now()}`,
        ...bookingData.guest
      };
      this.data.guests.push(guestRecord);
    }

    // 4. Create Booking
    const bookingId = `bk-${Date.now()}`;
    const newBooking: Booking = {
      id: bookingId,
      property_id: bookingData.property_id,
      room_id: bookingData.room_id,
      guest_id: guestRecord.id,
      check_in: bookingData.check_in,
      check_out: bookingData.check_out,
      total_amount: finalAmount,
      coupon_id: bookingData.coupon_id,
      discount_amount: discountAmount,
      status: 'Confirmed',
      payment_status: bookingData.payment_status || 'Paid',
      guests_count: { adults: 2, children: 0 },
      created_at: new Date().toISOString(),
      notes: bookingData.notes || '',
      sync_source: bookingData.sync_source || null
    };
    this.data.bookings.push(newBooking);

    // 5. Create Payment
    const paymentId = `pay-${Date.now()}`;
    const newPayment: Payment = {
      id: paymentId,
      booking_id: bookingId,
      gateway_payment_id: bookingData.gateway_payment_id || `pay_sim_${Date.now()}`,
      gateway_order_id: bookingData.gateway_order_id || `order_sim_${Date.now()}`,
      amount: bookingData.paid_amount !== undefined ? bookingData.paid_amount : finalAmount,
      status: 'Success',
      method: bookingData.payment_method,
      created_at: new Date().toISOString()
    };
    this.data.payments.push(newPayment);

    this.saveJSON();

    return {
      success: true,
      booking: newBooking,
      guest: guestRecord,
      payment: newPayment
    };
  }

  public async updateBookingStatus(id: string, status: BookingStatus, payment_status?: PaymentStatus): Promise<Booking> {
    if (this.useMySQL) {
      if (payment_status) {
        await this.pool!.query('UPDATE bookings SET status = ?, payment_status = ? WHERE id = ?', [status, payment_status, id]);
      } else {
        await this.pool!.query('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
      }
      const [rows]: any = await this.pool!.query('SELECT * FROM bookings WHERE id = ?', [id]);
      if (rows.length === 0) throw new Error('Booking not found');
      return {
        ...rows[0],
        check_in: formatDate(rows[0].check_in),
        check_out: formatDate(rows[0].check_out),
        total_amount: Number(rows[0].total_amount),
        discount_amount: Number(rows[0].discount_amount),
        guests_count: typeof rows[0].guests_count === 'string' ? JSON.parse(rows[0].guests_count) : rows[0].guests_count
      };
    }

    const idx = this.data.bookings.findIndex(b => b.id === id);
    if (idx === -1) throw new Error('Booking not found');
    this.data.bookings[idx].status = status;
    if (payment_status) {
      this.data.bookings[idx].payment_status = payment_status;
    }
    this.saveJSON();
    return this.data.bookings[idx];
  }

  // --- CHANNEL SYNC & CALENDAR SIMULATOR ---
  public async getSyncChannels(): Promise<CalendarSyncChannel[]> {
    if (this.useMySQL) {
      const [rows]: any = await this.pool!.query('SELECT * FROM sync_channels');
      return rows;
    }
    return this.data.syncChannels;
  }

  public async addSyncChannel(channel: Omit<CalendarSyncChannel, 'id' | 'last_sync_time' | 'sync_status' | 'sync_logs'>): Promise<CalendarSyncChannel> {
    const id = `chan-${Date.now()}`;
    const newChannel: CalendarSyncChannel = {
      ...channel,
      id,
      last_sync_time: null,
      sync_status: null,
      sync_logs: 'Channel registered. No sync executed yet.'
    };

    if (this.useMySQL) {
      await this.pool!.query(
        'INSERT INTO sync_channels (id, room_id, channel_name, ical_url, last_sync_time, sync_status, sync_logs) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, channel.room_id, channel.channel_name, channel.ical_url, null, null, newChannel.sync_logs]
      );
      return newChannel;
    }

    this.data.syncChannels.push(newChannel);
    this.saveJSON();
    return newChannel;
  }

  public async deleteSyncChannel(id: string): Promise<void> {
    if (this.useMySQL) {
      await this.pool!.query('DELETE FROM sync_channels WHERE id = ?', [id]);
      return;
    }

    this.data.syncChannels = this.data.syncChannels.filter(c => c.id !== id);
    this.saveJSON();
  }

  // Trigger iCal Synchronization simulation
  public async triggerSyncChannel(id: string): Promise<CalendarSyncChannel> {
    if (this.useMySQL) {
      const [chanRows]: any = await this.pool!.query('SELECT * FROM sync_channels WHERE id = ?', [id]);
      const channel = chanRows[0];
      if (!channel) throw new Error('Channel not found');

      const [roomRows]: any = await this.pool!.query('SELECT * FROM rooms WHERE id = ?', [channel.room_id]);
      const room = roomRows[0];

      if (!room) {
        const last_sync_time = new Date().toISOString();
        const sync_status = 'Failed';
        const sync_logs = 'Failed sync: Target room type no longer exists.';
        await this.pool!.query('UPDATE sync_channels SET last_sync_time = ?, sync_status = ?, sync_logs = ? WHERE id = ?', [last_sync_time, sync_status, sync_logs, id]);
        return { ...channel, last_sync_time, sync_status, sync_logs };
      }

      const today = new Date();
      const importedDates: string[] = [];

      if (channel.channel_name.toLowerCase() === 'airbnb') {
        const blockStart = new Date(today);
        blockStart.setDate(today.getDate() + 14);
        for (let i = 0; i < 3; i++) {
          const d = new Date(blockStart);
          d.setDate(blockStart.getDate() + i);
          const dateStr = d.toISOString().split('T')[0];
          importedDates.push(dateStr);

          await this.setAvailabilityOverride({
            room_id: channel.room_id,
            date: dateStr,
            price_override: null,
            is_blackout: true,
            notes: `Synced Block: Airbnb listing block`
          });
        }
      } else {
        const blockStart = new Date(today);
        blockStart.setDate(today.getDate() + 10);
        for (let i = 0; i < 2; i++) {
          const d = new Date(blockStart);
          d.setDate(blockStart.getDate() + i);
          const dateStr = d.toISOString().split('T')[0];
          importedDates.push(dateStr);

          await this.setAvailabilityOverride({
            room_id: channel.room_id,
            date: dateStr,
            price_override: null,
            is_blackout: true,
            notes: `Synced Block: ${channel.channel_name} OTA sync`
          });
        }
      }

      const last_sync_time = new Date().toISOString();
      const sync_status = 'Success';
      const sync_logs = `Successfully processed iCal URL feed. Parsed ${importedDates.length} external blackout periods. Blocked dates: [${importedDates.join(', ')}].`;

      await this.pool!.query('UPDATE sync_channels SET last_sync_time = ?, sync_status = ?, sync_logs = ? WHERE id = ?', [last_sync_time, sync_status, sync_logs, id]);
      return { ...channel, last_sync_time, sync_status, sync_logs };
    }

    // JSON Local Fallback
    const idx = this.data.syncChannels.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Channel not found');

    const channel = this.data.syncChannels[idx];
    const room = this.data.rooms.find(r => r.id === channel.room_id);

    if (!room) {
      channel.last_sync_time = new Date().toISOString();
      channel.sync_status = 'Failed';
      channel.sync_logs = 'Failed sync: Target room type no longer exists.';
      this.saveJSON();
      return channel;
    }

    const today = new Date();
    const importedDates: string[] = [];

    if (channel.channel_name.toLowerCase() === 'airbnb') {
      const blockStart = new Date(today);
      blockStart.setDate(today.getDate() + 14);
      for (let i = 0; i < 3; i++) {
        const d = new Date(blockStart);
        d.setDate(blockStart.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        importedDates.push(dateStr);

        await this.setAvailabilityOverride({
          room_id: channel.room_id,
          date: dateStr,
          price_override: null,
          is_blackout: true,
          notes: `Synced Block: Airbnb listing block`
        });
      }
    } else {
      const blockStart = new Date(today);
      blockStart.setDate(today.getDate() + 10);
      for (let i = 0; i < 2; i++) {
        const d = new Date(blockStart);
        d.setDate(blockStart.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        importedDates.push(dateStr);

        await this.setAvailabilityOverride({
          room_id: channel.room_id,
          date: dateStr,
          price_override: null,
          is_blackout: true,
          notes: `Synced Block: ${channel.channel_name} OTA sync`
        });
      }
    }

    channel.last_sync_time = new Date().toISOString();
    channel.sync_status = 'Success';
    channel.sync_logs = `Successfully processed iCal URL feed. Parsed ${importedDates.length} external blackout periods. Blocked dates: [${importedDates.join(', ')}].`;

    this.saveJSON();
    return channel;
  }

  // --- EMAIL ALERTS SYSTEM ---
  public async getEmailLogs(): Promise<EmailLog[]> {
    if (this.useMySQL) {
      const [rows]: any = await this.pool!.query('SELECT * FROM email_logs ORDER BY sent_at DESC');
      return rows;
    }
    return this.data.emailLogs;
  }

  public async addEmailLog(log: Omit<EmailLog, 'id' | 'sent_at'>): Promise<EmailLog> {
    const id = `em-${Date.now()}`;
    const sent_at = new Date().toISOString();
    const newLog: EmailLog = { ...log, id, sent_at };

    if (this.useMySQL) {
      await this.pool!.query(
        'INSERT INTO email_logs (id, `to`, subject, html, sent_at) VALUES (?, ?, ?, ?, ?)',
        [id, log.to, log.subject, log.html, sent_at]
      );
      return newLog;
    }

    this.data.emailLogs.push(newLog);
    this.saveJSON();
    return newLog;
  }

  // Generate Admin Panel Statistics
  public async getBookingStats(): Promise<BookingStats> {
    const bookings = await this.getBookings();
    const rooms = await this.getRooms();
    const payments = await this.getPayments();
    const syncChannels = await this.getSyncChannels();
    const coupons = await this.getCoupons();

    const validBookings = bookings.filter(b => b.status !== 'Cancelled');
    const totalRevenue = validBookings.reduce((sum, b) => sum + b.total_amount, 0);
    const totalBookings = bookings.length;

    const totalInventoryCount = rooms.reduce((sum, r) => sum + r.total_inventory, 0);
    const activeBookingsCount = bookings.filter(b => b.status === 'Confirmed' || b.status === 'Checked-in').length;
    const occupancyRate = totalInventoryCount > 0
      ? Math.min(100, Math.round((activeBookingsCount / totalInventoryCount) * 100))
      : 0;

    const activeCoupons = coupons.filter(c => c.active).length;

    const activities = [
      ...bookings.map(b => ({
        id: b.id,
        description: `New booking created for ${b.guests_count?.adults || 2} guests at ${rooms.find(r => r.id === b.room_id)?.name || 'Hotel'}`,
        timestamp: b.created_at,
        type: 'booking' as const
      })),
      ...payments.map(p => ({
        id: p.id,
        description: `Successful Payment of $${p.amount} received via ${p.method}`,
        timestamp: p.created_at,
        type: 'payment' as const
      })),
      ...syncChannels.filter(c => c.last_sync_time).map(c => ({
        id: c.id,
        description: `Synced channels for ${c.channel_name} (${c.sync_status})`,
        timestamp: c.last_sync_time!,
        type: 'sync' as const
      }))
    ];

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      totalRevenue,
      totalBookings,
      occupancyRate,
      activeCoupons,
      recentActivity: activities.slice(0, 10)
    };
  }

  // --- OWNERS CRUD ---
  public async getOwners(): Promise<Owner[]> {
    if (this.useMySQL) {
      const [rows]: any = await this.pool!.query('SELECT * FROM owners');
      return rows;
    }
    return this.data.owners || [];
  }

  public async addOwner(owner: Omit<Owner, 'id'>): Promise<Owner> {
    const id = `owner-${Date.now()}`;
    const newOwner: Owner = { ...owner, id };

    if (this.useMySQL) {
      await this.pool!.query(
        'INSERT INTO owners (id, name, email, phone, company, password) VALUES (?, ?, ?, ?, ?, ?)',
        [id, owner.name, owner.email, owner.phone, owner.company, owner.password || null]
      );
      return newOwner;
    }

    if (!this.data.owners) this.data.owners = [];
    this.data.owners.push(newOwner);
    this.saveJSON();
    return newOwner;
  }

  public async updateOwner(id: string, updated: Partial<Owner>): Promise<Owner> {
    if (this.useMySQL) {
      const keys = Object.keys(updated).filter(k => k !== 'id');
      if (keys.length > 0) {
        const sets = keys.map(k => `\`${k}\` = ?`).join(', ');
        const values = keys.map(k => (updated as any)[k]);
        await this.pool!.query(`UPDATE owners SET ${sets} WHERE id = ?`, [...values, id]);
      }
      const [rows]: any = await this.pool!.query('SELECT * FROM owners WHERE id = ?', [id]);
      if (rows.length === 0) throw new Error('Owner not found');
      return rows[0];
    }

    if (!this.data.owners) this.data.owners = [];
    const idx = this.data.owners.findIndex(o => o.id === id);
    if (idx === -1) throw new Error('Owner not found');
    this.data.owners[idx] = { ...this.data.owners[idx], ...updated };
    this.saveJSON();
    return this.data.owners[idx];
  }

  public async deleteOwner(id: string): Promise<void> {
    if (this.useMySQL) {
      await this.pool!.query('DELETE FROM owners WHERE id = ?', [id]);
      return;
    }

    if (!this.data.owners) this.data.owners = [];
    this.data.owners = this.data.owners.filter(o => o.id !== id);
    this.data.properties.forEach(p => {
      if (p.owner_id === id) {
        p.owner_id = null;
      }
    });
    this.saveJSON();
  }
}

export const db = new Database();
