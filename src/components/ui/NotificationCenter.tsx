import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, X, Info, AlertTriangle, CheckCircle, Clock, MessageSquare, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { realtimeNotificationService, RealtimeNotification } from '../../services/realtimeNotificationService';
import { NotificationType } from '../../types';
import Badge from './Badge';
import Button from './Button';

// Props du composant
interface NotificationCenterProps {
  onNotificationRead?: () => void;
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNotificationRead, className }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Charger les notifications au montage du composant
  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const unreadNotifications = await realtimeNotificationService.getUnreadNotifications(user.id);
        setNotifications(unreadNotifications);
      } catch (error) {
        console.error('Erreur lors du chargement des notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadNotifications();
    
    // S'abonner aux nouvelles notifications
    const unsubscribe = realtimeNotificationService.subscribeToNotifications(
      user?.id || '',
      (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
      }
    );
    
    // Nettoyer l'abonnement lors du démontage du composant
    return () => {
      unsubscribe();
    };
  }, [user]);
  
  // Fermer le dropdown lorsqu'on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Marquer une notification comme lue
  const handleMarkAsRead = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const success = await realtimeNotificationService.markAsRead(notificationId);
      if (success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true } 
              : notification
          )
        );
        
        // Appeler le callback si fourni
        if (onNotificationRead) {
          onNotificationRead();
        }
      }
    } catch (error) {
      console.error('Erreur lors du marquage de la notification comme lue:', error);
    }
  };
  
  // Supprimer une notification
  const handleDeleteNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const success = await realtimeNotificationService.deleteNotification(notificationId);
      if (success) {
        setNotifications(prev => 
          prev.filter(notification => notification.id !== notificationId)
        );
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la notification:', error);
    }
  };
  
  // Marquer toutes les notifications comme lues
  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    try {
      const success = await realtimeNotificationService.markAllAsRead(user.id);
      if (success) {
        const unreadCount = notifications.filter(n => !n.isRead).length;
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
        
        // Appeler le callback pour chaque notification non lue si fourni
        if (onNotificationRead && unreadCount > 0) {
          for (let i = 0; i < unreadCount; i++) {
            onNotificationRead();
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
    }
  };
  
  // Obtenir l'icône en fonction du type de notification
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'repair':
        return <Clock className="h-5 w-5 text-purple-500" />;
      case 'message':
        return <MessageSquare className="h-5 w-5 text-primary" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Déterminer l'URL de destination en fonction du type de notification
  const getNotificationUrl = (notification: RealtimeNotification): string => {
    if (!notification.relatedId) return '/';
    
    // Utiliser un type casting pour éviter les erreurs de type
    const notificationType = notification.type as string;
    
    if (notificationType === 'message' || notificationType === 'chat') {
      return `/chat/${notification.relatedId}`;
    } else if (notificationType === 'repair' || notification.repairInfo) {
      return `/repair/${notification.relatedId}`;
    } else if (['info', 'success', 'warning', 'error'].includes(notificationType)) {
      // Pour les notifications générales, rediriger vers la page des notifications
      return '/notifications';
    }
    
    return '/';
  };
  
  // Formater la date pour l'affichage
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) {
      return 'À l\'instant';
    } else if (diffMins < 60) {
      return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  };
  
  // Nombre de notifications non lues
  const unreadCount = notifications.filter(notification => !notification.isRead).length;
  
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-lg overflow-hidden z-50">
          <div className="p-3 border-b flex items-center justify-between">
            <h3 className="font-medium">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
              >
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-xs">Tout marquer comme lu</span>
                </div>
              </Button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Chargement des notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">Aucune notification</p>
              </div>
            ) : (
              <div>
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b hover:bg-gray-50 transition-colors flex ${!notification.isRead ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex-shrink-0 mr-3">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-sm truncate">
                          {notification.title}
                        </p>
                        <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                          {formatDate(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      {notification.repairInfo && (
                        <div className="mt-2 flex items-center">
                          <Badge
                            variant={
                              notification.repairInfo.statusName === 'completed' ? 'success' :
                              notification.repairInfo.statusName === 'inRepair' ? 'primary' :
                              notification.repairInfo.statusName === 'cancelled' ? 'error' : 'warning'
                            }
                            className="mr-2"
                          >
                            {notification.repairInfo.statusLabel}
                          </Badge>
                          <span className="text-xs text-gray-500 truncate">
                            {notification.repairInfo.brand} {notification.repairInfo.model}
                          </span>
                        </div>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        {notification.relatedId && (
                          <Link
                            to={getNotificationUrl(notification)}
                            className="text-xs text-primary hover:underline"
                            onClick={() => setIsOpen(false)}
                          >
                            Voir les détails
                          </Link>
                        )}
                        <div className="flex space-x-2">
                          {!notification.isRead && (
                            <button
                              className="text-xs text-gray-500 hover:text-primary"
                              onClick={(e) => handleMarkAsRead(notification.id, e)}
                              title="Marquer comme lu"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            className="text-xs text-gray-500 hover:text-red-500"
                            onClick={(e) => handleDeleteNotification(notification.id, e)}
                            title="Supprimer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-2 border-t bg-gray-50">
            <Link
              to="/notifications"
              className="block text-center text-sm text-primary hover:underline p-1"
              onClick={() => setIsOpen(false)}
            >
              Voir toutes les notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
