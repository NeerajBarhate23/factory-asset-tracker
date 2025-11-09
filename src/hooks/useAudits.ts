import { useState, useEffect, useCallback } from 'react';
// TODO: Implement auditsApi backend integration
// import { query, exec, generateId } from '../lib/database';
import type { Audit } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';

export interface AuditWithDetails extends Audit {
  asset_name: string;
  asset_uid: string;
  audited_by_name: string;
}

export function useAudits() {
  const [audits, setAudits] = useState<AuditWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  const fetchAudits = useCallback(async () => {
    try {
      setLoading(true);
      const results = query<AuditWithDetails>(`
        SELECT 
          au.*,
          a.name as asset_name,
          a.asset_uid,
          u.name as audited_by_name
        FROM audits au
        JOIN assets a ON au.asset_id = a.id
        JOIN users u ON au.audited_by = u.id
        ORDER BY au.audited_at DESC
      `);
      setAudits(results);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching audits:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  const createAudit = async (auditData: {
    asset_id: string;
    status: string;
    condition?: string;
    issues_found?: string;
    recommendations?: string;
    photos?: string;
  }) => {
    if (!user) throw new Error('User not authenticated');

    const asset = query('SELECT * FROM assets WHERE id = ?', [auditData.asset_id])[0];
    if (!asset) throw new Error('Asset not found');

    const id = generateId();
    const now = new Date().toISOString();

    exec(
      `INSERT INTO audits (
        id, asset_id, audited_by, audited_at, status, condition, issues_found, recommendations, photos
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        auditData.asset_id,
        user.id,
        now,
        auditData.status,
        auditData.condition || null,
        auditData.issues_found || null,
        auditData.recommendations || null,
        auditData.photos || null,
      ]
    );

    // Log activity
    exec(
      'INSERT INTO activities (id, user_id, action, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?, ?)',
      [
        generateId(),
        user.id,
        'audit',
        'asset',
        auditData.asset_id,
        `Completed audit with status: ${auditData.status}`,
      ]
    );

    await fetchAudits();
    return id;
  };

  const getAuditsByAsset = (assetId: string): AuditWithDetails[] => {
    return audits.filter(a => a.asset_id === assetId);
  };

  return {
    audits,
    loading,
    error,
    createAudit,
    getAuditsByAsset,
    refetch: fetchAudits,
  };
}
