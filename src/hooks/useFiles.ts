import { useState, useEffect, useCallback } from 'react';
import { filesApi } from '../lib/api-client';
import { useAuth } from '../contexts/AuthContext';

export interface AssetFile {
  id: string;
  asset_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path?: string;
  file_data?: string; // Base64 encoded (legacy)
  uploaded_by: string;
  uploaded_at: string;
}

export function useFiles(assetId: string) {
  const [files, setFiles] = useState<AssetFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      const results = await filesApi.getAssetFiles(assetId);
      setFiles(results || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  }, [assetId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const uploadFile = async (file: File) => {
    if (!user) throw new Error('User not authenticated');

    // Limit file size to 5MB to avoid performance issues
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File size exceeds 5MB limit');
    }

    try {
      await filesApi.upload(file, assetId);
      await fetchFiles();
    } catch (err) {
      throw err;
    }
  };

  const deleteFile = async (fileId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      await filesApi.delete(fileId);
      await fetchFiles();
    } catch (err) {
      throw err;
    }
  };

  const downloadFile = async (file: AssetFile) => {
    try {
      // If file has base64 data (legacy), use it directly
      if (file.file_data) {
        const link = document.createElement('a');
        link.href = file.file_data;
        link.download = file.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Otherwise, fetch from backend
        const blob = await filesApi.preview(file.id);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      throw err;
    }
  };

  return {
    files,
    loading,
    error,
    uploadFile,
    deleteFile,
    downloadFile,
    refetch: fetchFiles,
  };
}
