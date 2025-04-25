# Scripts de Migration Supabase pour PC Relais

Ce répertoire contient les scripts SQL nécessaires pour initialiser et configurer la base de données Supabase utilisée par l'application PC Relais.

## Structure des Fichiers

- `migrations/00_init_schema.sql` : Création des schémas et tables principales
- `migrations/01_repair_requests.sql` : Tables liées aux demandes de réparation
- `migrations/02_chat_notifications.sql` : Tables pour la messagerie et les notifications
- `migrations/03_storage_rls.sql` : Configuration du stockage et des politiques RLS
- `migrations/04_seed_data.sql` : Données initiales pour les tables de référence

## Comment Exécuter les Scripts

### Option 1 : Via l'Interface Web Supabase

1. Connectez-vous à votre [dashboard Supabase](https://app.supabase.io)
2. Sélectionnez votre projet (`bijodgezlhkpdaimijpe`)
3. Allez dans la section "SQL Editor"
4. Créez une nouvelle requête
5. Copiez-collez le contenu de chaque script dans l'ordre (00, 01, 02, 03, 04)
6. Exécutez chaque script en cliquant sur "Run"

### Option 2 : Via l'API Supabase

Vous pouvez également exécuter ces scripts via l'API Supabase en utilisant la fonction `rpc` :

```typescript
import { supabase } from '../lib/supabase';

const executeMigration = async (sqlScript: string) => {
  const { data, error } = await supabase.rpc('exec_sql', { sql: sqlScript });
  
  if (error) {
    console.error('Erreur lors de l\'exécution du script :', error);
    return false;
  }
  
  console.log('Script exécuté avec succès :', data);
  return true;
};
```

### Option 3 : Via le CLI Supabase

Si vous avez installé le [CLI Supabase](https://supabase.io/docs/guides/cli), vous pouvez exécuter :

```bash
# Assurez-vous d'être connecté à votre projet
supabase link --project-ref bijodgezlhkpdaimijpe

# Exécutez chaque script dans l'ordre
supabase db execute --file src/db/migrations/00_init_schema.sql
supabase db execute --file src/db/migrations/01_repair_requests.sql
supabase db execute --file src/db/migrations/02_chat_notifications.sql
supabase db execute --file src/db/migrations/03_storage_rls.sql
supabase db execute --file src/db/migrations/04_seed_data.sql
```

## Ordre d'Exécution

Il est important d'exécuter les scripts dans l'ordre numérique car ils contiennent des dépendances entre eux :

1. `00_init_schema.sql` - Crée les tables de base
2. `01_repair_requests.sql` - Crée les tables qui dépendent des tables de base
3. `02_chat_notifications.sql` - Crée les tables de messagerie et notifications
4. `03_storage_rls.sql` - Configure le stockage et les politiques de sécurité
5. `04_seed_data.sql` - Insère les données initiales

## Notes Importantes

- Ces scripts sont idempotents et peuvent être exécutés plusieurs fois sans créer de duplications
- Les politiques RLS (Row Level Security) sont configurées pour protéger vos données
- Les buckets de stockage sont configurés avec des limites de taille et des types MIME autorisés
- Un déclencheur est créé pour mettre à jour automatiquement les champs `updated_at`

## Après l'Exécution

Après avoir exécuté tous les scripts, votre base de données Supabase sera prête à être utilisée avec l'application PC Relais. Vous pourrez alors :

1. Créer des utilisateurs via l'authentification Supabase
2. Soumettre des demandes de réparation
3. Gérer les réparations et les communications
4. Télécharger et partager des fichiers

## Dépannage

Si vous rencontrez des erreurs lors de l'exécution des scripts :

1. Vérifiez que vous avez les permissions nécessaires dans Supabase
2. Assurez-vous que vous exécutez les scripts dans le bon ordre
3. Consultez les logs d'erreur dans l'interface Supabase
4. Si une table existe déjà, le script ne la recréera pas grâce aux clauses `IF NOT EXISTS`
