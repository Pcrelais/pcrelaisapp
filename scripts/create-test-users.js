// scripts/create-test-users.js
// Script pour créer des utilisateurs de test dans Supabase

import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = 'https://bijodgezlhkpdaimijpe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpam9kZ2V6bGhrcGRhaW1panBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0MDE3NjUsImV4cCI6MjA2MDk3Nzc2NX0.gnZqsq_AePCmVoDmNVyQzRv7n8jhmzdAQ7ZdFhyyfoE';

// Créer le client Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Fonction pour créer un utilisateur et son profil
async function createUser(email, password, firstName, lastName, role, phone, address, city, postalCode) {
  try {
    // 1. Créer l'utilisateur dans auth.users
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          role
        }
      }
    });

    if (authError) {
      console.error(`Erreur lors de la création de l'utilisateur ${email}:`, authError);
      return null;
    }

    console.log(`Utilisateur ${email} créé avec succès, ID: ${authData.user.id}`);

    // 2. Créer le profil dans public.profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        address,
        city,
        postal_code: postalCode,
        role
      });

    if (profileError) {
      console.error(`Erreur lors de la création du profil pour ${email}:`, profileError);
    } else {
      console.log(`Profil pour ${email} créé avec succès`);
    }

    return authData.user.id;
  } catch (error) {
    console.error(`Erreur inattendue pour ${email}:`, error);
    return null;
  }
}

// Fonction principale pour créer tous les utilisateurs de test
async function createTestUsers() {
  // 1. Client
  await createUser(
    'client@pcrelais.fr',
    'password123',
    'Jean',
    'Dupont',
    'client',
    '0612345678',
    '15 Rue de la Paix',
    'Paris',
    '75001'
  );

  // 2. Technicien
  await createUser(
    'tech@pcrelais.fr',
    'password123',
    'Pierre',
    'Martin',
    'technician',
    '0623456789',
    '25 Avenue des Champs-Élysées',
    'Paris',
    '75008'
  );

  // 3. Administrateur
  await createUser(
    'admin@pcrelais.fr',
    'password123',
    'Sophie',
    'Lefebvre',
    'admin',
    '0634567890',
    '10 Rue de Rivoli',
    'Paris',
    '75004'
  );

  // 4. Point Relais
  await createUser(
    'relais@pcrelais.fr',
    'password123',
    'Marc',
    'Dubois',
    'relayPoint',
    '0645678901',
    '30 Boulevard Haussmann',
    'Paris',
    '75009'
  );

  console.log('Création des utilisateurs de test terminée');
}

// Exécuter la fonction principale
createTestUsers()
  .then(() => {
    console.log('Script terminé avec succès');
    process.exit(0);
  })
  .catch(error => {
    console.error('Erreur lors de l\'exécution du script:', error);
    process.exit(1);
  });
