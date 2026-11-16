"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building, ArrowLeft, Calculator, Package, Layers, ShieldCheck } from "lucide-react";

export default function MaterialEstimationPage() {
  const router = useRouter();
  const [areaSqFt, setAreaSqFt] = useState<number>(1000);

  // Standard Rules of Thumb multipliers per 1 sq.ft. of RCC Slab Casting
  const cementBagsPerSqFt = 0.40;     // 400 bags for 1000 sq.ft.
  const sandCuFtPerSqFt = 1.5;        // 1500 cu.ft. for 1000 sq.ft.
  const aggregateCuFtPerSqFt = 3.0;   // 3000 cu.ft. for 1000 sq.ft.
  const steelKgPerSqFt = 3.8;         // 3800 kg (3.8 Tons) for 1000 sq.ft.

  // Calculated values
  const totalCementBags = Math.ceil(areaSqFt * cementBagsPerSqFt);
  const totalSandCuFt = Math.round(areaSqFt * sandCuFtPerSqFt);
  const totalAggregateCuFt = Math.round(areaSqFt * aggregateCuFtPerSqFt);
  const totalSteelKg = Math.round(areaSqFt * steelKgPerSqFt);
  const totalSteelTons = (totalSteelKg / 1000).toFixed(2);

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
            <h1 className="font-bold text-lg tracking-wide">Universal Engicon - Material Estimation Calculator</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="bg-slate-900 px-8 py-6 text-white flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calculator className="text-pink-500" /> RCC Slab Casting Estimator (Rule of Thumb)
              </h2>
              <p className="text-slate-400 text-xs mt-1">Calculate exact material requirements (Cement, Sand, Aggregate, Steel) instantly based on built-up area.</p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="max-w-md">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Enter Slab Area (Square Feet) *
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={areaSqFt}
                  onChange={(e) => setAreaSqFt(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-black text-slate-800 focus:outline-none focus:border-pink-600"
                  placeholder="e.g. 1000"
                />
                <span className="flex items-center bg-slate-100 px-4 rounded-xl text-xs font-bold text-slate-600">Sq.Ft.</span>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
              {/* Cement */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 relative overflow-hidden">
                <div className="p-3 bg-pink-100 text-pink-600 rounded-xl w-fit mb-3"><Package size={22} /></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cement Required</span>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{totalCementBags.toLocaleString()} <span className="text-sm font-semibold text-slate-500">Bags</span></h3>
                <p className="text-[11px] text-slate-500 mt-2">@(0.4 bags / sq.ft.) 50kg standard bags</p>
              </div>

              {/* Sand */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 relative overflow-hidden">
                <div className="p-3 bg-amber-100 text-amber-600 rounded-xl w-fit mb-3"><Layers size={22} /></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Coarse / Fine Sand</span>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{totalSandCuFt.toLocaleString()} <span className="text-sm font-semibold text-slate-500">Cu.Ft.</span></h3>
                <p className="text-[11px] text-slate-500 mt-2">@(1.5 cu.ft. / sq.ft.) River / M-Sand</p>
              </div>

              {/* Aggregate */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 relative overflow-hidden">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl w-fit mb-3"><Building size={22} /></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aggregate (20mm Chips)</span>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{totalAggregateCuFt.toLocaleString()} <span className="text-sm font-semibold text-slate-500">Cu.Ft.</span></h3>
                <p className="text-[11px] text-slate-500 mt-2">@(3.0 cu.ft. / sq.ft.) Stone metal</p>
              </div>

              {/* Steel */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 relative overflow-hidden">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl w-fit mb-3"><ShieldCheck size={22} /></div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">TMT Steel Bars</span>
                <h3 className="text-2xl font-black text-slate-800 mt-1">{totalSteelKg.toLocaleString()} <span className="text-sm font-semibold text-slate-500">Kg</span></h3>
                <p className="text-[11px] text-pink-600 font-bold mt-2">≈ {totalSteelTons} Metric Tons (3.8 kg/sq.ft.)</p>
              </div>
            </div>

            {/* Quick Engineering Notes */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs text-amber-900 space-y-1.5">
              <h4 className="font-bold text-amber-950 uppercase tracking-wider">📌 Important Site Note:</h4>
              <p>• Calculations are based on standard RCC slab casting assuming 5-inch slab thickness with normal beam distribution.</p>
              <p>• Actual consumption may vary by ±5% depending on structural consultant drawings and site wastage.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}