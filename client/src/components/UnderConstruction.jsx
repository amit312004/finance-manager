import React from 'react';
import { Card } from '@/components/ui/base';

/**
 * A reusable placeholder component for modules under development.
 * @param {string} title - The title of the module (e.g. "Analytics").
 * @param {string} description - A short description of the module.
 * @param {React.ReactNode} icon - The icon component (e.g. from lucide-react or custom SVG).
 * @param {string} colorClass - Tailwind color classes for the icon container (e.g. "bg-blue-50 text-blue-500").
 */
export default function UnderConstruction({ title, description, icon, colorClass = "bg-gray-50 text-gray-500" }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500">{description}</p>
        </div>
      </div>

      <Card className="p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className={`${colorClass} p-4 rounded-full mb-4`}>
          {icon}
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Module Under Construction</h2>
        <p className="text-gray-500 max-w-md">
          This module is currently being built. Check back soon for the {title.toLowerCase()} feature.
        </p>
      </Card>
    </div>
  );
}
