import React, { useState, useRef } from 'react';
import { Upload, X, File, Image, Loader2 } from 'lucide-react';
import { fileStorageService, FileType } from '../../services/fileStorageService';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';

interface FileUploaderProps {
  onFileUploaded: (fileUrl: string, fileName: string, fileType: string) => void;
  acceptedFileType: FileType;
  repairId?: string;
  messageId?: string;
  maxSizeMB?: number;
  className?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileUploaded,
  acceptedFileType,
  repairId,
  messageId,
  maxSizeMB = 10,
  className = '',
}) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    
    // Vérifier la taille du fichier
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Le fichier est trop volumineux (max ${maxSizeMB}MB)`);
      return;
    }

    // Vérifier le type de fichier
    if (!fileStorageService.isValidFileType(file, acceptedFileType)) {
      setError(`Type de fichier non autorisé: ${file.type}`);
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    try {
      setIsUploading(true);
      setError(null);

      const fileMetadata = await fileStorageService.uploadFile(
        selectedFile,
        acceptedFileType,
        user.id,
        repairId,
        messageId
      );

      if (!fileMetadata) {
        throw new Error('Échec du téléchargement du fichier');
      }

      onFileUploaded(fileMetadata.url, fileMetadata.name, fileMetadata.type);
      setSelectedFile(null);
      
      // Réinitialiser l'input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du téléchargement');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Déterminer l'icône à afficher en fonction du type de fichier
  const getFileIcon = () => {
    if (!selectedFile) return <Upload className="h-5 w-5" />;
    
    if (selectedFile.type.startsWith('image/')) {
      return <Image className="h-5 w-5" />;
    } else {
      return <File className="h-5 w-5" />;
    }
  };

  // Formater la taille du fichier
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={acceptedFileType === 'image' ? 'image/*' : '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv'}
        className="hidden"
      />
      
      <div className="flex items-center gap-2">
        {!selectedFile ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleButtonClick}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            <span>{acceptedFileType === 'image' ? 'Ajouter une image' : 'Ajouter un document'}</span>
          </Button>
        ) : (
          <div className="flex items-center gap-2 border rounded-md p-2 w-full">
            <div className="flex-shrink-0">
              {getFileIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <div className="flex-shrink-0 flex gap-2">
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleUpload}
                    className="flex items-center gap-1"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Envoyer</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSelection}
                    className="text-gray-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

export default FileUploader;
