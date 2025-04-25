import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { AlertCircle, CheckCircle, Wrench, Clock, Euro } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { technicianService } from '../../services/technicianService';

const TechnicianDiagnosticPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { repairId } = useParams<{ repairId: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ message: string } | null>(null);
  const [repair, setRepair] = useState<any | null>(null);
  
  // Formulaire de diagnostic
  const [diagnosis, setDiagnosis] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number | ''>('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [technicianNotes, setTechnicianNotes] = useState('');

  // Vérifier que l'utilisateur est un technicien
  if (!user || user.role !== 'technician') {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <Card>
            <Card.Content>
              <div className="p-4 text-center">
                <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès non autorisé</h2>
                <p className="text-gray-600 mb-4">
                  Vous devez être connecté en tant que technicien pour accéder à cette page.
                </p>
                <Button variant="primary" onClick={() => navigate('/login')}>
                  Se connecter
                </Button>
              </div>
            </Card.Content>
          </Card>
        </div>
      </Layout>
    );
  }

  // Charger les détails de la réparation
  useEffect(() => {
    const loadRepairDetails = async () => {
      if (!repairId) return;
      
      try {
        setLoading(true);
        const repairs = await technicianService.getTechnicianRepairs(user.id);
        const foundRepair = repairs.find(r => r.id === repairId);
        
        if (foundRepair) {
          setRepair(foundRepair);
          // Pré-remplir les champs si des données existent déjà
          if (foundRepair.preDiagnosis) setDiagnosis(foundRepair.preDiagnosis);
          if (foundRepair.estimatedCost) setEstimatedCost(foundRepair.estimatedCost);
          if (foundRepair.notes) setTechnicianNotes(foundRepair.notes);
        } else {
          setError('Réparation non trouvée ou non assignée à ce technicien.');
        }
      } catch (err) {
        console.error('Erreur lors du chargement des détails de la réparation:', err);
        setError('Impossible de charger les détails de la réparation.');
      } finally {
        setLoading(false);
      }
    };

    loadRepairDetails();
  }, [repairId, user.id]);

  // Soumettre le diagnostic et le devis
  const handleSubmitDiagnostic = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!diagnosis || !estimatedCost || !estimatedTime) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const success = await technicianService.updateDiagnosticAndSendQuote(
        repairId as string,
        {
          preDiagnosis: diagnosis,
          estimatedCost: typeof estimatedCost === 'string' ? parseFloat(estimatedCost) : estimatedCost,
          estimatedTime,
          notes: technicianNotes
        }
      );
      
      if (success) {
        setSuccess({
          message: 'Diagnostic et devis envoyés avec succès au client.'
        });
      } else {
        setError('Erreur lors de l\'envoi du diagnostic et du devis.');
      }
    } catch (err) {
      console.error('Erreur lors de l\'envoi du diagnostic:', err);
      setError('Une erreur est survenue lors de l\'envoi du diagnostic.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <Card>
          <Card.Header>
            <h1 className="text-2xl font-bold text-gray-900">Diagnostic et devis</h1>
            <p className="text-gray-600">
              Établissez un diagnostic et proposez un devis pour la réparation.
            </p>
          </Card.Header>
          
          <Card.Content>
            {loading && !repair ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
                <p className="mt-4 text-gray-500">Chargement des détails...</p>
              </div>
            ) : repair ? (
              <div className="space-y-6">
                {/* Informations sur l'appareil */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h2 className="font-semibold text-lg text-gray-900 mb-3">Informations sur l'appareil</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Type d'appareil</p>
                      <p className="font-medium">{repair.deviceType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Marque et modèle</p>
                      <p className="font-medium">{repair.brand} {repair.model}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Client</p>
                      <p className="font-medium">{repair.clientName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date de dépôt</p>
                      <p className="font-medium">{new Date(repair.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-sm text-gray-500">Description du problème</p>
                    <p className="mt-1">{repair.problemDescription}</p>
                  </div>
                </div>
                
                {/* Formulaire de diagnostic */}
                <form onSubmit={handleSubmitDiagnostic} className="space-y-6">
                  <div>
                    <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 mb-1">
                      Diagnostic <span className="text-error">*</span>
                    </label>
                    <textarea
                      id="diagnosis"
                      rows={4}
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Décrivez le problème identifié et les réparations nécessaires"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="estimatedCost" className="block text-sm font-medium text-gray-700 mb-1">
                        Coût estimé (€) <span className="text-error">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Euro className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          id="estimatedCost"
                          value={estimatedCost}
                          onChange={(e) => setEstimatedCost(e.target.value ? parseFloat(e.target.value) : '')}
                          className="block w-full rounded-md border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="estimatedTime" className="block text-sm font-medium text-gray-700 mb-1">
                        Délai estimé <span className="text-error">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Clock className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          id="estimatedTime"
                          value={estimatedTime}
                          onChange={(e) => setEstimatedTime(e.target.value)}
                          className="block w-full rounded-md border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          required
                        >
                          <option value="">Sélectionnez un délai</option>
                          <option value="24 heures">24 heures</option>
                          <option value="2-3 jours">2-3 jours</option>
                          <option value="1 semaine">1 semaine</option>
                          <option value="2 semaines">2 semaines</option>
                          <option value="3-4 semaines">3-4 semaines</option>
                          <option value="Plus d'un mois">Plus d'un mois</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="technicianNotes" className="block text-sm font-medium text-gray-700 mb-1">
                      Notes techniques (non visibles par le client)
                    </label>
                    <textarea
                      id="technicianNotes"
                      rows={3}
                      value={technicianNotes}
                      onChange={(e) => setTechnicianNotes(e.target.value)}
                      className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Notes internes pour vous ou d'autres techniciens"
                    />
                  </div>
                  
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm text-blue-800">
                          Le client recevra une notification avec votre diagnostic et le devis. Il pourra accepter ou refuser le devis.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => navigate('/technician/dashboard')}
                      disabled={loading}
                    >
                      Annuler
                    </Button>
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={loading || !diagnosis || !estimatedCost || !estimatedTime}
                      icon={<Wrench className="h-5 w-5 mr-2" />}
                    >
                      {loading ? 'Envoi en cours...' : 'Envoyer le devis'}
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center py-16">
                <AlertCircle className="h-12 w-12 text-error mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">Réparation non trouvée</h3>
                <p className="text-gray-500 mb-4">Cette réparation n'existe pas ou n'est pas assignée à votre compte.</p>
                <Button
                  variant="primary"
                  onClick={() => navigate('/technician/dashboard')}
                >
                  Retour au tableau de bord
                </Button>
              </div>
            )}
            
            {error && (
              <div className="p-4 mt-6 bg-error/10 border border-error/20 rounded-lg flex items-start">
                <AlertCircle className="h-5 w-5 text-error mr-2 mt-0.5" />
                <div className="text-error">{error}</div>
              </div>
            )}
            
            {success && (
              <div className="p-4 mt-6 bg-success/10 border border-success/20 rounded-lg flex items-start">
                <CheckCircle className="h-5 w-5 text-success mr-2 mt-0.5" />
                <div>
                  <p className="text-success font-medium">{success.message}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Vous serez notifié lorsque le client aura accepté ou refusé le devis.
                  </p>
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/technician/dashboard')}
                    >
                      Retour au tableau de bord
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card.Content>
        </Card>
      </div>
    </Layout>
  );
};

export default TechnicianDiagnosticPage;
