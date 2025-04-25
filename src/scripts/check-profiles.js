// Script pour vérifier les profils existants dans Supabase
import { createClient } from '@supabase/supabase-js';

// Informations de connexion Supabase
const supabaseUrl = 'https://bijodgezlhkpdaimijpe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpam9kZ2V6bGhrcGRhaW1panBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MDE3NjUsImV4cCI6MjA2MDk3Nzc2NX0.gnZqsq_AePCmVoDmNVyQzRv7n8jhmzdAQ7ZdFhyyfoE';

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProfiles() {
  console.log('Vérification des profils dans Supabase...');
  
  // Récupérer tous les profils
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*');
  
  if (error) {
    console.error('Erreur lors de la récupération des profils:', error);
    return;
  }
  
  console.log(`${profiles.length} profils trouvés:`);
  profiles.forEach(profile => {
    console.log(`- ID: ${profile.id}`);
    console.log(`  Email: ${profile.email}`);
    console.log(`  Nom: ${profile.first_name} ${profile.last_name}`);
    console.log(`  Rôle: ${profile.role}`);
    console.log('---');
  });
  
  // Vérifier également les utilisateurs dans auth.users
  console.log('\nVérification des utilisateurs dans auth.users...');
  
  try {
    // Cette requête nécessite des privilèges d'administrateur
    const { data: users, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Erreur lors de la récupération des utilisateurs auth:', authError);
      console.log('Note: La récupération des utilisateurs auth nécessite des privilèges d\'administrateur.');
      return;
    }
    
    console.log(`${users.length} utilisateurs auth trouvés:`);
    users.forEach(user => {
      console.log(`- ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Confirmé: ${user.email_confirmed_at ? 'Oui' : 'Non'}`);
      console.log('---');
    });
  } catch (e) {
    console.log('Note: La récupération des utilisateurs auth nécessite des privilèges d\'administrateur.');
  }
}

// Exécuter la fonction
checkProfiles()
  .catch(err => console.error('Erreur non gérée:', err))
  .finally(() => process.exit(0));
