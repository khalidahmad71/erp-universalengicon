"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, PieChart, Building, ShieldAlert } from "lucide-react";
import { supabase } from "@/utils/supabase";

interface ProjectBudget {
  id: string;
  project_name: string;
  total_estimated_budget: number;
  contract_value: number;
}

interface VendorBalance {
  id: string;
  name: string;
  company_name: string;
  opening_balance: number;
  total_credits: number;
  total_debits: number;
}

export default function FinancialReportsPage() {
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState<ProjectBudget[]>([]);
  const [vendorAging, setVendorAging] = useState<VendorBalance[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      // 1. Fetch Project Budgets
      const { data: budgetData } = await supabase.from("project_budgets").select("*");
      if (budgetData && budgetData.length > 0) {
        setBudgets(budgetData);
      } else {
        // Default dummy/active project data if table is empty
        setBudgets([
          {
            id: "1",
            project_name: "Godrej Zen Estate Phase-2",
            total_estimated_budget: 45000000,
            contract_value: 67500000
          }
        ]);
      }

      // 2. Fetch Vendors and calculate their ledger balances
      const { data: vendorsData } = await supabase.from("vendors").select("*");
      const { data: ledgerData } = await supabase.from("vendor_ledger").select("*");

      if (vendorsData) {
        let calculatedVendors: VendorBalance[] = vendorsData.map((v) => {
          const vTxns = ledgerData?.filter((t) => t.vendor_id === v.id) || [];
          const credits = vTxns.reduce((sum, t) => sum + (Number(t.credit_amount) || 0), 0);
          const debits = vTxns.reduce((sum, t) => sum + (Number(t.debit_amount) || 0), 0);
          
          return {
            id: v.id,
            name: v.name,
            company_name: v.company_name,
            opening_balance: Number(v.opening_balance) || 0,
            total_credits: credits,
            total_debits: debits
          };
        });

        setVendorAging(calculatedVendors);
        const overallExp = calculatedVendors.reduce((sum, v) => sum + v.total_debits, 0);
        setTotalExpenses(overallExp);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Financial summary calculations
  const totalContractVal = budgets.reduce((sum, b) => sum + Number(b.contract_value), 0);
  const totalEstBudget = budgets.reduce((sum, b) => sum + Number(b.total_estimated_budget), 0);
  const estimatedProfit = totalContractVal - totalEstBudget;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 h-16 px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <h2 className="font-extrabold text-slate-800 text-lg">Financial & Management Reporting</h2>
            <p className="text-[11px] text-slate-500">Universal Engicon Pvt. Ltd. | Executive Analytics Hub</p>
          </div>
          <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
            Live Financial Engine
          </span>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">Total Contract Value</p>
              <h3 className="text-xl font-black text-slate-900 mt-1">₹ {totalContractVal.toLocaleString()}</h3>
              <p className="text-[11px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
                <TrendingUp size={14} /> Active Real Estate Revenue
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">Estimated Budget</p>
              <h3 className="text-xl font-black text-slate-900 mt-1">₹ {totalEstBudget.toLocaleString()}</h3>
              <p className="text-[11px] text-blue-600 font-bold mt-2">Planned Construction Cost</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">Total Payments Made</p>
              <h3 className="text-xl font-black text-pink-600 mt-1">₹ {totalExpenses.toLocaleString()}</h3>
              <p className="text-[11px] text-slate-500 mt-2">Disbursed to Vendors / Material</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">Projected Net Profit</p>
              <h3 className="text-xl font-black text-emerald-600 mt-1">₹ {estimatedProfit.toLocaleString()}</h3>
              <p className="text-[11px] text-emerald-600 font-bold mt-2 flex items-center gap-1">
                <TrendingUp size={14} /> Estimated Margin (~33%)
              </p>
            </div>
          </div>

          {/* Section 1: Project-wise Cost vs Budget & Profit Analysis */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Project Cost vs Estimated Budget & Profitability</h3>
                <p className="text-xs text-slate-500">Comparative analysis of contract value, estimated budget, and projected margins.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase tracking-wider">
                    <th className="p-3 font-bold">Project Name</th>
                    <th className="p-3 font-bold text-right">Contract Value (₹)</th>
                    <th className="p-3 font-bold text-right">Estimated Budget (₹)</th>
                    <th className="p-3 font-bold text-right">Projected Profit (₹)</th>
                    <th className="p-3 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {budgets.map((b) => {
                    const profit = Number(b.contract_value) - Number(b.total_estimated_budget);
                    return (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="p-3 font-black text-slate-800 flex items-center gap-2">
                          <Building size={16} className="text-pink-600" /> {b.project_name}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900">₹ {Number(b.contract_value).toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-slate-600">₹ {Number(b.total_estimated_budget).toLocaleString()}</td>
                        <td className="p-3 text-right font-black text-emerald-600">₹ {profit.toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                            On Track / Executing
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Vendor Aging Reports & Outstanding Dues */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div>
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Vendor Aging & Outstanding Dues</h3>
              <p className="text-xs text-slate-500">Track current outstanding payables and net balances across all material suppliers and contractors.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase tracking-wider">
                    <th className="p-3 font-bold">Vendor / Contractor</th>
                    <th className="p-3 font-bold">Company</th>
                    <th className="p-3 font-bold text-right">Total Bills Raised (Credit)</th>
                    <th className="p-3 font-bold text-right">Total Paid (Debit)</th>
                    <th className="p-3 font-bold text-right">Outstanding Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vendorAging.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400">No vendor records found.</td>
                    </tr>
                  ) : (
                    vendorAging.map((v) => {
                      const netOutstanding = Number(v.opening_balance) + Number(v.total_credits) - Number(v.total_debits);
                      return (
                        <tr key={v.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-800">{v.name}</td>
                          <td className="p-3 text-slate-500">{v.company_name || 'N/A'}</td>
                          <td className="p-3 text-right font-bold text-pink-600">₹ {v.total_credits.toLocaleString()}</td>
                          <td className="p-3 text-right font-bold text-emerald-600">₹ {v.total_debits.toLocaleString()}</td>
                          <td className="p-3 text-right font-black text-slate-900">
                            ₹ {netOutstanding.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}