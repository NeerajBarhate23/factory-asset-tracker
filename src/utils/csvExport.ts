// CSV Export utility using papaparse
import Papa from 'papaparse';

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
) {
  try {
    // Transform data if columns are specified
    let exportData: any[] = data;

    if (columns && columns.length > 0) {
      exportData = data.map((row) => {
        const transformedRow: Record<string, any> = {};
        columns.forEach(({ key, label }) => {
          transformedRow[label] = row[key];
        });
        return transformedRow;
      });
    }

    // Convert to CSV
    const csv = Papa.unparse(exportData);

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true };
  } catch (error: any) {
    console.error('Error exporting to CSV:', error);
    return { success: false, error: error.message };
  }
}

// Specific export functions for different data types

export function exportAssets(assets: any[]) {
  return exportToCSV(
    assets,
    `assets_export_${new Date().toISOString().split('T')[0]}`,
    [
      { key: 'uid', label: 'Asset UID' },
      { key: 'name', label: 'Name' },
      { key: 'category', label: 'Category' },
      { key: 'location', label: 'Location' },
      { key: 'status', label: 'Status' },
      { key: 'criticality', label: 'Criticality' },
      { key: 'owner_department', label: 'Department' },
      { key: 'make', label: 'Make' },
      { key: 'model', label: 'Model' },
      { key: 'serial_number', label: 'Serial Number' },
      { key: 'custodian', label: 'Custodian' },
      { key: 'last_audit_date', label: 'Last Audit Date' },
      { key: 'last_maintenance_date', label: 'Last Maintenance Date' },
    ]
  );
}

export function exportMovements(movements: any[]) {
  return exportToCSV(
    movements,
    `movements_export_${new Date().toISOString().split('T')[0]}`,
    [
      { key: 'id', label: 'Movement ID' },
      { key: 'asset_name', label: 'Asset Name' },
      { key: 'from_location', label: 'From Location' },
      { key: 'to_location', label: 'To Location' },
      { key: 'status', label: 'Status' },
      { key: 'requested_by', label: 'Requested By' },
      { key: 'request_date', label: 'Request Date' },
      { key: 'approved_by', label: 'Approved By' },
      { key: 'approval_date', label: 'Approval Date' },
      { key: 'reason', label: 'Reason' },
      { key: 'sla_hours', label: 'SLA Hours' },
    ]
  );
}

export function exportAudits(audits: any[]) {
  return exportToCSV(
    audits,
    `audits_export_${new Date().toISOString().split('T')[0]}`,
    [
      { key: 'id', label: 'Audit ID' },
      { key: 'location', label: 'Location' },
      { key: 'category', label: 'Category' },
      { key: 'status', label: 'Status' },
      { key: 'scheduled_date', label: 'Scheduled Date' },
      { key: 'completed_date', label: 'Completed Date' },
      { key: 'auditor', label: 'Auditor' },
      { key: 'assets_scanned', label: 'Assets Scanned' },
      { key: 'total_assets', label: 'Total Assets' },
      { key: 'discrepancies', label: 'Discrepancies' },
    ]
  );
}
