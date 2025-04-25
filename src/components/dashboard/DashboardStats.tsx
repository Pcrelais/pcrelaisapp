import React from 'react';
import { Package, CheckCircle, Truck, Activity, TrendingUp } from 'lucide-react';

interface DashboardStatsProps {
  pendingDropOffs: number;
  readyForPickup: number;
  inTransit: number;
  completedThisMonth: number;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  pendingDropOffs,
  readyForPickup,
  inTransit,
  completedThisMonth
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Dépôts en attente</p>
            <h3 className="text-2xl font-bold text-gray-800">{pendingDropOffs}</h3>
          </div>
          <div className="p-2 bg-blue-50 rounded-lg">
            <Package className="h-5 w-5 text-blue-500" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
            À traiter aujourd'hui
          </span>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Prêts pour récupération</p>
            <h3 className="text-2xl font-bold text-gray-800">{readyForPickup}</h3>
          </div>
          <div className="p-2 bg-green-50 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
            En attente de client
          </span>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">En transit</p>
            <h3 className="text-2xl font-bold text-gray-800">{inTransit}</h3>
          </div>
          <div className="p-2 bg-amber-50 rounded-lg">
            <Truck className="h-5 w-5 text-amber-500" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
            En cours de traitement
          </span>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Complétés ce mois</p>
            <h3 className="text-2xl font-bold text-gray-800">{completedThisMonth}</h3>
          </div>
          <div className="p-2 bg-purple-50 rounded-lg">
            <Activity className="h-5 w-5 text-purple-500" />
          </div>
        </div>
        <div className="mt-2">
          <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
            <TrendingUp className="inline h-3 w-3 mr-1" /> Performance mensuelle
          </span>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
