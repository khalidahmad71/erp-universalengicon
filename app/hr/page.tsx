import React from 'react';
import Link from 'next/link';

export default function HRPayroll() {
  // Dummy data for Site-wise Labour & Staff
  const attendanceData = [
    { id: 1, site: "Godrej Zen Estate Phase-2", type: "Skilled Labour", count: 45, wagePerDay: 800, totalCost: "36,000" },
    { id: 2, site: "Godrej Zen Estate Phase-2", type: "Unskilled Labour", count: 120, wagePerDay: 500, totalCost: "60,000" },
    { id: 3, site: "Universal Head Office (Patna)", type: "Staff (Office)", count: 25, wagePerDay: "Monthly", totalCost: "N/A" },
    { id: 4, site: "Site C - Kolkata", type: "Heavy Machine Operators", count: 8, wagePerDay: 1200, totalCost: "9,600" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8">
      
      {/* Header with Back Button */}
      <header className="mb-8 flex justify-between items-end border-b pb-4">
        <div>
          <Link href="/" className="text-blue-600 hover:underline text-sm font-medium mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-blue-900">HR & Payroll Management</h1>
          <p className="text-gray-500 mt-1">Labour Attendance, Wages, and Staff Compliance</p>
        </div>
        <div className="flex gap-3">
            <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded shadow">
              ✓ Mark Attendance
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow">
              ₹ Generate Payroll
            </button>
        </div>
      </header>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
          <p className="text-sm text-gray-500 font-medium">Total Active Staff</p>
          <p className="text-2xl font-bold mt-1 text-gray-800">42</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 border-l-4 border-l-orange-500">
          <p className="text-sm text-gray-500 font-medium">Labour on Sites (Today)</p>
          <p className="text-2xl font-bold mt-1 text-gray-800">173</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 border-l-4 border-l-red-500">
          <p className="text-sm text-gray-500 font-medium">Today's Estimated Wage Cost</p>
          <p className="text-2xl font-bold mt-1 text-gray-800">₹ 1,05,600</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 border-l-4 border-l-green-500">
          <p className="text-sm text-gray-500 font-medium">PF/ESI Compliance</p>
          <p className="text-2xl font-bold mt-1 text-green-600">Up to Date</p>
        </div>
      </div>

      {/* Attendance & Wages Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-bold text-lg text-gray-700">Today's Site-wise Attendance Summary</h2>
        </div>
        <table className="min-w-full text-left border-collapse">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="py-3 px-6 text-sm font-semibold text-gray-700">Site / Location</th>
              <th className="py-3 px-6 text-sm font-semibold text-gray-700">Category</th>
              <th className="py-3 px-6 text-sm font-semibold text-gray-700">Present Today</th>
              <th className="py-3 px-6 text-sm font-semibold text-gray-700">Daily Wage (Avg)</th>
              <th className="py-3 px-6 text-sm font-semibold text-gray-700">Total Cost (₹)</th>
            </tr>
          </thead>
          <tbody>
            {attendanceData.map((row, index) => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 bg-white">
                <td className="py-3 px-6 font-medium text-gray-800">{row.site}</td>
                <td className="py-3 px-6 text-gray-600">{row.type}</td>
                <td className="py-3 px-6 font-bold text-gray-800">{row.count}</td>
                <td className="py-3 px-6 text-gray-500">{row.wagePerDay}</td>
                <td className="py-3 px-6 font-semibold text-blue-700">{row.totalCost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}