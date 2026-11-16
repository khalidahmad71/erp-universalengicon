import React from 'react';
import Link from 'next/link';

export default function PlantMachinery() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8">
      <header className="mb-8 flex justify-between items-end border-b pb-4">
        <div>
          <Link href="/" className="text-blue-600 hover:underline text-sm font-medium mb-2 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-blue-900">Plant & Machinery</h1>
          <p className="text-gray-500 mt-1">Asset Tracking, Fuel Consumption & Maintenance</p>
        </div>
      </header>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <p className="text-lg font-bold">Plant & Machinery Module Ready!</p>
          <p className="text-gray-600 mt-2">Yahan hum cranes, excavators, aur heavy vehicles track karenge.</p>
      </div>
    </div>
  );
}