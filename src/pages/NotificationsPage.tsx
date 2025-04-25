import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, ArrowLeft, Info, AlertTriangle, CheckCircle, Clock, MessageSquare, Trash2, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { realtimeNotificationService, RealtimeNotification } from '../services/realtimeNotificationService';
import { NotificationType } from '../types';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all'); // 'all', 'unread', 'read'
  const [typeFilter, setTypeFilter] = useState<string>('all'); // 'all', 'repair', 'message', etc.

  // Charger toutes les notifications
  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        const allNotifications = await realtimeNotificationService.getAllNotifications(user.id, 100);
        setNotifications(allNotifications);
      } catch (err) {
        console.error('Erreur lors du chargement des notifications:', err);
        setError('Impossible de charger les notifications. Veuillez réessayer plus tard.');
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

  // Marquer une notification comme lue
  const handleMarkAsRead = async (notificationId: string) => {
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
      }
    } catch (error) {
      console.error('Erreur lors du marquage de la notification comme lue:', error);
    }
  };
  
  // Supprimer une notification
  const handleDeleteNotification = async (notificationId: string) => {
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
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
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
  
  // Formater la date pour l'affichage
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Filtrer les notifications
  const filteredNotifications = notifications.filter(notification => {
    // Filtre par statut de lecture
    if (filter === 'unread' && notification.isRead) return false;
    if (filter === 'read' && !notification.isRead) return false;
    
    // Filtre par type
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false;
    
    return true;
  });
  
  // Nombre de notifications non lues
  const unreadCount = notifications.filter(notification => !notification.isRead).length;
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div className="flex items-center">
          <Link to="/dashboard" className="mr-4">
            <Button variant="ghost" className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">
              {unreadCount > 0 ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes les notifications sont lues'}
            </p>
          </div>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              className="flex items-center"
            >
              <Check className="h-4 w-4 mr-2" />
              Tout marquer comme lu
            </Button>
          )}
          
          <div className="relative">
            <Button
              variant="outline"
              className="flex items-center"
              onClick={() => {
                const select = document.getElementById('notification-filter');
                if (select) select.click();
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtrer
            </Button>
            <select
              id="notification-filter"
              className="absolute inset-0 opacity-0 cursor-pointer"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Toutes</option>
              <option value="unread">Non lues</option>
              <option value="read">Lues</option>
            </select>
          </div>
          
          <div className="relative">
            <Button
              variant="outline"
              className="flex items-center"
              onClick={() => {
                const select = document.getElementById('notification-type-filter');
                if (select) select.click();
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Type
            </Button>
            <select
              id="notification-type-filter"
              className="absolute inset-0 opacity-0 cursor-pointer"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">Tous</option>
              <option value="repair">Réparations</option>
              <option value="message">Messages</option>
              <option value="info">Informations</option>
              <option value="success">Succès</option>
              <option value="warning">Avertissements</option>
              <option value="error">Erreurs</option>
            </select>
          </div>
        </div>
      </div>
      
      <Card>
        <Card.Content className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-500 mt-4">Chargement des notifications...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-4" />
              <p className="text-red-500">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Réessayer
              </Button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune notification à afficher</p>
              {filter !== 'all' || typeFilter !== 'all' ? (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setFilter('all');
                    setTypeFilter('all');
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex">
                    <div className="flex-shrink-0 mr-4">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium">
                          {notification.title}
                        </h3>
                        <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                          {formatDate(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">
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
                          <span className="text-sm text-gray-600">
                            {notification.repairInfo.brand} {notification.repairInfo.model}
                          </span>
                        </div>
                      )}
                      <div className="mt-4 flex items-center justify-between">
                        {notification.relatedId && (
                          <Link
                            to={
                              (notification.type as string) === 'message' ? `/chat/${notification.relatedId}` :
                              (notification.type as string) === 'repair' ? `/repair/${notification.relatedId}` : '/'
                            }
                            className="text-sm text-primary hover:underline"
                          >
                            Voir les détails
                          </Link>
                        )}
                        <div className="flex space-x-2">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                              title="Marquer comme lu"
                              className="text-gray-500 hover:text-primary"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              <span className="hidden sm:inline">Marquer comme lu</span>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNotification(notification.id)}
                            title="Supprimer"
                            className="text-gray-500 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Supprimer</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};

export default NotificationsPage;
