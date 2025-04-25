import React from 'react';
import { Link } from 'react-router-dom';
import { Monitor, Smartphone, Laptop, Cpu, MapPin, Clock, ShieldCheck, Users } from 'lucide-react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const HomePage: React.FC = () => {
  const repairServices = [
    { 
      icon: <Laptop className="h-10 w-10 text-primary" />, 
      title: 'Ordinateurs portables', 
      description: 'Réparation d\'ordinateurs portables toutes marques, problèmes logiciels ou matériels.'
    },
    { 
      icon: <Monitor className="h-10 w-10 text-primary" />, 
      title: 'Ordinateurs de bureau', 
      description: 'Dépannage, mise à niveau et réparation pour tous les PC fixes.'
    },
    { 
      icon: <Smartphone className="h-10 w-10 text-primary" />, 
      title: 'Smartphones et tablettes', 
      description: 'Réparation d\'écrans, batteries et autres problèmes sur vos appareils mobiles.'
    },
    { 
      icon: <Cpu className="h-10 w-10 text-primary" />, 
      title: 'Pièces et composants', 
      description: 'Remplacement de pièces défectueuses et mise à niveau de composants.'
    },
  ];
  
  const benefits = [
    { 
      icon: <MapPin className="h-8 w-8 text-primary" />, 
      title: 'Proximité', 
      description: 'Un réseau de points relais proches de chez vous pour déposer et récupérer vos appareils.'
    },
    { 
      icon: <Clock className="h-8 w-8 text-primary" />, 
      title: 'Rapidité', 
      description: 'Réparations effectuées dans les meilleurs délais par nos techniciens experts.'
    },
    { 
      icon: <ShieldCheck className="h-8 w-8 text-primary" />, 
      title: 'Fiabilité', 
      description: 'Garantie sur toutes nos réparations et utilisation de pièces de qualité.'
    },
    { 
      icon: <Users className="h-8 w-8 text-primary" />, 
      title: 'Support', 
      description: 'Assistance et suivi en ligne à chaque étape de la réparation.'
    },
  ];
  
  return (
    <Layout>
      {/* Hero section */}
      <section className="bg-gradient-to-br from-primary-dark via-primary to-primary-light text-white py-16 lg:py-24">
        <div className="container-app">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4">
                Réparez votre ordinateur <span className="text-secondary-light">simplement et rapidement</span>
              </h1>
              <p className="text-lg md:text-xl opacity-90 mb-8">
                Déposez votre appareil dans un point relais près de chez vous. Nos experts s'occupent du reste !
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/request-repair">
                  <Button variant="secondary" size="lg">
                    Démarrer une réparation
                  </Button>
                </Link>
                <Link to="/find-relays">
                  <Button variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white/10">
                    Trouver un point relais
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <img 
                src="https://images.pexels.com/photos/5452255/pexels-photo-5452255.jpeg?auto=compress&cs=tinysrgb&w=600" 
                alt="Réparation d'ordinateur"
                className="rounded-lg shadow-xl max-w-full h-auto animate-slide-in-up" 
              />
            </div>
          </div>
        </div>
      </section>
      
      {/* How it works section */}
      <section className="py-16 bg-white">
        <div className="container-app">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Comment ça marche ?</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              PC Relais simplifie vos réparations informatiques en 3 étapes simples
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center px-6 relative">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white text-xl font-bold mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Décrivez votre problème</h3>
              <p className="text-gray-600">
                Expliquez-nous ce qui ne va pas avec votre appareil. Notre IA vous proposera un pré-diagnostic.
              </p>
            </div>
            
            <div className="text-center px-6 relative">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white text-xl font-bold mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Déposez votre appareil</h3>
              <p className="text-gray-600">
                Choisissez un point relais près de chez vous et déposez-y votre appareil quand cela vous convient.
              </p>
            </div>
            
            <div className="text-center px-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary text-white text-xl font-bold mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Récupérez-le réparé</h3>
              <p className="text-gray-600">
                Suivez la réparation en temps réel. Une fois terminé, récupérez votre appareil au même point relais.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link to="/request-repair">
              <Button variant="primary" size="lg">
                Faire réparer mon appareil
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Services section */}
      <section className="py-16 bg-gray-50">
        <div className="container-app">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Nos services de réparation</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Des solutions pour tous vos appareils électroniques
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {repairServices.map((service, index) => (
              <Card key={index} hoverable className="h-full">
                <Card.Content className="text-center p-6">
                  <div className="flex justify-center mb-4">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                  <p className="text-gray-600">{service.description}</p>
                </Card.Content>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Testimonials section */}
      <section className="py-16 bg-white">
        <div className="container-app">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ce que disent nos clients</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Des milliers d'utilisateurs satisfaits
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="h-full">
              <Card.Content className="p-6">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Service exceptionnel ! J'ai déposé mon ordinateur portable qui ne démarrait plus, et trois jours plus tard, il fonctionnait parfaitement. La communication était excellente tout au long du processus."
                </p>
                <div className="flex items-center mt-6">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-semibold">
                    SD
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold">Sophie Dupont</h4>
                    <p className="text-sm text-gray-500">Lyon</p>
                  </div>
                </div>
              </Card.Content>
            </Card>
            
            <Card className="h-full">
              <Card.Content className="p-6">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  "Très pratique de pouvoir déposer mon smartphone dans un point relais près de chez moi ! La réparation a été faite rapidement et le prix était raisonnable. Je recommande vivement."
                </p>
                <div className="flex items-center mt-6">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-semibold">
                    TM
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold">Thomas Martin</h4>
                    <p className="text-sm text-gray-500">Paris</p>
                  </div>
                </div>
              </Card.Content>
            </Card>
            
            <Card className="h-full">
              <Card.Content className="p-6">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(4)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-4">
                  "J'apprécie beaucoup le système de suivi en ligne qui permet de connaître l'état de la réparation en temps réel. Le service client a été très réactif quand j'avais des questions."
                </p>
                <div className="flex items-center mt-6">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-semibold">
                    LC
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold">Laura Clement</h4>
                    <p className="text-sm text-gray-500">Nantes</p>
                  </div>
                </div>
              </Card.Content>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Benefits section */}
      <section className="py-16 bg-gray-50">
        <div className="container-app">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Pourquoi choisir PC Relais ?</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Des avantages uniques pour une expérience client optimale
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex flex-col items-center text-center px-4">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA section */}
      <section className="py-16 bg-primary">
        <div className="container-app">
          <div className="text-center text-white max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Prêt à réparer votre appareil ?</h2>
            <p className="text-xl opacity-90 mb-8">
              Commencez dès maintenant et bénéficiez d'un service rapide, professionnel et à proximité de chez vous.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/request-repair">
                <Button variant="secondary" size="lg">
                  Démarrer une réparation
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white/10">
                  Nous contacter
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;