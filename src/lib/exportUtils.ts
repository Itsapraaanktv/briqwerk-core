import { saveAs } from 'file-saver';
import { unparse } from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface PhotoEntry {
  id: string;
  imageUrl: string;
  description: string;
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

// Load entries from localStorage
function getEntries(): PhotoEntry[] {
  const storedEntries = localStorage.getItem('briqwerk_entries');
  if (!storedEntries) return [];
  return JSON.parse(storedEntries);
}

// Export as JSON
export async function exportToJSON() {
  const entries = getEntries();
  const blob = new Blob([JSON.stringify(entries, null, 2)], {
    type: 'application/json'
  });
  saveAs(blob, `briqwerk-export-${new Date().toISOString().split('T')[0]}.json`);
}

// Export as CSV
export async function exportToCSV() {
  const entries = getEntries();
  
  // Transform entries for CSV format
  const csvData = entries.map(entry => ({
    ID: entry.id,
    Beschreibung: entry.description,
    Datum: new Date(entry.timestamp).toLocaleString('de-DE'),
    'GPS Latitude': entry.location?.latitude || '',
    'GPS Longitude': entry.location?.longitude || '',
    'Bild URL': entry.imageUrl
  }));

  const csv = unparse(csvData, {
    delimiter: ';',
    header: true
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `briqwerk-export-${new Date().toISOString().split('T')[0]}.csv`);
}

// Export as PDF
export async function exportToPDF() {
  const entries = getEntries();
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(16);
  doc.text('BriqWerk Dokumentation', 14, 15);
  doc.setFontSize(10);
  doc.text(`Export vom ${new Date().toLocaleDateString('de-DE')}`, 14, 22);

  // Prepare table data
  const tableData = entries.map(entry => [
    new Date(entry.timestamp).toLocaleString('de-DE'),
    entry.description,
    entry.location 
      ? `${entry.location.latitude.toFixed(6)}, ${entry.location.longitude.toFixed(6)}`
      : 'Keine GPS-Daten'
  ]);

  // Add table
  (doc as any).autoTable({
    startY: 30,
    head: [['Datum', 'Beschreibung', 'GPS-Koordinaten']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [100, 45, 155] },
    columnStyles: {
      0: { cellWidth: 40 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 50 }
    }
  });

  // Save PDF
  doc.save(`briqwerk-export-${new Date().toISOString().split('T')[0]}.pdf`);
} 