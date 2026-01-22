import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Upload, X, File, Image as ImageIcon, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useFiles } from '../../hooks/useFiles';
import { Alert, AlertDescription } from '../ui/alert';

interface FileUploadDialogProps {
  assetId: string;
  assetName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete?: () => void;
}

interface FileWithName {
  file: File;
  customName: string;
}

export function FileUploadDialog({ assetId, assetName, open, onOpenChange, onUploadComplete }: FileUploadDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileWithName[]>([]);
  const [uploading, setUploading] = useState(false);
  const { uploadFile, refetch } = useFiles(assetId);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles: FileWithName[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        errors.push(`${file.name} exceeds 5MB limit`);
      } else {
        validFiles.push({
          file,
          customName: file.name // Default to original filename
        });
      }
    });

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
    }

    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    // Reset input
    event.target.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateFileName = (index: number, newName: string) => {
    setSelectedFiles(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, customName: newName } : item
      )
    );
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    setUploading(true);
    let successCount = 0;
    let failCount = 0;

    for (const fileItem of selectedFiles) {
      try {
        // Upload with custom filename
        await uploadFile(fileItem.file, fileItem.customName);
        successCount++;
      } catch (error) {
        console.error('Error uploading file:', error);
        failCount++;
        toast.error(`Failed to upload ${fileItem.customName}`);
      }
    }

    setUploading(false);

    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} file(s)`);
      setSelectedFiles([]);
      refetch();
      onUploadComplete?.(); // Notify parent component to refresh
      onOpenChange(false);
    }

    if (failCount > 0) {
      toast.error(`Failed to upload ${failCount} file(s)`);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    } else if (type.includes('pdf')) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else {
      return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Upload documents and photos for {assetName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File size warning */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Maximum file size: 5MB per file. Supported formats: Images, PDFs, and documents.
            </AlertDescription>
          </Alert>

          {/* File input */}
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm">
                Click to select files or drag and drop
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, Images, Documents up to 5MB
              </p>
            </label>
          </div>

          {/* Selected files list */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              <p className="text-sm font-medium">Selected files ({selectedFiles.length}):</p>
              {selectedFiles.map((fileItem, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-2 p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(fileItem.file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">
                        Original: {fileItem.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(fileItem.file.size)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Custom name input */}
                  <div className="space-y-1">
                    <Label htmlFor={`file-name-${index}`} className="text-xs">
                      File Name
                    </Label>
                    <Input
                      id={`file-name-${index}`}
                      value={fileItem.customName}
                      onChange={(e) => updateFileName(index, e.target.value)}
                      placeholder="Enter custom file name"
                      disabled={uploading}
                      className="text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploading}
          >
            {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
