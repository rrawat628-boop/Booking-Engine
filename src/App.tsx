import React, { useState, useEffect } from 'react';
import {
  Search,
  Calendar,
  Users,
  MapPin,
  Map,
  Tag,
  BookOpen,
  Settings,
  Grid,
  Plus,
  Trash2,
  RefreshCw,
  Clock,
  Mail,
  ShieldCheck,
  CheckCircle,
  Sparkles,
  TrendingUp,
  FileText,
  DollarSign,
  IndianRupee,
  Building,
  BedDouble,
  Wifi,
  ChevronRight,
  Printer,
  ChevronDown,
  Percent,
  X,
  XCircle,
  HelpCircle,
  KeyRound,
  Eye,
  AlertCircle,
  ExternalLink,
  Save,
  Database,
  MessageSquare,
  Share2,
  Receipt,
  PlusCircle,
  Check,
  Upload
} from 'lucide-react';
import RazorpayModal from './components/RazorpayModal';
import PaymentOptionModal from './components/PaymentOptionModal';
import RateGrid from './components/RateGrid';
import {
  Owner,
  Property,
  Room,
  Booking,
  Guest,
  Payment,
  Coupon,
  AvailabilityOverride,
  CalendarSyncChannel,
  EmailLog,
  BookingStats,
  GSTInvoice
} from './types';

// Robust helper to split comma-separated image URLs, preserving base64 images that contain commas
const splitImageUrls = (str: string | null | undefined): string[] => {
  if (!str) return [];
  if (!str.includes('base64,')) {
    return str.split(',').map(s => s.trim()).filter(Boolean);
  }
  const parts = str.split(',');
  const result: string[] = [];
  let current = '';
  for (const part of parts) {
    if (part.trim().startsWith('data:image/') && part.includes(';base64')) {
      if (current) {
        result.push(current.trim());
      }
      current = part;
    } else {
      if (current && current.includes(';base64') && !current.includes(',')) {
        current = current + ',' + part;
      } else {
        if (current) {
          result.push(current.trim());
          current = '';
        }
        result.push(part.trim());
      }
    }
  }
  if (current) {
    result.push(current.trim());
  }
  return result.filter(Boolean);
};

// Client-side lightweight image compression (max 1200px, JPEG format, 0.75 quality)
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve(e.target?.result as string);
      };
    };
    reader.onerror = () => {
      resolve('');
    };
    reader.readAsDataURL(file);
  });
};

export interface MasterAmenity {
  id: string;
  name: string;
  enabled: boolean;
}

const DEFAULT_AMENITIES: MasterAmenity[] = [
  { id: '1', name: 'Wi-Fi', enabled: true },
  { id: '2', name: 'Air Conditioning', enabled: true },
  { id: '3', name: 'Swimming Pool', enabled: true },
  { id: '4', name: 'Parking', enabled: true },
  { id: '5', name: 'Kitchen', enabled: true },
  { id: '6', name: 'TV', enabled: true },
  { id: '7', name: 'Washing Machine', enabled: true },
  { id: '8', name: 'Power Backup', enabled: true },
  { id: '9', name: 'Gym', enabled: true },
  { id: '10', name: 'Elevator', enabled: true },
  { id: '11', name: 'Pet Friendly', enabled: true },
  { id: '12', name: 'Garden', enabled: true },
  { id: '13', name: 'Balcony', enabled: true },
  { id: '14', name: 'Breakfast Included', enabled: true }
];

const getRoomFallbackImage = (roomName: string, id: string): string => {
  const nameLower = (roomName || '').toLowerCase();
  if (nameLower.includes('suite') || nameLower.includes('royal') || nameLower.includes('sunrise')) {
    return 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&q=80&w=800';
  }
  if (nameLower.includes('villa') || nameLower.includes('cottage') || nameLower.includes('vocational') || nameLower.includes('vacational')) {
    return 'https://images.unsplash.com/photo-1584132967334-10e02bd35a17?auto=format&fit=crop&q=80&w=800';
  }
  if (nameLower.includes('deluxe') || nameLower.includes('king') || nameLower.includes('executive')) {
    return 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&q=80&w=800';
  }
  if (nameLower.includes('queen') || nameLower.includes('premium')) {
    return 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&q=80&w=800';
  }
  if (nameLower.includes('garden') || nameLower.includes('view') || nameLower.includes('mountain')) {
    return 'https://images.unsplash.com/photo-1582719478250-c89cae4db85b?auto=format&fit=crop&q=80&w=800';
  }
  // Generic beautiful hotel room image
  return 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&q=80&w=800';
};

function getEmbeddableMapUrl(url: string): string {
  if (!url) return '';
  let cleanUrl = url.trim();

  // If the user pasted a full iframe tag instead of just the URL, extract the src attribute
  if (cleanUrl.startsWith('<iframe') || cleanUrl.includes('src=')) {
    const match = cleanUrl.match(/src=["']([^"']+)["']/);
    if (match && match[1]) {
      cleanUrl = match[1];
    }
  }

  // If it's already an embed link, return as is
  if (cleanUrl.includes('output=embed') || cleanUrl.includes('/maps/embed')) {
    return cleanUrl;
  }

  // Convert standard share or cid links
  try {
    const urlObj = new URL(cleanUrl);
    
    // For maps.google.com or google.com/maps
    if (urlObj.hostname.includes('google.com') && urlObj.pathname.includes('/maps')) {
      urlObj.searchParams.set('output', 'embed');
      return urlObj.toString();
    }
  } catch (e) {
    // Fallback if URL parsing fails
  }

  // General fallback: if it's a google maps link, make sure output=embed is there
  if (cleanUrl.includes('google.com/maps') && !cleanUrl.includes('output=embed')) {
    const separator = cleanUrl.includes('?') ? '&' : '?';
    return `${cleanUrl}${separator}output=embed`;
  }

  return cleanUrl;
}

// Local Fetch Wrapper for Enhanced Database Persistence & Snapshots
const customFetch = async function (input: RequestInfo | URL, init?: RequestInit) {
  const response = await window.fetch(input, init);
  try {
    if (response.ok && init && init.method) {
      const method = String(init.method).toUpperCase();
      if (['POST', 'PUT', 'DELETE'].includes(method)) {
        let urlStr = '';
        if (typeof input === 'string') {
          urlStr = input;
        } else if (input instanceof URL) {
          urlStr = input.href;
        } else if (input && typeof input === 'object' && 'url' in input) {
          urlStr = (input as any).url;
        }
        if (urlStr && urlStr.includes('/api/') && !urlStr.includes('/api/restore-db') && !urlStr.includes('/api/reset-db')) {
          console.log('[DATABASE PERSISTENCE] Write detected, flagging custom state:', method, urlStr);
          localStorage.setItem('custom_db_is_dirty', 'true');
        }
      }
    }
  } catch (err) {
    console.error('[DATABASE PERSISTENCE] Interceptor error:', err);
  }
  return response;
};

// Shadows the global fetch within this module scope
const fetch = customFetch;

