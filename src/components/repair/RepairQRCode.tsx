import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Download, Share2 } from 'lucide-react';
import Button from '../ui/Button';
import html2canvas from 'html2canvas';

interface RepairQRCodeProps {
  qrData: string;
  repairCode: string;
  repairId: string;
  relayName: string;
  appointmentDate: string;
  deviceInfo: {
    type: string;
    brand: string;
    model: string;
  };
}

const RepairQRCode: React.FC<RepairQRCodeProps> = ({ 
  qrData, 
  repairCode, 
  repairId, 
  relayName, 
  appointmentDate,
  deviceInfo
}) => {
  const qrCodeRef = useRef<HTMLDivElement>(null);
  
  // Formatter la date de rendez-vous
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };
  
  // Imprimer le QR code
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && qrCodeRef.current) {
      html2canvas(qrCodeRef.current).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        printWindow.document.write(`
          <html>
            <head>
              <title>Code de réparation PC Relais</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                .container { max-width: 500px; margin: 0 auto; }
                .header { margin-bottom: 20px; }
                .qr-container { margin: 20px 0; }
                .info { margin: 20px 0; text-align: left; }
                .code { font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 20px 0; }
                .footer { margin-top: 30px; font-size: 12px; color: #666; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>PC Relais - Dépôt d'appareil</h1>
                  <p>Présentez ce code à votre point relais lors du dépôt de votre appareil</p>
                </div>
                <div class="qr-container">
                  <img src="${imgData}" alt="QR Code" style="width: 200px; height: 200px;" />
                </div>
                <div class="code">
                  Code: ${repairCode}
                </div>
                <div class="info">
                  <p><strong>Référence:</strong> ${repairId.substring(0, 8)}</p>
                  <p><strong>Point relais:</strong> ${relayName}</p>
                  <p><strong>Date prévue:</strong> ${formatDate(appointmentDate)}</p>
                  <p><strong>Appareil:</strong> ${deviceInfo.brand} ${deviceInfo.model} (${deviceInfo.type})</p>
                </div>
                <div class="footer">
                  <p>Ce code est valable pendant 24 heures à partir de sa génération.</p>
                  <p>Pour toute question, contactez notre service client au 01 23 45 67 89.</p>
                </div>
              </div>
              <script>
                window.onload = function() { window.print(); }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      });
    }
  };
  
  // Télécharger le QR code
  const handleDownload = () => {
    if (qrCodeRef.current) {
      html2canvas(qrCodeRef.current).then(canvas => {
        const link = document.createElement('a');
        link.download = `pcrelais-code-${repairCode}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }
  };
  
  // Partager le QR code (si l'API Web Share est disponible)
  const handleShare = async () => {
    if (qrCodeRef.current && typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        const canvas = await html2canvas(qrCodeRef.current);
        const blob = await (new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/png');
        }));
        
        if (blob) {
          const file = new File([blob], `pcrelais-code-${repairCode}.png`, { type: 'image/png' });
          await navigator.share({
            title: 'PC Relais - Code de réparation',
            text: `Voici mon code de réparation pour PC Relais: ${repairCode}`,
            files: [file]
          });
        }
      } catch (error) {
        console.error('Erreur lors du partage:', error);
      }
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Votre demande a été enregistrée !</h2>
        <p className="text-gray-600">
          Présentez ce QR code ou le code ci-dessous lors du dépôt de votre appareil au point relais.
        </p>
      </div>
      
      <div 
        ref={qrCodeRef}
        className="bg-white border border-gray-200 rounded-lg p-6 max-w-md mx-auto"
      >
        <div className="flex justify-center mb-4">
          <QRCodeSVG 
            value={qrData} 
            size={300}
            level="H"
            includeMargin={true}
          />
        </div>
        
        <div className="text-center mb-6">
          <p className="text-sm text-gray-500 mb-1">Code de réparation</p>
          <div className="text-2xl font-bold tracking-wider bg-gray-100 py-2 px-4 rounded-lg inline-block">
            {repairCode}
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Référence:</span>
            <span className="font-medium">{repairId.substring(0, 8)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Point relais:</span>
            <span className="font-medium">{relayName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Date prévue:</span>
            <span className="font-medium">{formatDate(appointmentDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Appareil:</span>
            <span className="font-medium">{deviceInfo.brand} {deviceInfo.model}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 text-center">
          <p>Ce code est valable pendant 24 heures.</p>
        </div>
      </div>
      
      <div className="flex justify-center mt-6 space-x-3">
        <Button
          variant="outline"
          onClick={handlePrint}
          className="flex items-center"
        >
          <Printer className="h-4 w-4 mr-2" />
          Imprimer
        </Button>
        <Button
          variant="outline"
          onClick={handleDownload}
          className="flex items-center"
        >
          <Download className="h-4 w-4 mr-2" />
          Télécharger
        </Button>
        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <Button
            variant="outline"
            onClick={handleShare}
            className="flex items-center"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Partager
          </Button>
        )}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="font-medium text-gray-800 mb-2">Prochaines étapes :</h3>
        <ol className="list-decimal pl-5 space-y-2 text-gray-600">
          <li>Apportez votre appareil au point relais sélectionné à la date prévue.</li>
          <li>Présentez ce QR code ou le code de réparation au personnel du point relais.</li>
          <li>Vous recevrez des notifications par email sur l'avancement de votre réparation.</li>
          <li>Une fois la réparation terminée, vous serez notifié pour récupérer votre appareil.</li>
        </ol>
      </div>
    </div>
  );
};

export default RepairQRCode;
