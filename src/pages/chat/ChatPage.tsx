import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  User, 
  Wrench, 
  Info,
  Image,
  FileText,
  Paperclip,
  Download,
  Loader2,
  X,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseConfig';
import Button from '../../components/ui/Button';
import PushNotificationToggle from '../../components/ui/PushNotificationToggle';
import { chatService, ChatMessage } from '../../services/chatService';
import FileUploader from '../../components/ui/FileUploader';
import FileViewer from '../../components/ui/FileViewer';
import { FileMetadata } from '../../services/fileStorageService';

interface RepairInfo {
  id: string;
  brand: string;
  model: string;
  clientId: string;
  clientName?: string;
  technicianId?: string;
  technicianName?: string;
  statusLabel?: string;
}

const ChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [repair, setRepair] = useState<RepairInfo | null>(null);
  const [typingUsers, setTypingUsers] = useState<{[key: string]: boolean}>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [exportingHistory, setExportingHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Récupérer les informations de la réparation et les messages
  useEffect(() => {
    const fetchData = async () => {
      if (!id || !user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Récupérer les détails de la réparation
        const { data: repairData, error: repairError } = await supabase
          .from('repair_requests')
          .select(`
            id,
            brand,
            model,
            client_id,
            technician_id,
            status:repair_statuses!inner(label),
            client:profiles!client_id(first_name, last_name),
            technician:profiles!technician_id(first_name, last_name)
          `)
          .eq('id', id)
          .single();
        
        if (repairError) throw repairError;
        
        if (!repairData) {
          setError('Réparation non trouvée');
          return;
        }
        
        // Vérifier si l'utilisateur est autorisé à accéder à cette conversation
        if (user.id !== repairData.client_id && user.id !== repairData.technician_id && user.role !== 'admin') {
          setError('Vous n\'êtes pas autorisé à accéder à cette conversation');
          return;
        }
        
        // Formater les données de la réparation
        const formattedRepair: RepairInfo = {
          id: repairData.id,
          brand: repairData.brand,
          model: repairData.model,
          clientId: repairData.client_id,
          clientName: repairData.client && repairData.client[0] ? `${repairData.client[0].first_name} ${repairData.client[0].last_name}` : undefined,
          technicianId: repairData.technician_id,
          technicianName: repairData.technician && repairData.technician[0] ? `${repairData.technician[0].first_name} ${repairData.technician[0].last_name}` : undefined,
          statusLabel: repairData.status && repairData.status[0] ? repairData.status[0].label : undefined
        };
        
        setRepair(formattedRepair);
        
        // Récupérer les messages de chat
        const chatMessages = await chatService.getChatMessages(id);
        setMessages(chatMessages);0
        
        // Marquer les messages comme lus
        await chatService.markMessagesAsRead(id, user.id);
        
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError('Impossible de charger les données. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // S'abonner aux nouveaux messages
    const messageSubscription = chatService.subscribeToMessages(id || '', (newMessage) => {
      setMessages(prev => {
        // Vérifier si le message existe déjà
        const exists = prev.some(msg => msg.id === newMessage.id);
        if (exists) return prev;
        
        // Ajouter le nouveau message
        return [...prev, newMessage];
      });
      
      // Marquer le message comme lu si l'utilisateur est actif
      if (user && newMessage.senderId !== user.id) {
        chatService.markMessagesAsRead(id || '', user.id);
      }
    });
    
    // S'abonner aux indicateurs de frappe
    const typingSubscription = chatService.subscribeToTypingEvents(id || '', (typingData) => {
      if (typingData.userId !== user?.id) {
        setTypingUsers(prev => ({
          ...prev,
          [typingData.userId]: typingData.isTyping
        }));
        
        // Réinitialiser l'indicateur après un délai
        if (typingData.isTyping) {
          setTimeout(() => {
            setTypingUsers(prev => ({
              ...prev,
              [typingData.userId]: false
            }));
          }, 5000);
        }
      }
    });
    
    // Faire défiler vers le bas lorsque de nouveaux messages arrivent
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Nettoyer les abonnements
    return () => {
      messageSubscription();
      typingSubscription();
    };
  }, [id, user]);
  
  // Faire défiler vers le bas lorsque de nouveaux messages arrivent
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Gérer l'envoi d'un nouveau message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && !selectedFile) || !id || !user || sending) return;
    
    try {
      setSending(true);
      
      const message = await chatService.sendMessage({
        requestId: id,
        senderId: user.id,
        senderRole: user.role as 'client' | 'technician' | 'admin' | 'relayPoint',
        message: newMessage.trim(),
        isAi: false
      }, selectedFile || undefined);
      
      if (message) {
        setNewMessage('');
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
    } finally {
      setSending(false);
    }
  };
  
  // Gérer la sélection de fichier
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setSelectedFile(file);
    
    // Réinitialiser l'input file
    e.target.value = '';
  };
  
  // Gérer l'exportation de l'historique de conversation
  const handleExportHistory = async () => {
    if (!id || !user || exportingHistory || messages.length === 0) return;
    
    try {
      setExportingHistory(true);
      
      const pdfUrl = await chatService.exportChatHistory(id);
      
      if (pdfUrl) {
        // Ouvrir le PDF dans un nouvel onglet
        window.open(pdfUrl, '_blank');
      }
    } catch (error) {
      console.error('Erreur lors de l\'exportation de l\'historique:', error);
    } finally {
      setExportingHistory(false);
    }
  };
  
  // Gérer la frappe en cours
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (id && user) {
      chatService.updateTypingStatus(id, user.id, true);
    }
  };
  
  // Formater la date pour l'affichage
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Rendre une pièce jointe
  const renderAttachment = (message: ChatMessage) => {
    if (!message.attachmentUrl) return null;
    
    // Créer un objet FileMetadata à partir des données du message
    const fileMetadata: FileMetadata = {
      id: message.id || '',
      name: `Fichier ${message.attachmentType || 'joint'}`,
      size: 0, // Taille inconnue
      type: message.attachmentType === 'image' ? 'image/jpeg' : 'application/octet-stream',
      url: message.attachmentUrl,
      createdAt: message.timestamp || new Date().toISOString(),
      userId: message.senderId,
      messageId: message.id
    };
    
    return (
      <div className="mt-2 max-w-sm">
        <FileViewer file={fileMetadata} showDelete={false} />
      </div>
    );
  };
  
  // Vérifier si quelqu'un est en train de taper
  const isAnyoneTyping = Object.values(typingUsers).some(isTyping => isTyping);
  
  // Formater la date pour les séparateurs de jour
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Aujourd\'hui';
    if (date.toDateString() === yesterday.toDateString()) return 'Hier';
    return date.toLocaleDateString();
  };
  
  // Vérifier si un message doit afficher un séparateur de date
  const shouldShowDateSeparator = (index: number) => {
    if (index === 0) return true;
    
    const currentDate = new Date(messages[index].timestamp || '').toDateString();
    const prevDate = new Date(messages[index - 1].timestamp || '').toDateString();
    
    return currentDate !== prevDate;
  };
  
  return (
    <div className="flex flex-col h-screen">
      {/* En-tête */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          {repair && (
            <div>
              <h1 className="text-lg font-medium">
                {repair.brand} {repair.model}
              </h1>
              <div className="flex items-center text-sm text-gray-500">
                {repair.clientName && (
                  <div className="flex items-center mr-4">
                    <User className="h-4 w-4 mr-1" />
                    <span>{repair.clientName}</span>
                  </div>
                )}
                {repair.technicianName && (
                  <div className="flex items-center mr-4">
                    <Wrench className="h-4 w-4 mr-1" />
                    <span>{repair.technicianName}</span>
                  </div>
                )}
                {repair.statusLabel && (
                  <div className="flex items-center">
                    <Info className="h-4 w-4 mr-1" />
                    <span>{repair.statusLabel}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div>
          <PushNotificationToggle />
        </div>
      </div>
      
      {/* Zone de messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Chargement des messages...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-4 bg-white rounded-lg shadow">
              <Info className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-500">{error}</p>
              {!repair && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate(-1)}
                >
                  Retour
                </Button>
              )}
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-4 bg-white rounded-lg shadow">
              <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Aucun message pour le moment.</p>
              <p className="text-gray-500 text-sm mt-1">
                Envoyez un message pour démarrer la conversation.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <React.Fragment key={message.id || index}>
                {shouldShowDateSeparator(index) && (
                  <div className="flex justify-center my-4">
                    <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                      {formatDate(message.timestamp || '')}
                    </div>
                  </div>
                )}
                
                <div className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${message.senderId === user?.id ? 'bg-primary text-white' : 'bg-white'} rounded-lg p-3 shadow`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">
                        {message.senderId === user?.id ? 'Vous' : 
                          message.senderRole === 'client' ? 'Client' :
                          message.senderRole === 'technician' ? 'Technicien' :
                          message.senderRole === 'admin' ? 'Admin' : 'Point Relais'}
                      </span>
                      <span className={`text-xs ${message.senderId === user?.id ? 'text-primary-foreground' : 'text-gray-500'}`}>
                        {formatTime(message.timestamp || '')}
                      </span>
                    </div>
                    <p className={`${message.senderId === user?.id ? 'text-primary-foreground' : 'text-gray-800'}`}>
                      {message.message}
                    </p>
                    {renderAttachment(message)}
                  </div>
                </div>
              </React.Fragment>
            ))}
            {isAnyoneTyping && (
              <div className="flex justify-start my-2">
                <div className="bg-gray-100 text-gray-600 rounded-lg p-2 px-4 flex items-center">
                  <div className="flex space-x-1 mr-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '600ms' }}></div>
                  </div>
                  <span className="text-xs">En train d'écrire...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Formulaire d'envoi de message */}
      <form 
        onSubmit={handleSendMessage}
        className="p-4 border-t bg-white"
      >
        {selectedFile && (
          <div className="mb-2 p-2 bg-gray-50 border rounded-lg flex items-center">
            <div className="flex-1 flex items-center overflow-hidden">
              {selectedFile.type.startsWith('image/') ? (
                <Image className="h-5 w-5 text-gray-500 mr-2" />
              ) : (
                <FileText className="h-5 w-5 text-gray-500 mr-2" />
              )}
              <span className="text-sm truncate">{selectedFile.name}</span>
            </div>
            <button 
              type="button" 
              className="ml-2 text-gray-500 hover:text-gray-700"
              onClick={() => setSelectedFile(null)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        
        <div className="mb-2">
          <div className="flex space-x-2">
            <FileUploader
              onFileUploaded={(fileUrl, fileName, fileType) => {
                // Créer un objet File à partir de l'URL
                if (id && user) {
                  setSending(true);
                  // Récupérer le fichier à partir de l'URL
                  fetch(fileUrl)
                    .then(response => response.blob())
                    .then(blob => {
                      // Créer un objet File à partir du blob
                      const file = new File([blob], fileName, { type: fileType });
                      
                      // Envoyer le message avec le fichier
                      return chatService.sendMessage({
                        requestId: id,
                        senderId: user.id,
                        senderRole: user.role as 'client' | 'technician' | 'admin' | 'relayPoint',
                        message: 'Fichier envoyé',
                        isAi: false
                      }, file);
                    })
                    .then(message => {
                    if (message) {
                      setMessages(prev => [...prev, message]);
                      setNewMessage('');
                    }
                  }).finally(() => {
                    setSending(false);
                  });
                }
              }}
              acceptedFileType="image"
              messageId={id}
              className="flex-1"
            />
            
            <FileUploader
              onFileUploaded={(fileUrl, fileName, fileType) => {
                // Créer un objet File à partir de l'URL
                if (id && user) {
                  setSending(true);
                  // Récupérer le fichier à partir de l'URL
                  fetch(fileUrl)
                    .then(response => response.blob())
                    .then(blob => {
                      // Créer un objet File à partir du blob
                      const file = new File([blob], fileName, { type: fileType });
                      
                      // Envoyer le message avec le fichier
                      return chatService.sendMessage({
                        requestId: id,
                        senderId: user.id,
                        senderRole: user.role as 'client' | 'technician' | 'admin' | 'relayPoint',
                        message: 'Fichier envoyé',
                        isAi: false
                      }, file);
                    })
                    .then(message => {
                    if (message) {
                      setMessages(prev => [...prev, message]);
                      setNewMessage('');
                    }
                  }).finally(() => {
                    setSending(false);
                  });
                }
              }}
              acceptedFileType="document"
              messageId={id}
              className="flex-1"
            />
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="relative">
            <button
              type="button"
              className="p-3 border rounded-l-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
            >
              <Paperclip className="h-5 w-5 text-gray-500" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              disabled={sending}
            />
          </div>
          
          <input
            type="text"
            className="flex-1 p-3 border-y border-r-0 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Tapez votre message..."
            value={newMessage}
            onChange={handleTyping}
            disabled={sending}
          />
          
          <div className="flex">
            <Button
              type="button"
              variant="outline"
              className="rounded-none border-y"
              onClick={handleExportHistory}
              disabled={sending || exportingHistory || messages.length === 0}
            >
              {exportingHistory ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Download className="h-5 w-5" />
              )}
            </Button>
            
            <Button
              type="submit"
              variant="primary"
              className="rounded-l-none"
              disabled={((!newMessage.trim() && !selectedFile) || sending)}
            >
              {sending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatPage;
