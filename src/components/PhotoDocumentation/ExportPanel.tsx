import { useState, useEffect } from 'react';
import { uploadEntriesToSupabase } from '@/lib/upload';
import { syncEntriesBidirectional } from '@/lib/sync';
import { exportToJSON, exportToCSV, exportToPDF } from '@/lib/exportUtils';
import { Loader2, FileText, Table, FileType, Upload, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

type ExportAction = 'json' | 'csv' | 'pdf' | 'upload' | 'sync' | null;
type SyncStatus = 'idle' | 'loading' | 'success' | 'error';

interface StatusMessage {
  text: string;
  type: 'success' | 'error';
  timestamp: number;
}

export function ExportPanel() {
  const [loading, setLoading] = useState<ExportAction>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // Load last sync time on mount
  useEffect(() => {
    const lastSyncTime = localStorage.getItem('briqwerk_last_sync');
    if (lastSyncTime) {
      setLastSync(lastSyncTime);
    }
  }, []);

  // Auto-hide status message after 3 seconds
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [statusMessage]);

  const handleAction = async (action: ExportAction) => {
    if (!action) return;
    
    setLoading(action);
    try {
      switch (action) {
        case 'json':
          await exportToJSON();
          break;
        case 'csv':
          await exportToCSV();
          break;
        case 'pdf':
          await exportToPDF();
          break;
        case 'upload':
          await uploadEntriesToSupabase();
          break;
        case 'sync':
          setSyncStatus('loading');
          const result = await syncEntriesBidirectional();
          setSyncStatus(result.success ? 'success' : 'error');
          setStatusMessage({
            text: result.message,
            type: result.success ? 'success' : 'error',
            timestamp: Date.now()
          });
          if (result.success) {
            setLastSync(new Date().toISOString());
          }
          break;
      }
    } catch (error) {
      console.error(`Fehler beim ${action.toUpperCase()}-Export:`, error);
      if (action === 'sync') {
        setSyncStatus('error');
        setStatusMessage({
          text: `Synchronisationsfehler: ${(error as Error).message}`,
          type: 'error',
          timestamp: Date.now()
        });
      }
    } finally {
      setLoading(null);
    }
  };

  const Button = ({ 
    action, 
    icon: Icon, 
    label, 
    color,
    disabled = false
  }: { 
    action: ExportAction; 
    icon: any; 
    label: string;
    color: string;
    disabled?: boolean;
  }) => (
    <button
      onClick={() => handleAction(action)}
      disabled={loading !== null || disabled}
      className={`
        w-full flex items-center justify-center gap-2 
        ${color} text-white p-3 rounded-xl shadow 
        transition-all hover:opacity-90 disabled:opacity-50
      `}
    >
      {loading === action ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Wird ausgeführt...</span>
        </>
      ) : (
        <>
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </>
      )}
    </button>
  );

  return (
    <div className="p-4 space-y-3">
      {/* Sync Status Message */}
      {statusMessage && (
        <div className={`
          p-3 rounded-lg mb-4 flex items-center gap-2
          ${statusMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
        `}>
          {statusMessage.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Sync Button */}
      <Button
        action="sync"
        icon={RefreshCw}
        label={
          syncStatus === 'loading' 
            ? 'Synchronisiere...' 
            : 'Mit Supabase synchronisieren'
        }
        color={
          syncStatus === 'success' 
            ? 'bg-green-600' 
            : syncStatus === 'error' 
              ? 'bg-red-600' 
              : 'bg-indigo-600'
        }
        disabled={syncStatus === 'loading'}
      />

      {/* Last Sync Time */}
      {lastSync && (
        <p className="text-xs text-gray-500 text-center mt-1">
          Letzte Synchronisation: {format(new Date(lastSync), "dd.MM.yyyy HH:mm", { locale: de })}
        </p>
      )}

      <div className="border-t border-gray-200 my-4" />

      {/* Export Buttons */}
      <Button
        action="json"
        icon={FileText}
        label="Als JSON exportieren"
        color="bg-blue-600"
      />
      <Button
        action="csv"
        icon={Table}
        label="Als CSV exportieren"
        color="bg-green-600"
      />
      <Button
        action="pdf"
        icon={FileType}
        label="Als PDF exportieren"
        color="bg-red-600"
      />
      <Button
        action="upload"
        icon={Upload}
        label="Zu Supabase hochladen"
        color="bg-purple-600"
      />
    </div>
  );
} 