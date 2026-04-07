'use client';
export default function Loading() {
  return (
    <div className="animate-pulse space-y-4 p-6">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="h-32 bg-gray-200 rounded-xl"></div>
      <div className="h-96 bg-gray-200 rounded-xl"></div>
    </div>
  );
}