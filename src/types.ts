export interface Owner {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  password?: string;
}

export interface Property {
  id: string;
  name: string;
  location: string;
  address: string;
  description: string;
  image_url: string;
  contact_email: string;
  contact_phone: string;
  amenities: string[];
  owner_id?: string | null;
  map_url?: string;
}

export interface Room {
  id: string;
  property_id: string;
  name: string;
  type: string;
  base_price: number;
  capacity_adults: number;
  capacity_children: number;
  total_inventory: number;
  description: string;
  amenities: string[];
  images: string[];
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Checked-in' | 'Checked-out';
export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Unpaid' | 'Refunded';

export interface Booking {
  id: string;
  property_id: string;
  room_id: string;
  guest_id: string;
  check_in: string; // YYYY-MM-DD
  check_out: string; // YYYY-MM-DD
  total_amount: number;
  coupon_id: string | null;
  discount_amount: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  guests_count: {
    adults: number;
    children: number;
  };
  created_at: string;
  notes: string;
  sync_source: string | null; // e.g., 'Booking.com', 'Airbnb', null (direct)
}

export interface Payment {
  id: string;
  booking_id: string;
  gateway_payment_id: string;
  gateway_order_id: string;
  amount: number;
  status: 'Success' | 'Failed' | 'Pending';
  method: string;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'Percentage' | 'Fixed';
  discount_value: number;
  min_booking_amount: number;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  active: boolean;
}

export interface AvailabilityOverride {
  id: string;
  room_id: string;
  date: string; // YYYY-MM-DD
  price_override: number | null;
  is_blackout: boolean;
  notes: string | null;
}

export interface CalendarSyncChannel {
  id: string;
  room_id: string;
  channel_name: string; // Airbnb, Booking.com, Expedia, etc.
  ical_url: string;
  last_sync_time: string | null;
  sync_status: 'Success' | 'Failed' | null;
  sync_logs: string;
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  html: string;
  sent_at: string;
}

export interface BookingStats {
  totalRevenue: number;
  totalBookings: number;
  occupancyRate: number;
  activeCoupons: number;
  recentActivity: {
    id: string;
    description: string;
    timestamp: string;
    type: 'booking' | 'payment' | 'sync' | 'block';
  }[];
}

export interface GSTInvoice {
  id: string;
  booking_id?: string | null;
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  guest_gstin?: string;
  billing_address?: string;
  property_id: string;
  property_name: string;
  room_name: string;
  check_in: string;
  check_out: string;
  nights: number;
  hsn_code: string;
  base_amount: number;
  cgst_rate: number;
  sgst_rate: number;
  cgst_amount: number;
  sgst_amount: number;
  total_gst: number;
  grand_total: number;
  invoice_date: string;
  status: 'Paid' | 'Unpaid' | 'Cancelled';
  owner_gstin?: string;
}

