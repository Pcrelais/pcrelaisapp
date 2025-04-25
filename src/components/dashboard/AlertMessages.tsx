import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface AlertMessagesProps {
  successMessage: string | null;
  errorMessage: string | null;
  onClearSuccess: () => void;
  onClearError: () => void;
}

const AlertMessages: React.FC<AlertMessagesProps> = ({
  successMessage,
  errorMessage,
  onClearSuccess,
  onClearError
}) => {
  return (
    <>
      {successMessage && (
        <div className="bg-white border-l-4 border-green-500 shadow-sm rounded-lg p-4 mb-6 flex items-start" role="alert">
          <div className="bg-green-100 p-2 rounded-full mr-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="font-medium text-gray-800">Opération réussie</p>
            <p className="text-gray-600">{successMessage}</p>
          </div>
          <button 
            className="ml-auto text-gray-400 hover:text-gray-500"
            onClick={onClearSuccess}
          >
            <span className="sr-only">Fermer</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      
      {errorMessage && (
        <div className="bg-white border-l-4 border-red-500 shadow-sm rounded-lg p-4 mb-6 flex items-start" role="alert">
          <div className="bg-red-100 p-2 rounded-full mr-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="font-medium text-gray-800">Une erreur est survenue</p>
            <p className="text-gray-600">{errorMessage}</p>
          </div>
          <button 
            className="ml-auto text-gray-400 hover:text-gray-500"
            onClick={onClearError}
          >
            <span className="sr-only">Fermer</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
};

export default AlertMessages;
