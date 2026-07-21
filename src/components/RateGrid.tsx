import React, { useState, useEffect } from 'react';
import { Calendar, Save, ShieldAlert, Check, RefreshCw, ChevronLeft, ChevronRight, Ban, DollarSign } from 'lucide-react';
import { Property, Room, AvailabilityOverride } from '../types';

interface RateGridProps {
  properties: Property[];
  rooms: Room[];
  overrides: AvailabilityOverride[];
  bookings: any[];
  onRefresh: () => void;
}

export default function RateGrid({ properties, rooms, overrides, bookings, onRefresh }: RateGridProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>(new Date('2026-07-06')); // Match context year
  const [gridData, setGridData] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ [key: string]: 'success' | 'error' | null }>({});

  // Initialize selected property
  useEffect(() => {
    if (properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  // Generate 14-day header array starting from startDate
  const getDatesRange = () => {
    const dates: Date[] = [];
    const temp = new Date(startDate);
    for (let i = 0; i < 14; i++) {
      dates.push(new Date(temp));
      temp.setDate(temp.getDate() + 1);
    }
    return dates;
  };

  const datesRange = getDatesRange();

  // Load and structure grid entries
  useEffect(() => {
    if (!selectedPropertyId) return;

    const activeRooms = rooms.filter(r => r.property_id === selectedPropertyId);
    
    const structured = activeRooms.map(room => {
      const datesInfo = datesRange.map(date => {
        const dateStr = date.toISOString().split('T')[0];
        
        // Find existing override
        const activeOverride = overrides.find(
          o => o.room_id === room.id && o.date === dateStr
        );

        // Calculate bookings covering this date
        const activeBookingsCount = bookings.filter(b => {
          if (b.room_id !== room.id) return false;
          if (b.status === 'Cancelled') return false;
          return dateStr >= b.check_in && dateStr < b.check_out;
        }).length;

        const isBlackout = activeOverride ? activeOverride.is_blackout : false;
        const currentPrice = activeOverride && activeOverride.price_override !== null
          ? activeOverride.price_override
          : room.base_price;

        const availableInventory = isBlackout ? 0 : room.total_inventory - activeBookingsCount;

        return {
          dateStr,
          basePrice: room.base_price,
          price: currentPrice,
          isOverridden: activeOverride && activeOverride.price_override !== null,
          isBlackout,
          bookedCount: activeBookingsCount,
          availableInventory,
          totalInventory: room.total_inventory
        };
      });

      return {
        room,
        datesInfo
      };
    });

    setGridData(structured);
  }, [selectedPropertyId, startDate, overrides, rooms, bookings]);

  const handlePriceChange = (roomId: string, dateStr: string, newPriceVal: string) => {
    const numericPrice = parseFloat(newPriceVal);
    if (isNaN(numericPrice)) return;

    setGridData(prev => 
      prev.map(row => {
        if (row.room.id !== roomId) return row;
        return {
          ...row,
          datesInfo: row.datesInfo.map((info: any) => {
            if (info.dateStr !== dateStr) return info;
            return {
              ...info,
              price: numericPrice,
              isOverridden: true
            };
          })
        };
      })
    );
  };

  const saveOverride = async (roomId: string, dateStr: string, price: number | null, isBlackout: boolean) => {
    const key = `${roomId}_${dateStr}`;
    setIsSaving(key);
    try {
      const response = await fetch('/api/availability-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          date: dateStr,
          price_override: price,
          is_blackout: isBlackout,
          notes: isBlackout ? 'Admin Blackout Overhaul' : 'Seasonal Price Override'
        })
      });

      if (!response.ok) throw new Error('Failed to save');
      
      setFeedbackMsg(prev => ({ ...prev, [key]: 'success' }));
      setTimeout(() => {
        setFeedbackMsg(prev => ({ ...prev, [key]: null }));
      }, 1500);
      onRefresh();
    } catch (err) {
      console.error(err);
      setFeedbackMsg(prev => ({ ...prev, [key]: 'error' }));
    } finally {
      setIsSaving(null);
    }
  };

  const handleBlackoutToggle = async (roomId: string, dateStr: string, currentBlackout: boolean, price: number) => {
    // Save with toggled blackout state
    await saveOverride(roomId, dateStr, currentBlackout ? null : price, !currentBlackout);
  };

  const shiftDays = (days: number) => {
    const newStart = new Date(startDate);
    newStart.setDate(startDate.getDate() + days);
    setStartDate(newStart);
  };

  const formatDateLabel = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      dayName: days[date.getDay()],
      dateNum: date.getDate(),
      monthName: months[date.getMonth()]
    };
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden" id="rate_grid_module">
      
      {/* Selector and Nav Header */}
      <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 text-blue-800 p-2 rounded-lg">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Holiday Rentals Max Dynamic Grid</h3>
            <p className="text-xs text-slate-500">Manage real-time room availability, blackout blocks, and seasonal overrides.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Property Dropdown */}
          <select
            value={selectedPropertyId}
            onChange={(e) => setSelectedPropertyId(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            id="rate_grid_prop_select"
          >
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Date Pagination */}
          <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden">
            <button 
              onClick={() => shiftDays(-14)}
              className="p-1.5 hover:bg-slate-100 text-slate-600 border-r border-slate-200 transition"
              title="Prev 14 Days"
              id="rate_grid_prev_btn"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1.5 text-xs font-bold text-slate-700">
              {startDate.toISOString().split('T')[0]}
            </span>
            <button 
              onClick={() => shiftDays(14)}
              className="p-1.5 hover:bg-slate-100 text-slate-600 border-l border-slate-200 transition"
              title="Next 14 Days"
              id="rate_grid_next_btn"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onRefresh}
            className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 p-1.5 rounded-lg transition"
            title="Reload Grid Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto">
        <div className="min-w-[1200px] divide-y divide-slate-200">
          
          {/* Calendar Headers Row */}
          <div className="flex bg-slate-100 font-semibold text-xs text-slate-700 text-center py-2.5">
            <div className="w-[200px] flex-shrink-0 text-left px-5 font-bold flex items-center justify-start text-slate-900 uppercase tracking-wider">
              Room Type
            </div>
            <div className="flex-1 grid grid-cols-14">
              {datesRange.map((date, idx) => {
                const label = formatDateLabel(date);
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                return (
                  <div 
                    key={idx} 
                    className={`p-1 flex flex-col justify-center border-l border-slate-200 ${isWeekend ? 'bg-amber-50/50' : ''}`}
                  >
                    <span className="text-[10px] uppercase text-slate-400 font-bold">{label.dayName}</span>
                    <span className="text-sm font-extrabold text-slate-800">{label.dateNum}</span>
                    <span className="text-[9px] text-slate-500">{label.monthName}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid Rows for Each Room */}
          {gridData.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No rooms found. Register rooms in the configuration tab.
            </div>
          ) : (
            gridData.map(({ room, datesInfo }) => (
              <div key={room.id} className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200">
                
                {/* Left Side: Room Information Column */}
                <div className="w-[200px] flex-shrink-0 p-4 bg-white flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm leading-tight">{room.name}</h4>
                    <span className="inline-block mt-1 bg-slate-100 border border-slate-200 rounded-md px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                      {room.type}
                    </span>
                  </div>
                  <div className="mt-3 border-t border-slate-100 pt-2 text-[10px] text-slate-400">
                    <p>Base price: <strong className="text-slate-600">₹{room.base_price}</strong></p>
                    <p>Max Inventory: <strong className="text-slate-600">{room.total_inventory} units</strong></p>
                  </div>
                </div>

                {/* Right Side: 14 Days Interactive Cells */}
                <div className="flex-1 grid grid-cols-14 bg-white">
                  {datesInfo.map((info: any, idx: number) => {
                    const key = `${room.id}_${info.dateStr}`;
                    const saving = isSaving === key;
                    const feedback = feedbackMsg[key];

                    return (
                      <div 
                        key={idx} 
                        className={`border-l border-slate-100 p-2 flex flex-col justify-between text-center min-h-[170px] relative transition-all ${
                          info.isBlackout 
                            ? 'bg-rose-50/60' 
                            : info.isOverridden 
                            ? 'bg-blue-50/20' 
                            : 'hover:bg-slate-50/50'
                        }`}
                      >
                        {/* Live Inventory Counter */}
                        <div className="mb-2">
                          <span className={`inline-block px-1.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide ${
                            info.isBlackout
                              ? 'bg-rose-200 text-rose-800'
                              : info.availableInventory === 0
                              ? 'bg-rose-100 text-rose-700'
                              : info.availableInventory <= 2
                              ? 'bg-amber-100 text-amber-800 font-bold'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {info.isBlackout ? 'BLOCKED' : `${info.availableInventory} Left`}
                          </span>
                          <div className="text-[9px] text-slate-400 mt-1">
                            {info.bookedCount} Booked
                          </div>
                        </div>

                        {/* Interactive Pricing Input */}
                        <div className="my-1.5">
                          <div className="relative flex items-center bg-white border border-slate-300 rounded-md focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 overflow-hidden shadow-xs">
                            <span className="pl-1.5 text-[10px] text-slate-400 font-bold">₹</span>
                            <input
                              type="number"
                              value={info.price}
                              onChange={(e) => handlePriceChange(room.id, info.dateStr, e.target.value)}
                              disabled={info.isBlackout}
                              className="w-full bg-transparent border-0 text-center text-xs font-bold text-slate-700 focus:ring-0 py-1 px-1 focus:outline-none"
                            />
                          </div>
                          {info.isOverridden && !info.isBlackout && (
                            <span className="block text-[8px] text-blue-500 font-bold mt-0.5 uppercase tracking-wide">Override</span>
                          )}
                        </div>

                        {/* Actions Row (Save Overrides / Blackout Toggles) */}
                        <div className="mt-2 space-y-1">
                          {/* Individual Save Button */}
                          <button
                            onClick={() => saveOverride(room.id, info.dateStr, info.price, false)}
                            disabled={info.isBlackout || saving}
                            className={`w-full py-1 rounded-md text-[9px] font-bold transition flex items-center justify-center gap-1 border ${
                              feedback === 'success'
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : feedback === 'error'
                                ? 'bg-rose-600 text-white border-rose-600'
                                : info.isOverridden
                                ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                            }`}
                            title="Save pricing override"
                          >
                            {saving ? (
                              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                            ) : feedback === 'success' ? (
                              <Check className="w-2.5 h-2.5" />
                            ) : (
                              <>
                                <Save className="w-2.5 h-2.5" />
                                <span>Save</span>
                              </>
                            )}
                          </button>

                          {/* Blackout Toggle Button */}
                          <button
                            onClick={() => handleBlackoutToggle(room.id, info.dateStr, info.isBlackout, info.price)}
                            disabled={saving}
                            className={`w-full py-1 rounded-md text-[9px] font-bold transition flex items-center justify-center gap-1 border ${
                              info.isBlackout
                                ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600'
                                : 'bg-white hover:bg-rose-50 text-rose-600 border-rose-200'
                            }`}
                            title={info.isBlackout ? 'Unblock Maintenance' : 'Block for Maintenance'}
                          >
                            <Ban className="w-2.5 h-2.5" />
                            <span>{info.isBlackout ? 'Unblock' : 'Block'}</span>
                          </button>
                        </div>

                        {/* Cell Background Banner for Blackout */}
                        {info.isBlackout && (
                          <div className="absolute inset-0 bg-rose-50/50 backdrop-blur-[0.5px] rounded-sm pointer-events-none border border-rose-300 flex items-center justify-center">
                            <div className="bg-rose-600 text-white p-1 rounded-md shadow-md text-[8px] font-extrabold flex items-center gap-1 rotate-[-12deg] tracking-wider">
                              <ShieldAlert className="w-3 h-3" />
                              <span>BLACKOUT</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            ))
          )}

        </div>
      </div>

    </div>
  );
}
