import React, { useState, useEffect } from 'react';
import { fileStorageService, FileMetadata } from '../../services/fileStorageService';
import FileViewer from './FileViewer';
import { Loader2 } from 'lucide-react';

interface FileGalleryProps {
  repairId?: string;
  messageId?: string;
  onDeleteFile?: (fileId: string) => void;
  showDelete?: boolean;
  className?: string;
}

const FileGallery: React.FC<FileGalleryProps> = ({
  repairId,
  messageId,
  onDeleteFile,
  showDelete = false,
  className = '',
}) => {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let filesData: FileMetadata[] = [];
        
        if (repairId) {
          filesData = await fileStorageService.getRepairFiles(repairId);
        } else if (messageId) {
          filesData = await fileStorageService.getMessageFiles(messageId);
        }
        
        setFiles(filesData);
      } catch (err) {
        console.error('Erreur lors du chargement des fichiers:', err);
        setError('Impossible de charger les fichiers. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };
    
    if (repairId || messageId) {
      loadFiles();
    } else {
      setLoading(false);
      setFiles([]);
    }
  }, [repairId, messageId]);

  const handleDeleteFile = async (fileId: string) => {
    try {
      const success = await fileStorageService.deleteFileById(fileId);
      
      if (success) {
        setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
        
        if (onDeleteFile) {
          onDeleteFile(fileId);
        }
      } else {
        setError('Échec de la suppression du fichier. Veuillez réessayer.');
      }
    } catch (err) {
      console.error('Erreur lors de la suppression du fichier:', err);
      setError('Erreur lors de la suppression du fichier.');
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-gray-500">Chargement des fichiers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 text-red-500 text-sm ${className}`}>
        {error}
      </div>
    );
  }

  if (files.length === 0) {
    return null;
  }

  // Séparer les images des autres types de fichiers
  const images = files.filter(file => file.type.startsWith('image/'));
  const documents = files.filter(file => !file.type.startsWith('image/'));

  return (
    <div className={className}>
      {/* Afficher les images en grille */}
      {images.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Images ({images.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map(file => (
              <FileViewer
                key={file.id}
                file={file}
                onDelete={showDelete ? handleDeleteFile : undefined}
                showDelete={showDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Afficher les documents en liste */}
      {documents.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Documents ({documents.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {documents.map(file => (
              <FileViewer
                key={file.id}
                file={file}
                onDelete={showDelete ? handleDeleteFile : undefined}
                showDelete={showDelete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileGallery;
