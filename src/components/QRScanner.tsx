import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import Button from './ui/Button';
import { Camera, StopCircle } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onScanError }) => {
  const [scanning, setScanning] = useState(false);
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);
  const qrScannerElementId = 'qr-reader';

  useEffect(() => {
    // Initialiser le scanner
    const qrCodeScanner = new Html5Qrcode(qrScannerElementId);
    setHtml5QrCode(qrCodeScanner);

    // Nettoyer lors du démontage du composant
    return () => {
      if (qrCodeScanner.isScanning) {
        qrCodeScanner.stop().catch(error => console.error('Erreur lors de l\'arrêt du scanner:', error));
      }
    };
  }, []);

  const startScanner = () => {
    if (!html5QrCode) return;

    setScanning(true);
    
    // Configuration optimisée pour mobile
    const config = {
      fps: 10,
      qrbox: { width: 300, height: 300 },
      aspectRatio: 1.0,
      //formatsToSupport: [ "QR_CODE" ],
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true
      }
    };

    // Détecter si on est sur mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Configuration de la caméra adaptée au mobile
    const cameraConfig = isMobile 
      ? { facingMode: { exact: "environment" } } // Force la caméra arrière sur mobile
      : { facingMode: "environment" }; // Caméra arrière par défaut

    html5QrCode.start(
      cameraConfig,
      config,
      (decodedText) => {
        // Succès du scan
        onScanSuccess(decodedText);
        stopScanner(); // Arrêter le scanner après un scan réussi
      },
      (errorMessage) => {
        // Gérer les erreurs silencieusement pendant le scan
        if (onScanError) {
          onScanError(errorMessage);
        }
      }
    ).catch(err => {
      console.error('Erreur lors du démarrage du scanner:', err);
      setScanning(false);
      if (onScanError) {
        onScanError('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
      }
    });
  };

  const stopScanner = () => {
    if (html5QrCode && html5QrCode.isScanning) {
      html5QrCode.stop().then(() => {
        setScanning(false);
      }).catch(error => {
        console.error('Erreur lors de l\'arrêt du scanner:', error);
      });
    }
  };

  return (
    <div className="qr-scanner-container">
      <div 
        id={qrScannerElementId} 
        className="qr-scanner-element" 
        style={{ 
          width: '100%', 
          maxWidth: '500px', 
          margin: '0 auto',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '8px'
        }}
      >
        {scanning && (
          <div 
            className="absolute inset-0 border-2 border-primary"
            style={{
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
              borderRadius: '8px'
            }}
          />
        )}
      </div>
      
      <div className="mt-4 flex justify-center">
        {!scanning ? (
          <Button 
            variant="primary" 
            size="lg" 
            onClick={startScanner}
            icon={<Camera className="h-5 w-5 mr-2" />}
          >
            Scanner un QR code
          </Button>
        ) : (
          <Button 
            variant="outline" 
            size="lg" 
            onClick={stopScanner}
            icon={<StopCircle className="h-5 w-5 mr-2" />}
          >
            Arrêter le scan
          </Button>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
