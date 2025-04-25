import React from 'react';
import { Search, Package, CheckCircle, Truck } from 'lucide-react';
import Button from '../../components/ui/Button';

interface SearchAndFiltersProps {
  searchTerm: string;
  activeTab: 'all' | 'dropOffs' | 'pickups' | 'transit';
  stats: {
    pendingDropOffs: number;
    readyForPickup: number;
    inTransit: number;
  };
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTabChange: (tab: 'all' | 'dropOffs' | 'pickups' | 'transit') => void;
}

const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchTerm,
  activeTab,
  stats,
  onSearchChange,
  onTabChange
}) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="relative flex-grow max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Rechercher par nom, appareil, marque..."
          value={searchTerm}
          onChange={onSearchChange}
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={activeTab === 'all' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => onTabChange('all')}
          className="rounded-full"
        >
          Tous
        </Button>
        <Button 
          variant={activeTab === 'dropOffs' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => onTabChange('dropOffs')}
          className="rounded-full flex items-center gap-1"
        >
          <Package className="h-4 w-4" /> Dépôts ({stats.pendingDropOffs})
        </Button>
        <Button 
          variant={activeTab === 'pickups' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => onTabChange('pickups')}
          className="rounded-full flex items-center gap-1"
        >
          <CheckCircle className="h-4 w-4" /> Récupérations ({stats.readyForPickup})
        </Button>
        <Button 
          variant={activeTab === 'transit' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => onTabChange('transit')}
          className="rounded-full flex items-center gap-1"
        >
          <Truck className="h-4 w-4" /> En transit ({stats.inTransit})
        </Button>
      </div>
    </div>
  );
};

export default SearchAndFilters;
