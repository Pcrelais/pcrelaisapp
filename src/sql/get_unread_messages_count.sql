-- Fonction pour compter les messages non lus par utilisateur
CREATE OR REPLACE FUNCTION get_unread_messages_count(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT cm.request_id) INTO unread_count
  FROM chat_messages cm
  LEFT JOIN chat_messages_read_status cmrs ON cm.request_id = cmrs.request_id AND cmrs.user_id = $1
  WHERE 
    -- Messages destinés à l'utilisateur (soit il est client, soit il est technicien)
    (
      (cm.request_id IN (SELECT id FROM repair_requests WHERE client_id = $1)) OR
      (cm.request_id IN (SELECT id FROM repair_requests WHERE technician_id = $1))
    )
    -- Message non envoyé par l'utilisateur lui-même
    AND cm.sender_id != $1
    -- Message non lu (soit pas d'entrée dans la table de statut, soit message plus récent que la dernière lecture)
    AND (cmrs.last_read IS NULL OR cm.timestamp > cmrs.last_read);
    
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql;

-- Exemple d'utilisation:
-- SELECT get_unread_messages_count('user-uuid-here');