export default function App() {
  // Global View Control
  const [currentRole, setCurrentRole] = useState<'landing' | 'portal' | 'owner' | 'admin'>('landing');
  const [adminTab, setAdminTab] = useState<'dashboard' | 'bookings' | 'properties' | 'rooms' | 'coupons' | 'emails' | 'owners' | 'tax_settings' | 'db_settings' | 'amenities'>('dashboard');

  // Owner States
  const [owners, setOwners] = useState<Owner[]>([]);
  const [isOwnerLoggedIn, setIsOwnerLoggedIn] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
  const [ownerTab, setOwnerTab] = useState<'dashboard' | 'listings' | 'rates' | 'calendar' | 'bookings' | 'properties' | 'quotations' | 'invoices'>('dashboard');
  const [ownerSelectedPropId, setOwnerSelectedPropId] = useState<string>('');

  // Owner Invoice states
  const [invoices, setInvoices] = useState<GSTInvoice[]>(() => {
    const saved = localStorage.getItem('custom_invoices');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    // Set some initial mock/sample GST invoice for demonstration if empty
    return [
      {
        id: 'GST-2026-0001',
        booking_id: 'b-1',
        guest_name: 'Amit Patel',
        guest_phone: '9876543210',
        guest_email: 'amit.patel@gmail.com',
        guest_gstin: '24AAAAA1111A1Z1',
        billing_address: '102, Shanti Sadan, CG Road, Ahmedabad, Gujarat',
        property_id: 'prop-1783409576594',
        property_name: 'Amber Moon Retreat',
        room_name: 'Ground Floor',
        check_in: '2026-07-20',
        check_out: '2026-07-23',
        nights: 3,
        hsn_code: '9963',
        base_amount: 75000,
        cgst_rate: 9,
        sgst_rate: 9,
        cgst_amount: 6750,
        sgst_amount: 6750,
        total_gst: 13500,
        grand_total: 88500,
        invoice_date: '2026-07-15',
        status: 'Paid',
        owner_gstin: '07AAAAA2222B2Z2'
      }
    ];
  });

  // Sync invoices to localStorage
  useEffect(() => {
    localStorage.setItem('custom_invoices', JSON.stringify(invoices));
  }, [invoices]);

  const [selectedInvoice, setSelectedInvoice] = useState<GSTInvoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showCreateInvoiceForm, setShowCreateInvoiceForm] = useState(false);
  const [showGenInvoiceModal, setShowGenInvoiceModal] = useState(false);
  
  // States for generating invoices
  const [genInvoiceBooking, setGenInvoiceBooking] = useState<Booking | null>(null);
  const [genInvoiceGstin, setGenInvoiceGstin] = useState('');
  const [genInvoiceBillingAddress, setGenInvoiceBillingAddress] = useState('');
  const [genInvoiceOwnerGstin, setGenInvoiceOwnerGstin] = useState('07AAAAA2222B2Z2'); // Default owner GSTIN

  // States for creating custom invoices manually
  const [customInvPropId, setCustomInvPropId] = useState('');
  const [customInvRoomName, setCustomInvRoomName] = useState('');
  const [customInvGuestName, setCustomInvGuestName] = useState('');
  const [customInvGuestPhone, setCustomInvGuestPhone] = useState('');
  const [customInvGuestEmail, setCustomInvGuestEmail] = useState('');
  const [customInvGuestGstin, setCustomInvGuestGstin] = useState('');
  const [customInvBillingAddress, setCustomInvBillingAddress] = useState('');
  const [customInvCheckIn, setCustomInvCheckIn] = useState('');
  const [customInvCheckOut, setCustomInvCheckOut] = useState('');
  const [customInvBaseAmount, setCustomInvBaseAmount] = useState('');
  const [customInvGstPercent, setCustomInvGstPercent] = useState('18');
  const [customInvOwnerGstin, setCustomInvOwnerGstin] = useState('07AAAAA2222B2Z2');
  const [customInvStatus, setCustomInvStatus] = useState<'Paid' | 'Unpaid'>('Paid');

  // Lifted top-level states for GST Invoice lists and generator (to adhere to React Rules of Hooks)
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [invoiceFilterProp, setInvoiceFilterProp] = useState('all');
  const [genInvoiceGstPct, setGenInvoiceGstPct] = useState('18');
  const [genInvoiceTaxTreatment, setGenInvoiceTaxTreatment] = useState<'inclusive' | 'exclusive'>('inclusive');

  // Dynamic Amenities Master States
  const [masterAmenities, setMasterAmenities] = useState<MasterAmenity[]>(() => {
    const saved = localStorage.getItem('holiday_rentals_amenities_master');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_AMENITIES;
  });

  useEffect(() => {
    localStorage.setItem('holiday_rentals_amenities_master', JSON.stringify(masterAmenities));
  }, [masterAmenities]);

  const [editingAmenityId, setEditingAmenityId] = useState<string | null>(null);
  const [editingAmenityName, setEditingAmenityName] = useState<string>('');
  const [newAmenityName, setNewAmenityName] = useState('');
  const [newAmenityEnabled, setNewAmenityEnabled] = useState(true);
  const [amenitySearchQuery, setAmenitySearchQuery] = useState('');

  const handleSaveAmenity = (id: string) => {
    const name = editingAmenityName.trim();
    if (!name) return;
    if (masterAmenities.some(am => am.id !== id && am.name.toLowerCase() === name.toLowerCase())) {
      alert("Another amenity with this name already exists.");
      return;
    }
    setMasterAmenities(masterAmenities.map(am => am.id === id ? { ...am, name } : am));
    setEditingAmenityId(null);
    setEditingAmenityName('');
  };

  const handleToggleAmenity = (id: string) => {
    setMasterAmenities(masterAmenities.map(am => am.id === id ? { ...am, enabled: !am.enabled } : am));
  };

  const handleDeleteAmenity = (id: string) => {
    if (window.confirm("Are you sure you want to delete this amenity? Properties using it will no longer display it as an active standard choice.")) {
      setMasterAmenities(masterAmenities.filter(am => am.id !== id));
    }
  };

  const [showOwnerPropertyForm, setShowOwnerPropertyForm] = useState(false);
  const [ownerBookingSearchQuery, setOwnerBookingSearchQuery] = useState('');
  const [activeImg, setActiveImg] = useState<string | null>(null);
  const [showAddOwnerForm, setShowAddOwnerForm] = useState(false);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
  const [ownerLoginEmail, setOwnerLoginEmail] = useState('');
  const [ownerLoginPassword, setOwnerLoginPassword] = useState('');
  const [ownerLoginError, setOwnerLoginError] = useState('');

  // Owner Quotation Generator States
  const [quotePropId, setQuotePropId] = useState<string>('');
  const [quoteRoomId, setQuoteRoomId] = useState<string>('');
  const [quoteGuestName, setQuoteGuestName] = useState<string>('');
  const [quoteGuestPhone, setQuoteGuestPhone] = useState<string>('');
  const [quoteCheckIn, setQuoteCheckIn] = useState<string>('');
  const [quoteCheckOut, setQuoteCheckOut] = useState<string>('');
  const [quoteAdults, setQuoteAdults] = useState<number>(2);
  const [quoteChildren, setQuoteChildren] = useState<number>(0);
  const [quoteCustomRate, setQuoteCustomRate] = useState<string>('');
  const [quoteDiscount, setQuoteDiscount] = useState<string>('');
  const [quoteInclusions, setQuoteInclusions] = useState<string>('Free Wi-Fi, Complementary Water, Standard Check-in Inclusions');

  // Landing page interactive play state
  const [landingPromoInput, setLandingPromoInput] = useState('');
  const [landingPromoResult, setLandingPromoResult] = useState<{ success: boolean; message: string } | null>(null);

  // DB States
  const [properties, setProperties] = useState<Property[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [overrides, setOverrides] = useState<AvailabilityOverride[]>([]);
  const [syncChannels, setSyncChannels] = useState<CalendarSyncChannel[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);

  useEffect(() => {
    if (ownerTab === 'properties') {
      const ownerProps = properties.filter(p => p.owner_id === selectedOwnerId);
      if (ownerSelectedPropId === '' && ownerProps.length > 0) {
        const firstProp = ownerProps[0];
        setOwnerSelectedPropId(firstProp.id);
        const imgs = splitImageUrls(firstProp.image_url);
        setPropertyImages(imgs.length > 0 ? imgs : ['']);
        setPropertySelectedAmenities(firstProp.amenities || []);
        setCustomAmenityInput('');
      } else if (ownerSelectedPropId) {
        const found = ownerProps.find(p => p.id === ownerSelectedPropId);
        if (found) {
          const imgs = splitImageUrls(found.image_url);
          setPropertyImages(imgs.length > 0 ? imgs : ['']);
          setPropertySelectedAmenities(found.amenities || []);
          setCustomAmenityInput('');
        }
      }
    }
  }, [ownerTab, ownerSelectedPropId, properties, selectedOwnerId]);

  // loading/sync indicators
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncingChan, setIsSyncingChan] = useState<string | null>(null);

  // Booking Portal Filters
  const [searchPropertyId, setSearchPropertyId] = useState<string>('all');
  const [searchCheckIn, setSearchCheckIn] = useState<string>('2026-07-06');
  const [searchCheckOut, setSearchCheckOut] = useState<string>('2026-07-10');
  const [searchAdults, setSearchAdults] = useState<number>(2);
  const [searchChildren, setSearchChildren] = useState<number>(0);
  const [searchPromoCode, setSearchPromoCode] = useState<string>('');

  // Portal Search Results
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<string>('');
  const [searchError, setSearchError] = useState<string>('');

  // Selected rate plans per room type
  const [selectedRatePlans, setSelectedRatePlans] = useState<{ [key: string]: 'basic' | 'premium' }>({});
  // Image swap index trackers per room
  const [imageIndexes, setImageIndexes] = useState<{ [key: string]: number }>({});

  // Custom Modal & Alert States for iframe-friendly prompts
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isAlert?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
      isAlert: false,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const showAlert = (title: string, message: string) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText: 'OK',
      isAlert: true,
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const getWhatsAppBookingConfirmationUrl = (
    b: Booking,
    guest: Guest | undefined,
    rm: Room | undefined,
    prop: Property | undefined,
    nights: number
  ) => {
    if (!guest) return '#';
    const text = `Hello *${guest.name}*,\n\nYour booking with *${prop?.name || 'Holiday Rentals'}* has been confirmed! 🎉\n\n*Booking Details:*\n• *Booking ID:* ${b.id}\n• *Room/Villa:* ${rm?.name || 'Luxury Suite'}\n• *Dates:* ${b.check_in} to ${b.check_out} (${nights} ${nights === 1 ? 'Night' : 'Nights'})\n• *Guests:* ${b.guests_count?.adults || 1} Adults, ${b.guests_count?.children || 0} Children\n• *Total Amount:* ₹${b.total_amount.toLocaleString()} (${b.payment_status === 'Paid' ? 'Paid - Thank you!' : b.payment_status})\n\n${b.notes ? `*Special Request:* ${b.notes}\n\n` : ''}*Property Location:*\n${prop?.address || prop?.location || ''}\n\nWe look forward to hosting you! If you have any questions, feel free to reach out to us at ${prop?.contact_phone || ''}.\n\nSafe travels,\n*Partner Management*`;
    
    const cleanPhone = (guest.phone || '').replace(/[^0-9]/g, '');
    let formattedPhone = cleanPhone;
    if (cleanPhone.length === 10) {
      formattedPhone = '91' + cleanPhone; // Default to India country code if 10 digits
    }
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
  };

  // Admin Login States
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Computed Portfolio Variables for current logged in Owner
  const loggedInOwner = owners.find(o => o.id === selectedOwnerId);
  const ownerProperties = properties.filter(p => p.owner_id === selectedOwnerId);
  const ownerPropertyIds = ownerProperties.map(p => p.id);
  const ownerRooms = rooms.filter(r => ownerPropertyIds.includes(r.property_id));
  const ownerRoomIds = ownerRooms.map(r => r.id);
  const ownerBookings = bookings.filter(b => ownerRoomIds.includes(b.room_id));

  // Handler: update room rates inline
  const handleUpdateRoomRate = async (roomId: string, newRate: number) => {
    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base_price: newRate })
      });
      if (!res.ok) throw new Error('Failed to update room rate.');
      loadDatabase();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Apply dynamic seasonal overrides to a room type in bulk
  const handleApplySeasonalRate = async (
    roomId: string,
    startDateStr: string,
    endDateStr: string,
    rateType: 'flat' | 'percent',
    rateValue: number,
    labelNotes: string
  ) => {
    if (!roomId || !startDateStr || !endDateStr || rateValue === undefined) {
      showAlert('Error', 'Please fill in all the seasonal rate configuration fields.');
      return;
    }
    
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (end < start) {
      showAlert('Error', 'Check-out/end date cannot be earlier than check-in/start date.');
      return;
    }

    const roomObj = rooms.find(r => r.id === roomId);
    if (!roomObj) {
      showAlert('Error', 'Selected room type could not be located.');
      return;
    }

    try {
      // Create dates array
      const dates: string[] = [];
      let curr = new Date(start);
      while (curr <= end) {
        dates.push(curr.toISOString().split('T')[0]);
        curr.setDate(curr.getDate() + 1);
      }

      // Loop through dates and apply override
      for (const d of dates) {
        let finalPriceOverride = rateValue;
        if (rateType === 'percent') {
          // Increase or decrease room price by percentage
          finalPriceOverride = Math.round(roomObj.base_price * (1 + rateValue / 100));
        }

        const res = await fetch('/api/availability-overrides', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            room_id: roomId,
            date: d,
            price_override: finalPriceOverride,
            is_blackout: false,
            notes: labelNotes || 'Seasonal Dynamic Rate adjustment'
          })
        });
        if (!res.ok) throw new Error(`Failed to save rate for date: ${d}`);
      }

      showAlert('Rates Updated Successfully', `Successfully applied the seasonal price override "${labelNotes}" for ${dates.length} dates!`);
      // Reset seasonal rate form inputs to default/empty values
      setSeasonalRoomId('');
      setSeasonalStartDate('');
      setSeasonalEndDate('');
      setSeasonalRateValue(0);
      setSeasonalLabel('Summer Vacation');
      await loadDatabase();
    } catch (err: any) {
      showAlert('Error updating rates', err.message);
    }
  };

  // Handler: reset a custom nightly rate back to base price
  const handleResetRate = async (roomId: string, dateStr: string) => {
    try {
      const response = await fetch('/api/availability-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          date: dateStr,
          price_override: null,
          is_blackout: false,
          notes: null
        })
      });
      if (!response.ok) throw new Error('Failed to reset nightly rate.');
      await loadDatabase();
    } catch (err: any) {
      showAlert('Error resetting rate', err.message);
    }
  };

  // Handler: toggle availability block status
  const handleToggleBlackout = async (roomId: string, dateStr: string) => {
    const existing = overrides.find(o => o.room_id === roomId && o.date === dateStr);
    const isBlackout = existing ? existing.is_blackout : false;
    
    try {
      const response = await fetch('/api/availability-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          date: dateStr,
          is_blackout: !isBlackout,
          rate_multiplier: 1.0
        })
      });
      if (!response.ok) throw new Error('Failed to toggle calendar block.');
      loadDatabase();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Custom Interactive Calendar States
  const [calMonth, setCalMonth] = useState(6); // 6 = July (0-indexed)
  const [calYear, setCalYear] = useState(2026);
  const [openRoomCalendarId, setOpenRoomCalendarId] = useState<string | null>(null);

  // Seasonal and dynamic pricing states
  const [seasonalRoomId, setSeasonalRoomId] = useState('');
  const [seasonalStartDate, setSeasonalStartDate] = useState('');
  const [seasonalEndDate, setSeasonalEndDate] = useState('');
  const [seasonalRateType, setSeasonalRateType] = useState<'flat' | 'percent'>('flat');
  const [seasonalRateValue, setSeasonalRateValue] = useState<number>(0);
  const [seasonalLabel, setSeasonalLabel] = useState('Summer Vacation');

  // Helper: check if a room type is fully booked on a YYYY-MM-DD date
  const isRoomBookedOnDate = (roomId: string, dateStr: string) => {
    const roomObj = rooms.find(r => r.id === roomId);
    if (!roomObj) return false;
    
    // Count bookings for this room on this date
    const bookedCount = bookings.filter(b => {
      if (b.room_id !== roomId) return false;
      if (b.status === 'Cancelled') return false;
      return dateStr >= b.check_in && dateStr < b.check_out;
    }).length;
    
    // Check if date is blacked out
    const isBlackout = overrides.some(o => o.room_id === roomId && o.date === dateStr && o.is_blackout);
    
    return isBlackout || (bookedCount >= roomObj.total_inventory);
  };

  // Helper: check property status on a date
  const getPropertyStatusForDate = (dateStr: string) => {
    const targetRooms = rooms.filter(r => searchPropertyId === 'all' || r.property_id === searchPropertyId);
    if (targetRooms.length === 0) return { status: 'available', totalInv: 0, booked: 0 };

    let totalInv = 0;
    let totalBooked = 0;
    let totalBlackout = 0;

    targetRooms.forEach(room => {
      totalInv += room.total_inventory;
      
      const bookedCount = bookings.filter(b => {
        if (b.room_id !== room.id) return false;
        if (b.status === 'Cancelled') return false;
        return dateStr >= b.check_in && dateStr < b.check_out;
      }).length;
      
      totalBooked += bookedCount;

      const isBlackout = overrides.some(o => o.room_id === room.id && o.date === dateStr && o.is_blackout);
      if (isBlackout) {
        totalBlackout += room.total_inventory;
      }
    });

    const isFullyBooked = (totalBooked >= totalInv) || (totalBlackout >= totalInv);
    const hasSomeBookings = totalBooked > 0;

    if (isFullyBooked) {
      return { status: 'fully-booked', totalInv, booked: totalBooked, label: 'Fully Booked' };
    } else if (hasSomeBookings) {
      const remaining = totalInv - totalBooked;
      return { status: 'partially-booked', totalInv, booked: totalBooked, label: `${remaining} Left` };
    } else {
      return { status: 'available', totalInv, booked: 0, label: 'Available' };
    }
  };

  // Active Reservation / Checkout Flow state
  const [selectedRoomResult, setSelectedRoomResult] = useState<any | null>(null);
  const [taxRate, setTaxRate] = useState<number>(() => {
    const saved = localStorage.getItem('custom_tax_rate');
    return saved ? parseFloat(saved) : 8.5;
  });

  const [partialPaymentPercent, setPartialPaymentPercent] = useState<number>(() => {
    const saved = localStorage.getItem('custom_partial_payment_percent');
    return saved ? parseInt(saved, 10) : 30;
  });

  const [tempTaxRate, setTempTaxRate] = useState<number>(taxRate);
  const [tempPartialPaymentPercent, setTempPartialPaymentPercent] = useState<number>(partialPaymentPercent);

  useEffect(() => {
    setTempTaxRate(taxRate);
    setTempPartialPaymentPercent(partialPaymentPercent);
  }, [taxRate, partialPaymentPercent, adminTab]);

  useEffect(() => {
    setActiveImg(null);
  }, [searchPropertyId]);

  const updateTaxRate = (rate: number) => {
    setTaxRate(rate);
    localStorage.setItem('custom_tax_rate', rate.toString());
  };

  const updatePartialPaymentPercent = (percent: number) => {
    setPartialPaymentPercent(percent);
    localStorage.setItem('custom_partial_payment_percent', percent.toString());
  };
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3 | 4>(1); // 1: Review, 2: Guest Details, 3: Success Screen
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestAddress, setGuestAddress] = useState('');
  const [guestNotes, setGuestNotes] = useState('');
  const [ratePlanAddon, setRatePlanAddon] = useState<'basic' | 'premium'>('basic');

  // Razorpay triggers
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
  const [isPaymentOptionOpen, setIsPaymentOptionOpen] = useState(false);
  const [selectedPaymentType, setSelectedPaymentType] = useState<'full' | 'partial'>('full');
  const [paymentPercentage, setPaymentPercentage] = useState<number>(100);
  const [selectedPayNowAmount, setSelectedPayNowAmount] = useState<number>(0);
  const [selectedRemainingAmount, setSelectedRemainingAmount] = useState<number>(0);
  const [confirmedBookingResult, setConfirmedBookingResult] = useState<any | null>(null);

  // Email Modal Previews
  const [previewEmail, setPreviewEmail] = useState<EmailLog | null>(null);

  // Admin Editors States
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [propertyImages, setPropertyImages] = useState<string[]>(['']);
  const [propertySelectedAmenities, setPropertySelectedAmenities] = useState<string[]>([]);
  const [customAmenityInput, setCustomAmenityInput] = useState('');
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomImages, setRoomImages] = useState<string[]>(['']);
  const [showChannelForm, setShowChannelForm] = useState(false);
  const [showCouponForm, setShowCouponForm] = useState(false);

  const [imageUploading, setImageUploading] = useState<{ [key: string]: boolean }>({});
  const [tempPreviews, setTempPreviews] = useState<{ [key: string]: string }>({});

  const liveEditingProperty = editingProperty ? (properties.find(p => p.id === editingProperty.id) || editingProperty) : null;
  useEffect(() => {
    if (liveEditingProperty) {
      const imgs = splitImageUrls(liveEditingProperty.image_url);
      setPropertyImages(imgs.length > 0 ? imgs : ['']);
      setPropertySelectedAmenities(liveEditingProperty.amenities || []);
    }
  }, [liveEditingProperty?.image_url, liveEditingProperty?.amenities]);

  const handleUploadImageFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number,
    formKey: string,
    currentImages: string[],
    setImagesState: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const key = `${formKey}-${idx}`;
    setImageUploading(prev => ({ ...prev, [key]: true }));

    try {
      const base64Data = await compressImage(file);
      if (!base64Data) {
        throw new Error('Could not compress or read the uploaded image.');
      }

      // Store the base64 preview locally for instantaneous preview thumbnail rendering,
      // without modifying the main image text input value or the database state.
      setTempPreviews(prev => ({ ...prev, [key]: base64Data }));

      // Now, upload to the server and replace with the real static file URL
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Data })
      });

      if (!response.ok) {
        throw new Error('Failed to upload image to server.');
      }

      const resData = await response.json();
      if (resData.url) {
        // Replace with the clean server-side URL path
        const finalUpdated = [...currentImages];
        finalUpdated[idx] = resData.url;
        setImagesState(finalUpdated);
        
        // Clean up local temp preview as we now have the server-side static url
        setTempPreviews(prev => {
          const cpy = { ...prev };
          delete cpy[key];
          return cpy;
        });
      } else {
        throw new Error('Server upload returned empty URL.');
      }

    } catch (err: any) {
      alert(err.message || 'Image upload failed.');
    } finally {
      setImageUploading(prev => ({ ...prev, [key]: false }));
    }
  };

  // Admin Search / Filter Bookings
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');

  // Load database content on boot with dynamic server recovery & sync
  const loadDatabase = async (isInitialBoot = false) => {
    setIsLoading(true);

    const safeFetchJson = async (url: string, defaultValue: any) => {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          console.warn(`[DATABASE] Fetch to ${url} failed with status ${res.status}`);
          return defaultValue;
        }
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn(`[DATABASE] Fetch to ${url} returned non-JSON content-type: ${contentType}`);
          return defaultValue;
        }
        return await res.json();
      } catch (err) {
        console.warn(`[DATABASE] Failed to fetch or parse JSON from ${url}:`, err);
        return defaultValue;
      }
    };

    try {
      // 1. If we have a local customized snapshot and the container restarted/slept, restore it first
      if (isInitialBoot && localStorage.getItem('custom_db_is_dirty') === 'true') {
        const snapshotStr = localStorage.getItem('custom_db_snapshot');
        if (snapshotStr) {
          try {
            const snapshot = JSON.parse(snapshotStr);
            console.log('[DATABASE PERSISTENCE] Syncing custom database state to active server...');
            const restoreRes = await fetch('/api/restore-db', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(snapshot)
            });
            if (restoreRes.ok) {
              console.log('[DATABASE PERSISTENCE] Server database successfully recovered and synchronized.');
            }
          } catch (e) {
            console.warn('[DATABASE PERSISTENCE] Failed to upload local snapshot to server:', e);
          }
        }
      }

      // 2. Fetch the active state safely
      const [
        resProps, resRooms, resBookings, resGuests,
        resPayments, resCoupons, resOverrides, resChannels,
        resEmails, resStats, resOwners
      ] = await Promise.all([
        safeFetchJson('/api/properties', []),
        safeFetchJson('/api/rooms', []),
        safeFetchJson('/api/bookings', []),
        safeFetchJson('/api/guests', []),
        safeFetchJson('/api/payments', []),
        safeFetchJson('/api/coupons', []),
        safeFetchJson('/api/availability-overrides', []),
        safeFetchJson('/api/sync-channels', []),
        safeFetchJson('/api/email-logs', []),
        safeFetchJson('/api/stats', null),
        safeFetchJson('/api/owners', [])
      ]);

      setProperties(resProps);
      setRooms(resRooms);
      setBookings(resBookings);
      setGuests(resGuests);
      setPayments(resPayments);
      setCoupons(resCoupons);
      setOverrides(resOverrides);
      setSyncChannels(resChannels);
      setEmailLogs(resEmails);
      setStats(resStats);
      setOwners(resOwners);

      // 3. Keep local storage snapshot perfectly synchronized
      if (localStorage.getItem('custom_db_is_dirty') === 'true') {
        const dbData = {
          properties: resProps,
          rooms: resRooms,
          guests: resGuests,
          bookings: resBookings,
          payments: resPayments,
          coupons: resCoupons,
          availabilityOverrides: resOverrides,
          syncChannels: resChannels,
          emailLogs: resEmails,
          owners: resOwners
        };
        localStorage.setItem('custom_db_snapshot', JSON.stringify(dbData));
      }
    } catch (err) {
      console.warn('Error fetching database:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportDatabase = () => {
    const dbData = {
      properties,
      rooms,
      guests,
      bookings,
      payments,
      coupons,
      availabilityOverrides: overrides,
      syncChannels,
      emailLogs,
      owners
    };
    
    const blob = new Blob([JSON.stringify(dbData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'db.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showAlert('Database Exported', 'The full current database has been successfully downloaded as db.json! You can place this file in your project folder to persist all modifications.');
  };

  const handleResetDatabase = () => {
    showConfirm(
      'Reset Database to Defaults',
      'Are you sure you want to completely clear all custom edits, deleted rooms, and settings, and restore the original default seed data?',
      async () => {
        try {
          localStorage.removeItem('custom_db_is_dirty');
          localStorage.removeItem('custom_db_snapshot');
          const res = await fetch('/api/reset-db', {
            method: 'POST'
          });
          if (res.ok) {
            window.location.reload();
          } else {
            const errData = await res.json();
            showAlert('Error', 'Failed to reset database on server: ' + (errData.error || 'Unknown error'));
          }
        } catch (err: any) {
          showAlert('Error', 'Failed to reset database: ' + err.message);
        }
      }
    );
  };

  useEffect(() => {
    loadDatabase(true);
  }, []);

  // Run Room Search
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchError('');
    setIsLoading(true);
    try {
      const q = new URLSearchParams({
        propertyId: searchPropertyId,
        checkIn: searchCheckIn,
        checkOut: searchCheckOut,
        adults: String(searchAdults),
        children: String(searchChildren),
        couponCode: searchPromoCode
      });
      const response = await fetch(`/api/search-rooms?${q.toString()}`);
      if (!response.ok) throw new Error('Search request failed.');
      const results = await response.json();
      setSearchResults(results);
      setHasSearched(true);
      setAppliedPromo(searchPromoCode);
    } catch (err: any) {
      setSearchError(err.message || 'Failed to retrieve available hotel rooms.');
    } finally {
      setIsLoading(false);
    }
  };

  // Run a default auto-search on boot so the booking page is pre-populated
  useEffect(() => {
    if (properties.length > 0 && !hasSearched) {
      handleSearch();
    }
  }, [properties]);

  // Initiate Booking Setup
  const openBookingCheckout = (resultItem: any) => {
    setSelectedRoomResult(resultItem);
    setRatePlanAddon(selectedRatePlans[resultItem.room.id] || 'basic');
    setCheckoutStep(1);
    setConfirmedBookingResult(null);
  };

  // Trigger simulated payment
  const handleGuestFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestEmail || !guestPhone) {
      alert('Please fill out all mandatory guest information fields.');
      return;
    }
    setIsPaymentOptionOpen(true);
  };

  const handlePaymentOptionSelect = (
    type: 'full' | 'partial',
    payNow: number,
    remaining: number,
    percentage: number
  ) => {
    setSelectedPaymentType(type);
    setSelectedPayNowAmount(payNow);
    setSelectedRemainingAmount(remaining);
    setPaymentPercentage(percentage);
    setIsPaymentOptionOpen(false);
    setIsRazorpayOpen(true);
  };

  // Razorpay simulation completed
  const handleRazorpaySuccess = async (paymentId: string, orderId: string) => {
    setIsRazorpayOpen(false);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: selectedRoomResult.room.property_id,
          room_id: selectedRoomResult.room.id,
          check_in: searchCheckIn,
          check_out: searchCheckOut,
          guests_count: { adults: searchAdults, children: searchChildren },
          notes: `${guestNotes ? guestNotes + '\n' : ''}${
            selectedPaymentType === 'partial' 
              ? `[Partial Payment Choice]: Paid ${paymentPercentage}% deposit. Remaining balance of ₹${selectedRemainingAmount.toFixed(0)} to be paid at property check-in.`
              : '[Full Payment Choice]: Paid 100% in full.'
          }`,
          guest: {
            name: guestName,
            email: guestEmail,
            phone: guestPhone,
            address: guestAddress || 'Not Provided'
          },
          coupon_code: appliedPromo || null,
          payment_method: 'Credit Card',
          gateway_payment_id: paymentId,
          gateway_order_id: orderId,
          payment_status: selectedPaymentType === 'partial' ? 'Partially Paid' : 'Paid',
          paid_amount: selectedPayNowAmount
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to complete booking processing.');
      }

      setConfirmedBookingResult(resData);
      setCheckoutStep(3); // success screen
      loadDatabase(); // reload statistics
    } catch (err: any) {
      alert(err.message || 'Booking process failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRazorpayFailure = (errorMsg: string) => {
    alert(`Payment verification failed: ${errorMsg}`);
    setIsRazorpayOpen(false);
  };

  // Admin actions: update status
  const handleUpdateBookingStatus = async (bookingId: string, status: string, payment_status?: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, payment_status })
      });
      if (!response.ok) throw new Error('Status update failed');
      loadDatabase();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Admin trigger external OTA Channel sync
  const handleTriggerSync = async (chanId: string) => {
    setIsSyncingChan(chanId);
    try {
      const response = await fetch(`/api/sync-channels/${chanId}/trigger`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('OTA Channel Sync failed');
      loadDatabase();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSyncingChan(null);
    }
  };

  // Add properties
  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = {
      name: (form.elements.namedItem('propName') as HTMLInputElement).value,
      location: (form.elements.namedItem('propLoc') as HTMLInputElement).value,
      address: (form.elements.namedItem('propAddress') as HTMLInputElement).value,
      contact_email: (form.elements.namedItem('propEmail') as HTMLInputElement).value,
      contact_phone: (form.elements.namedItem('propPhone') as HTMLInputElement).value,
      description: (form.elements.namedItem('propDesc') as HTMLTextAreaElement).value,
      image_url: propertyImages.map(s => s.trim()).filter(Boolean).join(','),
      amenities: propertySelectedAmenities.filter(Boolean),
      owner_id: (form.elements.namedItem('propOwner') as HTMLSelectElement)?.value || null,
      map_url: (form.elements.namedItem('propMapUrl') as HTMLInputElement).value
    };

    try {
      let url = '/api/properties';
      let method = 'POST';
      if (editingProperty) {
        url = `/api/properties/${editingProperty.id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to save hotel profile.');
      
      setShowPropertyForm(false);
      setEditingProperty(null);
      loadDatabase();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete properties
  const handleDeleteProperty = async (id: string) => {
    showConfirm(
      'Delete Hotel Property',
      'Are you absolutely sure? This will delete the hotel and all associated rooms, active calendar grids, and block setups!',
      async () => {
        try {
          const res = await fetch(`/api/properties/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Deletion failed.');
          loadDatabase();
        } catch (err: any) {
          showAlert('Error', err.message);
        }
      }
    );
  };

  // Save owner details
  const handleSaveOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = {
      name: (form.elements.namedItem('ownerName') as HTMLInputElement).value,
      email: (form.elements.namedItem('ownerEmail') as HTMLInputElement).value,
      phone: (form.elements.namedItem('ownerPhone') as HTMLInputElement).value,
      company: (form.elements.namedItem('ownerCompany') as HTMLInputElement).value
    };

    try {
      let url = '/api/owners';
      let method = 'POST';
      if (editingOwner) {
        url = `/api/owners/${editingOwner.id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to save owner profile.');

      setShowAddOwnerForm(false);
      setEditingOwner(null);
      loadDatabase();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete owner
  const handleDeleteOwner = async (id: string) => {
    showConfirm(
      'Delete Owner',
      'Are you sure you want to delete this owner? Their properties will become unassigned.',
      async () => {
        try {
          const res = await fetch(`/api/owners/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Deletion failed.');
          loadDatabase();
        } catch (err: any) {
          showAlert('Error', err.message);
        }
      }
    );
  };

  // Add rooms
  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = {
      property_id: (form.elements.namedItem('roomProp') as HTMLSelectElement).value,
      name: (form.elements.namedItem('roomName') as HTMLInputElement).value,
      type: (form.elements.namedItem('roomType') as HTMLInputElement).value,
      base_price: Number((form.elements.namedItem('roomPrice') as HTMLInputElement).value),
      capacity_adults: Number((form.elements.namedItem('roomAdults') as HTMLInputElement).value),
      capacity_children: Number((form.elements.namedItem('roomKids') as HTMLInputElement).value),
      total_inventory: Number((form.elements.namedItem('roomInv') as HTMLInputElement).value),
      description: (form.elements.namedItem('roomDesc') as HTMLTextAreaElement).value,
      amenities: (form.elements.namedItem('roomAmen') as HTMLInputElement).value.split(',').map(s => s.trim()),
      images: roomImages.map(s => s.trim()).filter(Boolean)
    };

    try {
      let url = '/api/rooms';
      let method = 'POST';
      if (editingRoom) {
        url = `/api/rooms/${editingRoom.id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to save room details.');

      setShowRoomForm(false);
      setEditingRoom(null);
      loadDatabase();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete room
  const handleDeleteRoom = async (id: string) => {
    showConfirm(
      'Delete Room Type',
      'Are you sure you want to delete this room type? All availability overrides will be cleared.',
      async () => {
        try {
          const res = await fetch(`/api/rooms/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Deletion failed.');
          loadDatabase();
        } catch (err: any) {
          showAlert('Error', err.message);
        }
      }
    );
  };

  // Add Calendar Sync channel
  const handleSaveChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = {
      room_id: (form.elements.namedItem('chanRoom') as HTMLSelectElement).value,
      channel_name: (form.elements.namedItem('chanName') as HTMLSelectElement).value,
      ical_url: (form.elements.namedItem('chanUrl') as HTMLInputElement).value
    };

    try {
      const res = await fetch('/api/sync-channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to register OTA channel sync.');

      setShowChannelForm(false);
      loadDatabase();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete Channel
  const handleDeleteChannel = async (id: string) => {
    showConfirm(
      'Remove Channel',
      'Remove this calendar synchronization channel?',
      async () => {
        try {
          const res = await fetch(`/api/sync-channels/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Deletion failed.');
          loadDatabase();
        } catch (err: any) {
          showAlert('Error', err.message);
        }
      }
    );
  };

  // Save promo coupon
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = {
      code: (form.elements.namedItem('cpCode') as HTMLInputElement).value.toUpperCase().replace(/\s/g, ''),
      discount_type: (form.elements.namedItem('cpType') as HTMLSelectElement).value,
      discount_value: Number((form.elements.namedItem('cpVal') as HTMLInputElement).value),
      min_booking_amount: Number((form.elements.namedItem('cpMin') as HTMLInputElement).value),
      start_date: (form.elements.namedItem('cpStart') as HTMLInputElement).value,
      end_date: (form.elements.namedItem('cpEnd') as HTMLInputElement).value,
      active: true
    };

    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to save promotional coupon.');

      setShowCouponForm(false);
      loadDatabase();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    showConfirm(
      'Delete Coupon',
      'Delete this coupon code?',
      async () => {
        try {
          const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Deletion failed.');
          loadDatabase();
        } catch (err: any) {
          showAlert('Error', err.message);
        }
      }
    );
  };

  // Format Helper for currency
  const fmtCurr = (val: number) => `₹${val.toLocaleString()}`;

  // Image Switcher Helper
  const handleImageSwitch = (roomId: string, index: number) => {
    setImageIndexes(prev => ({ ...prev, [roomId]: index }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none text-slate-800">
      
      {/* GLOBAL HEAD NAVIGATION RAIL */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-[100] px-4 md:px-8 py-3 flex flex-col md:flex-row justify-between items-center border-b border-slate-800 gap-3 md:gap-0">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentRole('landing')}>
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg text-white flex items-center justify-center font-black text-sm tracking-widest shadow-inner">
            Holiday Rentals
          </div>
          <div>
            <h1 className="font-extrabold text-xs md:text-sm tracking-tight flex items-center gap-1.5">
              <span>Holiday Rentals Cloud Suite</span>
              <span className="hidden sm:inline-block text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded-full font-bold uppercase">Max v4.2</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">Hotel Booking Engine & Channel Manager</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => setCurrentRole('landing')}
            className={`font-bold text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              currentRole === 'landing'
                ? 'bg-slate-800 text-white border border-slate-700 shadow-inner'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Building className="w-3.5 h-3.5 text-blue-400" />
            <span>Overview</span>
          </button>
          
          <button
            onClick={() => {
              setCurrentRole('portal');
              handleSearch();
            }}
            className={`font-bold text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              currentRole === 'portal'
                ? 'bg-emerald-600 text-white shadow-md border border-emerald-500'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            id="goto_portal_btn"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Booking Portal</span>
          </button>

          <button
            onClick={() => {
              setCurrentRole('owner');
              loadDatabase();
            }}
            className={`font-bold text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              currentRole === 'owner'
                ? 'bg-purple-650 bg-purple-600 text-white shadow-md border border-purple-500'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            id="goto_owner_btn"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Owner Portal</span>
          </button>

          <button
            onClick={() => {
              setCurrentRole('admin');
              loadDatabase();
            }}
            className={`font-bold text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              currentRole === 'admin'
                ? 'bg-blue-600 text-white shadow-md border border-blue-500'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            id="goto_admin_btn"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Admin Console</span>
          </button>

          {isLoading && (
            <RefreshCw className="w-4 h-4 animate-spin text-blue-400 ml-1" />
          )}
        </div>
      </header>

      {/* VIEWPORT BODY CONTAINER */}
      <main className="flex-1 flex flex-col">

        {/* VIEW 0: HOLIDAY RENTALS PRODUCT MARKETING LANDING PAGE */}
        {currentRole === 'landing' && (
          <div className="flex-1 bg-slate-50 flex flex-col" id="product_landing_page">
            
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 text-white pt-16 pb-28 px-4 sm:px-6 lg:px-8">
              {/* Background accent glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full opacity-10 pointer-events-none">
                <div className="absolute top-12 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
                <div className="absolute bottom-12 right-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-3xl"></div>
              </div>

              <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>HOLIDAY RENTALS MAX CLOUD SUITE • DEMO WORKSPACE</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  The Premium Hotel Booking Engine <br className="hidden sm:inline" />
                  <span className="text-blue-450 text-blue-400">& Channel Manager</span>
                </h1>

                <p className="text-slate-300 text-sm sm:text-base md:text-lg max-w-3xl mx-auto font-medium leading-relaxed">
                  Holiday Rentals empowers properties to supercharge direct bookings, eliminate overbookings with instantaneous inventory channel sync, and optimize revenue using daily grids, customized promo codes, and rich rate plan add-ons.
                </p>

                {/* Main Action CTAs */}
                <div className="pt-6 flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
                  <button
                    onClick={() => {
                      setCurrentRole('portal');
                      handleSearch();
                    }}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-sm py-4 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Launch Guest Portal</span>
                    <ChevronRight className="w-4 h-4 text-emerald-200" />
                  </button>

                  <button
                    onClick={() => {
                      setCurrentRole('admin');
                      loadDatabase();
                    }}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-extrabold text-sm py-4 px-6 rounded-xl shadow-md transition-all duration-200 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-blue-400" />
                    <span>Open Admin Console</span>
                  </button>
                </div>

                {/* App Features Quick Badges */}
                <div className="pt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs font-semibold text-slate-400 border-t border-slate-800/60 max-w-4xl mx-auto">
                  <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Multi-Property Management</span>
                  <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> iCal Calendar Sync Feed</span>
                  <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Razorpay Simulator</span>
                  <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500" /> Nodemailer Notifications</span>
                </div>
              </div>
            </section>

            {/* Elegant Search Bar Card (Overlapping Hero) */}
            <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20 mb-8 text-center" id="landing_overlapping_search">
              <p className="text-xs sm:text-sm text-slate-400 font-medium mb-4 tracking-wide max-w-2xl mx-auto drop-shadow-sm">
                Browse premium properties and book directly with property owners. No hidden fees, transparent pricing.
              </p>
              
              <div className="bg-white rounded-2xl border border-slate-200/65 shadow-xl p-6 sm:p-8 space-y-6 text-left">
                
                {/* Form inputs container */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    setCurrentRole('portal');
                    handleSearch();
                  }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    
                    {/* Destination/Property field */}
                    <div className="md:col-span-5 col-span-1">
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Destination
                      </label>
                      <div className="flex items-center gap-2 bg-[#f4f4f6] rounded-xl px-4 py-3 border border-transparent focus-within:border-slate-200 transition-all">
                        <MapPin className="w-4 h-4 text-slate-450 text-slate-400 flex-shrink-0" />
                        <select
                          value={searchPropertyId}
                          onChange={(e) => setSearchPropertyId(e.target.value)}
                          className="bg-transparent border-none outline-none w-full font-semibold text-slate-700 text-xs sm:text-sm focus:ring-0 p-0 cursor-pointer"
                        >
                          <option value="all">City or address (All Properties)</option>
                          {properties.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.location})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Check-in field */}
                    <div className="md:col-span-2 col-span-1">
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Check-in
                      </label>
                      <div className="flex items-center gap-2 bg-[#f4f4f6] rounded-xl px-4 py-3 border border-transparent focus-within:border-slate-200 transition-all">
                        <Calendar className="w-4 h-4 text-slate-450 text-slate-400 flex-shrink-0" />
                        <input
                          type="date"
                          value={searchCheckIn}
                          onChange={(e) => setSearchCheckIn(e.target.value)}
                          className="bg-transparent border-none outline-none w-full font-semibold text-slate-700 text-xs sm:text-sm focus:ring-0 p-0 cursor-pointer"
                          min="2026-01-01"
                        />
                      </div>
                    </div>

                    {/* Check-out field */}
                    <div className="md:col-span-2 col-span-1">
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Check-out
                      </label>
                      <div className="flex items-center gap-2 bg-[#f4f4f6] rounded-xl px-4 py-3 border border-transparent focus-within:border-slate-200 transition-all">
                        <Calendar className="w-4 h-4 text-slate-450 text-slate-400 flex-shrink-0" />
                        <input
                          type="date"
                          value={searchCheckOut}
                          onChange={(e) => setSearchCheckOut(e.target.value)}
                          className="bg-transparent border-none outline-none w-full font-semibold text-slate-700 text-xs sm:text-sm focus:ring-0 p-0 cursor-pointer"
                          min="2026-01-01"
                        />
                      </div>
                    </div>

                    {/* Guests field */}
                    <div className="md:col-span-3 col-span-1">
                      <label className="block text-xs font-bold text-slate-900 mb-2">
                        Guests
                      </label>
                      <div className="flex items-center gap-2 bg-[#f4f4f6] rounded-xl px-4 py-3 border border-transparent focus-within:border-slate-200 transition-all">
                        <Users className="w-4 h-4 text-slate-450 text-slate-400 flex-shrink-0" />
                        <select
                          value={searchAdults}
                          onChange={(e) => setSearchAdults(Number(e.target.value))}
                          className="bg-transparent border-none outline-none w-full font-semibold text-slate-700 text-xs sm:text-sm focus:ring-0 p-0 cursor-pointer"
                        >
                          {[1, 2, 3, 4, 5, 6].map(n => (
                            <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                  </div>

                  {/* Search Button (Bright Pink/Magenta `#d83bbb` from the image) */}
                  <div className="flex justify-start">
                    <button
                      type="submit"
                      className="bg-[#d83bbb] hover:bg-[#c22f9e] text-white font-bold text-sm px-10 py-3 rounded-xl transition-all duration-150 shadow-md hover:shadow-lg active:scale-95 cursor-pointer"
                    >
                      Search
                    </button>
                  </div>
                </form>

              </div>
            </div>

            {/* Live Interactive Statistics Widget */}
            <section className="bg-slate-100 py-12 px-4 sm:px-6 lg:px-8 border-y border-slate-200">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-xs font-extrabold tracking-widest text-blue-600 uppercase">Live Operations Snapshot</h2>
                  <p className="text-xl font-black text-slate-900 mt-1">Real-time database indicators powered by our custom JSON DB</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Card 1 */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs relative overflow-hidden group hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Managed Hotels</span>
                        <span className="text-3xl font-black text-slate-800 block mt-2">{properties.length}</span>
                      </div>
                      <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg">
                        <Building className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium mt-3 flex items-center gap-1">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block animate-ping"></span>
                      <span>Connected & active</span>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs relative overflow-hidden group hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bookings Received</span>
                        <span className="text-3xl font-black text-slate-800 block mt-2">{bookings.length}</span>
                      </div>
                      <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-lg">
                        <FileText className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-[10px] text-emerald-600 font-semibold mt-3">
                      <span>100% completed simulation</span>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs relative overflow-hidden group hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Yield Volume</span>
                        <span className="text-3xl font-black text-slate-800 block mt-2">
                          {fmtCurr(bookings.filter(b => b.status !== 'Cancelled').reduce((sum, b) => sum + b.total_amount, 0))}
                        </span>
                      </div>
                      <div className="bg-purple-50 text-purple-600 p-2.5 rounded-lg">
                        <IndianRupee className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-[10px] text-purple-600 font-semibold mt-3">
                      <span>Direct channel revenue</span>
                    </div>
                  </div>

                  {/* Card 4 */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs relative overflow-hidden group hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active Promo Coupons</span>
                        <span className="text-3xl font-black text-slate-800 block mt-2">
                          {coupons.filter(c => c.active).length}
                        </span>
                      </div>
                      <div className="bg-amber-50 text-amber-600 p-2.5 rounded-lg">
                        <Tag className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="text-[10px] text-amber-600 font-semibold mt-3">
                      <span>Valid across checkout</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Core Features Grid */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
              <div className="text-center space-y-2">
                <h2 className="text-xs font-extrabold tracking-widest text-blue-600 uppercase">Engineered for Results</h2>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">The Holiday Rentals Max Feature Advantage</h3>
                <p className="text-sm text-slate-500 max-w-2xl mx-auto font-medium">Everything a growing hotel property needs to synchronize rates, bypass middleman OTA commissions, and manage real-time inventory.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Feature 1 */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex gap-5 shadow-xs hover:shadow-md transition">
                  <div className="bg-blue-500 text-white p-3.5 rounded-xl h-12 w-12 flex items-center justify-center shrink-0">
                    <Grid className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 text-lg">Dynamic Holiday Rentals Max Grid</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Stay in full command of your daily rates, remaining inventory availability, pricing overrides, and blackout dates. Change rates in seconds, and automatically recalculate direct pricing multipliers.
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex gap-5 shadow-xs hover:shadow-md transition">
                  <div className="bg-emerald-500 text-white p-3.5 rounded-xl h-12 w-12 flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 text-lg">Frictionless Guest Booking Portal</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Provide travelers with a fast, modern direct checkout experience. Includes search widgets, date range validators, promo codes, basic vs. premium rate plans, and simulated secure credit card payments.
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex gap-5 shadow-xs hover:shadow-md transition">
                  <div className="bg-purple-500 text-white p-3.5 rounded-xl h-12 w-12 flex items-center justify-center shrink-0">
                    <RefreshCw className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 text-lg">Smart iCal OTA Synchronizer</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Eliminate manual updates and double bookings. Setup simulated calendar sync endpoints with connected channels (Booking.com, Airbnb, Expedia) to fetch external block lists automatically.
                    </p>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex gap-5 shadow-xs hover:shadow-md transition">
                  <div className="bg-amber-500 text-white p-3.5 rounded-xl h-12 w-12 flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 text-lg">Automated SMTP Email Notifications</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Simulate actual Nodemailer HTML receipts. Every completed guest transaction triggers interactive email notification logs that can be reviewed with a secure raw HTML code renderer.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Interactive Promo Sandbox & Code-Breaker */}
            <section className="bg-slate-900 text-white py-14 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
              <div className="max-w-4xl mx-auto text-center space-y-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
                  <Tag className="w-3.5 h-3.5 text-blue-400 animate-bounce" />
                  <span>Interactive Playground</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black tracking-tight">Try the Promo Code Engine</h3>
                <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto font-medium">
                  Have a promotional discount code? Check if it is currently valid across properties and see what discount rules apply. Try typing <span className="text-amber-400 font-mono font-bold">HOLIDAY10</span> or <span className="text-amber-400 font-mono font-bold">WELCOME20</span> below!
                </p>

                <div className="max-w-md mx-auto pt-3">
                  <div className="flex gap-2 bg-slate-950 p-2 rounded-xl border border-slate-750 shadow-inner">
                    <input
                      type="text"
                      placeholder="Enter promo code (e.g. HOLIDAY10)"
                      value={landingPromoInput}
                      onChange={(e) => setLandingPromoInput(e.target.value.toUpperCase().trim())}
                      className="flex-1 bg-transparent px-4 py-2.5 text-sm font-bold tracking-wider placeholder-slate-500 uppercase focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        if (!landingPromoInput) {
                          setLandingPromoResult({ success: false, message: 'Please type a promo code first.' });
                          return;
                        }
                        const found = coupons.find(c => c.code === landingPromoInput);
                        if (found) {
                          if (!found.active) {
                            setLandingPromoResult({ success: false, message: `Promo code "${found.code}" has been disabled.` });
                          } else {
                            const valStr = found.discount_type === 'Percentage' ? `${found.discount_value}% discount` : `₹${found.discount_value} flat reduction`;
                            setLandingPromoResult({
                              success: true,
                              message: `✅ VALID CODE! Appends a ${valStr} on checkouts with a minimum spend of ₹${found.min_booking_amount}.`
                            });
                          }
                        } else {
                          setLandingPromoResult({
                            success: false,
                            message: `❌ INVALID CODE! "${landingPromoInput}" is not recognized in our database. Go to Admin Console > Coupon Codes to define a custom code.`
                          });
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-500 font-bold text-xs px-5 py-2.5 rounded-lg transition shrink-0 cursor-pointer"
                    >
                      Verify Coupon
                    </button>
                  </div>

                  {landingPromoResult && (
                    <div className={`mt-4 p-4 rounded-xl text-xs font-semibold border text-left transition-all ${
                      landingPromoResult.success 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}>
                      <p>{landingPromoResult.message}</p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Testimonials */}
            <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
              <div className="text-center">
                <h2 className="text-xs font-extrabold tracking-widest text-blue-600 uppercase">Success Stories</h2>
                <h3 className="text-2xl font-black text-slate-900 mt-1">Loved by Hospitality Innovators</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
                  <div className="flex gap-1 text-amber-400">
                    <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                  </div>
                  <p className="text-xs text-slate-600 font-semibold italic leading-relaxed">
                    "Holiday Rentals Max completely revolutionized our direct bookings. We saw a 35% growth in direct reservations within the first month. The rate override grid is so fast, we use it daily."
                  </p>
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs">Marcus Sterling</h5>
                    <p className="text-[10px] text-slate-400 font-bold">General Manager, Grand Peak Resort</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
                  <div className="flex gap-1 text-amber-400">
                    <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                  </div>
                  <p className="text-xs text-slate-600 font-semibold italic leading-relaxed">
                    "We used to waste hours manually updating inventory on Airbnb and Booking.com. Since setting up Holiday Rentals' instant calendar synchronization, we have had zero double bookings."
                  </p>
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs">Elena Rostova</h5>
                    <p className="text-[10px] text-slate-400 font-bold">Director of Revenue, Serene Cove Villas</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Clean Minimalist Landing Footer */}
            <footer className="bg-slate-950 text-slate-500 py-8 px-4 text-center text-[11px] border-t border-slate-900 space-y-2">
              <p className="font-medium text-slate-400">Holiday Rentals Hotel Booking Engine & Channel Manager • Version 4.2 Stable</p>
              <p className="font-mono text-slate-600">Simulated SMTP Mail Delivery Node • Cloud Run Sandboxed Environment</p>
              <p className="text-slate-600 pt-1">© 2026 Holiday Rentals Limited. All simulated transaction layers are active.</p>
            </footer>
          </div>
        )}

        {/* VIEW 1: HOLIDAY RENTALS GUEST BOOKING PORTAL */}
        {currentRole === 'portal' && (
          <div className="flex-1 flex flex-col md:flex-row" id="guest_booking_portal">
            
            {/* Left Side: Booking Search & Results (8 columns if desktop) */}
            <div className="flex-1 p-4 md:p-8 space-y-6 md:max-h-[calc(100vh-64px)] md:overflow-y-auto">
              
              {/* Search Widget Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 md:p-6" id="search_widget_card">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Left Column: Configure Travel Stay Inputs */}
                  <div className="lg:col-span-7 space-y-4 flex flex-col justify-between" id="search_inputs_col">
                    <div>
                      <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Search className="w-4 h-4 text-blue-600" />
                        <span>Configure Travel Stay</span>
                      </h2>

                      <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="search_form">
                        {/* Property Selector */}
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                            <Building className="w-3 h-3 text-slate-400" />
                            <span>Select Hotel Property</span>
                          </label>
                          <select
                            value={searchPropertyId}
                            onChange={(e) => setSearchPropertyId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                            id="search_prop_select"
                          >
                            <option value="all">All Available Properties</option>
                            {properties.map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.location})</option>
                            ))}
                          </select>
                        </div>

                        {/* Check In Date */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-emerald-500" />
                            <span>Check-In</span>
                          </label>
                          <input
                            type="date"
                            value={searchCheckIn}
                            onChange={(e) => setSearchCheckIn(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                            id="search_check_in"
                            min="2026-01-01"
                          />
                        </div>

                        {/* Check Out Date */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-rose-500" />
                            <span>Check-Out</span>
                          </label>
                          <input
                            type="date"
                            value={searchCheckOut}
                            onChange={(e) => setSearchCheckOut(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                            id="search_check_out"
                            min="2026-01-01"
                          />
                        </div>

                        {/* Guests Occupancy */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                            <Users className="w-3 h-3 text-blue-500" />
                            <span>Guests</span>
                          </label>
                          <div className="grid grid-cols-2 gap-1 bg-slate-50 border border-slate-300 rounded-lg p-0.5">
                            <select
                              value={searchAdults}
                              onChange={(e) => setSearchAdults(Number(e.target.value))}
                              className="bg-transparent border-none text-xs font-semibold focus:outline-none text-center"
                              title="Adults"
                              id="search_adults"
                            >
                              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Ad</option>)}
                            </select>
                            <select
                              value={searchChildren}
                              onChange={(e) => setSearchChildren(Number(e.target.value))}
                              className="bg-transparent border-none text-xs font-semibold focus:outline-none text-center"
                              title="Children"
                              id="search_children"
                            >
                              {[0, 1, 2, 3, 4].map(n => <option key={n} value={n}>{n} Ch</option>)}
                            </select>
                          </div>
                        </div>

                        {/* Search Button */}
                        <div className="flex flex-col justify-end">
                          <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                            id="search_submit_btn"
                          >
                            <Search className="w-4 h-4" />
                            <span>Search Rooms</span>
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Promo Code Input Line */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                      <div className="relative max-w-xs w-full">
                        <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Enter Corporate Promo Code"
                          value={searchPromoCode}
                          onChange={(e) => setSearchPromoCode(e.target.value.toUpperCase())}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-9 pr-3 text-xs font-semibold focus:outline-none uppercase tracking-wider"
                          id="search_promo_code"
                        />
                      </div>
                      {appliedPromo && (
                        <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold py-1 px-2.5 rounded-md flex items-center gap-1">
                          <Percent className="w-3 h-3" />
                          <span>Code Active: "{appliedPromo}"</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Live Property Calendar */}
                  <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3" id="live_property_calendar_col">
                    {(() => {
                      const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
                      const firstDay = new Date(calYear, calMonth, 1).getDay();
                      const monthNames = [
                        "January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"
                      ];
                      
                      const days = [];
                      for (let i = 0; i < firstDay; i++) {
                        days.push(null);
                      }
                      for (let i = 1; i <= daysInMonth; i++) {
                        days.push(i);
                      }

                      return (
                        <div className="space-y-3 text-slate-800" id="live_availability_calendar_inner">
                          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                            <div>
                              <h4 className="font-bold text-[11px] uppercase tracking-wide text-slate-500">Global Hotel Occupancy</h4>
                              <p className="text-[10px] text-slate-400 font-semibold truncate max-w-[140px]">
                                {searchPropertyId === 'all' ? 'All Hotels Combined' : properties.find(p => p.id === searchPropertyId)?.name}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  if (calMonth === 0) {
                                    setCalMonth(11);
                                    setCalYear(prev => prev - 1);
                                  } else {
                                    setCalMonth(prev => prev - 1);
                                  }
                                }}
                                className="p-1 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                                title="Previous Month"
                              >
                                <ChevronDown className="w-3.5 h-3.5 rotate-90" />
                              </button>
                              <span className="text-[10px] font-black text-slate-700 w-[80px] text-center font-mono uppercase">
                                {monthNames[calMonth].substring(0, 3)} {calYear}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  if (calMonth === 11) {
                                    setCalMonth(0);
                                    setCalYear(prev => prev + 1);
                                  } else {
                                    setCalMonth(prev => prev + 1);
                                  }
                                }}
                                className="p-1 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                                title="Next Month"
                              >
                                <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                              </button>
                            </div>
                          </div>

                          {/* 7 columns grid header */}
                          <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-slate-400 uppercase">
                            <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                          </div>

                          {/* Calendar Cells Grid */}
                          <div className="grid grid-cols-7 gap-1">
                            {days.map((day, idx) => {
                              if (day === null) {
                                return <div key={`empty-${idx}`} className="h-12 md:h-13" />;
                              }

                              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                              const cellStatus = getPropertyStatusForDate(dateStr);
                              
                              const isCheckIn = searchCheckIn === dateStr;
                              const isCheckOut = searchCheckOut === dateStr;
                              const isWithinStay = searchCheckIn && searchCheckOut && dateStr > searchCheckIn && dateStr < searchCheckOut;

                              let cellBg = 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100';
                              let textStyle = 'font-bold';
                              let indicatorDot = '';
                              let isClickable = true;

                              if (cellStatus.status === 'fully-booked') {
                                cellBg = 'bg-rose-50 text-rose-400 border-rose-100 line-through';
                                indicatorDot = 'bg-rose-500';
                                isClickable = false;
                              } else if (cellStatus.status === 'partially-booked') {
                                cellBg = 'bg-amber-50/70 text-amber-800 border-amber-200/60 hover:bg-amber-100/80';
                                indicatorDot = 'bg-amber-500';
                              }

                              if (isCheckIn || isCheckOut) {
                                cellBg = 'bg-blue-600 text-white border-blue-600 scale-105 shadow-xs z-10';
                                textStyle = 'font-black';
                                isClickable = true;
                              } else if (isWithinStay) {
                                cellBg = 'bg-blue-50/70 text-blue-700 border-blue-100 font-semibold';
                                isClickable = true;
                              }

                              // Calculate lowest available price for any room on this date
                              const targetRoomsForPrice = rooms.filter(r => searchPropertyId === 'all' || r.property_id === searchPropertyId);
                              let lowestPriceOnDate = 0;
                              if (targetRoomsForPrice.length > 0) {
                                const prices = targetRoomsForPrice.map(rm => {
                                  const o = overrides.find(ov => ov.room_id === rm.id && ov.date === dateStr);
                                  return o && o.price_override !== null ? o.price_override : rm.base_price;
                                });
                                lowestPriceOnDate = Math.min(...prices);
                              }

                              return (
                                <button
                                  key={`day-${day}`}
                                  type="button"
                                  onClick={() => {
                                    if (!isClickable && cellStatus.status === 'fully-booked') {
                                      setSearchError(`Date Notice: ${dateStr} is currently fully booked across all rooms at this property.`);
                                      return;
                                    }
                                    setSearchError('');
                                    
                                    // Interactive select
                                    if (!searchCheckIn || (searchCheckIn && searchCheckOut)) {
                                      setSearchCheckIn(dateStr);
                                      setSearchCheckOut('');
                                    } else {
                                      if (dateStr <= searchCheckIn) {
                                        setSearchCheckIn(dateStr);
                                      } else {
                                        setSearchCheckOut(dateStr);
                                      }
                                    }
                                  }}
                                  className={`h-12 md:h-13 flex flex-col items-center justify-between p-1 border rounded-lg text-[10px] transition-all relative group ${cellBg} ${textStyle}`}
                                  title={`${dateStr}: ${cellStatus.label} (Starting at ₹${lowestPriceOnDate})`}
                                >
                                  <span className="text-[10px]">{day}</span>
                                  {lowestPriceOnDate > 0 && (
                                    <span className={`text-[7.5px] md:text-[8.5px] font-mono font-extrabold tracking-tight truncate max-w-full ${
                                      isCheckIn || isCheckOut 
                                        ? 'text-white' 
                                        : isWithinStay 
                                          ? 'text-blue-800' 
                                          : 'text-blue-600/90'
                                    }`}>
                                      ₹{lowestPriceOnDate}
                                    </span>
                                  )}
                                  {indicatorDot && !isCheckIn && !isCheckOut && !isWithinStay && (
                                    <span className={`w-1 h-1 rounded-full ${indicatorDot} mt-0.5`} />
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {/* Legend Indicator */}
                          <div className="flex items-center justify-between text-[8px] font-bold text-slate-400 uppercase pt-2 border-t border-slate-200">
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-white border border-slate-300 rounded-sm"></span>
                              <span>Available</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-amber-50 border border-amber-200 rounded-sm"></span>
                              <span>Limited</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-rose-50 border border-rose-200 rounded-sm"></span>
                              <span>Full / Blocked</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                </div>
              </div>

              {searchError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{searchError}</span>
                </div>
              )}

              {/* Selected Hotel Profile Header (including Map location) */}
              {searchPropertyId !== 'all' && (() => {
                const selectedProp = properties.find(p => p.id === searchPropertyId);
                if (!selectedProp) return null;
                return (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-150 p-6 space-y-4">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Left: Image / Gallery */}
                      {selectedProp.image_url && (() => {
                        const imgs = splitImageUrls(selectedProp.image_url);
                        const currentActiveImg = activeImg && imgs.includes(activeImg) ? activeImg : imgs[0];
                        return (
                          <div className="lg:w-1/3 flex flex-col gap-2">
                            <div className="h-48 lg:h-64 rounded-xl overflow-hidden relative bg-slate-100 border border-slate-200">
                              <img 
                                src={currentActiveImg} 
                                alt={selectedProp.name} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            {imgs.length > 1 && (
                              <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
                                {imgs.map((img, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => setActiveImg(img)}
                                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 flex-shrink-0 transition ${
                                      currentActiveImg === img ? 'border-blue-600 scale-95' : 'border-transparent opacity-70 hover:opacity-100'
                                    }`}
                                  >
                                    <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                      {/* Right: Info */}
                      <div className="flex-1 flex flex-col justify-between space-y-4">
                        <div>
                          <span className="bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider inline-block mb-2">
                            Featured Property Profile
                          </span>
                          <h3 className="text-lg font-black text-slate-800 tracking-tight leading-tight">
                            {selectedProp.name}
                          </h3>
                          <p className="text-xs text-slate-400 font-bold mt-1 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            <span>{selectedProp.address}</span>
                          </p>
                          <p className="text-xs text-slate-500 leading-relaxed font-semibold mt-3">
                            {selectedProp.description}
                          </p>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-4 items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400 text-[10px] font-extrabold uppercase">Contact info:</span>
                            <span className="text-xs text-slate-600 font-bold">{selectedProp.contact_phone}</span>
                            <span className="text-slate-300">|</span>
                            <span className="text-xs text-slate-600 font-semibold">{selectedProp.contact_email}</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-1.5">
                            {selectedProp.amenities.map((amenity, i) => (
                              <span key={i} className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                {amenity}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Map Embed Location Section */}
                    {selectedProp.map_url && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                          <Map className="w-4 h-4 text-emerald-500" />
                          <span>Map Location & Address details</span>
                        </h4>
                        <div className="w-full h-64 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-inner relative">
                          <iframe 
                            src={getEmbeddableMapUrl(selectedProp.map_url)}
                            className="w-full h-full border-0"
                            allowFullScreen={true}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title={`${selectedProp.name} Map Location`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Room Listings Section */}
              <div className="space-y-6">
                <h3 className="font-extrabold text-slate-800 text-base border-l-4 border-blue-600 pl-3">
                  {searchPropertyId !== 'all' 
                    ? `Available Rooms at ${properties.find(p => p.id === searchPropertyId)?.name || 'Property'}`
                    : 'All Match Hotel Room Offerings'}
                </h3>

                {searchResults.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                    <div className="text-slate-300 font-bold text-5xl mb-4">🏨</div>
                    <h4 className="font-bold text-slate-800 text-sm">No Matching Available Rooms Found</h4>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting dates, properties, guest counts, or clear blackout periods in the Admin panel.</p>
                  </div>
                ) : (
                  searchResults.map((result, idx) => {
                    const { room, isAvailable, totalOriginalPrice, totalFinalPrice, discountAmount, datesDetails, couponValid, couponError } = result;
                    const prop = properties.find(p => p.id === room.property_id);
                    const selectedImgIndex = imageIndexes[room.id] || 0;
                    const activePlan = selectedRatePlans[room.id] || 'basic';
                    
                    const nightsCount = datesDetails.length;
                    const premiumAddon = 40 * nightsCount;
                    const finalWithPlan = activePlan === 'premium' ? totalFinalPrice + premiumAddon : totalFinalPrice;
                    const originalWithPlan = activePlan === 'premium' ? totalOriginalPrice + premiumAddon : totalOriginalPrice;

                    return (
                      <div 
                        key={room.id}
                        className={`bg-white rounded-xl border transition-all duration-150 overflow-hidden flex flex-col lg:flex-row shadow-xs hover:shadow-md ${
                          !isAvailable ? 'opacity-70 border-slate-200 bg-slate-50/50' : 'border-slate-200'
                        }`}
                        id={`room_card_${room.id}`}
                      >
                        {/* 1. Left Side: Image Gallery component */}
                        <div className="lg:w-4/12 relative bg-slate-900 min-h-[220px] lg:min-h-auto">
                          <img 
                            src={room.images?.[selectedImgIndex] || getRoomFallbackImage(room.name, room.id)} 
                            alt={room.name}
                            className="w-full h-full object-cover absolute inset-0"
                            referrerPolicy="no-referrer"
                          />
                          {/* Image Thumbnails Overlay */}
                          {room.images.length > 1 && (
                            <div className="absolute bottom-3 left-3 right-3 flex gap-2 z-10 bg-black/30 backdrop-blur-xs p-1.5 rounded-lg">
                              {room.images.map((img: string, i: number) => (
                                <button
                                  key={i}
                                  onClick={() => handleImageSwitch(room.id, i)}
                                  className={`w-10 h-8 rounded-sm overflow-hidden border transition ${
                                    selectedImgIndex === i ? 'border-white scale-105' : 'border-white/40 hover:border-white'
                                  }`}
                                >
                                  <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                </button>
                              ))}
                            </div>
                          )}
                          <div className="absolute top-3 left-3 bg-slate-950/80 text-white text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                            {prop?.name}
                          </div>
                        </div>

                        {/* 2. Center: Room details */}
                        <div className="flex-1 p-5 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="font-extrabold text-slate-800 text-base leading-tight">{room.name}</h4>
                              <span className="bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-extrabold py-0.5 px-2.5 rounded-full uppercase">
                                {room.type}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{room.description}</p>
                            
                            {/* Capacity and Amenities */}
                            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600 font-semibold">
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                <span>Max capacity: {room.capacity_adults} Adults, {room.capacity_children} Kids</span>
                              </span>
                            </div>

                            {/* Bullet Amenities */}
                            <div className="mt-3 flex flex-wrap gap-1">
                              {room.amenities.slice(0, 5).map((amen: string, i: number) => (
                                <span key={i} className="bg-slate-100 border border-slate-200 rounded-md py-0.5 px-2 text-[10px] font-bold text-slate-600 flex items-center gap-1">
                                  <Wifi className="w-2.5 h-2.5 text-slate-400" />
                                  <span>{amen}</span>
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Live Calendar Rates details block */}
                          <div className="mt-4 pt-4 border-t border-slate-100">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mb-2">Live Nightly Price Grid Summary</p>
                            <div className="flex items-center gap-1 overflow-x-auto pb-1">
                              {datesDetails.map((det: any, i: number) => (
                                <div key={i} className="border border-slate-200 rounded-lg p-1.5 bg-slate-50 text-center flex-1 min-w-[75px]">
                                  <div className="text-[8px] text-slate-400 font-bold uppercase">{det.date.substring(5)}</div>
                                  <div className="text-[11px] font-black text-slate-700">₹{det.finalPrice}</div>
                                  {det.priceOverride !== null && (
                                    <div className="text-[7px] text-purple-600 font-black tracking-tighter uppercase mt-0.5 animate-pulse leading-none">
                                      Dynamic Rate
                                    </div>
                                  )}
                                  <div className={`text-[8px] font-bold mt-0.5 ${det.availableInventory === 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {det.isBlackout ? 'Blocked' : `${det.availableInventory} Left`}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Specific Room Calendar Toggle */}
                            <div className="mt-3">
                              <button
                                type="button"
                                onClick={() => setOpenRoomCalendarId(openRoomCalendarId === room.id ? null : room.id)}
                                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg py-1.5 text-[10px] font-bold tracking-wider transition uppercase flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer"
                              >
                                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                <span>{openRoomCalendarId === room.id ? 'Hide Monthly Room Calendar' : 'Check Month Bookings Calendar'}</span>
                              </button>

                              {openRoomCalendarId === room.id && (
                                <div className="mt-3 p-3 bg-slate-100/50 border border-slate-200 rounded-xl space-y-3" id={`room_calendar_panel_${room.id}`}>
                                  {(() => {
                                    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
                                    const firstDay = new Date(calYear, calMonth, 1).getDay();
                                    const monthNames = [
                                      "January", "February", "March", "April", "May", "June",
                                      "July", "August", "September", "October", "November", "December"
                                    ];
                                    
                                    const days = [];
                                    for (let i = 0; i < firstDay; i++) {
                                      days.push(null);
                                    }
                                    for (let i = 1; i <= daysInMonth; i++) {
                                      days.push(i);
                                    }

                                    return (
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                                          <span className="text-[9px] font-bold uppercase text-slate-500">📅 {room.name} Occupancy</span>
                                          <span className="text-[9px] font-black text-slate-700 font-mono uppercase">{monthNames[calMonth]} {calYear}</span>
                                        </div>

                                        {/* Grid 7 columns */}
                                        <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-slate-400 uppercase">
                                          <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                                        </div>

                                        {/* Cells Grid */}
                                        <div className="grid grid-cols-7 gap-1">
                                          {days.map((day, idx) => {
                                            if (day === null) {
                                              return <div key={`empty-${idx}`} className="h-12 md:h-13" />;
                                            }

                                            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                            const isBooked = isRoomBookedOnDate(room.id, dateStr);

                                            let cellStyle = 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50';
                                            let textStyle = 'font-bold';
                                            let dotStyle = 'bg-emerald-500';

                                            if (isBooked) {
                                              cellStyle = 'bg-rose-50 text-rose-400 border-rose-100 line-through cursor-not-allowed';
                                              dotStyle = 'bg-rose-500';
                                            }

                                            // Calculate precise daily price for this room
                                            const override = overrides.find(o => o.room_id === room.id && o.date === dateStr);
                                            const finalPrice = override && override.price_override !== null ? override.price_override : room.base_price;

                                            const isCheckIn = searchCheckIn === dateStr;
                                            const isCheckOut = searchCheckOut === dateStr;
                                            const isWithinStay = searchCheckIn && searchCheckOut && dateStr > searchCheckIn && dateStr < searchCheckOut;

                                            return (
                                              <button
                                                key={`room-day-${day}`}
                                                type="button"
                                                onClick={() => {
                                                  if (isBooked) {
                                                    setSearchError(`Date Notice: Room is fully booked on ${dateStr}. Please choose available dates.`);
                                                    return;
                                                  }
                                                  setSearchError('');
                                                  // Select date
                                                  if (!searchCheckIn || (searchCheckIn && searchCheckOut)) {
                                                    setSearchCheckIn(dateStr);
                                                    setSearchCheckOut('');
                                                  } else {
                                                    if (dateStr <= searchCheckIn) {
                                                      setSearchCheckIn(dateStr);
                                                    } else {
                                                      setSearchCheckOut(dateStr);
                                                    }
                                                  }
                                                }}
                                                className={`h-12 md:h-13 flex flex-col items-center justify-between p-1 border rounded-lg text-[10px] transition relative ${cellStyle} ${textStyle}`}
                                                title={`${dateStr}: ${isBooked ? 'Booked Out' : 'Available'} (₹${finalPrice})`}
                                              >
                                                <span className="text-[10px]">{day}</span>
                                                {finalPrice > 0 && (
                                                  <span className={`text-[7.5px] md:text-[8.5px] font-mono font-extrabold tracking-tight truncate max-w-full ${
                                                    isCheckIn || isCheckOut 
                                                      ? 'text-white' 
                                                      : isWithinStay 
                                                        ? 'text-blue-800' 
                                                        : isBooked
                                                          ? 'text-rose-400 line-through'
                                                          : 'text-blue-600/90'
                                                  }`}>
                                                    ₹{finalPrice}
                                                  </span>
                                                )}
                                                <span className={`w-1 h-1 rounded-full ${dotStyle} mt-0.5`} />
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>

                          </div>
                        </div>

                        {/* 3. Right: Pricing & CTA Package panels */}
                        <div className="lg:w-3/12 bg-slate-50 p-5 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col justify-between">
                          
                          {/* Rate Plan Select */}
                          <div className="space-y-2 mb-4">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Select Rate Plan</label>
                            
                            <button
                              onClick={() => setSelectedRatePlans(prev => ({ ...prev, [room.id]: 'basic' }))}
                              className={`w-full text-left p-2 border rounded-lg transition text-xs ${
                                activePlan === 'basic' 
                                  ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold shadow-xs' 
                                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <div className="flex justify-between">
                                <span>Room Only</span>
                                <span className="text-[10px] text-blue-600">Included</span>
                              </div>
                              <p className="text-[9px] text-slate-400 font-medium mt-0.5">Standard single room entry.</p>
                            </button>

                            <button
                              onClick={() => setSelectedRatePlans(prev => ({ ...prev, [room.id]: 'premium' }))}
                              className={`w-full text-left p-2 border rounded-lg transition text-xs ${
                                activePlan === 'premium' 
                                  ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold shadow-xs' 
                                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <div className="flex justify-between">
                                <span>Premium Bundle</span>
                                <span className="text-[10px] text-blue-600">+₹40/n</span>
                              </div>
                              <p className="text-[9px] text-slate-400 font-medium mt-0.5">+Breakfast Buffet, Spa Gym & complimentary minibar.</p>
                            </button>
                          </div>

                          {/* Pricing Display */}
                          <div className="pt-3 border-t border-slate-200">
                            <div className="text-right">
                              <p className="text-[10px] text-slate-400 font-bold uppercase">Stay total ({nightsCount} nights)</p>
                              {discountAmount > 0 && (
                                <p className="text-xs text-rose-500 font-semibold line-through">
                                  {fmtCurr(originalWithPlan)}
                                </p>
                              )}
                              <p className="text-2xl font-black text-slate-900 leading-none mt-1">
                                {fmtCurr(finalWithPlan)}
                              </p>
                              <p className="text-[9px] text-slate-400 font-medium mt-1">Excludes local lodging taxes</p>
                            </div>

                            {/* Promo validation notifications */}
                            {searchPromoCode && !couponError && couponValid && (
                              <div className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md p-1 mt-2 text-center font-bold">
                                Code applied: Saved -{fmtCurr(discountAmount)}
                              </div>
                            )}

                            {searchPromoCode && couponError && (
                              <div className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 rounded-md p-1 mt-2 text-center font-medium">
                                {couponError}
                              </div>
                            )}

                            {/* Book Button */}
                            {isAvailable ? (
                              <button
                                onClick={() => openBookingCheckout(result)}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg py-2.5 font-bold text-xs tracking-wider transition-all mt-3 flex items-center justify-center gap-1 shadow-md hover:shadow-lg uppercase"
                                id={`book_btn_${room.id}`}
                              >
                                <span>Book Stay</span>
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                disabled
                                className="w-full bg-slate-200 border border-slate-300 text-slate-400 rounded-lg py-2.5 font-bold text-xs transition cursor-not-allowed mt-3 flex items-center justify-center gap-1 uppercase"
                              >
                                <Users className="w-4 h-4" />
                                <span>Sold Out</span>
                              </button>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>

            {/* Right Side Sticky Preview: Selected Reservation & Checkout drawer */}
            {selectedRoomResult && (
              <div className="w-full md:w-[380px] bg-white border-t md:border-t-0 md:border-l border-slate-200 shadow-2xl p-6 flex flex-col justify-between md:max-h-[calc(100vh-64px)] md:overflow-y-auto" id="booking_summary_pane">
                
                {/* Review Header */}
                <div className="pb-4 border-b border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2.5 py-0.5 rounded-full uppercase">Step {checkoutStep} of 3</span>
                    <button 
                      onClick={() => setSelectedRoomResult(null)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-semibold hover:bg-slate-100 px-2 py-1 rounded-md"
                    >
                      Cancel
                    </button>
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-base">Booking Summary</h3>
                  <p className="text-xs text-slate-500">{properties.find(p => p.id === selectedRoomResult.room.property_id)?.name}</p>
                </div>

                {checkoutStep === 1 && (
                  <div className="space-y-4 py-4 flex-1">
                    {/* Stay Specs summary */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-2">
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Room Selected:</span>
                        <span className="font-bold text-slate-800">{selectedRoomResult.room.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Dates:</span>
                        <span className="font-bold text-slate-800">{searchCheckIn} to {searchCheckOut}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Duration:</span>
                        <span className="font-bold text-slate-800">{selectedRoomResult.datesDetails.length} Nights</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Guests:</span>
                        <span className="font-bold text-slate-800">{searchAdults} Adults, {searchChildren} Children</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Rate Plan:</span>
                        <span className="font-bold text-blue-700 capitalize">{ratePlanAddon} Package</span>
                      </div>
                    </div>

                    {/* Price Calculations */}
                    <div className="space-y-2 text-xs pt-2">
                      <h4 className="font-bold text-slate-700 uppercase text-[9px] tracking-wide">Charges Breakdown</h4>
                      <div className="flex justify-between text-slate-600">
                        <span>Room nightly charges ({selectedRoomResult.datesDetails.length} nights):</span>
                        <span>{fmtCurr(selectedRoomResult.totalOriginalPrice)}</span>
                      </div>

                      {ratePlanAddon === 'premium' && (
                        <div className="flex justify-between text-slate-600">
                          <span>Premium Upgrade Add-on:</span>
                          <span>{fmtCurr(40 * selectedRoomResult.datesDetails.length)}</span>
                        </div>
                      )}

                      {selectedRoomResult.discountAmount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>Promo Coupon Discount ({appliedPromo}):</span>
                          <span>-{fmtCurr(selectedRoomResult.discountAmount)}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-slate-600">
                        <span>GST ({taxRate}%):</span>
                        <span>
                          {fmtCurr(
                            ((ratePlanAddon === 'premium' 
                              ? selectedRoomResult.totalFinalPrice + (40 * selectedRoomResult.datesDetails.length)
                              : selectedRoomResult.totalFinalPrice) * (taxRate / 100))
                          )}
                        </span>
                      </div>

                      <div className="border-t border-slate-200 pt-3 flex justify-between items-baseline">
                        <span className="font-bold text-slate-800 text-sm">Amount Due:</span>
                        <span className="font-black text-slate-900 text-2xl" id="checkout_final_amount">
                          {fmtCurr(
                            (ratePlanAddon === 'premium' 
                              ? selectedRoomResult.totalFinalPrice + (40 * selectedRoomResult.datesDetails.length)
                              : selectedRoomResult.totalFinalPrice) * (1 + (taxRate / 100))
                          )}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setCheckoutStep(2)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 font-extrabold text-xs tracking-wider uppercase shadow-md transition mt-6"
                      id="proceed_to_guest_btn"
                    >
                      <span>Proceed to Guest Details</span>
                    </button>
                  </div>
                )}

                {checkoutStep === 2 && (
                  <form onSubmit={handleGuestFormSubmit} className="space-y-4 py-4 flex-1" id="guest_form">
                    <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-2">Guest Profile Information</h4>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Jane Smith"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        id="guest_name_input"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address <span className="text-rose-500">*</span></label>
                      <input
                        type="email"
                        required
                        placeholder="e.g., jane.smith@example.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        id="guest_email_input"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone Number <span className="text-rose-500">*</span></label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g., +1 555-0100"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        id="guest_phone_input"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Billing Address</label>
                      <input
                        type="text"
                        placeholder="e.g., 123 Maple St, Seattle"
                        value={guestAddress}
                        onChange={(e) => setGuestAddress(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                        id="guest_addr_input"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Special Stay Requests</label>
                      <textarea
                        rows={2}
                        placeholder="e.g., High floor, early check-in, feather pillows"
                        value={guestNotes}
                        onChange={(e) => setGuestNotes(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                        id="guest_notes_input"
                      ></textarea>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 font-extrabold text-xs tracking-wider uppercase shadow-md transition flex items-center justify-center gap-1.5"
                        id="guest_form_submit_btn"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-300" />
                        <span>Pay Securely with Razorpay</span>
                      </button>
                    </div>
                  </form>
                )}

                {checkoutStep === 3 && confirmedBookingResult && (
                  <div className="space-y-5 py-6 text-center flex flex-col items-center justify-center" id="booking_success_screen">
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center animate-bounce mb-2 border border-emerald-300">
                      <CheckCircle className="w-9 h-9" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-lg">Booking Confirmed!</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Your receipt has been authorized.</p>
                    </div>

                    <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 text-xs text-left w-full space-y-2">
                      <div className="flex justify-between border-b border-emerald-100 pb-1.5">
                        <span className="font-bold text-slate-500">Booking Reference:</span>
                        <span className="font-black text-blue-700 font-mono tracking-wide">{confirmedBookingResult.booking.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-400">Total Booking Cost:</span>
                        <span className="font-bold text-slate-800">₹{confirmedBookingResult.booking.total_amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-400">Amount Paid Now:</span>
                        <span className="font-bold text-emerald-700">₹{confirmedBookingResult.payment.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-400">Payment Status:</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          confirmedBookingResult.booking.payment_status === 'Partially Paid'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {confirmedBookingResult.booking.payment_status}
                        </span>
                      </div>
                      {confirmedBookingResult.booking.payment_status === 'Partially Paid' && (
                        <div className="flex justify-between text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-lg font-semibold mt-2.5">
                          <span>Balance Due at Check-In:</span>
                          <span className="font-bold font-mono">
                            ₹{(confirmedBookingResult.booking.total_amount - confirmedBookingResult.payment.amount).toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1 border-t border-slate-200/50">
                        <span className="font-semibold text-slate-400">Guest:</span>
                        <span className="font-bold text-slate-800">{confirmedBookingResult.guest.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-400">Check-In:</span>
                        <span className="font-bold text-slate-800">{confirmedBookingResult.booking.check_in}</span>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-[10px] text-blue-800 leading-relaxed text-left flex gap-1.5 w-full">
                      <Mail className="w-5 h-5 flex-shrink-0 text-blue-600" />
                      <div>
                        <strong>Nodemailer Alert:</strong> An instant HTML booking confirmation has been sent to <strong>{confirmedBookingResult.guest.email}</strong>. Open the Admin Console <strong>Emails Tab</strong> to view the fully styled HTML email receipt!
                      </div>
                    </div>

                    <div className="w-full pt-4 space-y-2">
                      <button
                        onClick={() => window.print()}
                        className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg py-2 text-xs font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Print Receipt</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRoomResult(null);
                          setConfirmedBookingResult(null);
                        }}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg py-2.5 text-xs font-bold transition uppercase tracking-wide"
                      >
                        Book Another Room
                      </button>
                    </div>
                  </div>
                )}

                <div className="border-t border-slate-100 pt-3 text-[9px] text-slate-400 text-center flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  <span>Secure 256-Bit SSL Booking Engine</span>
                </div>

              </div>
            )}

            {/* Payment Option Selector Modal */}
            {isPaymentOptionOpen && selectedRoomResult && (
              <PaymentOptionModal
                isOpen={isPaymentOptionOpen}
                onClose={() => setIsPaymentOptionOpen(false)}
                onSelect={handlePaymentOptionSelect}
                totalAmount={
                  (ratePlanAddon === 'premium' 
                    ? selectedRoomResult.totalFinalPrice + (40 * selectedRoomResult.datesDetails.length)
                    : selectedRoomResult.totalFinalPrice) * (1 + (taxRate / 100))
                }
                currency="INR"
                roomName={selectedRoomResult.room.name}
                defaultPercentage={partialPaymentPercent}
              />
            )}

            {/* Razorpay Interactive Overlay */}
            {isRazorpayOpen && selectedRoomResult && (
              <RazorpayModal
                isOpen={isRazorpayOpen}
                onClose={() => setIsRazorpayOpen(false)}
                onSuccess={handleRazorpaySuccess}
                onFailure={handleRazorpayFailure}
                amount={selectedPayNowAmount}
                currency="INR"
                guestEmail={guestEmail}
                guestPhone={guestPhone}
                roomName={
                  selectedPaymentType === 'partial'
                    ? `${selectedRoomResult.room.name} (${paymentPercentage}% Deposit)`
                    : selectedRoomResult.room.name
                }
              />
            )}

          </div>
        )}

        {/* VIEW 2: HOLIDAY RENTALS OPERATOR ACCESS & ADMIN CONSOLE */}
        {currentRole === 'admin' && (
          !isAdminLoggedIn ? (
            <div className="flex-1 bg-slate-950 flex items-center justify-center p-4 min-h-[500px]" id="admin_login_view">
              <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl space-y-6">
                
                {/* Brand Logo & Title */}
                <div className="text-center space-y-2">
                  <div className="inline-flex bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl text-white font-black text-lg tracking-widest shadow-lg">
                    Holiday Rentals
                  </div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">Operator Administration Access</h2>
                  <p className="text-xs text-slate-400">Please authenticate to manage rates, inventory channels & bookings.</p>
                </div>

                {/* Form */}
                <form onSubmit={(e) => {
                  e.preventDefault();
                  setLoginError('');
                  if (adminUsername.trim().toLowerCase() === 'admin' && adminPassword === 'admin') {
                    setIsAdminLoggedIn(true);
                    setLoginError('');
                  } else {
                    setLoginError('Invalid operator credentials. Please try again.');
                  }
                }} className="space-y-4" id="admin_login_form">
                  
                  {loginError && (
                    <div className="bg-rose-950/40 border border-rose-900/50 text-rose-300 rounded-lg p-3 text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Username</label>
                    <div className="relative">
                      <Users className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        placeholder="Operator Username"
                        className="w-full bg-slate-950/85 border border-slate-800 focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-white focus:outline-none transition-all placeholder:text-slate-600"
                        id="admin_username_field"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Security Password</label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-950/85 border border-slate-800 focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold text-white focus:outline-none transition-all placeholder:text-slate-600"
                        id="admin_password_field"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl py-2.5 font-bold text-xs tracking-wider uppercase shadow-md transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
                    id="admin_login_submit_btn"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                    <span>Authorize Session</span>
                  </button>
                </form>

                {/* Simulated Credentials Card */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-[11px] text-slate-400 space-y-1">
                  <div className="font-bold text-slate-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    <span>Demo Credentials Provided</span>
                  </div>
                  <p>Username: <strong className="text-slate-200">admin</strong></p>
                  <p>Password: <strong className="text-slate-200">admin</strong></p>
                </div>

                <div className="text-center pt-2">
                  <button
                    onClick={() => setCurrentRole('landing')}
                    className="text-[10px] text-slate-500 hover:text-slate-300 font-bold transition uppercase tracking-wider cursor-pointer"
                  >
                    ← Return to Home Screen
                  </button>
                </div>

              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col md:flex-row" id="admin_dashboard">
              
              {/* Sidebar Navigation Panel */}
              <aside className="w-full md:w-[240px] bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col justify-between" id="admin_sidebar">
              
              {/* Navigation Items */}
              <div className="p-4 space-y-6">
                <div>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3.5">OPERATIONAL CONSOLE</h3>
                  <nav className="space-y-1" id="admin_nav">
                    
                    <button
                      onClick={() => setAdminTab('dashboard')}
                      className={`w-full flex items-center gap-2.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                        adminTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
                      }`}
                      id="admin_tab_dashboard"
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>Analytics Overview</span>
                    </button>

                    <button
                      onClick={() => setAdminTab('bookings')}
                      className={`w-full flex items-center gap-2.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                        adminTab === 'bookings' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
                      }`}
                      id="admin_tab_bookings"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Reservation Logs</span>
                    </button>

                    <button
                      onClick={() => setAdminTab('properties')}
                      className={`w-full flex items-center gap-2.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                        adminTab === 'properties' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
                      }`}
                      id="admin_tab_properties"
                    >
                      <Building className="w-4 h-4" />
                      <span>Hotel Properties</span>
                    </button>

                    <button
                      onClick={() => setAdminTab('owners')}
                      className={`w-full flex items-center gap-2.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                        adminTab === 'owners' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
                      }`}
                      id="admin_tab_owners"
                    >
                      <Users className="w-4 h-4" />
                      <span>Property Owners</span>
                    </button>

                    <button
                      onClick={() => setAdminTab('rooms')}
                      className={`w-full flex items-center gap-2.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                        adminTab === 'rooms' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
                      }`}
                      id="admin_tab_rooms"
                    >
                      <BedDouble className="w-4 h-4" />
                      <span>Room Inventories</span>
                    </button>

                    <button
                      onClick={() => setAdminTab('amenities')}
                      className={`w-full flex items-center gap-2.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                        adminTab === 'amenities' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
                      }`}
                      id="admin_tab_amenities"
                    >
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span>Amenities Master</span>
                    </button>

                    <button
                      onClick={() => setAdminTab('coupons')}
                      className={`w-full flex items-center gap-2.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                        adminTab === 'coupons' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
                      }`}
                      id="admin_tab_coupons"
                    >
                      <Percent className="w-4 h-4" />
                      <span>Coupon Codes</span>
                    </button>

                    <button
                      onClick={() => setAdminTab('tax_settings')}
                      className={`w-full flex items-center gap-2.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                        adminTab === 'tax_settings' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
                      }`}
                      id="admin_tab_tax_settings"
                    >
                      <Settings className="w-4 h-4 text-amber-400" />
                      <span>Tax & Payment Settings</span>
                    </button>

                    <button
                      onClick={() => setAdminTab('db_settings')}
                      className={`w-full flex items-center gap-2.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                        adminTab === 'db_settings' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
                      }`}
                      id="admin_tab_db_settings"
                    >
                      <Database className="w-4 h-4 text-emerald-400" />
                      <span>Database Settings</span>
                    </button>

                  </nav>
                </div>

                <div>
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3.5">ALERTS & DIAGNOSTICS</h3>
                  <nav className="space-y-1">
                    <button
                      onClick={() => setAdminTab('emails')}
                      className={`w-full flex items-center gap-2.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                        adminTab === 'emails' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
                      }`}
                      id="admin_tab_emails"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Email Logs Terminal</span>
                    </button>
                  </nav>
                </div>
              </div>

              {/* Sign Out Button */}
              <div className="px-4 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminLoggedIn(false);
                    setCurrentRole('landing');
                  }}
                  className="w-full bg-slate-800 hover:bg-rose-950 border border-slate-700 hover:border-rose-900 hover:text-rose-200 text-slate-300 text-xs font-bold py-2 px-3 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer"
                  id="admin_logout_btn"
                >
                  <X className="w-4 h-4 text-rose-500" />
                  <span>Logout Admin Session</span>
                </button>
              </div>

              {/* Account Signature Footer */}
              <div className="p-4 border-t border-slate-800 text-slate-500">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                  <span>Active Developer Mode</span>
                </div>
                <p className="text-[9px] text-slate-500 mt-1">GCP Cloud Run Container Ingress Node #HOLIDAY3000</p>
              </div>

            </aside>

            {/* Dashboard Content Panel */}
            <div className="flex-1 p-6 md:p-8 space-y-6 md:max-h-[calc(100vh-64px)] md:overflow-y-auto" id="admin_content_panel">
              
              {/* TAB 1: ANALYTICS OVERVIEW */}
              {adminTab === 'dashboard' && stats && (
                <div className="space-y-6" id="panel_dashboard">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-black text-slate-800 tracking-tight">Analytics Executive Dashboard</h2>
                      <p className="text-xs text-slate-500">Global indicators aggregated across all managed properties and connected OTAs.</p>
                    </div>
                    <button 
                      onClick={loadDatabase}
                      className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {/* Bento Grid Analytics Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Total Gross Revenue</span>
                        <IndianRupee className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="text-2xl font-black text-slate-800 mt-2">{fmtCurr(stats.totalRevenue)}</div>
                      <p className="text-[9px] text-emerald-600 font-semibold mt-1">▲ 14.5% vs last month</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Reservation Logs</span>
                        <FileText className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="text-2xl font-black text-slate-800 mt-2">{stats.totalBookings}</div>
                      <p className="text-[9px] text-slate-500 font-semibold mt-1">100% Secure Local Database</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Active Occupancy</span>
                        <TrendingUp className="w-4 h-4 text-purple-500" />
                      </div>
                      <div className="text-2xl font-black text-slate-800 mt-2">{stats.occupancyRate}%</div>
                      <p className="text-[9px] text-purple-600 font-semibold mt-1">▲ 4.2% overall rate</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Active Promos</span>
                        <Tag className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="text-2xl font-black text-slate-800 mt-2">{stats.activeCoupons}</div>
                      <p className="text-[9px] text-amber-600 font-semibold mt-1">Toggled valid in coupon panel</p>
                    </div>
                  </div>

                  {/* Chart and Activity rows */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Visual Revenue chart using lightweight customized SVG */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                      <h3 className="font-bold text-slate-800 text-sm mb-4 uppercase tracking-wider text-slate-500">Gross Revenue Distribution</h3>
                      <div className="h-56 w-full flex items-end gap-6 pt-4 px-4 border-b border-l border-slate-200 relative">
                        {/* Dynamic SVG Bars based on Property revenue */}
                        {properties.map((p, idx) => {
                          const propRevenue = bookings
                            .filter(b => b.property_id === p.id && b.status !== 'Cancelled')
                            .reduce((sum, b) => sum + b.total_amount, 0);

                          const maxRevenue = Math.max(...properties.map(pr => 
                            bookings.filter(b => b.property_id === pr.id && b.status !== 'Cancelled').reduce((s, b) => s + b.total_amount, 0)
                          ), 1);

                          const barHeightPercent = Math.min(100, Math.max(15, Math.round((propRevenue / maxRevenue) * 100)));
                          const barColors = ['bg-blue-600', 'bg-emerald-600', 'bg-purple-600'];

                          return (
                            <div key={p.id} className="flex-1 flex flex-col items-center group relative cursor-pointer h-full justify-end">
                              {/* Hover tooltip */}
                              <div className="absolute -top-10 bg-slate-950 text-white text-[10px] font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10 pointer-events-none">
                                {fmtCurr(propRevenue)} Total Gross
                              </div>
                              <div 
                                className={`w-full ${barColors[idx % 3]} rounded-t-lg transition-all duration-300 shadow-md group-hover:brightness-105`}
                                style={{ height: `${barHeightPercent}%` }}
                              ></div>
                              <span className="text-[9px] font-bold text-slate-500 mt-2 truncate w-full text-center">
                                {p.name.split(' ')[0]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-3 text-center italic">Hover bar columns to show gross financial breakdown values.</p>
                    </div>

                    {/* Timeline Log */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm mb-4 uppercase tracking-wider text-slate-500">Real-Time Channel Activity</h3>
                        <div className="space-y-4 max-h-[220px] overflow-y-auto">
                          {stats.recentActivity.map((act, i) => (
                            <div key={i} className="flex gap-3 text-xs border-l-2 border-slate-100 pl-3.5 relative pb-1">
                              <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white"></div>
                              <div>
                                <p className="font-semibold text-slate-700 leading-normal">{act.description}</p>
                                <span className="text-[9px] text-slate-400 font-bold">{new Date(act.timestamp).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-400 border-t border-slate-100 pt-3 text-center">Logs capture direct engine bookings and OTA iCal syncing.</p>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 3: RESERVATION LOGS */}
              {adminTab === 'bookings' && (
                <div className="space-y-6" id="panel_bookings">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-black text-slate-800 tracking-tight">Central Reservation Logs</h2>
                      <p className="text-xs text-slate-500">Inspect guest entries, update operational booking statuses, and issue immediate refund flags.</p>
                    </div>

                    <div className="relative w-full sm:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search Guest Name or Booking ID"
                        value={bookingSearchQuery}
                        onChange={(e) => setBookingSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg py-1.5 pl-9 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        id="booking_search_input"
                      />
                    </div>
                  </div>

                  {/* Bookings Table */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                            <th className="p-4">Reference ID</th>
                            <th className="p-4">Guest Details</th>
                            <th className="p-4">Hotel Room type</th>
                            <th className="p-4">Stay Interval</th>
                            <th className="p-4 text-right">Receipt Total</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-center">Payment Status</th>
                            <th className="p-4 text-right">Operational Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {bookings
                            .filter(b => {
                              const gst = guests.find(g => g.id === b.guest_id);
                              const matchQuery = b.id.toLowerCase().includes(bookingSearchQuery.toLowerCase()) || 
                                                 (gst?.name || '').toLowerCase().includes(bookingSearchQuery.toLowerCase());
                              return matchQuery;
                            })
                            .map(b => {
                              const gst = guests.find(g => g.id === b.guest_id);
                              const rm = rooms.find(r => r.id === b.room_id);
                              const prop = properties.find(p => p.id === b.property_id);

                              return (
                                <tr key={b.id} className="hover:bg-slate-50/50">
                                  <td className="p-4">
                                    <span className="font-extrabold text-blue-700 font-mono tracking-wide">{b.id}</span>
                                    {b.sync_source && (
                                      <span className="block mt-1 text-[8px] bg-amber-100 text-amber-800 border border-amber-200 rounded-sm px-1 py-0.5 font-bold uppercase w-max">
                                        Synced: {b.sync_source}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-4">
                                    <p className="font-extrabold text-slate-800">{gst?.name || 'Jane Doe'}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{gst?.email}</p>
                                    <p className="text-[10px] text-slate-400">{gst?.phone}</p>
                                  </td>
                                  <td className="p-4">
                                    <p className="font-bold text-slate-700">{rm?.name || 'Room type'}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{prop?.name}</p>
                                  </td>
                                  <td className="p-4">
                                    <p className="font-bold text-slate-700">{b.check_in} to {b.check_out}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                      {Math.round((new Date(b.check_out).getTime() - new Date(b.check_in).getTime()) / (1000 * 60 * 60 * 24))} nights
                                    </p>
                                  </td>
                                  <td className="p-4 text-right font-black text-slate-950">
                                    ₹{b.total_amount.toFixed(2)}
                                  </td>
                                  <td className="p-4 text-center">
                                    <select
                                      value={b.status}
                                      onChange={(e) => handleUpdateBookingStatus(b.id, e.target.value)}
                                      className={`border text-[10px] font-extrabold py-1 px-2.5 rounded-full uppercase focus:outline-none ${
                                        b.status === 'Cancelled' 
                                          ? 'bg-rose-50 border-rose-300 text-rose-700' 
                                          : b.status === 'Confirmed' 
                                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                                          : b.status === 'Checked-in' 
                                          ? 'bg-blue-50 border-blue-300 text-blue-700' 
                                          : 'bg-slate-100 border-slate-300 text-slate-600'
                                      }`}
                                    >
                                      {['Pending', 'Confirmed', 'Cancelled', 'Checked-in', 'Checked-out'].map(st => (
                                        <option key={st} value={st}>{st}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="p-4 text-center">
                                    <span className={`inline-block border text-[10px] font-extrabold py-1 px-2.5 rounded-full uppercase ${
                                      b.payment_status === 'Paid'
                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                                        : b.payment_status === 'Refunded'
                                        ? 'bg-rose-50 border-rose-200 text-rose-600'
                                        : 'bg-slate-100 border-slate-300 text-slate-500'
                                    }`}>
                                      {b.payment_status}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right">
                                    {b.status === 'Cancelled' && b.payment_status === 'Paid' ? (
                                      <button
                                        onClick={() => handleUpdateBookingStatus(b.id, 'Cancelled', 'Refunded')}
                                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-md py-1 px-3.5 text-[10px] font-bold tracking-wide transition"
                                      >
                                        Process Refund
                                      </button>
                                    ) : (
                                      <span className="text-slate-300 text-[10px] font-bold">No Refund Needed</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: HOTEL PROPERTIES CRUD */}
              {adminTab === 'properties' && (
                <div className="space-y-6" id="panel_properties">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-black text-slate-800 tracking-tight">Manage Managed Hotels</h2>
                      <p className="text-xs text-slate-500">Configure geographical parameters, primary contact profiles, and visual layouts.</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingProperty(null);
                        setPropertyImages(['']);
                        setPropertySelectedAmenities([]);
                        setCustomAmenityInput('');
                        setShowPropertyForm(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-md flex items-center gap-1.5"
                      id="add_property_btn"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Register Property</span>
                    </button>
                  </div>

                  {/* Form Modal for Properties */}
                  {showPropertyForm && (
                    <div className="bg-white rounded-xl border border-slate-300 p-6 shadow-xl animate-fade-in" id="property_editor_form">
                      <h3 className="font-extrabold text-slate-800 text-sm mb-4">
                        {editingProperty ? `Edit ${editingProperty.name}` : 'Register New Hotel Property'}
                      </h3>
                      <form onSubmit={handleSaveProperty} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Hotel Name</label>
                          <input
                            type="text"
                            name="propName"
                            required
                            defaultValue={editingProperty?.name || ''}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Location Area</label>
                          <input
                            type="text"
                            name="propLoc"
                            required
                            placeholder="e.g. Miami, USA"
                            defaultValue={editingProperty?.location || ''}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Street Address</label>
                          <input
                            type="text"
                            name="propAddress"
                            required
                            defaultValue={editingProperty?.address || ''}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Reservations Contact Email</label>
                          <input
                            type="email"
                            name="propEmail"
                            required
                            defaultValue={editingProperty?.contact_email || ''}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Reception Phone</label>
                          <input
                            type="text"
                            name="propPhone"
                            required
                            defaultValue={editingProperty?.contact_phone || ''}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Hotel Bio Description</label>
                          <textarea
                            name="propDesc"
                            rows={3}
                            defaultValue={editingProperty?.description || ''}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white resize-none"
                          ></textarea>
                        </div>
                        <div className="md:col-span-2 space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase">Hotel Images Portfolio</label>
                            <button
                              type="button"
                              onClick={() => setPropertyImages([...propertyImages, ''])}
                              className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg py-1 px-2 text-[10px] font-bold transition cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Image Field</span>
                            </button>
                          </div>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 border border-dashed border-slate-200 p-3 rounded-lg bg-slate-50/50">
                            {propertyImages.map((imgUrl, idx) => {
                              const key = `admin-properties-${idx}`;
                              const previewSrc = tempPreviews[key] || imgUrl;
                              const isUploading = imageUploading[key];
                              return (
                                <div key={idx} className="flex gap-2 items-center">
                                  <div className="text-[10px] text-slate-500 font-extrabold w-16 flex-shrink-0">
                                    Image #{idx + 1}
                                  </div>
                                  <div className="flex-1 flex gap-2 items-center">
                                    {previewSrc && (
                                      <div className="w-8 h-8 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center relative shadow-sm">
                                        <img
                                          src={previewSrc}
                                          alt="Preview"
                                          className="w-full h-full object-cover"
                                          referrerPolicy="no-referrer"
                                        />
                                        {isUploading && (
                                          <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    <input
                                      type="text"
                                      value={imgUrl}
                                      placeholder="e.g. https://images.unsplash.com/photo-..."
                                      onChange={(e) => {
                                        const updated = [...propertyImages];
                                        updated[idx] = e.target.value;
                                        setPropertyImages(updated);
                                      }}
                                      className="flex-1 bg-white border border-slate-300 rounded-lg py-1 px-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                                    />
                                    <label className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg py-1 px-2.5 text-[10px] font-bold transition cursor-pointer select-none">
                                      <Upload className="w-3 h-3" />
                                      <span>{isUploading ? 'Uploading...' : 'Browse...'}</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleUploadImageFile(e, idx, 'admin-properties', propertyImages, setPropertyImages)}
                                        className="hidden"
                                        disabled={isUploading}
                                      />
                                    </label>
                                  </div>
                                  {propertyImages.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = propertyImages.filter((_, i) => i !== idx);
                                        setPropertyImages(updated);
                                      }}
                                      className="p-1 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded border border-slate-200 transition cursor-pointer flex-shrink-0"
                                      title="Remove this image field"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Google Maps Embed Link (URL inside src="...")</label>
                          <input
                            type="text"
                            name="propMapUrl"
                            placeholder="e.g. https://www.google.com/maps/embed?pb=..."
                            defaultValue={editingProperty?.map_url || ''}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Property Owner</label>
                          <select
                            name="propOwner"
                            defaultValue={editingProperty?.owner_id || ''}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white"
                          >
                            <option value="">No Owner / Independent</option>
                            {owners.map(o => (
                              <option key={o.id} value={o.id}>{o.name} ({o.company || 'Private'})</option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-2 border-t border-slate-100 pt-4 space-y-3">
                          <div>
                            <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Property Amenities</span>
                            <p className="text-[10px] text-slate-400 font-semibold mb-2">Check all standard comforts offered by this property.</p>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 bg-slate-50 border border-slate-200/60 p-3 rounded-xl">
                            {masterAmenities.filter(am => am.enabled).map((am) => {
                              const amenity = am.name;
                              const isChecked = propertySelectedAmenities.includes(amenity);
                              return (
                                <label key={am.id} className="flex items-center gap-2 cursor-pointer py-1 hover:bg-slate-100/50 rounded-lg px-1.5 transition select-none">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setPropertySelectedAmenities(propertySelectedAmenities.filter(a => a !== amenity));
                                      } else {
                                        setPropertySelectedAmenities([...propertySelectedAmenities, amenity]);
                                      }
                                    }}
                                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                                  />
                                  <span className="text-xs text-slate-700 font-bold">{amenity}</span>
                                </label>
                              );
                            })}
                          </div>

                          {/* Custom Amenities Section */}
                          <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase">Or Add Custom Amenity</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="e.g. Ocean View, Private Spa, Airport Shuttle"
                                value={customAmenityInput}
                                onChange={(e) => setCustomAmenityInput(e.target.value)}
                                className="flex-1 bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white text-slate-800"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const trimmed = customAmenityInput.trim();
                                    if (trimmed && !propertySelectedAmenities.includes(trimmed)) {
                                      setPropertySelectedAmenities([...propertySelectedAmenities, trimmed]);
                                      setCustomAmenityInput('');
                                    }
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const trimmed = customAmenityInput.trim();
                                  if (trimmed && !propertySelectedAmenities.includes(trimmed)) {
                                    setPropertySelectedAmenities([...propertySelectedAmenities, trimmed]);
                                    setCustomAmenityInput('');
                                  }
                                }}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-300 transition cursor-pointer"
                              >
                                + Add Custom
                              </button>
                            </div>

                            {/* Display any selected non-standard (custom) amenities as removable tags */}
                            {propertySelectedAmenities.filter(a => !masterAmenities.filter(am => am.enabled).map(am => am.name).includes(a)).length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1.5">
                                <span className="text-[10px] text-slate-400 font-bold uppercase mr-1 flex items-center">Custom added:</span>
                                {propertySelectedAmenities.filter(a => !masterAmenities.filter(am => am.enabled).map(am => am.name).includes(a)).map((amenity) => (
                                  <span key={amenity} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-purple-100 animate-in fade-in zoom-in-95 duration-100">
                                    <span>{amenity}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPropertySelectedAmenities(propertySelectedAmenities.filter(a => a !== amenity));
                                      }}
                                      className="text-purple-400 hover:text-purple-600 font-black cursor-pointer text-[10px] ml-0.5"
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 pt-3">
                          <button
                            type="button"
                            onClick={() => {
                              setShowPropertyForm(false);
                              setEditingProperty(null);
                            }}
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg py-2 px-4 text-xs font-bold transition text-slate-700"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 px-4 text-xs font-bold transition shadow-md"
                          >
                            Save Hotel Profile
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Properties Listing */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {properties.map(p => (
                      <div key={p.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between" id={`prop_card_${p.id}`}>
                        <div>
                          <img src={p.image_url ? splitImageUrls(p.image_url)[0] : ''} className="w-full h-40 object-cover" alt={p.name} referrerPolicy="no-referrer" />
                          <div className="p-4 space-y-2">
                            <h3 className="font-extrabold text-slate-800 text-sm">{p.name}</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-blue-500" />
                              <span>{p.location}</span>
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-100/80 rounded-md py-1 px-2 w-max">
                              <Users className="w-3.5 h-3.5 text-purple-500" />
                              <span>Owner: {owners.find(o => o.id === p.owner_id)?.name || 'Independent'}</span>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{p.description}</p>
                          </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingProperty(p);
                              const imgs = splitImageUrls(p.image_url);
                              setPropertyImages(imgs.length > 0 ? imgs : ['']);
                              setPropertySelectedAmenities(p.amenities || []);
                              setCustomAmenityInput('');
                              setShowPropertyForm(true);
                            }}
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs px-3.5 py-1.5 rounded-lg transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProperty(p.id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs p-1.5 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* TAB 4.5: OWNERS CRUD */}
              {adminTab === 'owners' && (
                <div className="space-y-6" id="panel_owners">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-black text-slate-800 tracking-tight">Property Owners</h2>
                      <p className="text-xs text-slate-500">Add, edit, or delete registered holiday rentals and hotel owners, and assign their company profiles.</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingOwner(null);
                        setShowAddOwnerForm(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-lg transition-all flex items-center gap-1.5 shadow-md hover:shadow-lg"
                      id="admin_add_owner_btn"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Register Owner</span>
                    </button>
                  </div>

                  {showAddOwnerForm && (
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4" id="owner_form_container">
                      <h3 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2">
                        {editingOwner ? `Edit Owner Profile: ${editingOwner.name}` : 'Register New Property Owner'}
                      </h3>
                      <form onSubmit={handleSaveOwner} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                          <input
                            type="text"
                            name="ownerName"
                            required
                            placeholder="e.g. Alex Rivera"
                            defaultValue={editingOwner?.name || ''}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
                          <input
                            type="email"
                            name="ownerEmail"
                            required
                            placeholder="e.g. alex@riverahospitality.com"
                            defaultValue={editingOwner?.email || ''}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone Number</label>
                          <input
                            type="text"
                            name="ownerPhone"
                            placeholder="e.g. +1 305-555-0101"
                            defaultValue={editingOwner?.phone || ''}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Company / Group Name</label>
                          <input
                            type="text"
                            name="ownerCompany"
                            placeholder="e.g. Rivera Hospitality Group"
                            defaultValue={editingOwner?.company || ''}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white"
                          />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 pt-3">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddOwnerForm(false);
                              setEditingOwner(null);
                            }}
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg py-2 px-4 text-xs font-bold transition text-slate-700"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 px-4 text-xs font-bold transition shadow-md"
                          >
                            Save Owner Profile
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Owners Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {owners.map(o => {
                      const ownedProps = properties.filter(p => p.owner_id === o.id);
                      return (
                        <div key={o.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between" id={`owner_card_${o.id}`}>
                          <div className="space-y-3">
                            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                              <div>
                                <h3 className="font-extrabold text-slate-800 text-sm">{o.name}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{o.company || 'Private Owner'}</p>
                              </div>
                              <span className="bg-purple-50 border border-purple-200 text-purple-700 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase">
                                {ownedProps.length} {ownedProps.length === 1 ? 'Property' : 'Properties'}
                              </span>
                            </div>

                            <div className="text-xs text-slate-500 space-y-1">
                              <p>Email: <strong className="text-slate-700">{o.email}</strong></p>
                              <p>Phone: <strong className="text-slate-700">{o.phone || 'N/A'}</strong></p>
                              {ownedProps.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-dashed border-slate-100">
                                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Assigned Listings:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {ownedProps.map(p => (
                                      <span key={p.id} className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm">
                                        {p.name}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-end border-t border-slate-100 pt-3 mt-4 gap-2">
                            <button
                              onClick={() => {
                                setEditingOwner(o);
                                setShowAddOwnerForm(true);
                              }}
                              className="bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 font-bold text-xs px-3 py-1.5 rounded-lg transition"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteOwner(o.id)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs p-1.5 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 5: ROOMS CRUD */}
              {adminTab === 'rooms' && (
                <div className="space-y-6" id="panel_rooms">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-black text-slate-800 tracking-tight">Room Inventories</h2>
                      <p className="text-xs text-slate-500">Configure primary inventories, standard base nightly pricing limits, and room types.</p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingRoom(null);
                        setRoomImages(['']);
                        setShowRoomForm(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-md flex items-center gap-1.5"
                      id="add_room_btn"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Configure Room</span>
                    </button>
                  </div>

                  {/* Form Modal for Rooms */}
                  {showRoomForm && (
                    <div className="bg-white rounded-xl border border-slate-300 p-6 shadow-xl animate-fade-in" id="room_editor_form">
                      <h3 className="font-extrabold text-slate-800 text-sm mb-4">
                        {editingRoom ? `Edit ${editingRoom.name}` : 'Configure New Room Type'}
                      </h3>
                      <form onSubmit={handleSaveRoom} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Hotel Property</label>
                          <select
                            name="roomProp"
                            required
                            defaultValue={editingRoom?.property_id || properties[0]?.id || ''}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white"
                          >
                            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Room Display Name</label>
                          <input
                            type="text"
                            name="roomName"
                            required
                            placeholder="e.g. Superior Garden Suite"
                            defaultValue={editingRoom?.name || ''}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Room Type Classification</label>
                          <input
                            type="text"
                            name="roomType"
                            required
                            placeholder="e.g. Deluxe Suite"
                            defaultValue={editingRoom?.type || ''}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Standard Base Price (₹ / night)</label>
                          <input
                            type="number"
                            name="roomPrice"
                            required
                            defaultValue={editingRoom?.base_price || ''}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Capacity: Max Adults</label>
                          <input
                            type="number"
                            name="roomAdults"
                            required
                            defaultValue={editingRoom?.capacity_adults || 2}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Capacity: Max Children</label>
                          <input
                            type="number"
                            name="roomKids"
                            required
                            defaultValue={editingRoom?.capacity_children || 0}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Total Available Inventory Units</label>
                          <input
                            type="number"
                            name="roomInv"
                            required
                            defaultValue={editingRoom?.total_inventory || 5}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Room Description</label>
                          <textarea
                            name="roomDesc"
                            rows={3}
                            defaultValue={editingRoom?.description || ''}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white resize-none"
                          ></textarea>
                        </div>
                        <div className="md:col-span-2 space-y-3">
                          <div className="flex justify-between items-center">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase">Room Images Portfolio</label>
                            <button
                              type="button"
                              onClick={() => setRoomImages([...roomImages, ''])}
                              className="flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg py-1 px-2 text-[10px] font-bold transition cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Image Field</span>
                            </button>
                          </div>
                          <div className="space-y-2 max-h-48 overflow-y-auto pr-1 border border-dashed border-slate-200 p-3 rounded-lg bg-slate-50/50">
                            {roomImages.map((imgUrl, idx) => {
                              const key = `admin-rooms-${idx}`;
                              const previewSrc = tempPreviews[key] || imgUrl;
                              const isUploading = imageUploading[key];
                              return (
                                <div key={idx} className="flex gap-2 items-center">
                                  <div className="text-[10px] text-slate-500 font-extrabold w-16 flex-shrink-0">
                                    Image #{idx + 1}
                                  </div>
                                  <div className="flex-1 flex gap-2 items-center">
                                    {previewSrc && (
                                      <div className="w-8 h-8 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center relative shadow-sm">
                                        <img
                                          src={previewSrc}
                                          alt="Preview"
                                          className="w-full h-full object-cover"
                                          referrerPolicy="no-referrer"
                                        />
                                        {isUploading && (
                                          <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    <input
                                      type="text"
                                      value={imgUrl}
                                      placeholder="e.g. https://images.unsplash.com/photo-..."
                                      onChange={(e) => {
                                        const updated = [...roomImages];
                                        updated[idx] = e.target.value;
                                        setRoomImages(updated);
                                      }}
                                      className="flex-1 bg-white border border-slate-300 rounded-lg py-1 px-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                                    />
                                    <label className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg py-1 px-2.5 text-[10px] font-bold transition cursor-pointer select-none">
                                      <Upload className="w-3 h-3" />
                                      <span>{isUploading ? 'Uploading...' : 'Browse...'}</span>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleUploadImageFile(e, idx, 'admin-rooms', roomImages, setRoomImages)}
                                        className="hidden"
                                        disabled={isUploading}
                                      />
                                    </label>
                                  </div>
                                  {roomImages.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = roomImages.filter((_, i) => i !== idx);
                                        setRoomImages(updated);
                                      }}
                                      className="p-1 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded border border-slate-200 transition cursor-pointer flex-shrink-0"
                                      title="Remove this image field"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Amenities (comma-separated list)</label>
                          <input
                            type="text"
                            name="roomAmen"
                            defaultValue={editingRoom?.amenities.join(', ') || ''}
                            placeholder="Free Wi-Fi, Ocean View, Central Air Conditioning, Nespresso Machine"
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white"
                          />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 pt-3">
                          <button
                            type="button"
                            onClick={() => {
                              setShowRoomForm(false);
                              setEditingRoom(null);
                            }}
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg py-2 px-4 text-xs font-bold transition text-slate-700"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 px-4 text-xs font-bold transition shadow-md"
                          >
                            Save Room Details
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Rooms Listing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {rooms.map(r => {
                      const prop = properties.find(p => p.id === r.property_id);
                      return (
                        <div key={r.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col md:flex-row justify-between" id={`room_card_${r.id}`}>
                          <img src={r.images?.[0] || getRoomFallbackImage(r.name, r.id)} className="w-full md:w-40 h-40 md:h-full object-cover" alt={r.name} referrerPolicy="no-referrer" />
                          
                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <h3 className="font-extrabold text-slate-800 text-sm leading-tight">{r.name}</h3>
                                <span className="text-[9px] font-bold bg-slate-100 px-2 py-0.5 rounded-full uppercase text-slate-500">
                                  {r.type}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{prop?.name}</p>
                              
                              <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-slate-600 font-bold">
                                <p>Standard Price: <span className="text-slate-800">₹{r.base_price}/n</span></p>
                                <p>Max Guests: <span className="text-slate-800">{r.capacity_adults} + {r.capacity_children}</span></p>
                                <p className="col-span-2">Base Inventory: <span className="text-slate-800">{r.total_inventory} Units</span></p>
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 mt-4">
                              <button
                                onClick={() => {
                                  setEditingRoom(r);
                                  setRoomImages(r.images && r.images.length > 0 ? [...r.images] : ['']);
                                  setShowRoomForm(true);
                                }}
                                className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs px-3 py-1 rounded-md transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteRoom(r.id)}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs p-1 rounded-md transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}

              {/* TAB 7: COUPONS */}
              {adminTab === 'coupons' && (
                <div className="space-y-6" id="panel_coupons">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-black text-slate-800 tracking-tight">Promotional Codes & Seasonal Discounts</h2>
                      <p className="text-xs text-slate-500">Define active discounts to apply inside the direct guest booking search engine.</p>
                    </div>
                    <button
                      onClick={() => setShowCouponForm(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-md flex items-center gap-1.5"
                      id="add_coupon_btn"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Coupon</span>
                    </button>
                  </div>

                  {showCouponForm && (
                    <div className="bg-white rounded-xl border border-slate-300 p-6 shadow-xl animate-fade-in" id="coupon_editor_form">
                      <h3 className="font-extrabold text-slate-800 text-sm mb-4">Create New Promotional Code</h3>
                      <form onSubmit={handleSaveCoupon} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Coupon Promo Code</label>
                          <input
                            type="text"
                            name="cpCode"
                            required
                            placeholder="e.g. SUMMER26"
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-bold uppercase focus:outline-none focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Discount Type</label>
                          <select
                            name="cpType"
                            required
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white"
                          >
                            <option value="Percentage">Percentage (%)</option>
                            <option value="Fixed">Fixed Amount (₹)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Discount Value</label>
                          <input
                            type="number"
                            name="cpVal"
                            required
                            placeholder="e.g. 20"
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Minimum Stay Purchase Spend</label>
                          <input
                            type="number"
                            name="cpMin"
                            required
                            defaultValue={0}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Valid From Date</label>
                          <input
                            type="date"
                            name="cpStart"
                            required
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Valid To Date</label>
                          <input
                            type="date"
                            name="cpEnd"
                            required
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white"
                          />
                        </div>
                        <div className="md:col-span-3 flex justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowCouponForm(false)}
                            className="bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg py-2 px-4 text-xs font-bold transition text-slate-700"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 px-4 text-xs font-bold transition shadow-md"
                          >
                            Save Promo Code
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Coupons Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {coupons.map(cp => (
                      <div key={cp.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between" id={`coupon_card_${cp.id}`}>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <span className="font-black text-slate-900 text-sm font-mono tracking-wider">{cp.code}</span>
                            <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                              {cp.discount_type === 'Percentage' ? `${cp.discount_value}% OFF` : `₹${cp.discount_value} OFF`}
                            </span>
                          </div>

                          <div className="text-xs text-slate-500 space-y-1">
                            <p>Minimum Spend: <strong className="text-slate-700">₹{cp.min_booking_amount}</strong></p>
                            <p>Validity Period: <strong className="text-slate-700">{cp.start_date} to {cp.end_date}</strong></p>
                          </div>
                        </div>

                        <div className="flex justify-end border-t border-slate-100 pt-3 mt-4">
                          <button
                            onClick={() => handleDeleteCoupon(cp.id)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs p-1.5 rounded-lg transition flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* TAB 8: EMAIL LOGS TERMINAL (NODEMAILER SIMULATION) */}
              {adminTab === 'emails' && (
                <div className="space-y-6" id="panel_emails">
                  <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Outgoing Simulated Email Terminal</h2>
                    <p className="text-xs text-slate-500">Inspect the complete HTML notification records generated by the simulated Nodemailer engine. Click "Preview" to open the raw secure rendering.</p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                            <th className="p-4">Log Stamp ID</th>
                            <th className="p-4">Recipient Address</th>
                            <th className="p-4">Notification Subject</th>
                            <th className="p-4">Sent At Timestamp</th>
                            <th className="p-4 text-right">Rendering</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {emailLogs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50/50">
                              <td className="p-4 font-mono font-bold text-blue-700">
                                {log.id}
                              </td>
                              <td className="p-4 font-bold text-slate-800">
                                {log.to}
                              </td>
                              <td className="p-4 text-slate-700 font-semibold">
                                {log.subject}
                              </td>
                              <td className="p-4 text-slate-400">
                                {new Date(log.sent_at).toLocaleString()}
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => setPreviewEmail(log)}
                                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-1 rounded-md transition flex items-center gap-1.5 ml-auto"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>HTML View</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 9: TAX SETTINGS */}
              {adminTab === 'tax_settings' && (
                <div className="space-y-6 max-w-4xl" id="panel_tax_settings">
                  <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Financial, Tax & Payment Settings</h2>
                    <p className="text-xs text-slate-500">Configure global reservation tax parameters, partial payment deposit percentage, and transaction-wide calculations.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left 2 Columns: Config Controls */}
                    <div className="md:col-span-2 space-y-6">
                      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
                        <div className="space-y-2">
                          <h3 className="text-sm font-bold text-slate-800">Global Tax Rate (%)</h3>
                          <p className="text-xs text-slate-500">This percentage will be automatically appended as GST to all brand-new and pending customer checkouts.</p>
                        </div>

                        {/* Interactive Slider & Number Input */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <input
                              type="range"
                              min="0"
                              max="30"
                              step="0.5"
                              value={tempTaxRate}
                              onChange={(e) => setTempTaxRate(parseFloat(e.target.value))}
                              className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                              id="tax_settings_slider"
                            />
                            <div className="relative w-28">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={tempTaxRate}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val) && val >= 0) {
                                    setTempTaxRate(val);
                                  }
                                }}
                                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg py-2 pl-3 pr-8 text-sm font-bold text-slate-800 text-right focus:outline-none"
                                id="tax_settings_input"
                              />
                              <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">%</span>
                            </div>
                          </div>

                          {/* Quick Select Buttons */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quick Presets</label>
                            <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
                              {[
                                { label: 'Exempt', val: 0 },
                                { label: 'Budget', val: 5 },
                                { label: 'Prev Default', val: 8.5 },
                                { label: 'GST 10%', val: 10 },
                                { label: 'Standard', val: 12 },
                                { label: 'Luxury', val: 18 },
                                { label: 'Premium', val: 28 }
                              ].map((preset) => (
                                <button
                                  key={preset.val}
                                  type="button"
                                  onClick={() => setTempTaxRate(preset.val)}
                                  className={`py-2 px-1 text-center rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                                    tempTaxRate === preset.val
                                      ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-xs'
                                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                  }`}
                                  id={`tax_preset_${preset.val}`}
                                >
                                  <div className="truncate">{preset.label}</div>
                                  <div className="font-mono text-[9px] text-slate-400 mt-0.5">{preset.val}%</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Additional Tax Notes */}
                        <div className="pt-4 border-t border-slate-100 space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tax Display Label</label>
                          <input
                            type="text"
                            disabled
                            value="GST"
                            className="w-full bg-slate-100 border border-slate-200 rounded-lg py-2 px-3 text-xs font-semibold text-slate-500 cursor-not-allowed"
                          />
                          <p className="text-[10px] text-slate-400">Label is fixed as GST according to the latest configuration update.</p>
                        </div>
                      </div>

                      {/* Partial Payments Deposit Settings */}
                      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
                        <div className="space-y-2">
                          <h3 className="text-sm font-bold text-slate-800">Partial Payment Deposit Percentage (%)</h3>
                          <p className="text-xs text-slate-500">Configure the default deposit ratio presented to guests when making partial payments via Razorpay.</p>
                        </div>

                        {/* Interactive Slider & Number Input */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <input
                              type="range"
                              min="10"
                              max="90"
                              step="5"
                              value={tempPartialPaymentPercent}
                              onChange={(e) => setTempPartialPaymentPercent(parseInt(e.target.value, 10))}
                              className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                              id="partial_payment_settings_slider"
                            />
                            <div className="relative w-28">
                              <input
                                type="number"
                                min="10"
                                max="90"
                                step="5"
                                value={tempPartialPaymentPercent}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  if (!isNaN(val) && val >= 10 && val <= 90) {
                                    setTempPartialPaymentPercent(val);
                                  }
                                }}
                                className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 rounded-lg py-2 pl-3 pr-8 text-sm font-bold text-slate-800 text-right focus:outline-none"
                                id="partial_payment_settings_input"
                              />
                              <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">%</span>
                            </div>
                          </div>

                          {/* Quick Select Buttons */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quick Presets</label>
                            <div className="grid grid-cols-4 gap-2">
                              {[
                                { label: 'Min Deposit', val: 15 },
                                { label: 'Standard', val: 30 },
                                { label: 'Half-Pay', val: 50 },
                                { label: 'Premium Dep', val: 75 }
                              ].map((preset) => (
                                <button
                                  key={preset.val}
                                  type="button"
                                  onClick={() => setTempPartialPaymentPercent(preset.val)}
                                  className={`py-2 px-1 text-center rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                                    tempPartialPaymentPercent === preset.val
                                      ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-xs'
                                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                  }`}
                                  id={`partial_preset_${preset.val}`}
                                >
                                  <div className="truncate">{preset.label}</div>
                                  <div className="font-mono text-[9px] text-slate-400 mt-0.5">{preset.val}%</div>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Explicit Save Action Card */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-left">
                          {(tempTaxRate !== taxRate || tempPartialPaymentPercent !== partialPaymentPercent) ? (
                            <span className="text-xs text-amber-600 font-bold flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Unsaved Changes Detected
                            </span>
                          ) : (
                            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              All Settings Synchronized
                            </span>
                          )}
                          <p className="text-[10px] text-slate-400 mt-0.5">Click Save Settings to apply these parameters to live user checkouts.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            updateTaxRate(tempTaxRate);
                            updatePartialPaymentPercent(tempPartialPaymentPercent);
                            showAlert('Settings Saved', `Successfully updated Global GST Rate to ${tempTaxRate}% and Deposit percentage to ${tempPartialPaymentPercent}%!`);
                          }}
                          className="w-full sm:w-auto py-2.5 px-6 rounded-lg text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white hover:scale-[1.02] active:scale-[0.98]"
                          id="btn_save_tax_settings"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save Settings</span>
                        </button>
                      </div>
                    </div>

                    {/* Right 1 Column: Live Simulation Sandbox */}
                    <div className="space-y-6">
                      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-md space-y-4">
                        <div className="flex items-center gap-1.5 border-b border-slate-800 pb-3">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Simulation Engine</h4>
                        </div>

                        <div className="space-y-3 text-xs">
                          <p className="text-slate-400 text-[11px] leading-relaxed">
                            How a sample room charge of <strong className="text-slate-100">₹10,000</strong> would calculate live:
                          </p>

                          <div className="bg-slate-950 p-3.5 rounded-lg font-mono space-y-2 text-[11px] border border-slate-800/80">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Base Fare:</span>
                              <span className="text-slate-200">₹10,000.00</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-800 pb-1.5">
                              <span className="text-slate-500">GST ({tempTaxRate}%):</span>
                              <span className="text-amber-400">+₹{(10000 * (tempTaxRate / 100)).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between pt-1.5 text-xs font-bold">
                              <span className="text-slate-300">Total Charge:</span>
                              <span className="text-emerald-400">₹{(10000 * (1 + (tempTaxRate / 100))).toFixed(2)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-lg text-[10px] text-slate-400 space-y-2">
                          <div className="font-bold text-slate-300">System Integration Status:</div>
                          <p className="leading-normal">
                            All guest booking summary panels, transaction checkouts, Nodemailer confirmation letters, and Razorpay simulations have been successfully bound to this rate!
                          </p>
                          <div className="inline-flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-bold">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                            <span>Live & Reactive</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 10: DATABASE SETTINGS */}
              {adminTab === 'db_settings' && (
                <div className="space-y-6 max-w-4xl" id="panel_db_settings">
                  <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Database Settings & Backups</h2>
                    <p className="text-xs text-slate-500">Manage local sandbox data sync state, download full database backups, or reset the seeding configuration.</p>
                  </div>

                  {/* DATABASE PERSISTENCE & EXPORT SECTION */}
                  <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4" id="database_persistence_section">
                    <div className="flex items-start justify-between gap-4 flex-col sm:flex-row border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin-slow" />
                          <span>Active Database Persistence & Backups</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          In the AI Studio sandbox environment, the backend server containers scale down or restart automatically, resetting local server files like <code className="bg-slate-50 px-1 py-0.5 rounded text-rose-600 font-mono text-[11px]">db.json</code>. We have engineered an <strong>Automatic Sync Engine</strong> that persists your custom room inventories, edits, and bookings inside your browser's persistent cache.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {localStorage.getItem('custom_db_is_dirty') === 'true' ? (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold shadow-xs">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
                            <span>Customized State Sync Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-500 px-3 py-1 rounded-full text-xs font-bold">
                            <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                            <span>Default Seed Database</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Local Project Export</span>
                        <h4 className="text-xs font-bold text-slate-700">Download Current Database File</h4>
                        <p className="text-[11px] text-slate-500 leading-normal">
                          Ready to export or run this project on your local machine? Download your customized database snapshot as a pristine <code className="bg-slate-100 px-1 rounded text-slate-600 font-mono text-[10px]">db.json</code> file. Place it in the root folder of your project to keep all your customized properties, rooms, edits, and reservations perfectly intact!
                        </p>
                        <button
                          type="button"
                          onClick={handleExportDatabase}
                          className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Download db.json File</span>
                        </button>
                      </div>

                      <div className="bg-red-50/40 border border-red-100 rounded-lg p-4 space-y-2">
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">Dangerous Area</span>
                        <h4 className="text-xs font-bold text-red-800">Reset Database to Default Seed Data</h4>
                        <p className="text-[11px] text-red-600/80 leading-normal">
                          This action will completely wipe all custom edits, room creations, and mock bookings you have made. Your browser cache and server state will both be immediately re-seeded back to the pristine hotel database defaults.
                        </p>
                        <button
                          type="button"
                          onClick={handleResetDatabase}
                          className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Reset to Original Defaults</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 11: AMENITIES MASTER */}
              {adminTab === 'amenities' && (
                <div className="space-y-6 max-w-5xl" id="panel_amenities">
                  <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <span>Amenities Master Console</span>
                    </h2>
                    <p className="text-xs text-slate-500">Configure, add, rename, and toggle availability of standard comforts across all hotel properties and villa listings.</p>
                  </div>

                  {/* Add New Amenity form card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs" id="add_amenity_section">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Add New Global Amenity</h3>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const name = newAmenityName.trim();
                        if (!name) return;
                        if (masterAmenities.some(am => am.name.toLowerCase() === name.toLowerCase())) {
                          alert("This amenity already exists in the master list.");
                          return;
                        }
                        const newAmenity: MasterAmenity = {
                          id: `amenity-${Date.now()}`,
                          name,
                          enabled: newAmenityEnabled
                        };
                        setMasterAmenities([...masterAmenities, newAmenity]);
                        setNewAmenityName('');
                        setNewAmenityEnabled(true);
                      }}
                      className="flex flex-col sm:flex-row gap-4 items-end"
                      id="add_amenity_form"
                    >
                      <div className="flex-1 space-y-1.5 w-full">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amenity Display Name</label>
                        <input
                          type="text"
                          required
                          value={newAmenityName}
                          onChange={(e) => setNewAmenityName(e.target.value)}
                          placeholder="e.g. Infinity Pool, Private Beach, Personal Chef"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-400"
                          id="new_amenity_name_input"
                        />
                      </div>

                      <div className="flex items-center gap-2.5 h-10 select-none pb-2 sm:pb-3">
                        <input
                          type="checkbox"
                          id="new_amenity_enabled"
                          checked={newAmenityEnabled}
                          onChange={(e) => setNewAmenityEnabled(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                        />
                        <label htmlFor="new_amenity_enabled" className="text-xs font-semibold text-slate-600 cursor-pointer">
                          Enable Immediately
                        </label>
                      </div>

                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer w-full sm:w-auto h-10 justify-center"
                        id="new_amenity_submit_btn"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Global Amenity</span>
                      </button>
                    </form>
                  </div>

                  {/* Amenities List Card */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs space-y-4 p-5" id="amenities_list_section">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">All Managed Comforts ({masterAmenities.length})</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Manage existing configurations, rename entries, or activate/deactivate standard filters.</p>
                      </div>

                      {/* Search Bar */}
                      <div className="relative max-w-sm w-full">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search amenities..."
                          value={amenitySearchQuery}
                          onChange={(e) => setAmenitySearchQuery(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl py-1.5 pl-9 pr-4 text-xs font-semibold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-400"
                          id="amenity_search_input"
                        />
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-lg">
                      <table className="w-full text-left border-collapse text-xs" id="amenities_master_table">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                            <th className="p-3.5">Amenity Name</th>
                            <th className="p-3.5">Status Badge</th>
                            <th className="p-3.5 text-right">Operational Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                          {masterAmenities
                            .filter(am => am.name.toLowerCase().includes(amenitySearchQuery.toLowerCase()))
                            .map((am) => {
                              const isEditing = editingAmenityId === am.id;
                              return (
                                <tr key={am.id} className="hover:bg-slate-50/40 transition-colors">
                                  <td className="p-3.5">
                                    {isEditing ? (
                                      <div className="flex items-center gap-2 max-w-xs">
                                        <input
                                          type="text"
                                          value={editingAmenityName}
                                          onChange={(e) => setEditingAmenityName(e.target.value)}
                                          className="bg-white border border-slate-300 rounded-lg py-1 px-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              handleSaveAmenity(am.id);
                                            } else if (e.key === 'Escape') {
                                              setEditingAmenityId(null);
                                            }
                                          }}
                                          autoFocus
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleSaveAmenity(am.id)}
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-md text-[10px] font-bold shadow-xs transition"
                                        >
                                          Save
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setEditingAmenityId(null)}
                                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2.5 py-1 rounded-md text-[10px] font-bold transition"
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-slate-800 text-xs font-extrabold tracking-tight">{am.name}</span>
                                    )}
                                  </td>
                                  <td className="p-3.5">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleAmenity(am.id)}
                                      className="focus:outline-none select-none"
                                      title="Click to toggle status"
                                    >
                                      {am.enabled ? (
                                        <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-2xs hover:bg-emerald-100/60 transition">
                                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                          <span>Enabled</span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-500 px-2.5 py-0.5 rounded-full text-[10px] font-bold hover:bg-slate-200/60 transition">
                                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                                          <span>Disabled</span>
                                        </span>
                                      )}
                                    </button>
                                  </td>
                                  <td className="p-3.5 text-right">
                                    <div className="flex items-center justify-end gap-2.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingAmenityId(am.id);
                                          setEditingAmenityName(am.name);
                                        }}
                                        className="text-blue-600 hover:text-blue-800 text-[11px] font-bold hover:underline transition"
                                      >
                                        Rename
                                      </button>
                                      <div className="w-px h-3 bg-slate-200"></div>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleAmenity(am.id)}
                                        className="text-slate-600 hover:text-slate-800 text-[11px] font-bold hover:underline transition"
                                      >
                                        Toggle Status
                                      </button>
                                      <div className="w-px h-3 bg-slate-200"></div>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteAmenity(am.id)}
                                        className="text-rose-600 hover:text-rose-800 p-1 hover:bg-rose-50 rounded transition"
                                        title="Delete completely"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          {masterAmenities.filter(am => am.name.toLowerCase().includes(amenitySearchQuery.toLowerCase())).length === 0 && (
                            <tr>
                              <td colSpan={3} className="p-8 text-center text-slate-400 font-semibold italic">
                                No matching amenities found. Add a new one above to expand the master catalog!
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Stats summary banner */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between text-xs text-slate-500 font-semibold">
                      <div className="flex gap-4">
                        <p>Total Managed: <span className="text-slate-800 font-bold">{masterAmenities.length}</span></p>
                        <p>Enabled: <span className="text-emerald-600 font-bold">{masterAmenities.filter(a => a.enabled).length}</span></p>
                        <p>Disabled: <span className="text-amber-600 font-bold">{masterAmenities.filter(a => !a.enabled).length}</span></p>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        * Enabled amenities are immediately checkable on Property Creation & edit cards.
                      </p>
                    </div>

                  </div>
                </div>
              )}

            </div>

            {/* Email HTML Modal View Overlay */}
            {previewEmail && (
              <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-[10000] p-4" id="email_preview_overlay">
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh] border border-slate-200">
                  <div className="bg-slate-900 text-white p-4 flex justify-between items-center rounded-t-xl">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold font-mono text-slate-300">RAW NODEMAILER LOG PREVIEW</span>
                    </div>
                    <button 
                      onClick={() => setPreviewEmail(null)}
                      className="text-slate-400 hover:text-white hover:bg-slate-800 p-1 rounded-md transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 font-semibold space-y-1">
                    <p><strong>To:</strong> {previewEmail.to}</p>
                    <p><strong>Subject:</strong> {previewEmail.subject}</p>
                    <p><strong>Sent Date:</strong> {new Date(previewEmail.sent_at).toLocaleString()}</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
                    {/* Render raw html content inside iframe or div cleanly */}
                    <div 
                      className="bg-white rounded-lg shadow-sm p-4 border border-slate-200" 
                      dangerouslySetInnerHTML={{ __html: previewEmail.html }} 
                    />
                  </div>
                  <div className="p-3 bg-slate-50 rounded-b-xl border-t border-slate-200 text-center text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Nodemailer simulated output matches actual SMTP layout grids.</span>
                  </div>
                </div>
              </div>
            )}

          </div>
          )
        )}

        {/* VIEW 3: OWNER ACCESS & OWNER PORTAL DASHBOARD */}
        {currentRole === 'owner' && (
          !isOwnerLoggedIn ? (
            <div className="max-w-4xl mx-auto px-4 py-12 flex-1 flex flex-col justify-center">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
                
                {/* Left Panel: Demo Accounts selection */}
                <div className="bg-slate-900 text-slate-100 p-8 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full font-bold uppercase text-[9px] w-max">
                      Secure Partner Portal
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-black tracking-tight text-white">Owner Portal</h2>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Access your properties, update base room rates dynamically, and block or unblock calendar dates directly.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/50 space-y-3">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">DEMO OWNER ACCOUNTS</p>
                    <div className="grid grid-cols-1 gap-2">
                      {owners.length > 0 ? (
                        owners.map(o => (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => {
                              setOwnerLoginEmail(o.email);
                              setOwnerLoginPassword(o.password || '');
                              setSelectedOwnerId(o.id);
                              setIsOwnerLoggedIn(true);
                            }}
                            className="bg-slate-900 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 text-left p-2.5 rounded-lg transition-all flex justify-between items-center cursor-pointer"
                          >
                            <div>
                              <p className="text-xs font-bold text-white">{o.name}</p>
                              <p className="text-[9px] text-slate-400">{o.company || 'Private Portfolio'}</p>
                            </div>
                            <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
                          </button>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-500">Loading demo owners...</p>
                      )}
                    </div>
                  </div>

                  <p className="text-[9px] text-slate-500 text-center">
                    Protected by secure SMTP Nodemailer validation logs.
                  </p>
                </div>

                {/* Right Panel: Form Login */}
                <div className="p-8 space-y-6 flex flex-col justify-center">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-800 text-lg">Partner Sign In</h3>
                    <p className="text-xs text-slate-400">Enter your owner credentials to manage listings.</p>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const targetOwner = owners.find(o => o.email.toLowerCase() === ownerLoginEmail.trim().toLowerCase());
                      if (targetOwner) {
                        if (targetOwner.password && ownerLoginPassword !== targetOwner.password) {
                          setOwnerLoginError('Invalid security PIN / password.');
                          return;
                        }
                        setSelectedOwnerId(targetOwner.id);
                        setIsOwnerLoggedIn(true);
                        setOwnerLoginError('');
                      } else {
                        setOwnerLoginError('Owner profile with this email was not found.');
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Registered Email</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. alex@riverahospitality.com"
                        value={ownerLoginEmail}
                        onChange={(e) => setOwnerLoginEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Security PIN / Password</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={ownerLoginPassword}
                        onChange={(e) => setOwnerLoginPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>

                    {ownerLoginError && (
                      <p className="text-[10px] text-rose-600 font-bold bg-rose-50 border border-rose-100 p-2 rounded-lg flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{ownerLoginError}</span>
                      </p>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2 px-4 text-xs font-bold transition shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>Authenticate Access</span>
                    </button>
                  </form>
                </div>

              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col md:flex-row" id="owner_workspace">
              
              {/* Owner Sidebar Navigation */}
              <aside className="w-full md:w-[240px] bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col justify-between" id="owner_sidebar">
                <div className="p-4 space-y-6">
                  
                  {/* Active Partner Info Card */}
                  <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40">
                    <p className="text-[9px] font-bold text-purple-400 uppercase tracking-widest mb-1">PARTNER ACCESS</p>
                    <h4 className="font-extrabold text-xs text-white truncate">{loggedInOwner?.name}</h4>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{loggedInOwner?.company || 'Private Portfolio'}</p>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3.5">MANAGEMENT RAIL</h3>
                    <nav className="space-y-1">
                      
                      <button
                        onClick={() => setOwnerTab('dashboard')}
                        className={`w-full flex items-center gap-2.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                          ownerTab === 'dashboard' ? 'bg-purple-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
                        }`}
                        id="owner_tab_dashboard"
                      >
                        <TrendingUp className="w-4 h-4" />
                        <span>Dashboard Overview</span>
                      </button>

                      <button
                        onClick={() => setOwnerTab('listings')}
                        className={`w-full flex items-center gap-2.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                          ownerTab === 'listings' ? 'bg-purple-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
                        }`}
                        id="owner_tab_listings"
                      >
                        <BedDouble className="w-4 h-4" />
                        <span>Listings & Nightly Rates</span>
                      </button>

                      <button
                        onClick={() => setOwnerTab('calendar')}
                        className={`w-full flex items-center gap-2.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                          ownerTab === 'calendar' ? 'bg-purple-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
                        }`}
                        id="owner_tab_calendar"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Availability Calendar</span>
                      </button>

                      <button
                        onClick={() => setOwnerTab('bookings')}
                        className={`w-full flex items-center gap-2.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                          ownerTab === 'bookings' ? 'bg-purple-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
                        }`}
                        id="owner_tab_bookings"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Reservation Logs</span>
                      </button>

                      <button
                        onClick={() => setOwnerTab('properties')}
                        className={`w-full flex items-center gap-2.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                          ownerTab === 'properties' ? 'bg-purple-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
                        }`}
                        id="owner_tab_properties"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Edit Property</span>
                      </button>

                      <button
                        onClick={() => {
                          setOwnerTab('quotations');
                          // Pre-select first property if quotePropId is empty
                          if (!quotePropId && ownerProperties.length > 0) {
                            setQuotePropId(ownerProperties[0].id);
                          }
                        }}
                        className={`w-full flex items-center gap-2.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                          ownerTab === 'quotations' ? 'bg-purple-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
                        }`}
                        id="owner_tab_quotations"
                      >
                        <IndianRupee className="w-4 h-4" />
                        <span>Generate Quotation</span>
                      </button>

                      <button
                        onClick={() => {
                          setOwnerTab('invoices');
                          if (!customInvPropId && ownerProperties.length > 0) {
                            setCustomInvPropId(ownerProperties[0].id);
                          }
                        }}
                        className={`w-full flex items-center gap-2.5 py-2 px-3 text-xs font-semibold rounded-lg transition-all ${
                          ownerTab === 'invoices' ? 'bg-purple-600 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
                        }`}
                        id="owner_tab_invoices"
                      >
                        <Receipt className="w-4 h-4" />
                        <span>GST Invoices</span>
                      </button>

                    </nav>
                  </div>

                  <div className="text-center pt-2">
                    <button
                      onClick={() => setCurrentRole('landing')}
                      className="text-[10px] text-slate-500 hover:text-slate-300 font-bold transition uppercase tracking-wider cursor-pointer"
                    >
                      ← Return to Home Screen
                    </button>
                  </div>

                </div>

                <div className="px-4 pb-4">
                  <button
                    onClick={() => {
                      setIsOwnerLoggedIn(false);
                      setSelectedOwnerId('');
                    }}
                    className="w-full bg-slate-800 hover:bg-rose-950 border border-slate-700 hover:border-rose-900 hover:text-rose-200 text-slate-300 text-xs font-bold py-2 px-3 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer"
                    id="owner_logout_btn"
                  >
                    <span>Sign Out Partner</span>
                  </button>
                </div>
              </aside>

              {/* Owner Content Panel */}
              <div className="flex-1 bg-slate-50 p-6 md:p-8 overflow-y-auto" id="owner_content_panel">
                
                {/* TAB 1: OWNER DASHBOARD */}
                {ownerTab === 'dashboard' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-black text-slate-800 tracking-tight">Portfolio Overview</h2>
                      <p className="text-xs text-slate-500">Real-time occupancy performance across your registered listings.</p>
                    </div>

                    {/* Stats Cards Row */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Properties Managed</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">{ownerProperties.length}</h3>
                          </div>
                          <div className="bg-purple-50 p-2.5 rounded-lg text-purple-600">
                            <Building className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Room Types</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">{ownerRooms.length}</h3>
                          </div>
                          <div className="bg-purple-50 p-2.5 rounded-lg text-purple-600">
                            <BedDouble className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Active Bookings</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">
                              {ownerBookings.filter(b => b.status !== 'Cancelled').length}
                            </h3>
                          </div>
                          <div className="bg-purple-50 p-2.5 rounded-lg text-purple-600">
                            <CheckCircle className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Direct Income</p>
                            <h3 className="text-2xl font-black text-slate-900 mt-1">
                              ₹{ownerBookings.filter(b => b.status !== 'Cancelled').reduce((sum, b) => sum + b.total_amount, 0).toLocaleString()}
                            </h3>
                          </div>
                          <div className="bg-purple-50 p-2.5 rounded-lg text-purple-600">
                            <IndianRupee className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Booking Table for Owner's Properties */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                      <div className="p-4 border-b border-slate-150">
                        <h3 className="font-extrabold text-slate-850 text-sm">Recent Reservations Portfolio</h3>
                        <p className="text-[10px] text-slate-400">Showing all reservations associated with your managed properties.</p>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                              <th className="p-4">Stay ID</th>
                              <th className="p-4">Guest</th>
                              <th className="p-4">Assigned Room</th>
                              <th className="p-4">Dates</th>
                              <th className="p-4 text-right">Price</th>
                              <th className="p-4 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {ownerBookings.length > 0 ? (
                              ownerBookings.map(b => {
                                const rm = ownerRooms.find(r => r.id === b.room_id);
                                const prop = ownerProperties.find(p => p.id === rm?.property_id);
                                const gst = guests.find(g => g.id === b.guest_id);
                                return (
                                  <tr key={b.id} className="hover:bg-slate-50/50">
                                    <td className="p-4 font-mono font-bold text-purple-700">{b.id}</td>
                                    <td className="p-4">
                                      <p className="font-bold text-slate-800">{gst?.name || 'Jane Doe'}</p>
                                      <p className="text-[9px] text-slate-400">{gst?.email}</p>
                                    </td>
                                    <td className="p-4">
                                      <p className="font-semibold text-slate-700">{rm?.name}</p>
                                      <p className="text-[9px] text-slate-400">{prop?.name}</p>
                                    </td>
                                    <td className="p-4 text-slate-600">{b.check_in} to {b.check_out}</td>
                                    <td className="p-4 text-right font-bold text-slate-900">₹{b.total_amount}</td>
                                    <td className="p-4 text-center">
                                      <span className={`inline-block border text-[9px] font-extrabold py-0.5 px-2 rounded-full uppercase ${
                                        b.status === 'Cancelled' 
                                          ? 'bg-rose-50 border-rose-200 text-rose-600' 
                                          : b.status === 'Confirmed' 
                                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                                          : 'bg-blue-50 border-blue-200 text-blue-600'
                                      }`}>
                                        {b.status}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                                  No active bookings found for your listings.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: LISTINGS & RATES */}
                {ownerTab === 'listings' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-black text-slate-800 tracking-tight">Listings & Dynamic Rates</h2>
                      <p className="text-xs text-slate-500">Edit nightly base rates directly to adjust to high-demand periods instantly.</p>
                    </div>

                    {/* Bulk Seasonal & Holiday Rate Editor */}
                    <div className="bg-gradient-to-br from-slate-900 to-purple-950 text-white rounded-xl p-6 border border-purple-900/50 shadow-md">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-5 h-5 text-purple-400" />
                        <h3 className="font-extrabold text-sm uppercase tracking-wider text-purple-300">Seasonal Dynamic Price Planner</h3>
                      </div>
                      <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                        Schedule dynamic rate variations for special events or high-demand periods like the <strong className="text-purple-300">Summer Vacation</strong> season. Select a room type, date range, and the price modifier or a custom flat price to update rates in bulk instantly.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {/* 1. Room Type Selector */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Target Room Type</label>
                          <select
                            value={seasonalRoomId}
                            onChange={(e) => setSeasonalRoomId(e.target.value)}
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 text-white"
                          >
                            <option value="">-- Choose Room Type --</option>
                            {ownerProperties.map(p => {
                              const rList = ownerRooms.filter(r => r.property_id === p.id);
                              return (
                                <optgroup key={p.id} label={p.name} className="text-slate-800 bg-white">
                                  {rList.map(r => (
                                    <option key={r.id} value={r.id} className="text-slate-800">
                                      {r.name} (Base: ₹{r.base_price})
                                    </option>
                                  ))}
                                </optgroup>
                              );
                            })}
                          </select>
                        </div>

                        {/* 2. Rate Plan Label Preset */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Season Name / Event Label</label>
                          <select
                            value={seasonalLabel}
                            onChange={(e) => {
                              setSeasonalLabel(e.target.value);
                            }}
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 text-white"
                          >
                            <option value="Summer Vacation">Summer Vacation (High Season)</option>
                            <option value="Winter Holidays">Winter Holidays (Festive Season)</option>
                            <option value="Weekend Surge Rates">Weekend Demand Surge</option>
                            <option value="Monsoon Off-Season Discount">Monsoon Off-Season (Discounted)</option>
                            <option value="Corporate Offsite Demand">Corporate Events Period</option>
                          </select>
                        </div>

                        {/* 3. Pricing Calculation Type */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Override Calculation Type</label>
                          <div className="grid grid-cols-2 gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
                            <button
                              type="button"
                              onClick={() => setSeasonalRateType('flat')}
                              className={`py-1 text-[11px] font-extrabold rounded-md transition-all ${
                                seasonalRateType === 'flat' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Flat Price (₹)
                            </button>
                            <button
                              type="button"
                              onClick={() => setSeasonalRateType('percent')}
                              className={`py-1 text-[11px] font-extrabold rounded-md transition-all ${
                                seasonalRateType === 'percent' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              Percentage Adjustment
                            </button>
                          </div>
                        </div>

                        {/* 4. Start Date */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Season Start Date</label>
                          <input
                            type="date"
                            value={seasonalStartDate}
                            onChange={(e) => setSeasonalStartDate(e.target.value)}
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 text-white"
                          />
                        </div>

                        {/* 5. End Date */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Season End Date</label>
                          <input
                            type="date"
                            value={seasonalEndDate}
                            onChange={(e) => setSeasonalEndDate(e.target.value)}
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 text-white"
                          />
                        </div>

                        {/* 6. Adjustment Value */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                            {seasonalRateType === 'flat' ? 'New Nightly Flat Rate (₹)' : 'Percentage Modifier (%)'}
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={seasonalRateValue}
                              onChange={(e) => setSeasonalRateValue(Number(e.target.value))}
                              placeholder={seasonalRateType === 'flat' ? 'e.g. 5500' : 'e.g. +25 or -15'}
                              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg py-1.5 px-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-purple-500 text-white"
                            />
                            {seasonalRateType === 'percent' && (
                              <span className="absolute right-3 top-2 text-xs font-extrabold text-purple-300">%</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-purple-900/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <p className="text-[10px] text-slate-400 font-medium">
                          * Updates will overwrite previous price overrides in the specified date window. Blackouts are unaffected.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleApplySeasonalRate(
                            seasonalRoomId,
                            seasonalStartDate,
                            seasonalEndDate,
                            seasonalRateType,
                            seasonalRateValue,
                            seasonalLabel
                          )}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-black text-xs py-2 px-5 rounded-lg transition-all shadow-md flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                        >
                          <Calendar className="w-4 h-4" />
                          <span>Apply Seasonal Rate Plan</span>
                        </button>
                      </div>
                    </div>

                    {showOwnerPropertyForm && liveEditingProperty && (
                      <div className="bg-white rounded-xl border border-purple-200 p-6 shadow-xl animate-fade-in mb-6" id="owner_property_editor_form">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-purple-100">
                          <h3 className="font-extrabold text-slate-800 text-sm">
                            Edit {liveEditingProperty.name} Profile Details
                          </h3>
                          <button
                            type="button"
                            onClick={() => {
                              setShowOwnerPropertyForm(false);
                              setEditingProperty(null);
                            }}
                            className="text-slate-400 hover:text-slate-600 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const form = e.target as HTMLFormElement;
                            const data = {
                              name: (form.elements.namedItem('propName') as HTMLInputElement).value,
                              location: (form.elements.namedItem('propLoc') as HTMLInputElement).value,
                              address: (form.elements.namedItem('propAddress') as HTMLInputElement).value,
                              contact_email: (form.elements.namedItem('propEmail') as HTMLInputElement).value,
                              contact_phone: (form.elements.namedItem('propPhone') as HTMLInputElement).value,
                              description: (form.elements.namedItem('propDesc') as HTMLTextAreaElement).value,
                              image_url: propertyImages.map(s => s.trim()).filter(Boolean).join(','),
                              amenities: propertySelectedAmenities.filter(Boolean),
                              owner_id: liveEditingProperty.owner_id || null,
                              map_url: (form.elements.namedItem('propMapUrl') as HTMLInputElement).value
                            };

                            try {
                              const res = await fetch(`/api/properties/${liveEditingProperty.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(data)
                              });
                              if (!res.ok) throw new Error('Failed to update hotel profile.');
                              setShowOwnerPropertyForm(false);
                              setEditingProperty(null);
                              loadDatabase();
                            } catch (err: any) {
                              alert(err.message);
                            }
                          }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left"
                        >
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Hotel Name</label>
                            <input
                              type="text"
                              name="propName"
                              required
                              defaultValue={liveEditingProperty.name}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Location Area</label>
                            <input
                              type="text"
                              name="propLoc"
                              required
                              defaultValue={liveEditingProperty.location}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white text-slate-800"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Street Address</label>
                            <input
                              type="text"
                              name="propAddress"
                              required
                              defaultValue={liveEditingProperty.address}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Reservations Contact Email</label>
                            <input
                              type="email"
                              name="propEmail"
                              required
                              defaultValue={liveEditingProperty.contact_email}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Reception Phone</label>
                            <input
                              type="text"
                              name="propPhone"
                              required
                              defaultValue={liveEditingProperty.contact_phone}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white text-slate-800"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Hotel Bio Description</label>
                            <textarea
                              name="propDesc"
                              rows={3}
                              defaultValue={editingProperty.description}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white resize-none text-slate-800"
                            ></textarea>
                          </div>
                          <div className="md:col-span-2 space-y-3">
                            <div className="flex justify-between items-center">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase">Hotel Images Portfolio</label>
                              <button
                                type="button"
                                onClick={() => setPropertyImages([...propertyImages, ''])}
                                className="flex items-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200 rounded-lg py-1 px-2 text-[10px] font-bold transition cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add Image Field</span>
                              </button>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 border border-dashed border-slate-200 p-3 rounded-lg bg-slate-50/50">
                              {propertyImages.map((imgUrl, idx) => {
                                const key = `owner-listings-${idx}`;
                                const previewSrc = tempPreviews[key] || imgUrl;
                                const isUploading = imageUploading[key];
                                return (
                                  <div key={idx} className="flex gap-2 items-center">
                                    <div className="text-[10px] text-slate-500 font-extrabold w-16 flex-shrink-0">
                                      Image #{idx + 1}
                                    </div>
                                    <div className="flex-1 flex gap-2 items-center">
                                      {previewSrc && (
                                        <div className="w-8 h-8 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center relative shadow-sm">
                                          <img
                                            src={previewSrc}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                          />
                                          {isUploading && (
                                            <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                      <input
                                        type="text"
                                        value={imgUrl}
                                        placeholder="e.g. https://images.unsplash.com/photo-..."
                                        onChange={(e) => {
                                          const updated = [...propertyImages];
                                          updated[idx] = e.target.value;
                                          setPropertyImages(updated);
                                        }}
                                        className="flex-1 bg-white border border-slate-300 rounded-lg py-1 px-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-800"
                                      />
                                      <label className="flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200 rounded-lg py-1 px-2.5 text-[10px] font-bold transition cursor-pointer select-none">
                                        <Upload className="w-3 h-3" />
                                        <span>{isUploading ? 'Uploading...' : 'Browse...'}</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => handleUploadImageFile(e, idx, 'owner-listings', propertyImages, setPropertyImages)}
                                          className="hidden"
                                          disabled={isUploading}
                                        />
                                      </label>
                                    </div>
                                    {propertyImages.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = propertyImages.filter((_, i) => i !== idx);
                                          setPropertyImages(updated);
                                        }}
                                        className="p-1 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded border border-slate-200 transition cursor-pointer flex-shrink-0"
                                        title="Remove this image field"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Google Maps Embed Link (URL inside src="..." or standard share link)</label>
                            <input
                              type="text"
                              name="propMapUrl"
                              placeholder="e.g. https://www.google.com/maps/embed?pb=... or standard maps link"
                              defaultValue={liveEditingProperty.map_url || ''}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white text-slate-800"
                            />
                          </div>
                          <div className="md:col-span-2 border-t border-slate-100 pt-4 space-y-3">
                            <div>
                              <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Property Amenities</span>
                              <p className="text-[10px] text-slate-400 font-semibold mb-2">Check all standard comforts offered by this property.</p>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 bg-slate-50 border border-slate-200/60 p-3 rounded-xl text-left">
                              {masterAmenities.filter(am => am.enabled).map((am) => {
                                const amenity = am.name;
                                const isChecked = propertySelectedAmenities.includes(amenity);
                                return (
                                  <label key={am.id} className="flex items-center gap-2 cursor-pointer py-1 hover:bg-slate-100/50 rounded-lg px-1.5 transition select-none">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        if (isChecked) {
                                          setPropertySelectedAmenities(propertySelectedAmenities.filter(a => a !== amenity));
                                        } else {
                                          setPropertySelectedAmenities([...propertySelectedAmenities, amenity]);
                                        }
                                      }}
                                      className="w-3.5 h-3.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                                    />
                                    <span className="text-xs text-slate-700 font-bold">{amenity}</span>
                                  </label>
                                );
                              })}
                            </div>

                            {/* Custom Amenities Section */}
                            <div className="space-y-2 text-left">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase">Or Add Custom Amenity</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  placeholder="e.g. Ocean View, Private Spa, Airport Shuttle"
                                  value={customAmenityInput}
                                  onChange={(e) => setCustomAmenityInput(e.target.value)}
                                  className="flex-1 bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white text-slate-800"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      const trimmed = customAmenityInput.trim();
                                      if (trimmed && !propertySelectedAmenities.includes(trimmed)) {
                                        setPropertySelectedAmenities([...propertySelectedAmenities, trimmed]);
                                        setCustomAmenityInput('');
                                      }
                                    }
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const trimmed = customAmenityInput.trim();
                                    if (trimmed && !propertySelectedAmenities.includes(trimmed)) {
                                      setPropertySelectedAmenities([...propertySelectedAmenities, trimmed]);
                                      setCustomAmenityInput('');
                                    }
                                  }}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-1.5 rounded-lg border border-slate-300 transition cursor-pointer"
                                >
                                  + Add Custom
                                </button>
                              </div>

                              {/* Display any selected non-standard (custom) amenities as removable tags */}
                              {propertySelectedAmenities.filter(a => !masterAmenities.filter(am => am.enabled).map(am => am.name).includes(a)).length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1.5">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase mr-1 flex items-center">Custom added:</span>
                                  {propertySelectedAmenities.filter(a => !masterAmenities.filter(am => am.enabled).map(am => am.name).includes(a)).map((amenity) => (
                                    <span key={amenity} className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-purple-100 animate-in fade-in zoom-in-95 duration-100">
                                      <span>{amenity}</span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPropertySelectedAmenities(propertySelectedAmenities.filter(a => a !== amenity));
                                        }}
                                        className="text-purple-400 hover:text-purple-600 font-black cursor-pointer text-[10px] ml-0.5"
                                      >
                                        &times;
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="md:col-span-2 flex justify-end gap-3 pt-3">
                            <button
                              type="button"
                              onClick={() => {
                                setShowOwnerPropertyForm(false);
                                setEditingProperty(null);
                              }}
                              className="bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg py-2 px-4 text-xs font-bold transition text-slate-700"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2 px-4 text-xs font-bold transition shadow-md"
                            >
                              Save Hotel Profile
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-6">
                      {ownerProperties.map(prop => {
                        const propRooms = ownerRooms.filter(r => r.property_id === prop.id);
                        return (
                          <div key={prop.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                            {prop.image_url && (() => {
                              const imgs = splitImageUrls(prop.image_url);
                              if (imgs.length > 0 && imgs[0]) {
                                return (
                                  <div className="w-full h-40 relative bg-slate-100 overflow-hidden">
                                    <img
                                      src={imgs[0]}
                                      alt={prop.name}
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/10 to-transparent"></div>
                                    <div className="absolute bottom-4 left-4 text-white text-left">
                                      <h3 className="font-black text-base drop-shadow-md">{prop.name}</h3>
                                      <p className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5 drop-shadow-md font-medium">
                                        <MapPin className="w-3.5 h-3.5 text-purple-400" />
                                        <span>{prop.location}</span>
                                      </p>
                                    </div>
                                    <div className="absolute bottom-4 right-4 flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingProperty(prop);
                                          const imgs = splitImageUrls(prop.image_url);
                                          setPropertyImages(imgs.length > 0 ? imgs : ['']);
                                          setPropertySelectedAmenities(prop.amenities || []);
                                          setCustomAmenityInput('');
                                          setShowOwnerPropertyForm(true);
                                        }}
                                        className="bg-purple-600/90 hover:bg-purple-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-xs border border-purple-500/30 backdrop-blur-xs"
                                      >
                                        <Settings className="w-3.5 h-3.5" />
                                        <span>Edit Hotel Profile</span>
                                      </button>
                                      <span className="text-[10px] bg-purple-500/40 text-purple-100 border border-purple-500/30 font-bold px-2.5 py-0.5 rounded-full uppercase backdrop-blur-xs">
                                        {propRooms.length} Room Types
                                      </span>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            {(!prop.image_url || splitImageUrls(prop.image_url).length === 0 || !splitImageUrls(prop.image_url)[0]) && (
                              <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                                <div className="text-left">
                                  <h3 className="font-black text-sm">{prop.name}</h3>
                                  <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3 text-purple-400" />
                                    <span>{prop.location}</span>
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingProperty(prop);
                                      const imgs = splitImageUrls(prop.image_url);
                                      setPropertyImages(imgs.length > 0 ? imgs : ['']);
                                      setPropertySelectedAmenities(prop.amenities || []);
                                      setCustomAmenityInput('');
                                      setShowOwnerPropertyForm(true);
                                    }}
                                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-xs border border-purple-500/30"
                                  >
                                    <Settings className="w-3.5 h-3.5" />
                                    <span>Edit Hotel Profile</span>
                                  </button>
                                  <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold px-2.5 py-0.5 rounded-full uppercase">
                                    {propRooms.length} Room Types
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className="divide-y divide-slate-100">
                              {propRooms.map(rm => {
                                const roomOverrides = overrides.filter(
                                  o => o.room_id === rm.id && o.price_override !== null && !o.is_blackout
                                );
                                const sortedRoomOverrides = [...roomOverrides].sort((a, b) => a.date.localeCompare(b.date));

                                return (
                                  <div key={rm.id} className="p-5 space-y-4">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                      <div>
                                        <h4 className="font-extrabold text-slate-800 text-sm">{rm.name}</h4>
                                        <p className="text-xs text-slate-400 mt-1">
                                          Room Type: <strong className="text-slate-600">{rm.type}</strong> | Total Inventory Capacity: <strong className="text-slate-600">{rm.total_inventory} Units</strong>
                                        </p>
                                      </div>

                                      <div className="flex items-center gap-3">
                                        <div className="space-y-1">
                                          <span className="block text-[9px] uppercase font-bold text-slate-400">Base Nightly Rate (₹)</span>
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="number"
                                              defaultValue={rm.base_price}
                                              id={`price_input_${rm.id}`}
                                              className="bg-slate-50 border border-slate-300 rounded-lg py-1 px-3 text-xs font-bold w-24 text-slate-800 focus:outline-none focus:bg-white"
                                            />
                                            <button
                                              onClick={() => {
                                                const input = document.getElementById(`price_input_${rm.id}`) as HTMLInputElement;
                                                if (input) {
                                                  handleUpdateRoomRate(rm.id, Number(input.value));
                                                }
                                              }}
                                              className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold py-1.5 px-3.5 rounded-lg transition shadow-xs"
                                            >
                                              Save Rate
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* All Date Price Details */}
                                    {sortedRoomOverrides.length > 0 ? (
                                      <div className="bg-purple-50/40 border border-purple-100/60 rounded-xl p-4">
                                        <div className="flex justify-between items-center mb-3">
                                          <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
                                            Active Seasonal Price Overrides & Dynamic Rates Details
                                          </span>
                                          <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 border px-2 py-0.5 rounded-full">
                                            {sortedRoomOverrides.length} Custom Dates
                                          </span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
                                          {sortedRoomOverrides.map(ov => (
                                            <div key={ov.id} className="bg-white border border-purple-100 rounded-lg p-2.5 flex flex-col justify-between shadow-2xs relative group hover:border-purple-300 transition-all">
                                              <div className="flex justify-between items-start gap-1">
                                                <span className="font-extrabold text-slate-700 text-xs">{ov.date}</span>
                                                <button
                                                  type="button"
                                                  onClick={() => handleResetRate(rm.id, ov.date)}
                                                  className="text-[10px] text-slate-400 hover:text-rose-600 font-extrabold transition cursor-pointer"
                                                  title="Reset back to base price"
                                                >
                                                  ×
                                                </button>
                                              </div>
                                              <div className="mt-1.5 flex justify-between items-baseline">
                                                <span className="text-[9px] text-purple-400 font-bold uppercase">Rate</span>
                                                <span className="font-black text-purple-700 text-[13px]">₹{ov.price_override}</span>
                                              </div>
                                              {ov.notes && (
                                                <div className="mt-1 text-[8px] text-slate-400 font-medium truncate" title={ov.notes}>
                                                  {ov.notes}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-[10px] text-slate-400 font-semibold italic bg-slate-50 border border-slate-100 p-2.5 rounded-lg">
                                        No active date-specific overrides. Default base rate is applied for all dates.
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 3: AVAILABILITY CALENDAR */}
                {ownerTab === 'calendar' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-black text-slate-800 tracking-tight">Availability Blocks & Calendar</h2>
                      <p className="text-xs text-slate-500">
                        View real-time reservation occupancy. **Click on any date tile to block or unblock rooms on the availability grid.** Blocked rooms won't be bookable by guests.
                      </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
                      {ownerProperties.map(prop => {
                        const propRooms = ownerRooms.filter(r => r.property_id === prop.id);
                        
                        // Generate next 10 dates starting from 2026-07-06
                        const startDate = new Date('2026-07-06');
                        const datesArray: string[] = [];
                        for (let i = 0; i < 10; i++) {
                          const d = new Date(startDate);
                          d.setDate(startDate.getDate() + i);
                          datesArray.push(d.toISOString().split('T')[0]);
                        }

                        return (
                          <div key={prop.id} className="space-y-4 border-b border-slate-100 pb-6 last:border-b-0 last:pb-0">
                            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200/50">
                              <h3 className="font-extrabold text-sm text-slate-800">{prop.name}</h3>
                              <span className="text-[10px] font-bold text-slate-400">{prop.location}</span>
                            </div>

                            <div className="overflow-x-auto border border-slate-200 rounded-lg">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold text-[9px] uppercase tracking-wider">
                                    <th className="p-3 border-r border-slate-200 min-w-[150px]">Room Type</th>
                                    {datesArray.map(dateStr => {
                                      const [,, day] = dateStr.split('-');
                                      const dObj = new Date(dateStr);
                                      const dayName = dObj.toLocaleDateString('en-US', { weekday: 'short' });
                                      return (
                                        <th key={dateStr} className="p-3 text-center border-r border-slate-200 min-w-[90px]">
                                          <p className="text-slate-400 font-semibold">{dayName}</p>
                                          <p className="text-slate-800 font-bold text-[11px] mt-0.5">{day}</p>
                                        </th>
                                      );
                                    })}
                                  </tr>
                                </thead>
                                <tbody>
                                  {propRooms.map(rm => {
                                    return (
                                      <tr key={rm.id} className="border-b border-slate-150 hover:bg-slate-50/30">
                                        <td className="p-3 font-extrabold text-slate-700 border-r border-slate-200">
                                          {rm.name}
                                          <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                            {rm.total_inventory} Rooms Total
                                          </span>
                                        </td>
                                        {datesArray.map(dateStr => {
                                          // check bookings
                                          const booked = bookings.filter(b => {
                                            if (b.room_id !== rm.id) return false;
                                            if (b.status === 'Cancelled') return false;
                                            return dateStr >= b.check_in && dateStr < b.check_out;
                                          });

                                          // check overrides
                                          const override = overrides.find(o => o.room_id === rm.id && o.date === dateStr);
                                          const isBlackout = override ? override.is_blackout : false;

                                          // status calculation
                                          let cellBg = 'bg-emerald-50/50 hover:bg-emerald-100/50 text-emerald-800 border border-emerald-100 cursor-pointer';
                                          let statusLabel = 'Available';

                                          if (isBlackout) {
                                            cellBg = 'bg-rose-50/50 hover:bg-rose-100/50 text-rose-850 border border-rose-100 cursor-pointer';
                                            statusLabel = 'Blocked';
                                          } else if (booked.length >= rm.total_inventory) {
                                            cellBg = 'bg-slate-200/60 text-slate-500 border border-slate-300 select-none';
                                            statusLabel = `Booked (${booked.length}/${rm.total_inventory})`;
                                          } else if (booked.length > 0) {
                                            const remaining = rm.total_inventory - booked.length;
                                            cellBg = 'bg-amber-50/60 hover:bg-amber-100/60 text-amber-800 border border-amber-200 cursor-pointer';
                                            statusLabel = `${remaining} Left`;
                                          }

                                          return (
                                            <td 
                                              key={dateStr}
                                              onClick={() => {
                                                if (booked.length < rm.total_inventory) {
                                                  handleToggleBlackout(rm.id, dateStr);
                                                }
                                              }}
                                              className={`p-2 text-center border-r border-slate-200 transition-colors text-[10px] font-bold ${cellBg}`}
                                            >
                                              <p className="font-bold tracking-tight">{statusLabel}</p>
                                              {booked.length > 0 && booked.length < rm.total_inventory && (
                                                <p className="text-[8px] text-amber-500 font-extrabold uppercase tracking-wide mt-0.5">
                                                  {booked.length} Sold
                                                </p>
                                              )}
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 4: RESERVATION LOGS */}
                {ownerTab === 'bookings' && (() => {
                  // Filter owner bookings by search query
                  const filteredOwnerBookings = ownerBookings.filter(b => {
                    const guest = guests.find(g => g.id === b.guest_id);
                    const room = rooms.find(r => r.id === b.room_id);
                    const prop = properties.find(p => p.id === room?.property_id);
                    
                    const matchesSearch = 
                      (guest?.name || '').toLowerCase().includes(ownerBookingSearchQuery.toLowerCase()) ||
                      (guest?.email || '').toLowerCase().includes(ownerBookingSearchQuery.toLowerCase()) ||
                      (guest?.phone || '').toLowerCase().includes(ownerBookingSearchQuery.toLowerCase()) ||
                      (room?.name || '').toLowerCase().includes(ownerBookingSearchQuery.toLowerCase()) ||
                      (prop?.name || '').toLowerCase().includes(ownerBookingSearchQuery.toLowerCase()) ||
                      b.id.toLowerCase().includes(ownerBookingSearchQuery.toLowerCase());
                    return matchesSearch;
                  });

                  return (
                    <div className="space-y-6 text-left animate-fade-in">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-xl font-black text-slate-800 tracking-tight">Reservation Logs & Guests</h2>
                          <p className="text-xs text-slate-500">
                            Monitor and manage bookings, check guest status, and view financial logs for your properties.
                          </p>
                        </div>
                        
                        <div className="w-full sm:w-72">
                          <div className="relative">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                            <input
                              type="text"
                              value={ownerBookingSearchQuery}
                              onChange={(e) => setOwnerBookingSearchQuery(e.target.value)}
                              placeholder="Search by Guest, Room, Property, ID..."
                              className="w-full bg-white border border-slate-300 rounded-lg py-1.5 pl-9 pr-4 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-850 shadow-sm"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                        {filteredOwnerBookings.length === 0 ? (
                          <div className="p-12 text-center text-slate-400 font-semibold text-xs space-y-2">
                            <div className="text-3xl">📭</div>
                            <p>No reservations found matching search query.</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold text-[9px] uppercase tracking-wider">
                                  <th className="p-3">Ref ID / Guest Details</th>
                                  <th className="p-3">Room / Hotel</th>
                                  <th className="p-3">Dates (Nights)</th>
                                  <th className="p-3">Financial Summary</th>
                                  <th className="p-3">Source Channel</th>
                                  <th className="p-3">Status</th>
                                  <th className="p-3 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-semibold">
                                {filteredOwnerBookings.map(b => {
                                  const guest = guests.find(g => g.id === b.guest_id);
                                  const rm = rooms.find(r => r.id === b.room_id);
                                  const prop = properties.find(p => p.id === rm?.property_id);
                                  
                                  const dateIn = new Date(b.check_in);
                                  const dateOut = new Date(b.check_out);
                                  const diffTime = Math.abs(dateOut.getTime() - dateIn.getTime());
                                  const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

                                  // Status badges colors
                                  let badgeClass = 'bg-slate-100 text-slate-600';
                                  if (b.status === 'Confirmed') badgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                                  if (b.status === 'Checked-in' || b.status === 'Checked-In') badgeClass = 'bg-purple-50 text-purple-700 border border-purple-200';
                                  if (b.status === 'Checked-out' || b.status === 'Checked-Out') badgeClass = 'bg-blue-50 text-blue-700 border border-blue-200';
                                  if (b.status === 'Cancelled') badgeClass = 'bg-rose-50 text-rose-700 border border-rose-200';

                                  return (
                                    <tr key={b.id} className="hover:bg-slate-50/50">
                                      <td className="p-3 space-y-1">
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-bold text-slate-800 text-[11px]">{b.id}</span>
                                        </div>
                                        <p className="text-slate-800 text-xs font-black">{guest?.name || 'Anonymous Guest'}</p>
                                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                          <span>{guest?.email}</span>
                                          <span>•</span>
                                          <span>{guest?.phone}</span>
                                        </p>
                                        {b.notes && (
                                          <div className="bg-amber-50 text-amber-800 border border-amber-200/50 text-[10px] p-1.5 rounded-md max-w-xs leading-relaxed font-medium mt-1">
                                            <strong>Notes:</strong> {b.notes}
                                          </div>
                                        )}
                                      </td>
                                      
                                      <td className="p-3">
                                        <p className="text-slate-800 font-bold">{rm?.name || 'Room Type'}</p>
                                        <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                          <Building className="w-3 h-3 text-slate-400" />
                                          <span>{prop?.name}</span>
                                        </p>
                                      </td>

                                      <td className="p-3 space-y-0.5">
                                        <p className="text-slate-700">{b.check_in} to {b.check_out}</p>
                                        <span className="inline-block bg-slate-100 text-slate-500 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                          {nights} {nights === 1 ? 'Night' : 'Nights'}
                                        </span>
                                      </td>

                                      <td className="p-3 space-y-0.5">
                                        <div className="text-slate-800 font-bold">
                                          ₹{b.total_amount.toFixed(2)}
                                        </div>
                                        {b.discount_amount > 0 && (
                                          <p className="text-[9px] text-emerald-600">
                                            Discount: -₹{b.discount_amount.toFixed(2)}
                                          </p>
                                        )}
                                        <p className="text-[9px] text-slate-500">
                                          Payment: <span className="font-extrabold uppercase">{b.payment_status}</span>
                                        </p>
                                      </td>

                                      <td className="p-3">
                                        <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                                          {b.sync_source || 'Direct Engine'}
                                        </span>
                                      </td>

                                      <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block uppercase ${badgeClass}`}>
                                          {b.status}
                                        </span>
                                      </td>

                                      <td className="p-3 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                          <select
                                            value={b.status}
                                            onChange={(e) => handleUpdateBookingStatus(b.id, e.target.value)}
                                            className="bg-slate-50 border border-slate-300 rounded-md py-1 px-1.5 text-[10px] font-bold focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-700 cursor-pointer"
                                          >
                                            <option value="Confirmed">Confirmed</option>
                                            <option value="Checked-in">Checked-In</option>
                                            <option value="Checked-out">Checked-Out</option>
                                            <option value="Cancelled">Cancelled</option>
                                          </select>

                                          {b.status !== 'Cancelled' && (
                                            <a
                                              href={getWhatsAppBookingConfirmationUrl(b, guest, rm, prop, nights)}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 hover:text-emerald-700 rounded-md transition flex items-center justify-center gap-1 font-bold text-[10px] px-2.5 py-1.5"
                                              title="Send WhatsApp Confirmation"
                                            >
                                              <MessageSquare className="w-3.5 h-3.5" />
                                              <span>WhatsApp Confirm</span>
                                            </a>
                                          )}

                                          {b.status !== 'Cancelled' && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setGenInvoiceBooking(b);
                                                setGenInvoiceGstin('');
                                                setGenInvoiceBillingAddress(guest?.address || '');
                                                setGenInvoiceOwnerGstin('07AAAAA2222B2Z2');
                                                setShowGenInvoiceModal(true);
                                              }}
                                              className="p-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-600 hover:text-purple-700 rounded-md transition flex items-center justify-center gap-1 font-bold text-[10px] px-2.5 py-1.5 cursor-pointer"
                                              title="Generate GST Invoice for this Guest"
                                            >
                                              <Receipt className="w-3.5 h-3.5" />
                                              <span>GST Invoice</span>
                                            </button>
                                          )}
                                          
                                          {b.status !== 'Cancelled' && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setConfirmModal({
                                                  isOpen: true,
                                                  title: 'Cancel Reservation?',
                                                  message: `Are you sure you want to cancel the reservation for ${guest?.name || 'this guest'}? This will release the rooms back to open inventory.`,
                                                  onConfirm: () => {
                                                    handleUpdateBookingStatus(b.id, 'Cancelled', 'Refunded');
                                                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                                  },
                                                  isAlert: false
                                                });
                                              }}
                                              className="p-1 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-md transition cursor-pointer"
                                              title="Cancel Reservation"
                                            >
                                              <XCircle className="w-4 h-4" />
                                            </button>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* TAB 5: EDIT PROPERTY DETAILS */}
                {ownerTab === 'properties' && (() => {
                  const selectedProp = ownerProperties.find(p => p.id === ownerSelectedPropId) || ownerProperties[0];

                  if (!selectedProp) {
                    return (
                      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 font-semibold text-xs space-y-2 animate-fade-in text-left">
                        <div className="text-3xl">🏨</div>
                        <p>No registered properties found for your partner account.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-6 text-left animate-fade-in">
                      <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Edit Hotel Profiles</h2>
                        <p className="text-xs text-slate-500">
                          Update contact details, description, amenities, dynamic image portfolio, and map locations for your hotel listings.
                        </p>
                      </div>

                      {ownerProperties.length > 1 && (
                        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 shadow-xs">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex-shrink-0">
                            Select Property to Edit:
                          </label>
                          <select
                            value={ownerSelectedPropId}
                            onChange={(e) => {
                              const pId = e.target.value;
                              setOwnerSelectedPropId(pId);
                              const prop = ownerProperties.find(p => p.id === pId);
                              if (prop) {
                                const imgs = splitImageUrls(prop.image_url);
                                setPropertyImages(imgs.length > 0 ? imgs : ['']);
                                setPropertySelectedAmenities(prop.amenities || []);
                                setCustomAmenityInput('');
                              }
                            }}
                            className="bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-800 cursor-pointer min-w-[200px]"
                          >
                            {ownerProperties.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.location})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                        <div className="bg-slate-100 border-b border-slate-200 p-4">
                          <h3 className="font-extrabold text-slate-800 text-xs flex items-center gap-2">
                            <Building className="w-4 h-4 text-purple-600" />
                            <span>Editing Profile for: <strong className="text-purple-700">{selectedProp.name}</strong></span>
                          </h3>
                        </div>

                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const form = e.target as HTMLFormElement;
                            const data = {
                              name: (form.elements.namedItem('propName') as HTMLInputElement).value,
                              location: (form.elements.namedItem('propLoc') as HTMLInputElement).value,
                              address: (form.elements.namedItem('propAddress') as HTMLInputElement).value,
                              contact_email: (form.elements.namedItem('propEmail') as HTMLInputElement).value,
                              contact_phone: (form.elements.namedItem('propPhone') as HTMLInputElement).value,
                              description: (form.elements.namedItem('propDesc') as HTMLTextAreaElement).value,
                              image_url: propertyImages.map(s => s.trim()).filter(Boolean).join(','),
                              amenities: propertySelectedAmenities.filter(Boolean),
                              owner_id: selectedProp.owner_id || null,
                              map_url: (form.elements.namedItem('propMapUrl') as HTMLInputElement).value
                            };

                            try {
                              const res = await fetch(`/api/properties/${selectedProp.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(data)
                              });
                              if (!res.ok) throw new Error('Failed to update hotel profile.');
                              
                              loadDatabase();

                              showAlert(
                                'Hotel Profile Saved!',
                                `Successfully updated profile details and image portfolio for "${data.name}".`
                              );
                            } catch (err: any) {
                              alert(err.message);
                            }
                          }}
                          className="p-6 space-y-5 text-left"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Hotel Name</label>
                              <input
                                type="text"
                                name="propName"
                                required
                                defaultValue={selectedProp.name}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white text-slate-800"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Location Area</label>
                              <input
                                type="text"
                                name="propLoc"
                                required
                                defaultValue={selectedProp.location}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white text-slate-800"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Physical Address</label>
                              <input
                                type="text"
                                name="propAddress"
                                required
                                defaultValue={selectedProp.address}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white text-slate-800"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Contact Email</label>
                              <input
                                type="email"
                                name="propEmail"
                                required
                                defaultValue={selectedProp.contact_email}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white text-slate-800"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Contact Phone</label>
                              <input
                                type="text"
                                name="propPhone"
                                required
                                defaultValue={selectedProp.contact_phone}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white text-slate-800"
                              />
                            </div>
                            <div className="md:col-span-2 border-t border-slate-100 pt-4 space-y-3">
                              <div>
                                <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Property Amenities</span>
                                <p className="text-[10px] text-slate-400 font-semibold mb-2">Check all standard comforts offered by this property.</p>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 bg-slate-50 border border-slate-200/60 p-3 rounded-xl text-left">
                                {masterAmenities.filter(am => am.enabled).map((am) => {
                                  const amenity = am.name;
                                  const isChecked = propertySelectedAmenities.includes(amenity);
                                  return (
                                    <label key={am.id} className="flex items-center gap-2 cursor-pointer py-1 hover:bg-slate-100/50 rounded-lg px-1.5 transition select-none">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {
                                          if (isChecked) {
                                            setPropertySelectedAmenities(propertySelectedAmenities.filter(a => a !== amenity));
                                          } else {
                                            setPropertySelectedAmenities([...propertySelectedAmenities, amenity]);
                                          }
                                        }}
                                        className="w-3.5 h-3.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                                      />
                                      <span className="text-xs text-slate-700 font-bold">{amenity}</span>
                                    </label>
                                  );
                                })}
                              </div>

                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Marketing Description</label>
                              <textarea
                                name="propDesc"
                                rows={4}
                                required
                                defaultValue={selectedProp.description}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white resize-none text-slate-800"
                              ></textarea>
                            </div>
                            <div className="md:col-span-2 space-y-3">
                              <div className="flex justify-between items-center">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase">Hotel Images Portfolio</label>
                                <button
                                  type="button"
                                  onClick={() => setPropertyImages([...propertyImages, ''])}
                                  className="flex items-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200 rounded-lg py-1 px-2 text-[10px] font-bold transition cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add Image Field</span>
                                </button>
                              </div>
                              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 border border-dashed border-slate-200 p-3 rounded-lg bg-slate-50/50">
                                {propertyImages.map((imgUrl, idx) => {
                                  const key = `owner-properties-${idx}`;
                                  const previewSrc = tempPreviews[key] || imgUrl;
                                  const isUploading = imageUploading[key];
                                  return (
                                    <div key={idx} className="flex gap-2 items-center">
                                      <div className="text-[10px] text-slate-500 font-extrabold w-16 flex-shrink-0">
                                        Image #{idx + 1}
                                      </div>
                                      <div className="flex-1 flex gap-2 items-center">
                                        {previewSrc && (
                                          <div className="w-8 h-8 rounded-lg border border-slate-200 overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center relative shadow-sm">
                                            <img
                                              src={previewSrc}
                                              alt="Preview"
                                              className="w-full h-full object-cover"
                                              referrerPolicy="no-referrer"
                                            />
                                            {isUploading && (
                                              <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                        <input
                                          type="text"
                                          value={imgUrl}
                                          placeholder="e.g. https://images.unsplash.com/photo-..."
                                          onChange={(e) => {
                                            const updated = [...propertyImages];
                                            updated[idx] = e.target.value;
                                            setPropertyImages(updated);
                                          }}
                                          className="flex-1 bg-white border border-slate-300 rounded-lg py-1 px-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-800"
                                        />
                                        <label className="flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 border border-purple-200 rounded-lg py-1 px-2.5 text-[10px] font-bold transition cursor-pointer select-none">
                                          <Upload className="w-3 h-3" />
                                          <span>{isUploading ? 'Uploading...' : 'Browse...'}</span>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleUploadImageFile(e, idx, 'owner-properties', propertyImages, setPropertyImages)}
                                            className="hidden"
                                            disabled={isUploading}
                                          />
                                        </label>
                                      </div>
                                      {propertyImages.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const updated = propertyImages.filter((_, i) => i !== idx);
                                            setPropertyImages(updated);
                                          }}
                                          className="p-1 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded border border-slate-200 transition cursor-pointer flex-shrink-0"
                                          title="Remove this image field"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Google Maps Embed Link (URL inside src="..." or standard share link)</label>
                              <input
                                type="text"
                                name="propMapUrl"
                                placeholder="e.g. https://www.google.com/maps/embed?pb=..."
                                defaultValue={selectedProp.map_url || ''}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white text-slate-800"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                            <button
                              type="submit"
                              className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-6 py-2.5 rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                            >
                              <Save className="w-4 h-4" />
                              <span>Save Profile Changes</span>
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  );
                })()}

                {/* TAB 6: GENERATE & SEND QUOTATION */}
                {ownerTab === 'quotations' && (() => {
                  const selectedProp = ownerProperties.find(p => p.id === quotePropId) || ownerProperties[0];
                  const quoteRooms = rooms.filter(r => r.property_id === (selectedProp?.id || ''));
                  const selectedRoom = quoteRooms.find(r => r.id === quoteRoomId) || quoteRooms[0];

                  // Calculate nights
                  const nightsCount = (() => {
                    if (!quoteCheckIn || !quoteCheckOut) return 1;
                    const d1 = new Date(quoteCheckIn);
                    const d2 = new Date(quoteCheckOut);
                    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 1;
                    const diff = d2.getTime() - d1.getTime();
                    return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 1;
                  })();

                  const currentBaseRate = selectedRoom ? selectedRoom.base_price : 0;
                  const finalNightlyRate = quoteCustomRate !== '' ? Number(quoteCustomRate) : currentBaseRate;
                  const totalRent = finalNightlyRate * nightsCount;
                  const discountValue = quoteDiscount !== '' ? Number(quoteDiscount) : 0;
                  const grandTotalAmount = Math.max(0, totalRent - discountValue);

                  // Construct the gorgeous WhatsApp Message text
                  const whatsAppText = `*QUOTATION FROM ${selectedProp?.name || 'Amber Moon Retreat'}* 🏨🌸\n\n` +
                    `Hello *${quoteGuestName || 'Valued Guest'}*,\n\n` +
                    `Thank you for your stay inquiry! We are pleased to share our exclusive stay quotation:\n\n` +
                    `*Stay Details:*\n` +
                    `• *Property:* ${selectedProp?.name || 'Luxury Retreat'}\n` +
                    `• *Accommodation:* ${selectedRoom?.name || 'Premium Floor/Villa'}\n` +
                    `• *Check-in:* ${quoteCheckIn || 'Select Date'}\n` +
                    `• *Check-out:* ${quoteCheckOut || 'Select Date'}\n` +
                    `• *Duration:* ${nightsCount} ${nightsCount === 1 ? 'Night' : 'Nights'}\n` +
                    `• *Guests:* ${quoteAdults} Adults${quoteChildren > 0 ? `, ${quoteChildren} Children` : ''}\n\n` +
                    `*Commercial Offer:*\n` +
                    `• *Nightly Rate:* ₹${finalNightlyRate.toLocaleString()} per night\n` +
                    `• *Rent for ${nightsCount} Night(s):* ₹${totalRent.toLocaleString()}\n` +
                    (discountValue > 0 ? `• *Special Partner Discount:* -₹${discountValue.toLocaleString()}\n` : '') +
                    `• *Grand Total:* *₹${grandTotalAmount.toLocaleString()}*\n\n` +
                    `*Stay Inclusions:*\n` +
                    (quoteInclusions ? quoteInclusions.split(',').map(inc => `✓ ${inc.trim()}`).join('\n') : '✓ Complimentary high-speed Wi-Fi\n✓ Premium room inclusions') + `\n\n` +
                    `*Property Amenities:*\n` +
                    (selectedRoom?.amenities || selectedProp?.amenities || []).slice(0, 6).map(a => `• ${a}`).join('\n') + `\n\n` +
                    `*Location Map:*\n` +
                    `${selectedProp?.address || selectedProp?.location || ''}\n` +
                    (selectedProp?.map_url ? `🗺️ Link: ${selectedProp.map_url}` : '') + `\n\n` +
                    `To proceed with your booking or secure dates, please reply directly to this chat. We would be absolutely delighted to host you!\n\n` +
                    `Warm regards,\n` +
                    `*Partner Management Team*\n` +
                    (selectedProp?.contact_phone ? `📞 Contact: ${selectedProp.contact_phone}` : '');

                  // Sanitize phone for WA
                  const cleanPhone = (quoteGuestPhone || '').replace(/[^0-9]/g, '');
                  let formattedPhone = cleanPhone;
                  if (cleanPhone.length === 10) {
                    formattedPhone = '91' + cleanPhone; // India code by default
                  }
                  const whatsAppHref = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(whatsAppText)}`;

                  const handleReset = () => {
                    setQuoteGuestName('');
                    setQuoteGuestPhone('');
                    setQuoteCheckIn('');
                    setQuoteCheckOut('');
                    setQuoteAdults(2);
                    setQuoteChildren(0);
                    setQuoteCustomRate('');
                    setQuoteDiscount('');
                    setQuoteInclusions('Free Wi-Fi, Complementary Water, Standard Check-in Inclusions');
                  };

                  const handleCopyToClipboard = (text: string) => {
                    navigator.clipboard.writeText(text);
                    showAlert('Quotation Copied', 'The WhatsApp quotation text has been copied to your clipboard!');
                  };

                  return (
                    <div className="space-y-6 text-left animate-fade-in">
                      <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Generate Stay Quotation</h2>
                        <p className="text-xs text-slate-500">
                          Configure customized quotations with custom rates and discounts, preview the exact message template, and share instantly via WhatsApp.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* LEFT COLUMN: Inputs form */}
                        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-xs space-y-4">
                          <h3 className="text-sm font-black text-slate-800 border-b border-slate-100 pb-2">Stay Parameters</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Property</label>
                              <select
                                value={quotePropId}
                                onChange={(e) => {
                                  const nextPropId = e.target.value;
                                  setQuotePropId(nextPropId);
                                  const nextRooms = rooms.filter(r => r.property_id === nextPropId);
                                  if (nextRooms.length > 0) {
                                    setQuoteRoomId(nextRooms[0].id);
                                    setQuoteCustomRate('');
                                  } else {
                                    setQuoteRoomId('');
                                    setQuoteCustomRate('');
                                  }
                                }}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white text-slate-800"
                              >
                                {ownerProperties.map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Accommodation Floor/Room</label>
                              <select
                                value={quoteRoomId}
                                onChange={(e) => {
                                  setQuoteRoomId(e.target.value);
                                  setQuoteCustomRate(''); // Reset custom rate to use new room's default base_price
                                }}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white text-slate-800"
                              >
                                {quoteRooms.map(r => (
                                  <option key={r.id} value={r.id}>{r.name} (Base: ₹{r.base_price.toLocaleString()}/N)</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Guest Name</label>
                              <input
                                type="text"
                                placeholder="e.g. Rahul Sharma"
                                value={quoteGuestName}
                                onChange={(e) => setQuoteGuestName(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white text-slate-800"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Guest Mobile (WhatsApp Number)</label>
                              <input
                                type="text"
                                placeholder="e.g. 9876543210"
                                value={quoteGuestPhone}
                                onChange={(e) => setQuoteGuestPhone(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white text-slate-800"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Check-In Date</label>
                              <input
                                type="date"
                                value={quoteCheckIn}
                                onChange={(e) => setQuoteCheckIn(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white text-slate-800"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Check-Out Date</label>
                              <input
                                type="date"
                                value={quoteCheckOut}
                                onChange={(e) => setQuoteCheckOut(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white text-slate-800"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Guests Occupancy</label>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 px-2 py-1 rounded-lg">
                                  <span className="text-[10px] font-bold text-slate-400">Adults</span>
                                  <input
                                    type="number"
                                    min={1}
                                    value={quoteAdults}
                                    onChange={(e) => setQuoteAdults(Number(e.target.value))}
                                    className="w-full bg-transparent focus:outline-none text-xs font-black text-slate-800 text-right"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 px-2 py-1 rounded-lg">
                                  <span className="text-[10px] font-bold text-slate-400">Kids</span>
                                  <input
                                    type="number"
                                    min={0}
                                    value={quoteChildren}
                                    onChange={(e) => setQuoteChildren(Number(e.target.value))}
                                    className="w-full bg-transparent focus:outline-none text-xs font-black text-slate-800 text-right"
                                  />
                                </div>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Custom Nightly Rate (₹)</label>
                              <input
                                type="number"
                                placeholder={`Default ₹${currentBaseRate}`}
                                value={quoteCustomRate}
                                onChange={(e) => setQuoteCustomRate(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white text-slate-800"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Special Discount (₹)</label>
                              <input
                                type="number"
                                placeholder="Optional"
                                value={quoteDiscount}
                                onChange={(e) => setQuoteDiscount(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white text-slate-800"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Quotation Inclusions (Comma separated list)</label>
                            <input
                              type="text"
                              value={quoteInclusions}
                              onChange={(e) => setQuoteInclusions(e.target.value)}
                              placeholder="e.g. Wi-Fi, Morning Tea, Complimentary Swimming Pool access"
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 text-xs font-semibold focus:outline-none focus:bg-white text-slate-800"
                            />
                          </div>

                          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={handleReset}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs px-5 py-2 rounded-lg transition animate-pulse"
                            >
                              Reset Fields
                            </button>
                          </div>
                        </div>

                        {/* RIGHT COLUMN: Live calculation & message preview */}
                        <div className="lg:col-span-5 space-y-6">
                          
                          {/* Financial Summary Card */}
                          <div className="bg-gradient-to-br from-purple-900 to-indigo-950 text-white rounded-xl p-6 shadow-md relative overflow-hidden">
                            {/* Decorative background circle */}
                            <div className="absolute -right-12 -top-12 w-32 h-32 bg-purple-500/20 rounded-full blur-xl" />
                            <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-xl" />
                            
                            <div className="relative space-y-4">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-extrabold tracking-widest text-purple-200 uppercase">Live Quotation Costing</span>
                                <span className="bg-purple-800/60 text-purple-200 text-[9px] font-bold px-2 py-0.5 rounded-full border border-purple-600/30">
                                  {nightsCount} {nightsCount === 1 ? 'Night' : 'Nights'}
                                </span>
                              </div>

                              <div className="border-b border-white/10 pb-3 space-y-1">
                                <div className="flex justify-between text-xs font-medium text-purple-200">
                                  <span>Nightly Room Rent:</span>
                                  <span>₹{finalNightlyRate.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-xs font-semibold text-white pt-1">
                                  <span>Room Rent Subtotal ({nightsCount} nights):</span>
                                  <span>₹{totalRent.toLocaleString()}</span>
                                </div>
                                {discountValue > 0 && (
                                  <div className="flex justify-between text-xs font-medium text-emerald-400">
                                    <span>Special Partner Discount:</span>
                                    <span>-₹{discountValue.toLocaleString()}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex justify-between items-end pt-1">
                                <span className="text-xs font-bold text-purple-200">Quote Grand Total:</span>
                                <span className="text-2xl font-black text-white tracking-tight">
                                  ₹{grandTotalAmount.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* WhatsApp Template Live Preview */}
                          <div className="bg-slate-100 border border-slate-200 rounded-xl p-5 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">WhatsApp Message Preview</span>
                              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                Draft Formatted
                              </span>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-lg p-3.5 h-64 overflow-y-auto text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed shadow-inner">
                              {whatsAppText}
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-1">
                              <button
                                type="button"
                                onClick={() => handleCopyToClipboard(whatsAppText)}
                                className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs py-2.5 px-3 rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>Copy Text</span>
                              </button>

                              <a
                                href={whatsAppHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-3 rounded-lg transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-center"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Send WhatsApp</span>
                              </a>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* TAB 7: GST INVOICES */}
                {ownerTab === 'invoices' && (() => {
                  // Filter invoices scoped to the owner's properties
                  const ownerPropIds = ownerProperties.map(p => p.id);
                  const ownerInvoices = invoices.filter(inv => ownerPropIds.includes(inv.property_id));
                  const ownerInvoicesBookings = bookings.filter(b => {
                    const r = rooms.find(room => room.id === b.room_id);
                    return r && ownerPropIds.includes(r.property_id);
                  });

                  // Filters (Aliased to top-level states to adhere to React Rules of Hooks)
                  const searchQuery = invoiceSearchQuery;
                  const setSearchQuery = setInvoiceSearchQuery;
                  const selectedFilterProp = invoiceFilterProp;
                  const setSelectedFilterProp = setInvoiceFilterProp;

                  const filteredInvoices = ownerInvoices.filter(inv => {
                    const matchesSearch = 
                      inv.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      inv.guest_phone.includes(searchQuery) ||
                      inv.room_name.toLowerCase().includes(searchQuery.toLowerCase());
                    
                    const matchesProp = selectedFilterProp === 'all' || inv.property_id === selectedFilterProp;

                    return matchesSearch && matchesProp;
                  });

                  // Stats calculations
                  const totalInvoiced = filteredInvoices
                    .filter(inv => inv.status !== 'Cancelled')
                    .reduce((sum, inv) => sum + inv.base_amount, 0);

                  const totalGstCollected = filteredInvoices
                    .filter(inv => inv.status !== 'Cancelled')
                    .reduce((sum, inv) => sum + inv.total_gst, 0);

                  const totalGrandRevenue = filteredInvoices
                    .filter(inv => inv.status !== 'Cancelled')
                    .reduce((sum, inv) => sum + inv.grand_total, 0);

                  const handleCancelInvoice = (invId: string) => {
                    setConfirmModal({
                      isOpen: true,
                      title: 'Cancel Invoice?',
                      message: `Are you sure you want to cancel the GST Invoice ${invId}? The invoice status will be marked as Cancelled.`,
                      onConfirm: () => {
                        setInvoices(prev => prev.map(inv => inv.id === invId ? { ...inv, status: 'Cancelled' } : inv));
                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                        showAlert('Invoice Cancelled', `Invoice ${invId} has been successfully cancelled.`);
                      },
                      isAlert: false
                    });
                  };

                  const handleDeleteInvoice = (invId: string) => {
                    setConfirmModal({
                      isOpen: true,
                      title: 'Delete Invoice?',
                      message: `Are you sure you want to permanently delete the GST Invoice ${invId}? This action cannot be undone.`,
                      onConfirm: () => {
                        setInvoices(prev => prev.filter(inv => inv.id !== invId));
                        setConfirmModal(prev => ({ ...prev, isOpen: false }));
                        showAlert('Invoice Deleted', `Invoice ${invId} has been deleted.`);
                      },
                      isAlert: false
                    });
                  };

                  const handleSaveManualInvoice = (e: React.FormEvent) => {
                    e.preventDefault();
                    if (!customInvPropId || !customInvGuestName || !customInvCheckIn || !customInvCheckOut || !customInvBaseAmount) {
                      showAlert('Error', 'Please fill in all the required invoice parameters.');
                      return;
                    }

                    const selectedProp = ownerProperties.find(p => p.id === customInvPropId);
                    if (!selectedProp) {
                      showAlert('Error', 'Selected property not found.');
                      return;
                    }

                    const baseAmt = parseFloat(customInvBaseAmount);
                    if (isNaN(baseAmt) || baseAmt <= 0) {
                      showAlert('Error', 'Please enter a valid base amount.');
                      return;
                    }

                    // Calculate nights
                    const d1 = new Date(customInvCheckIn);
                    const d2 = new Date(customInvCheckOut);
                    let nightsCount = 1;
                    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
                      const diff = d2.getTime() - d1.getTime();
                      if (diff > 0) {
                        nightsCount = Math.ceil(diff / (1000 * 60 * 60 * 24));
                      }
                    }

                    const gstPct = parseFloat(customInvGstPercent) || 18;
                    const halfGst = gstPct / 2;
                    const gstAmount = baseAmt * (gstPct / 100);
                    const grandTotalVal = baseAmt + gstAmount;

                    const newInvId = `GST-2026-${String(invoices.length + 1).padStart(4, '0')}`;

                    const newInvoice: GSTInvoice = {
                      id: newInvId,
                      booking_id: null,
                      guest_name: customInvGuestName,
                      guest_phone: customInvGuestPhone,
                      guest_email: customInvGuestEmail,
                      guest_gstin: customInvGuestGstin || undefined,
                      billing_address: customInvBillingAddress || undefined,
                      property_id: customInvPropId,
                      property_name: selectedProp.name,
                      room_name: customInvRoomName || 'Premium Stay Service',
                      check_in: customInvCheckIn,
                      check_out: customInvCheckOut,
                      nights: nightsCount,
                      hsn_code: '9963',
                      base_amount: baseAmt,
                      cgst_rate: halfGst,
                      sgst_rate: halfGst,
                      cgst_amount: gstAmount / 2,
                      sgst_amount: gstAmount / 2,
                      total_gst: gstAmount,
                      grand_total: grandTotalVal,
                      invoice_date: new Date().toISOString().split('T')[0],
                      status: customInvStatus,
                      owner_gstin: customInvOwnerGstin || undefined
                    };

                    setInvoices(prev => [newInvoice, ...prev]);
                    setShowCreateInvoiceForm(false);
                    showAlert('GST Invoice Generated', `Invoice ${newInvId} has been successfully registered and generated!`);

                    // Reset form fields
                    setCustomInvRoomName('');
                    setCustomInvGuestName('');
                    setCustomInvGuestPhone('');
                    setCustomInvGuestEmail('');
                    setCustomInvGuestGstin('');
                    setCustomInvBillingAddress('');
                    setCustomInvCheckIn('');
                    setCustomInvCheckOut('');
                    setCustomInvBaseAmount('');
                    setCustomInvGstPercent('18');
                  };

                  return (
                    <div className="space-y-6 text-left animate-fade-in">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-purple-600" />
                            <span>GST Invoice Ledger</span>
                          </h2>
                          <p className="text-xs text-slate-500">
                            Create, manage, and print legally compliant GST invoices for hotel/villa accommodation bookings.
                          </p>
                        </div>

                        {!showCreateInvoiceForm && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowCreateInvoiceForm(true);
                              if (ownerProperties.length > 0) {
                                setCustomInvPropId(ownerProperties[0].id);
                              }
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2 px-4 rounded-lg transition shadow-md flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
                          >
                            <PlusCircle className="w-4 h-4" />
                            <span>Create Manual GST Invoice</span>
                          </button>
                        )}
                      </div>

                      {/* INLINE CUSTOM INVOICE CREATION FORM */}
                      {showCreateInvoiceForm && (
                        <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 shadow-sm space-y-4 animate-slide-in">
                          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-black text-slate-800">New GST Invoice Parameters</h3>
                            <button
                              type="button"
                              onClick={() => setShowCreateInvoiceForm(false)}
                              className="text-xs font-bold text-slate-400 hover:text-slate-600 transition"
                            >
                              Cancel
                            </button>
                          </div>

                          <form onSubmit={handleSaveManualInvoice} className="space-y-4 text-xs font-semibold text-slate-700">
                            {ownerInvoicesBookings.length > 0 && (
                              <div className="bg-purple-50 border border-purple-100 p-3.5 rounded-xl space-y-1.5 shadow-xs">
                                <label className="block text-[10px] font-bold text-purple-600 uppercase tracking-wider">Pre-fill details from active booking (Optional)</label>
                                <select
                                  onChange={(e) => {
                                    const bId = e.target.value;
                                    if (!bId) return;
                                    const selectedBooking = bookings.find(b => b.id === bId);
                                    if (selectedBooking) {
                                      const roomObj = rooms.find(r => r.id === selectedBooking.room_id);
                                      const guestObj = guests.find(g => g.id === selectedBooking.guest_id);
                                      if (roomObj) {
                                        setCustomInvPropId(roomObj.property_id);
                                        setCustomInvRoomName(roomObj.name);
                                      }
                                      if (guestObj) {
                                        setCustomInvGuestName(guestObj.name);
                                        setCustomInvGuestPhone(guestObj.phone);
                                        setCustomInvGuestEmail(guestObj.email);
                                      }
                                      setCustomInvCheckIn(selectedBooking.check_in);
                                      setCustomInvCheckOut(selectedBooking.check_out);
                                      setCustomInvBaseAmount(String(selectedBooking.total_amount));
                                    }
                                  }}
                                  className="w-full bg-white border border-purple-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-purple-400 text-purple-950 font-semibold cursor-pointer"
                                >
                                  <option value="">-- Choose a booking to auto-fill --</option>
                                  {ownerInvoicesBookings.map(b => {
                                    const guestObj = guests.find(g => g.id === b.guest_id);
                                    const roomObj = rooms.find(r => r.id === b.room_id);
                                    const propObj = properties.find(p => p.id === roomObj?.property_id);
                                    return (
                                      <option key={b.id} value={b.id}>
                                        {guestObj?.name || 'Guest'} - {propObj?.name} ({roomObj?.name}) - ₹{b.total_amount.toLocaleString()} ({b.check_in})
                                      </option>
                                    );
                                  })}
                                </select>
                                <p className="text-[10px] text-slate-400 font-semibold">
                                  Selecting a booking automatically pre-fills all guest and check-in / check-out details.
                                </p>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Select Property *</label>
                                <select
                                  value={customInvPropId}
                                  onChange={(e) => setCustomInvPropId(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 focus:outline-none focus:bg-white text-slate-800 font-semibold"
                                  required
                                >
                                  {ownerProperties.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Accommodation / Room Type *</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Ground Floor Deluxe"
                                  value={customInvRoomName}
                                  onChange={(e) => setCustomInvRoomName(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 focus:outline-none focus:bg-white text-slate-800 font-semibold"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Owner Business GSTIN</label>
                                <input
                                  type="text"
                                  placeholder="e.g. 07AAAAA2222B2Z2"
                                  value={customInvOwnerGstin}
                                  onChange={(e) => setCustomInvOwnerGstin(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 focus:outline-none focus:bg-white text-slate-800 font-semibold"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-50 pt-4">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Guest Name *</label>
                                <input
                                  type="text"
                                  placeholder="Amit Sharma"
                                  value={customInvGuestName}
                                  onChange={(e) => setCustomInvGuestName(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 focus:outline-none focus:bg-white text-slate-800 font-semibold"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Guest Phone</label>
                                <input
                                  type="text"
                                  placeholder="9876543210"
                                  value={customInvGuestPhone}
                                  onChange={(e) => setCustomInvGuestPhone(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 focus:outline-none focus:bg-white text-slate-800 font-semibold"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Guest Email</label>
                                <input
                                  type="email"
                                  placeholder="guest@gmail.com"
                                  value={customInvGuestEmail}
                                  onChange={(e) => setCustomInvGuestEmail(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 focus:outline-none focus:bg-white text-slate-800 font-semibold"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Guest GSTIN (Taxpayer Registration)</label>
                                <input
                                  type="text"
                                  placeholder="e.g. 24AAAAA1111A1Z1"
                                  value={customInvGuestGstin}
                                  onChange={(e) => setCustomInvGuestGstin(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 focus:outline-none focus:bg-white text-slate-800 font-semibold"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Billing Address</label>
                                <input
                                  type="text"
                                  placeholder="Full Business Billing Address"
                                  value={customInvBillingAddress}
                                  onChange={(e) => setCustomInvBillingAddress(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 focus:outline-none focus:bg-white text-slate-800 font-semibold"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-slate-50 pt-4">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Check-In Date *</label>
                                <input
                                  type="date"
                                  value={customInvCheckIn}
                                  onChange={(e) => setCustomInvCheckIn(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 focus:outline-none focus:bg-white text-slate-800 font-semibold"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Check-Out Date *</label>
                                <input
                                  type="date"
                                  value={customInvCheckOut}
                                  onChange={(e) => setCustomInvCheckOut(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 focus:outline-none focus:bg-white text-slate-800 font-semibold"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Taxable Base Amount (₹) *</label>
                                <input
                                  type="number"
                                  placeholder="e.g. 50000"
                                  value={customInvBaseAmount}
                                  onChange={(e) => setCustomInvBaseAmount(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 focus:outline-none focus:bg-white text-slate-800 font-semibold"
                                  required
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">GST Tax Category (%) *</label>
                                <select
                                  value={customInvGstPercent}
                                  onChange={(e) => setCustomInvGstPercent(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 focus:outline-none focus:bg-white text-slate-800 font-semibold"
                                  required
                                >
                                  <option value="18">18% (Standard Luxury Lodging)</option>
                                  <option value="12">12% (Standard Hotel Lodging)</option>
                                  <option value="5">5% (Budget Homestay/Lodging)</option>
                                  <option value="28">28% (Super Luxury/Resort)</option>
                                </select>
                              </div>
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Initial Invoice Status</label>
                                <div className="flex gap-4">
                                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
                                    <input
                                      type="radio"
                                      checked={customInvStatus === 'Paid'}
                                      onChange={() => setCustomInvStatus('Paid')}
                                      className="accent-purple-600"
                                    />
                                    <span>Paid / Settled</span>
                                  </label>
                                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
                                    <input
                                      type="radio"
                                      checked={customInvStatus === 'Unpaid'}
                                      onChange={() => setCustomInvStatus('Unpaid')}
                                      className="accent-purple-600"
                                    />
                                    <span>Unpaid / Draft Invoice</span>
                                  </label>
                                </div>
                              </div>

                              <div className="flex gap-3">
                                <button
                                  type="button"
                                  onClick={() => setShowCreateInvoiceForm(false)}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs px-5 py-2.5 rounded-lg transition"
                                >
                                  Discard
                                </button>
                                <button
                                  type="submit"
                                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition shadow-md"
                                >
                                  Register Invoice
                                </button>
                              </div>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* STATS OVERVIEW */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Invoices</span>
                          <p className="text-xl font-black text-slate-800 mt-1">{filteredInvoices.length}</p>
                          <p className="text-[10px] text-slate-400 mt-1">Generated and active records</p>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Taxable Rent Amount</span>
                          <p className="text-xl font-black text-slate-800 mt-1">₹{totalInvoiced.toLocaleString()}</p>
                          <p className="text-[10px] text-purple-600 mt-1">Exclusive of GST levies</p>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GST Collected (CGST+SGST)</span>
                          <p className="text-xl font-black text-slate-800 mt-1">₹{totalGstCollected.toLocaleString()}</p>
                          <p className="text-[10px] text-emerald-600 mt-1">To be filed in quarterly GSTR</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-900 to-indigo-950 text-white rounded-xl p-4 shadow-md relative overflow-hidden">
                          <span className="text-[10px] font-bold text-purple-200 uppercase tracking-wider relative z-10">Total Billing Revenue</span>
                          <p className="text-xl font-black text-white mt-1 relative z-10">₹{totalGrandRevenue.toLocaleString()}</p>
                          <p className="text-[10px] text-purple-200 mt-1 relative z-10">Inclusive of all tax assessments</p>
                          <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-purple-500/20 rounded-full blur-lg" />
                        </div>
                      </div>

                      {/* FILTERS & SEARCH */}
                      <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="w-full md:w-72 relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by Guest, Invoice #, Room..."
                            className="w-full bg-white border border-slate-300 rounded-lg py-1.5 pl-9 pr-4 text-xs font-semibold focus:outline-none text-slate-800 shadow-sm"
                          />
                        </div>

                        <div className="flex gap-3 self-end sm:self-center">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase">Property:</span>
                            <select
                              value={selectedFilterProp}
                              onChange={(e) => setSelectedFilterProp(e.target.value)}
                              className="bg-white border border-slate-300 rounded-lg py-1 px-2.5 text-xs font-bold text-slate-700 focus:outline-none"
                            >
                              <option value="all">All Properties</option>
                              {ownerProperties.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* INVOICES LIST TABLE */}
                      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                        {filteredInvoices.length === 0 ? (
                          <div className="p-12 text-center text-slate-400 font-semibold text-xs space-y-2">
                            <div className="text-3xl">🧾</div>
                            <p>No GST Invoices found in ledger.</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold text-[9px] uppercase tracking-wider">
                                  <th className="p-3">Invoice # / Date</th>
                                  <th className="p-3">Recipient Guest Details</th>
                                  <th className="p-3">Stay & Location</th>
                                  <th className="p-3">Taxable Rent</th>
                                  <th className="p-3">GST Component</th>
                                  <th className="p-3">Grand Total</th>
                                  <th className="p-3">Status</th>
                                  <th className="p-3 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                                {filteredInvoices.map(inv => {
                                  let statusClass = 'bg-slate-100 text-slate-600 border border-slate-200';
                                  if (inv.status === 'Paid') statusClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                                  if (inv.status === 'Unpaid') statusClass = 'bg-amber-50 text-amber-700 border border-amber-200';
                                  if (inv.status === 'Cancelled') statusClass = 'bg-rose-50 text-rose-700 border border-rose-200';

                                  return (
                                    <tr key={inv.id} className="hover:bg-slate-50/50">
                                      <td className="p-3 space-y-0.5">
                                        <p className="font-bold text-slate-800 text-[11px]">{inv.id}</p>
                                        <p className="text-[10px] text-slate-400">{inv.invoice_date}</p>
                                        {inv.booking_id && (
                                          <span className="inline-block bg-slate-100 text-slate-500 text-[9px] font-bold px-1 rounded">
                                            Ref: {inv.booking_id}
                                          </span>
                                        )}
                                      </td>

                                      <td className="p-3 space-y-0.5">
                                        <p className="font-black text-slate-900">{inv.guest_name}</p>
                                        {inv.guest_gstin && (
                                          <p className="text-[10px] text-purple-600 font-extrabold">GSTIN: {inv.guest_gstin}</p>
                                        )}
                                        <p className="text-[10px] text-slate-400">{inv.guest_phone || inv.guest_email}</p>
                                      </td>

                                      <td className="p-3">
                                        <p className="text-slate-800 font-bold">{inv.room_name}</p>
                                        <p className="text-[10px] text-slate-400">{inv.property_name}</p>
                                        <span className="inline-block text-[9px] bg-indigo-50 text-indigo-700 px-1 py-0.5 rounded font-extrabold mt-1">
                                          {inv.check_in} to {inv.check_out} ({inv.nights} N)
                                        </span>
                                      </td>

                                      <td className="p-3 text-slate-800 font-bold">
                                        ₹{inv.base_amount.toLocaleString()}
                                      </td>

                                      <td className="p-3 space-y-0.5 text-[10px]">
                                        <p className="text-slate-700">CGST ({inv.cgst_rate}%): ₹{inv.cgst_amount.toLocaleString()}</p>
                                        <p className="text-slate-700">SGST ({inv.sgst_rate}%): ₹{inv.sgst_amount.toLocaleString()}</p>
                                        <span className="inline-block bg-purple-50 text-purple-700 px-1 py-0.5 rounded font-extrabold text-[9px]">
                                          Total GST: ₹{inv.total_gst.toLocaleString()}
                                        </span>
                                      </td>

                                      <td className="p-3 font-black text-slate-900 text-sm">
                                        ₹{inv.grand_total.toLocaleString()}
                                      </td>

                                      <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold inline-block uppercase ${statusClass}`}>
                                          {inv.status}
                                        </span>
                                      </td>

                                      <td className="p-3 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSelectedInvoice(inv);
                                              setShowInvoiceModal(true);
                                            }}
                                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 hover:text-indigo-700 rounded-md transition flex items-center justify-center gap-1 font-bold text-[10px] px-2.5 py-1.5 cursor-pointer"
                                            title="View / Print Tax Invoice"
                                          >
                                            <Eye className="w-3.5 h-3.5" />
                                            <span>View</span>
                                          </button>

                                          {inv.status !== 'Cancelled' && (
                                            <button
                                              type="button"
                                              onClick={() => handleCancelInvoice(inv.id)}
                                              className="p-1 hover:bg-rose-50 text-rose-500 hover:text-rose-700 rounded-md transition cursor-pointer"
                                              title="Cancel / Void Invoice"
                                            >
                                              <XCircle className="w-4 h-4" />
                                            </button>
                                          )}

                                          <button
                                            type="button"
                                            onClick={() => handleDeleteInvoice(inv.id)}
                                            className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-md transition cursor-pointer"
                                            title="Delete Invoice Record"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>
          )
        )}

      </main>

      {/* 1. GENERATE GST INVOICE FROM RESERVATION MODAL */}
      {showGenInvoiceModal && genInvoiceBooking && (() => {
        const guest = guests.find(g => g.id === genInvoiceBooking.guest_id);
        const rm = rooms.find(r => r.id === genInvoiceBooking.room_id);
        const prop = properties.find(p => p.id === rm?.property_id);

        // Aliased to top-level states to adhere to React Rules of Hooks
        const gstPct = genInvoiceGstPct;
        const setGstPct = setGenInvoiceGstPct;
        const taxTreatment = genInvoiceTaxTreatment;
        const setTaxTreatment = setGenInvoiceTaxTreatment;

        const basePrice = genInvoiceBooking.total_amount;
        
        // Calculations
        let baseAmount = basePrice;
        let totalGst = basePrice * 0.18;
        let grandTotal = basePrice + totalGst;

        const gstPercentVal = parseFloat(gstPct) || 18;

        if (taxTreatment === 'inclusive') {
          grandTotal = basePrice;
          baseAmount = basePrice / (1 + (gstPercentVal / 100));
          totalGst = grandTotal - baseAmount;
        } else {
          baseAmount = basePrice;
          totalGst = basePrice * (gstPercentVal / 100);
          grandTotal = basePrice + totalGst;
        }

        const handleGenerate = (e: React.FormEvent) => {
          e.preventDefault();
          if (!prop) {
            showAlert('Error', 'Property not found for this booking.');
            return;
          }

          const newInvId = `GST-2026-${String(invoices.length + 1).padStart(4, '0')}`;
          
          // Calculate nights
          const d1 = new Date(genInvoiceBooking.check_in);
          const d2 = new Date(genInvoiceBooking.check_out);
          let nightsCount = 1;
          if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
            const diff = d2.getTime() - d1.getTime();
            if (diff > 0) {
              nightsCount = Math.ceil(diff / (1000 * 60 * 60 * 24));
            }
          }

          const newInvoice: GSTInvoice = {
            id: newInvId,
            booking_id: genInvoiceBooking.id,
            guest_name: guest?.name || 'Anonymous Guest',
            guest_phone: guest?.phone || '',
            guest_email: guest?.email || '',
            guest_gstin: genInvoiceGstin || undefined,
            billing_address: genInvoiceBillingAddress || undefined,
            property_id: prop.id,
            property_name: prop.name,
            room_name: rm?.name || 'Accommodation Stay',
            check_in: genInvoiceBooking.check_in,
            check_out: genInvoiceBooking.check_out,
            nights: nightsCount,
            hsn_code: '9963',
            base_amount: Math.round(baseAmount * 100) / 100,
            cgst_rate: gstPercentVal / 2,
            sgst_rate: gstPercentVal / 2,
            cgst_amount: Math.round((totalGst / 2) * 100) / 100,
            sgst_amount: Math.round((totalGst / 2) * 100) / 100,
            total_gst: Math.round(totalGst * 100) / 100,
            grand_total: Math.round(grandTotal * 100) / 100,
            invoice_date: new Date().toISOString().split('T')[0],
            status: 'Paid',
            owner_gstin: genInvoiceOwnerGstin || undefined
          };

          setInvoices(prev => [newInvoice, ...prev]);
          setShowGenInvoiceModal(false);
          showAlert('GST Invoice Generated Successfully', `GST Invoice ${newInvId} has been successfully generated for ${guest?.name || 'Guest'} and added to your Invoices section!`);
          
          // Ask to view the invoice immediately
          setSelectedInvoice(newInvoice);
          setShowInvoiceModal(true);
        };

        return (
          <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs text-left">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="h-1.5 w-full bg-purple-600" />
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                      <Receipt className="w-5 h-5 text-purple-600" />
                      <span>Generate GST Invoice from Booking</span>
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold">
                      Assess taxes and generate official invoices for stays.
                    </p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowGenInvoiceModal(false)}
                    className="text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-600 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400">Guest Name:</span>
                    <span className="font-extrabold text-slate-800">{guest?.name || 'Anonymous'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400">Stay Location:</span>
                    <span className="font-semibold">{prop?.name} ({rm?.name})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400">Dates:</span>
                    <span className="font-semibold">{genInvoiceBooking.check_in} to {genInvoiceBooking.check_out}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200/60 pt-1.5">
                    <span className="font-bold text-slate-400">Total Charged:</span>
                    <span className="font-black text-purple-700 text-sm">₹{genInvoiceBooking.total_amount.toLocaleString()}</span>
                  </div>
                </div>

                <form onSubmit={handleGenerate} className="space-y-3.5 text-xs font-semibold text-slate-707">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Guest GSTIN (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. 24AAAAA1111A1Z1"
                        value={genInvoiceGstin}
                        onChange={(e) => setGenInvoiceGstin(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 focus:outline-none focus:bg-white text-slate-800 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Billing Address (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Gujarat, India"
                        value={genInvoiceBillingAddress}
                        onChange={(e) => setGenInvoiceBillingAddress(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 focus:outline-none focus:bg-white text-slate-800 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Owner GSTIN (Business registration)</label>
                      <input
                        type="text"
                        placeholder="e.g. 07AAAAA2222B2Z2"
                        value={genInvoiceOwnerGstin}
                        onChange={(e) => setGenInvoiceOwnerGstin(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 focus:outline-none focus:bg-white text-slate-800 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">GST Tax Slab</label>
                      <select
                        value={gstPct}
                        onChange={(e) => setGstPct(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-3 focus:outline-none focus:bg-white text-slate-800 font-semibold"
                      >
                        <option value="18">18% GST (Standard Luxury Villa)</option>
                        <option value="12">12% GST (Standard Hotel Room)</option>
                        <option value="5">5% GST (Standard Budget Stay)</option>
                        <option value="28">28% GST (Super Luxury Suite)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50 border border-indigo-100/60 rounded-xl space-y-2">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Tax Assessment Method</span>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
                        <input
                          type="radio"
                          checked={taxTreatment === 'inclusive'}
                          onChange={() => setTaxTreatment('inclusive')}
                          className="accent-purple-600"
                        />
                        <span>Inclusive (Price includes GST)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
                        <input
                          type="radio"
                          checked={taxTreatment === 'exclusive'}
                          onChange={() => setTaxTreatment('exclusive')}
                          className="accent-purple-600"
                        />
                        <span>Exclusive (Add GST on top)</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-indigo-100 text-[10px] font-bold text-slate-505">
                      <div>
                        <span>Taxable Value</span>
                        <p className="text-slate-800 font-extrabold text-xs">₹{Math.round(baseAmount).toLocaleString()}</p>
                      </div>
                      <div>
                        <span>GST ({gstPct}%)</span>
                        <p className="text-purple-700 font-extrabold text-xs">₹{Math.round(totalGst).toLocaleString()}</p>
                      </div>
                      <div>
                        <span>Grand Total</span>
                        <p className="text-emerald-700 font-extrabold text-xs">₹{Math.round(grandTotal).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowGenInvoiceModal(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs px-4 py-2.5 rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition shadow-md"
                    >
                      Generate & Print Tax Invoice
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 2. PRINTABLE / SHARABLE GST TAX INVOICE RECEIPT MODAL */}
      {showInvoiceModal && selectedInvoice && (() => {
        // Simple helper function to convert number to words for invoice authenticity
        const numberToWords = (num: number): string => {
          if (num === 0) return 'Rupees Zero Only';
          const a = [
            '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
            'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
          ];
          const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
          
          function g(n: number): string {
            if (n < 20) return a[n];
            const digit = n % 10;
            return b[Math.floor(n / 10)] + (digit ? ' ' + a[digit] : '');
          }
          
          function c(n: number): string {
            if (n < 100) return g(n);
            return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + g(n % 100) : '');
          }
          
          let rem = Math.floor(num);
          let words = '';
          
          if (Math.floor(rem / 10000000) > 0) {
            words += c(Math.floor(rem / 10000000)) + ' Crore ';
            rem %= 10000000;
          }
          if (Math.floor(rem / 100000) > 0) {
            words += c(Math.floor(rem / 100000)) + ' Lakh ';
            rem %= 100000;
          }
          if (Math.floor(rem / 1000) > 0) {
            words += c(Math.floor(rem / 1000)) + ' Thousand ';
            rem %= 1000;
          }
          if (rem > 0) {
            words += c(rem);
          }
          
          return 'Rupees ' + words.trim() + ' Only';
        };

        const rupeeWords = numberToWords(selectedInvoice.grand_total);

        // Prefilled WhatsApp message with tax compliance details
        const waText = `Hello ${selectedInvoice.guest_name},\n\nHope you had a wonderful stay at our property!\n\nPlease find the details of your Tax Invoice *${selectedInvoice.id}* below:\n\n🏨 Property: *${selectedInvoice.property_name}*\n🛏️ Category: *${selectedInvoice.room_name}*\n📅 Dates: ${selectedInvoice.check_in} to ${selectedInvoice.check_out} (${selectedInvoice.nights} Nights)\n\n💰 Taxable Stay Value: ₹${selectedInvoice.base_amount.toLocaleString()}\n📈 GST levied: ₹${selectedInvoice.total_gst.toLocaleString()} (${(selectedInvoice.cgst_rate + selectedInvoice.sgst_rate)}% CGST+SGST)\n💵 Grand Total: *₹${selectedInvoice.grand_total.toLocaleString()}*\n📌 Status: *${selectedInvoice.status}*\n\nThank you for choosing us! Let us know if you need any assistance.\n\nWarm regards,\n*Ambermoon Team*`;

        const waHref = `https://api.whatsapp.com/send?phone=${selectedInvoice.guest_phone || ''}&text=${encodeURIComponent(waText)}`;

        const handlePrint = () => {
          window.print();
        };

        return (
          <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs text-left overflow-y-auto">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
              {/* Toolbar */}
              <div className="bg-slate-100 border-b border-slate-200 py-3 px-6 flex justify-between items-center print:hidden">
                <span className="text-xs font-bold text-slate-505 uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-4 h-4 text-purple-600" />
                  <span>GST Invoice Preview</span>
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-[11px] py-1.5 px-3 rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Print / Save PDF</span>
                  </button>

                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg transition shadow-md flex items-center gap-1 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Guest</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setShowInvoiceModal(false);
                      setSelectedInvoice(null);
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-slate-600 transition ml-2 py-1.5 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Printable Invoice Container */}
              <div className="p-8 space-y-6 bg-white text-slate-800 text-xs font-medium" id="printable-gst-invoice">
                {/* Header Section */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                  <div className="space-y-1.5">
                    <span className="text-sm font-black text-indigo-900 uppercase tracking-widest">AMBERMOON HOMESTAYS</span>
                    <h1 className="text-xl font-black text-slate-800 tracking-tight">TAX INVOICE</h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Original for Recipient</p>
                  </div>

                  <div className="text-right space-y-1">
                    <p className="font-extrabold text-slate-800">Invoice No: {selectedInvoice.id}</p>
                    <p className="text-[10px] text-slate-505">Date: {selectedInvoice.invoice_date}</p>
                    <p className="text-[10px] text-slate-505">HSN Code: {selectedInvoice.hsn_code} (Accommodation)</p>
                  </div>
                </div>

                {/* Sender & Recipient addresses */}
                <div className="grid grid-cols-2 gap-8 border-b border-slate-100 pb-5">
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Service Provider (Issuer)</p>
                    <p className="font-black text-slate-900">{selectedInvoice.property_name}</p>
                    <p className="text-slate-505 leading-relaxed text-[11px]">
                      {selectedInvoice.property_name} Villa Resort Area,<br />
                      Partner Luxury Lodging Suite, India.
                    </p>
                    {selectedInvoice.owner_gstin && (
                      <p className="text-[11px] text-indigo-900 font-black pt-1">
                        GSTIN: {selectedInvoice.owner_gstin}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Billed To (Recipient)</p>
                    <p className="font-black text-slate-900">{selectedInvoice.guest_name}</p>
                    <p className="text-slate-505 text-[11px]">
                      Phone: {selectedInvoice.guest_phone || 'N/A'}<br />
                      Email: {selectedInvoice.guest_email || 'N/A'}
                    </p>
                    {selectedInvoice.billing_address && (
                      <p className="text-slate-505 text-[11px] leading-relaxed">
                        Address: {selectedInvoice.billing_address}
                      </p>
                    )}
                    {selectedInvoice.guest_gstin && (
                      <p className="text-[11px] text-emerald-700 font-black pt-1">
                        GSTIN: {selectedInvoice.guest_gstin}
                      </p>
                    )}
                  </div>
                </div>

                {/* Stay Description Details Table */}
                <div>
                  <table className="w-full text-left border-collapse border border-slate-200">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200 text-[9px] uppercase tracking-wider">
                        <th className="p-2 border-r border-slate-200">Accommodation Service Description</th>
                        <th className="p-2 border-r border-slate-200 text-center">Nights</th>
                        <th className="p-2 border-r border-slate-200 text-right">Taxable Value</th>
                        <th className="p-2 border-r border-slate-200 text-right">CGST</th>
                        <th className="p-2 border-r border-slate-200 text-right">SGST</th>
                        <th className="p-2 text-right">Total (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-[11px] text-slate-700">
                      <tr>
                        <td className="p-2.5 border-r border-slate-200 font-bold space-y-1">
                          <p>{selectedInvoice.room_name} Stay Service</p>
                          <p className="text-[10px] text-slate-400 font-semibold">
                            Stay Period: {selectedInvoice.check_in} to {selectedInvoice.check_out}
                          </p>
                        </td>
                        <td className="p-2.5 border-r border-slate-200 text-center font-bold">
                          {selectedInvoice.nights}
                        </td>
                        <td className="p-2.5 border-r border-slate-200 text-right font-bold">
                          ₹{selectedInvoice.base_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-2.5 border-r border-slate-200 text-right text-[10px]">
                          <p>₹{selectedInvoice.cgst_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          <p className="text-[9px] text-slate-400 font-bold">({selectedInvoice.cgst_rate}%)</p>
                        </td>
                        <td className="p-2.5 border-r border-slate-200 text-right text-[10px]">
                          <p>₹{selectedInvoice.sgst_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          <p className="text-[9px] text-slate-400 font-bold">({selectedInvoice.sgst_rate}%)</p>
                        </td>
                        <td className="p-2.5 text-right font-black text-slate-900">
                          ₹{selectedInvoice.grand_total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Subtotal Breakdowns and Words */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Amount Chargeable in Words</span>
                    <p className="font-extrabold text-indigo-950 text-[11px] leading-relaxed">
                      {rupeeWords}
                    </p>
                  </div>

                  <div className="space-y-2 text-slate-600 font-bold">
                    <div className="flex justify-between text-[11px]">
                      <span>Taxable Value (Subtotal):</span>
                      <span className="font-black text-slate-800">₹{selectedInvoice.base_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span>Central Tax (CGST):</span>
                      <span className="font-black text-slate-800">₹{selectedInvoice.cgst_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span>State Tax (SGST):</span>
                      <span className="font-black text-slate-800">₹{selectedInvoice.sgst_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-black text-slate-900">
                      <span>Grand Total (INR):</span>
                      <span className="text-purple-800 font-black">₹{selectedInvoice.grand_total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Legal compliance footer signature */}
                <div className="pt-8 border-t border-slate-200 flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Status & Terms</p>
                    <p className="text-emerald-700 font-extrabold uppercase text-[10px] flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-block">
                      <span>●</span> {selectedInvoice.status} / RECEIVED IN FULL
                    </p>
                    <p className="text-[9px] text-slate-400 italic">This is a computer-generated invoice. No physical signature is required.</p>
                  </div>

                  <div className="text-right space-y-4">
                    <div className="h-10 w-24 border-b border-slate-300 font-mono text-[9px] text-slate-400 text-center flex items-end justify-center">
                      [Computer Generated]
                    </div>
                    <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Authorized Signatory</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* CUSTOM CONFIRM & ALERT MODAL (iframe safe) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs transition-opacity duration-300">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform scale-100 transition-all duration-300 animate-in fade-in zoom-in-95 duration-150" id="custom_confirm_modal">
            {/* Header / Accent Bar */}
            <div className={`h-1.5 w-full ${confirmModal.isAlert ? 'bg-amber-500' : 'bg-rose-500'}`} />
            
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl flex-shrink-0 ${confirmModal.isAlert ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                  {confirmModal.isAlert ? (
                    <AlertCircle className="w-6 h-6" />
                  ) : (
                    <Trash2 className="w-6 h-6" />
                  )}
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-slate-800 tracking-tight">
                    {confirmModal.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    {confirmModal.message}
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                {!confirmModal.isAlert && (
                  <button
                    type="button"
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
                    id="confirm_modal_cancel"
                  >
                    {confirmModal.cancelText || 'Cancel'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className={`font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-sm text-white cursor-pointer ${
                    confirmModal.isAlert
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                  id="confirm_modal_confirm"
                >
                  {confirmModal.confirmText || (confirmModal.isAlert ? 'OK' : 'Confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
