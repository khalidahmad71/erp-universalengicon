"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building, ArrowLeft, X, Store, Briefcase, Home, MessageSquare, Send } from "lucide-react";
import { supabase } from "@/utils/supabase";

interface SalesUnit {
  id: string;
  flat_number: string;
  floor_no: number;
  unit_type: "Flat" | "Shop" | "Office";
  bhk_type: string;
  super_built_up_area: number;
  status: "Available" | "Booked" | "Registry Done";
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  total_unit_price?: number;
  booking_amount?: number;
}

export default function SalesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [units, setUnits] = useState<SalesUnit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<SalesUnit | null>(null);

  // Form States
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [totalUnitPrice, setTotalUnitPrice] = useState("");
  const [bookingAmount, setBookingAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Milestones States
  const [milestones, setMilestones] = useState<any[]>([]);
  const [newMilestoneName, setNewMilestoneName] = useState("");
  const [newMilestoneAmount, setNewMilestoneAmount] = useState("");

  const [filterType, setFilterType] = useState("All");

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    try {
      const { data, error } = await supabase
        .from("sales_units")
        .select("*")
        .order("floor_no", { ascending: false })
        .order("flat_number", { ascending: true });

      if (error) throw error;
      if (data) setUnits(data);
    } catch (error) {
      console.error("Error fetching units:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = async (unit: SalesUnit) => {
    setSelectedUnit(unit);
    setCustomerName(unit.customer_name || "");
    setCustomerPhone(unit.customer_phone || "");
    setCustomerEmail(unit.customer_email || "");
    setCustomerAddress(unit.customer_address || "");
    setTotalUnitPrice(unit.total_unit_price ? unit.total_unit_price.toString() : "");
    setBookingAmount(unit.booking_amount ? unit.booking_amount.toString() : "");

    const { data } = await supabase
      .from("payment_milestones")
      .select("*")
      .eq("unit_id", unit.id)
      .order("created_at", { ascending: true });
    
    setMilestones(data || []);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("sales_units")
        .update({
          status: "Booked",
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          customer_address: customerAddress,
          total_unit_price: parseFloat(totalUnitPrice) || 0,
          booking_amount: parseFloat(bookingAmount) || 0,
        })
        .eq("id", selectedUnit.id);

      if (error) throw error;

      alert("Unit booking & pricing saved successfully!");
      fetchUnits();
    } catch (error: any) {
      console.error("Error saving booking:", error);
      alert("Failed to save booking: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit || !newMilestoneName || !newMilestoneAmount) return;

    try {
      const { error } = await supabase.from("payment_milestones").insert({
        unit_id: selectedUnit.id,
        milestone_name: newMilestoneName,
        total_amount: parseFloat(newMilestoneAmount),
        status: "Pending"
      });

      if (error) throw error;

      setNewMilestoneName("");
      setNewMilestoneAmount("");
      handleOpenModal(selectedUnit);
    } catch (error: any) {
      alert("Error adding milestone: " + error.message);
    }
  };

  const toggleMilestoneStatus = async (milestoneId: string, currentStatus: string) => {
    if (!selectedUnit) return;
    const newStatus = currentStatus === 'Paid' ? 'Pending' : 'Paid';
    
    const { error } = await supabase
      .from("payment_milestones")
      .update({ status: newStatus })
      .eq("id", milestoneId);

    if (!error) {
      handleOpenModal(selectedUnit);
    }
  };

  // Calculate Balance Amount
  const unitTotalPrice = parseFloat(totalUnitPrice) || 0;
  const totalPaidMilestones = milestones
    .filter(m => m.status === 'Paid')
    .reduce((sum, m) => sum + (parseFloat(m.total_amount) || 0), 0);
  
  const initialBooking = parseFloat(bookingAmount) || 0;
  const balanceAmount = unitTotalPrice - (initialBooking + totalPaidMilestones);

  // Send WhatsApp Reminder Function
  const sendWhatsAppReminder = () => {
    if (!customerPhone || customerPhone.trim() === "") {
      alert("Please enter a valid customer phone number first!");
      return;
    }
    const message = `Dear ${customerName || "Customer"}, Greetings from Universal Engicon! Your payment balance for Unit ${selectedUnit?.flat_number} is ₹${balanceAmount.toLocaleString()}. Please clear your construction-linked installment at the earliest. Thank you!`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/91${customerPhone}?text=${encodedMessage}`, "_blank");
  };

  const filteredUnits = filterType === "All" 
    ? units 
    : units.filter(u => u.unit_type === filterType);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-semibold">Loading Sales & Financials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="bg-slate-800 p-2 rounded-lg hover:bg-slate-700 transition-colors">
              <ArrowLeft size={20} className="text-white" />
            </a>
            <div className="bg-pink-600 p-2 rounded-lg">
              <Building size={20} className="text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-wide">Real Estate Sales & Construction-Linked Plan</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Godrej Zen Estate - Unit Financial Matrix</h2>
            <p className="text-slate-500 text-sm mt-1">Track unit pricing, construction stages, and balance dues.</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {["All", "Flat", "Shop", "Office"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  filterType === type 
                    ? "bg-pink-600 text-white shadow-md shadow-pink-600/20" 
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {type}s
              </button>
            ))}
          </div>
        </div>

        {/* Units Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredUnits.map((unit) => {
            const isBooked = unit.status === "Booked" || unit.status === "Registry Done";
            const statusBg = 
              unit.status === "Available" ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
              unit.status === "Booked" ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-blue-50 border-blue-200 text-blue-800";

            const TypeIcon = unit.unit_type === "Shop" ? Store : unit.unit_type === "Office" ? Briefcase : Home;

            return (
              <div
                key={unit.id}
                onClick={() => handleOpenModal(unit)}
                className="bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-700"><TypeIcon size={16} /></div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{unit.unit_type}</span>
                        <h3 className="text-lg font-black text-slate-800">{unit.flat_number}</h3>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusBg}`}>{unit.status}</span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-500 mb-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p>Floor: <strong className="text-slate-700">{unit.floor_no === 0 ? "Ground" : `${unit.floor_no}th`}</strong></p>
                    <p>Area: <strong className="text-slate-700">{unit.super_built_up_area} sq.ft.</strong></p>
                    <p>Price: <strong className="text-pink-600">₹ {unit.total_unit_price ? unit.total_unit_price.toLocaleString() : "Not Set"}</strong></p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 mt-1">
                  {isBooked ? (
                    <div className="text-xs space-y-1 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                      <p className="font-bold text-slate-800 truncate">👤 {unit.customer_name || "N/A"}</p>
                      <p className="text-slate-600 truncate">📞 {unit.customer_phone || "No phone"}</p>
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-emerald-600 text-center py-1">Click to set pricing & plan →</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Modal */}
      {selectedUnit && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white shrink-0">
              <div>
                <h3 className="font-bold text-lg">{selectedUnit.unit_type} {selectedUnit.flat_number} - Financial Ledger</h3>
                <p className="text-xs text-slate-400">Total Price: ₹ {unitTotalPrice.toLocaleString()} | Balance Due: <span className="text-amber-400 font-bold">₹ {balanceAmount.toLocaleString()}</span></p>
              </div>
              <button onClick={() => setSelectedUnit(null)} className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Customer & Pricing Form */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-800 text-sm mb-3">👤 Customer & Unit Pricing</h4>
                <form onSubmit={handleBookingSubmit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Customer Full Name *</label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Buyer's name"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="10-digit mobile"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Total Unit Price (₹) *</label>
                      <input
                        type="number"
                        required
                        value={totalUnitPrice}
                        onChange={(e) => setTotalUnitPrice(e.target.value)}
                        placeholder="e.g. 5000000"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-600 font-bold text-pink-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Booking Amount Paid (₹)</label>
                      <input
                        type="number"
                        value={bookingAmount}
                        onChange={(e) => setBookingAmount(e.target.value)}
                        placeholder="e.g. 500000"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-600"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <div className="text-xs font-bold text-slate-700">
                      Calculated Balance Due: <span className="text-pink-600 text-sm">₹ {balanceAmount.toLocaleString()}</span>
                    </div>
                    <button type="submit" disabled={submitting} className="px-4 py-2 bg-pink-600 text-white rounded-xl text-xs font-bold hover:bg-pink-700 shadow-md">
                      {submitting ? "Saving..." : "Save Financial Details"}
                    </button>
                  </div>
                </form>
              </div>

              {/* Construction-Linked Milestones & Always-Visible WhatsApp Notification */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-800 text-sm">🏗️ Construction-Linked Payment Stages & Reminders</h4>

                {/* WhatsApp Notification Box (Always Visible) */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <MessageSquare size={14} className="text-emerald-600" /> WhatsApp Payment Reminder Preview
                    </span>
                    <button
                      type="button"
                      onClick={sendWhatsAppReminder}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm transition-colors"
                    >
                      <Send size={12} /> Send Now on WhatsApp
                    </button>
                  </div>
                  <p className="text-xs text-emerald-900 bg-white/80 p-2.5 rounded-lg border border-emerald-100 italic">
                    &quot;Dear {customerName || "Customer"}, Greetings from Universal Engicon! Your payment balance for Unit {selectedUnit?.flat_number} is ₹{balanceAmount.toLocaleString()}. Please clear your construction-linked installment at the earliest. Thank you!&quot;
                  </p>
                </div>

                <form onSubmit={handleAddMilestone} className="flex gap-2 pt-2 border-t border-slate-200">
                  <input
                    type="text"
                    required
                    value={newMilestoneName}
                    onChange={(e) => setNewMilestoneName(e.target.value)}
                    placeholder="Stage (e.g. Foundation / Roof Casting)"
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-pink-600"
                  />
                  <input
                    type="number"
                    required
                    value={newMilestoneAmount}
                    onChange={(e) => setNewMilestoneAmount(e.target.value)}
                    placeholder="Installment Amount (₹)"
                    className="w-36 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-pink-600"
                  />
                  <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 shrink-0">
                    + Add Stage
                  </button>
                </form>

                {milestones.length === 0 ? (
                  <p className="text-center text-slate-400 py-4 text-xs">No construction stages added yet.</p>
                ) : (
                  <div className="space-y-2">
                    {milestones.map((m) => (
                      <div key={m.id} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-800">{m.milestone_name}</p>
                          <p className="text-slate-500">Stage Installment: ₹ {m.total_amount?.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded-full font-bold ${m.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {m.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleMilestoneStatus(m.id, m.status)}
                            className="text-blue-600 hover:underline font-semibold"
                          >
                            Mark {m.status === 'Paid' ? 'Pending' : 'Paid'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-100 px-6 py-3 flex justify-end shrink-0 border-t border-slate-200">
              <button onClick={() => setSelectedUnit(null)} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800">
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}