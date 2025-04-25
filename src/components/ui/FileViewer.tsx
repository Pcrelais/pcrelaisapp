import React, { useState } from 'react';
import { Download, X, ExternalLink, File, FileText, Image as ImageIcon } from 'lucide-react';
import { FileMetadata } from '../../services/fileStorageService';
import Button from './Button';

interface FileViewerProps {
  file: FileMetadata;
  onDelete?: (fileId: string) => void;
  showDelete?: boolean;
  className?: string;
}

const FileViewer: React.FC<FileViewerProps> = ({
  file,
  onDelete,
  showDelete = false,
  className = '',
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Déterminer si le fichier est une image
  const isImage = file.type.startsWith('image/');
  
  // Déterminer si le fichier est un PDF
  const isPdf = file.type === 'application/pdf';

  // Formater la taille du fichier
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Obtenir l'icône du fichier en fonction de son type
  const getFileIcon = () => {
    if (isImage) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    } else if (isPdf) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (file.type.includes('word')) {
      return <FileText className="h-5 w-5 text-blue-700" />;
    } else if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
      return <FileText className="h-5 w-5 text-green-600" />;
    } else if (file.type.includes('presentation') || file.type.includes('powerpoint')) {
      return <FileText className="h-5 w-5 text-orange-500" />;
    } else {
      return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  // Gérer le téléchargement du fichier
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Gérer la suppression du fichier
  const handleDelete = () => {
    if (onDelete) {
      onDelete(file.id);
    }
  };

  // Ouvrir/fermer la prévisualisation
  const togglePreview = () => {
    setIsPreviewOpen(!isPreviewOpen);
  };

  return (
    <div className={`border rounded-md overflow-hidden ${className}`}>
      {/* Aperçu du fichier */}
      {isImage && file.thumbnailUrl && !isPreviewOpen && (
        <div 
          className="h-32 bg-gray-100 flex items-center justify-center cursor-pointer"
          onClick={togglePreview}
        >
          <img 
            src={file.thumbnailUrl} 
            alt={file.name} 
            className="h-full w-full object-contain"
          />
        </div>
      )}

      {/* Prévisualisation plein écran pour les images */}
      {isImage && isPreviewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <img 
              src={file.url} 
              alt={file.name} 
              className="max-h-[80vh] max-w-full object-contain"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePreview}
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Prévisualisation intégrée pour les PDF */}
      {isPdf && !isPreviewOpen && (
        <div 
          className="h-32 bg-gray-100 flex items-center justify-center cursor-pointer"
          onClick={togglePreview}
        >
          <FileText className="h-12 w-12 text-red-500" />
        </div>
      )}

      {/* Prévisualisation plein écran pour les PDF */}
      {isPdf && isPreviewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="relative bg-white w-full max-w-4xl h-[80vh]">
            <iframe
              src={`${file.url}#toolbar=0`}
              title={file.name}
              className="w-full h-full"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePreview}
              className="absolute top-2 right-2 bg-white rounded-full p-1"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      )}

      {/* Icône pour les autres types de fichiers */}
      {!isImage && !isPdf && (
        <div className="h-32 bg-gray-100 flex items-center justify-center">
          {getFileIcon()}
        </div>
      )}

      {/* Informations sur le fichier */}
      <div className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {file.name}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {formatFileSize(file.size)}
            </p>
          </div>
        </div>

        {/* Actions sur le fichier */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">Télécharger</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(file.url, '_blank')}
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">Ouvrir</span>
            </Button>
          </div>

          {showDelete && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Supprimer</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileViewer;
