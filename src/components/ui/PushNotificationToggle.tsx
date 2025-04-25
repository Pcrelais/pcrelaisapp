import React, { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { pushNotificationService } from '../../services/pushNotificationService';
import Button from './Button';

interface PushNotificationToggleProps {
  className?: string;
}

const PushNotificationToggle: React.FC<PushNotificationToggleProps> = ({ className }) => {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Vérifier si les notifications sont supportées
        if (!pushNotificationService.isPushSupported()) {
          setError('Les notifications ne sont pas supportées par votre navigateur');
          return;
        }
        
        // Vérifier si l'utilisateur est déjà abonné
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        setIsSubscribed(!!subscription);
      } catch (err) {
        console.error('Erreur lors de la vérification de l\'abonnement:', err);
        setError('Impossible de vérifier l\'état des notifications');
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [user]);

  const handleToggleSubscription = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      if (isSubscribed) {
        // Se désabonner
        const success = await pushNotificationService.unsubscribe(user.id);
        if (success) {
          setIsSubscribed(false);
        } else {
          throw new Error('Échec du désabonnement');
        }
      } else {
        // S'abonner
        const subscription = await pushNotificationService.subscribe(user.id);
        if (subscription) {
          setIsSubscribed(true);
        } else {
          throw new Error('Échec de l\'abonnement');
        }
      }
    } catch (err) {
      console.error('Erreur lors de la gestion de l\'abonnement:', err);
      setError('Impossible de gérer les notifications');
    } finally {
      setLoading(false);
    }
  };

  if (!pushNotificationService.isPushSupported()) {
    return null;
  }

  return (
    <div className={className}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggleSubscription}
        disabled={loading}
        className={`flex items-center ${isSubscribed ? 'text-primary' : 'text-gray-500'}`}
        title={isSubscribed ? 'Désactiver les notifications' : 'Activer les notifications'}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
        ) : isSubscribed ? (
          <Bell className="h-4 w-4" />
        ) : (
          <BellOff className="h-4 w-4" />
        )}
        <span className="ml-2 hidden md:inline">
          {isSubscribed ? 'Notifications activées' : 'Activer les notifications'}
        </span>
      </Button>
      
      {error && (
        <div className="text-xs text-error mt-1">{error}</div>
      )}
    </div>
  );
};

export default PushNotificationToggle;
