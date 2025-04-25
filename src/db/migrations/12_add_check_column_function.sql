-- Créer une fonction pour vérifier si une colonne existe dans une table
CREATE OR REPLACE FUNCTION check_column_exists(table_name text, column_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  column_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
      AND column_name = $2
  ) INTO column_exists;
  
  RETURN column_exists;
END;
$$;

-- Autoriser l'accès à cette fonction pour tous les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION check_column_exists TO authenticated;
