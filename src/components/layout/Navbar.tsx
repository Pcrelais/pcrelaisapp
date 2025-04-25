import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, User, LogOut, PenTool as Tool, MapPin } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import NotificationCenter from '../ui/NotificationCenter';
import { realtimeNotificationService } from '../../services/realtimeNotificationService';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setUserMenuOpen(false);
  };
  
  // Charger le nombre de notifications non lues
  useEffect(() => {
    if (!user) return;
    
    // Charger le nombre initial de notifications non lues
    const loadUnreadCount = async () => {
      try {
        const count = await realtimeNotificationService.getUnreadCount(user.id);
        setUnreadCount(count);
      } catch (error) {
        console.error('Erreur lors du chargement des notifications non lues:', error);
      }
    };
    
    loadUnreadCount();
    
    // S'abonner aux nouvelles notifications pour mettre à jour le compteur
    const unsubscribe = realtimeNotificationService.subscribeToNotifications(
      user.id,
      () => {
        // Mettre à jour le compteur à chaque nouvelle notification
        loadUnreadCount();
      }
    );
    
    return () => {
      unsubscribe();
    };
  }, [user]);
  
  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container-app">
        <div className="flex items-center justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <Tool className="h-6 w-6 text-primary" />
              <span className="text-xl font-semibold text-gray-900">PC Relais</span>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <Link to="/" className="text-gray-700 hover:text-primary px-2 py-1 text-sm font-medium transition-colors">
              Accueil
            </Link>
            <Link to="/services" className="text-gray-700 hover:text-primary px-2 py-1 text-sm font-medium transition-colors">
              Services
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-primary px-2 py-1 text-sm font-medium transition-colors">
              À propos
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-primary px-2 py-1 text-sm font-medium transition-colors">
              Contact
            </Link>
          </div>
          
          {/* Auth buttons or user profile */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {isAuthenticated ? (
              <div className="relative flex items-center space-x-3">
                <div className="relative">
                  <NotificationCenter 
                    onNotificationRead={() => setUnreadCount(prev => Math.max(0, prev - 1))}
                    className="text-gray-600 hover:text-primary p-1 rounded-full transition-colors"
                  />
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  )}
                </div>
                <button
                  className="flex items-center text-gray-700 hover:text-primary transition-colors"
                  onClick={toggleUserMenu}
                >
                  <span className="mr-2 text-sm font-medium">{user?.firstName}</span>
                  <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                    <User className="h-4 w-4" />
                  </div>
                </button>
                
                {/* User dropdown menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-10 w-48 bg-white rounded-md shadow-lg border border-gray-100 animate-fade-in">
                    <div className="py-1">
                      <Link 
                        to="/profile" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Mon profil
                      </Link>
                      <Link 
                        to="/dashboard" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Tableau de bord
                      </Link>
                      {(user?.role === 'relayPoint' || user?.role === 'admin') && (
                        <Link 
                          to="/admin/relay-points" 
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            Gestion des points relais
                          </div>
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <LogOut className="h-4 w-4 mr-2" /> Se déconnecter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">Se connecter</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">S'inscrire</Button>
                </Link>
              </>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-3">
            {isAuthenticated && (
              <div className="relative">
                <Link to="/notifications" className="text-gray-600 hover:text-primary p-1 rounded-full transition-colors">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  )}
                </Link>
              </div>
            )}
            <button
              onClick={toggleMobileMenu}
              className="text-gray-700 p-1 rounded-md focus:outline-none"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 animate-fade-in">
          <div className="pt-2 pb-4 space-y-1 px-4">
            <Link 
              to="/" 
              className="block py-2 text-base text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Accueil
            </Link>
            <Link 
              to="/services" 
              className="block py-2 text-base text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Services
            </Link>
            <Link 
              to="/about" 
              className="block py-2 text-base text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              À propos
            </Link>
            <Link 
              to="/contact" 
              className="block py-2 text-base text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            
            {isAuthenticated ? (
              <>
                <div className="border-t border-gray-200 my-2"></div>
                <Link 
                  to="/profile" 
                  className="block py-2 text-base text-gray-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mon profil
                </Link>
                <Link 
                  to="/dashboard" 
                  className="block py-2 text-base text-gray-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Tableau de bord
                </Link>
                {(user?.role === 'relayPoint' || user?.role === 'admin') && (
                  <Link 
                    to="/admin/relay-points" 
                    className="block py-2 text-base text-gray-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Gestion des points relais
                    </div>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full py-2 text-base text-gray-700"
                >
                  <LogOut className="h-4 w-4 mr-2" /> Se déconnecter
                </button>
              </>
            ) : (
              <>
                <div className="border-t border-gray-200 my-2"></div>
                <div className="pt-2 flex flex-col space-y-2">
                  <Link 
                    to="/login" 
                    className="w-full"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="outline" fullWidth>Se connecter</Button>
                  </Link>
                  <Link 
                    to="/register" 
                    className="w-full"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="primary" fullWidth>S'inscrire</Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;