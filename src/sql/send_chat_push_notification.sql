-- Fonction pour envoyer une notification push lorsqu'un nouveau message est reçu
CREATE OR REPLACE FUNCTION send_chat_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  recipient_name TEXT;
  sender_name TEXT;
  repair_info RECORD;
  subscription RECORD;
  payload JSONB;
BEGIN
  -- Déterminer le destinataire (celui qui n'a pas envoyé le message)
  SELECT 
    client_id, 
    technician_id,
    brand,
    model
  INTO repair_info
  FROM repair_requests
  WHERE id = NEW.request_id;
  
  -- Si l'expéditeur est le client, le destinataire est le technicien et vice versa
  IF NEW.sender_id = repair_info.client_id THEN
    recipient_id := repair_info.technician_id;
  ELSE
    recipient_id := repair_info.client_id;
  END IF;
  
  -- Si le destinataire est null, ne pas envoyer de notification
  IF recipient_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Récupérer le nom de l'expéditeur
  SELECT 
    CONCAT(first_name, ' ', last_name) INTO sender_name
  FROM profiles
  WHERE id = NEW.sender_id;
  
  -- Récupérer le nom du destinataire
  SELECT 
    CONCAT(first_name, ' ', last_name) INTO recipient_name
  FROM profiles
  WHERE id = recipient_id;
  
  -- Pour chaque abonnement push du destinataire
  FOR subscription IN
    SELECT * FROM push_subscriptions WHERE user_id = recipient_id
  LOOP
    -- Préparer le payload de la notification
    payload := jsonb_build_object(
      'title', 'Nouveau message',
      'body', CONCAT(sender_name, ' : ', SUBSTRING(NEW.message, 1, 50), CASE WHEN LENGTH(NEW.message) > 50 THEN '...' ELSE '' END),
      'tag', 'chat_' || NEW.request_id,
      'url', '/chat/' || NEW.request_id,
      'requestId', NEW.request_id,
      'subscription', jsonb_build_object(
        'endpoint', subscription.endpoint,
        'keys', jsonb_build_object(
          'p256dh', subscription.p256dh,
          'auth', subscription.auth
        )
      )
    );
    
    -- Appeler le service de notification push via une fonction HTTP
    PERFORM http_post(
      'https://bijodgezlhkpdaimijpe.supabase.co/functions/v1/send-push-notification',
      payload,
      'application/json',
      jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'))
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur la table chat_messages
DROP TRIGGER IF EXISTS chat_push_notification_trigger ON chat_messages;
CREATE TRIGGER chat_push_notification_trigger
AFTER INSERT ON chat_messages
FOR EACH ROW
EXECUTE FUNCTION send_chat_push_notification();
