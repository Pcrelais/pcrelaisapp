-- Supprimer la fonction existante si elle existe
DROP FUNCTION IF EXISTS check_table_exists(text);

-- Créer une fonction pour vérifier si une table existe
CREATE FUNCTION check_table_exists(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  table_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND information_schema.tables.table_name = $1
  ) INTO table_exists;
  
  RETURN table_exists;
END;
$$;

-- Autoriser l'accès à cette fonction pour tous les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION check_table_exists TO authenticated;
