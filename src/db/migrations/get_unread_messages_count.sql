-- Fonction pour compter les messages non lus pour un utilisateur
CREATE OR REPLACE FUNCTION public.get_unread_messages_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_count INTEGER;
BEGIN
  -- Compter les messages non lus pour l'utilisateur
  -- Cette requête recherche:
  -- 1. Les messages dans les réparations où l'utilisateur est client ou technicien
  -- 2. Les messages qui ne sont pas envoyés par l'utilisateur lui-même
  -- 3. Les messages qui n'ont pas été marqués comme lus dans message_read_status
  
  SELECT COUNT(*)::INTEGER INTO total_count
  FROM chat_messages cm
  JOIN repair_requests rr ON cm.repair_id = rr.id
  LEFT JOIN message_read_status mrs ON mrs.message_id = cm.id AND mrs.user_id = p_user_id
  WHERE 
    -- L'utilisateur est impliqué dans la réparation
    (rr.client_id = p_user_id OR rr.technician_id = p_user_id)
    -- Le message n'est pas envoyé par l'utilisateur
    AND cm.sender_id != p_user_id
    -- Le message n'est pas marqué comme lu
    AND (mrs.is_read IS NULL OR mrs.is_read = FALSE);
    
  RETURN total_count;
END;
$$;

-- Ajouter les commentaires pour la documentation
COMMENT ON FUNCTION public.get_unread_messages_count(UUID) IS 'Compte le nombre de messages non lus pour un utilisateur spécifique';

-- Accorder les privilèges nécessaires
GRANT EXECUTE ON FUNCTION public.get_unread_messages_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_messages_count(UUID) TO service_role;
