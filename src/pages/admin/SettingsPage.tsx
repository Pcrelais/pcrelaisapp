import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabaseConfig';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description: string;
  created_at: string;
  updated_at: string;
}

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  useEffect(() => {
    fetchSettings();
  }, []);
  
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Essayer de récupérer les paramètres directement
      // Si la table n'existe pas, cela générera une erreur
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .limit(1);
      
      // Si nous avons une erreur 404 ou une erreur de relation, cela signifie que la table n'existe pas
      const tableNotExists = error && (error.code === '404' || error.message.includes('does not exist'));
      
      if (tableNotExists) {
        // La table n'existe pas, on crée des paramètres par défaut
        setSettings([
          {
            id: 'default-1',
            key: 'company_name',
            value: 'PC Relais',
            description: 'Nom de l\'entreprise',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'default-2',
            key: 'contact_email',
            value: 'contact@pcrelais.fr',
            description: 'Email de contact',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'default-3',
            key: 'contact_phone',
            value: '01 23 45 67 89',
            description: 'Téléphone de contact',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'default-4',
            key: 'default_repair_price',
            value: '49.99',
            description: 'Prix par défaut d\'une réparation (€)',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'default-5',
            key: 'max_repair_days',
            value: '14',
            description: 'Nombre maximum de jours pour une réparation',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
        setError("La table des paramètres système n'existe pas encore. Les paramètres affichés sont des valeurs par défaut et ne seront pas enregistrés.");
      } else {
        // La table existe, on récupère les paramètres
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')
          .order('key', { ascending: true });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setSettings(data);
        } else {
          // Aucun paramètre trouvé, on propose des valeurs par défaut
          setSettings([
            {
              id: 'default-1',
              key: 'company_name',
              value: 'PC Relais',
              description: 'Nom de l\'entreprise',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'default-2',
              key: 'contact_email',
              value: 'contact@pcrelais.fr',
              description: 'Email de contact',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'default-3',
              key: 'contact_phone',
              value: '01 23 45 67 89',
              description: 'Téléphone de contact',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'default-4',
              key: 'default_repair_price',
              value: '49.99',
              description: 'Prix par défaut d\'une réparation (€)',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 'default-5',
              key: 'max_repair_days',
              value: '14',
              description: 'Nombre maximum de jours pour une réparation',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);
          setError("Aucun paramètre système trouvé. Les paramètres affichés sont des valeurs par défaut.");
        }
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération des paramètres:', error);
      setError(error.message || 'Erreur lors de la récupération des paramètres système.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (id: string, value: string) => {
    setSettings(prevSettings => 
      prevSettings.map(setting => 
        setting.id === id ? { ...setting, value } : setting
      )
    );
  };
  
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Essayer de récupérer les paramètres directement
      // Si la table n'existe pas, cela générera une erreur
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .limit(1);
      
      // Si nous avons une erreur 404 ou une erreur de relation, cela signifie que la table n'existe pas
      const tableNotExists = error && (error.code === '404' || error.message.includes('does not exist'));
      
      if (tableNotExists) {
        setError("La table des paramètres système n'existe pas encore. Veuillez exécuter la migration pour créer cette table.");
        return;
      }
      
      // La table existe, on met à jour les paramètres
      for (const setting of settings) {
        const { error } = await supabase
          .from('system_settings')
          .upsert({
            id: setting.id.startsWith('default-') ? undefined : setting.id,
            key: setting.key,
            value: setting.value,
            description: setting.description,
            updated_at: new Date().toISOString()
          });
        
        if (error) throw error;
      }
      
      setSuccessMessage("Paramètres système mis à jour avec succès.");
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Rafraîchir les paramètres
      fetchSettings();
      
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error);
      setError(error.message || 'Erreur lors de la sauvegarde des paramètres système.');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/admin')}
          className="mr-4"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold">Paramètres du système</h1>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-md text-error">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-6 p-4 bg-success/10 border border-success/20 rounded-md text-success">
          {successMessage}
        </div>
      )}
      
      <div className="mb-6 flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={fetchSettings}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Rafraîchir
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={saving || loading}
        >
          {saving ? (
            <>
              <div className="animate-spin h-4 w-4 mr-2 border-b-2 border-white rounded-full"></div>
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </>
          )}
        </Button>
      </div>
      
      <Card>
        <Card.Header>
          <Card.Title>Paramètres généraux</Card.Title>
        </Card.Header>
        <Card.Content>
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {settings.map((setting) => (
                <div key={setting.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div>
                    <label htmlFor={`setting-${setting.id}`} className="block text-sm font-medium text-gray-700">
                      {setting.description}
                    </label>
                    <p className="text-xs text-gray-500">{setting.key}</p>
                  </div>
                  <div className="md:col-span-2">
                    <input
                      id={`setting-${setting.id}`}
                      type="text"
                      value={setting.value}
                      onChange={(e) => handleChange(setting.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>
      
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="text-lg font-medium text-blue-800 mb-2">Création de la table des paramètres</h3>
        <p className="text-sm text-blue-700 mb-4">
          Si vous rencontrez des erreurs concernant la table des paramètres, vous pouvez créer la migration SQL suivante :
        </p>
        <pre className="bg-gray-800 text-white p-4 rounded-md text-sm overflow-x-auto">
{`-- Création de la table des paramètres système
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Création d'une fonction pour vérifier si une table existe
CREATE OR REPLACE FUNCTION check_table_exists(table_name text)
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
      AND table_name = $1
  ) INTO table_exists;
  
  RETURN table_exists;
END;
$$;

-- Autoriser l'accès à cette fonction pour tous les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION check_table_exists TO authenticated;

-- Ajouter des paramètres par défaut
INSERT INTO system_settings (key, value, description)
VALUES
  ('company_name', 'PC Relais', 'Nom de l''entreprise'),
  ('contact_email', 'contact@pcrelais.fr', 'Email de contact'),
  ('contact_phone', '01 23 45 67 89', 'Téléphone de contact'),
  ('default_repair_price', '49.99', 'Prix par défaut d''une réparation (€)'),
  ('max_repair_days', '14', 'Nombre maximum de jours pour une réparation')
ON CONFLICT (key) DO NOTHING;

-- Ajouter les politiques RLS
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Politique pour les administrateurs (lecture et écriture)
CREATE POLICY admin_system_settings ON system_settings
  FOR ALL
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Politique pour les autres utilisateurs (lecture seule)
CREATE POLICY read_system_settings ON system_settings
  FOR SELECT
  USING (true);`}
        </pre>
      </div>
    </div>
  );
};

export default SettingsPage;
