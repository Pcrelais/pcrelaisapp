import React from 'react';
import { Link } from 'react-router-dom';
import { QrCode, Calendar, BarChart, Zap } from 'lucide-react';

const QuickActions: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Link to="/relay/scan" className="flex items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="p-3 bg-blue-50 rounded-lg mr-4">
          <QrCode className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">Scanner un code QR</h3>
          <p className="text-sm text-gray-500">Traiter rapidement un dépôt ou une récupération</p>
        </div>
        <div className="ml-auto">
          <Zap className="h-5 w-5 text-blue-500" />
        </div>
      </Link>
      
      <Link to="/relay/calendar" className="flex items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="p-3 bg-green-50 rounded-lg mr-4">
          <Calendar className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">Calendrier</h3>
          <p className="text-sm text-gray-500">Voir les dépôts et récupérations à venir</p>
        </div>
        <div className="ml-auto">
          <Zap className="h-5 w-5 text-green-500" />
        </div>
      </Link>
      
      <Link to="/relay/stats" className="flex items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="p-3 bg-purple-50 rounded-lg mr-4">
          <BarChart className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">Statistiques</h3>
          <p className="text-sm text-gray-500">Suivre vos commissions et activité</p>
        </div>
        <div className="ml-auto">
          <Zap className="h-5 w-5 text-purple-500" />
        </div>
      </Link>
    </div>
  );
};

export default QuickActions;
