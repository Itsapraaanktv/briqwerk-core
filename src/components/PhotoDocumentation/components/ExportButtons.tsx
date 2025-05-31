import type { PhotoEntry } from '../types';
import { Button } from '../../ui';

interface Props {
  entries: PhotoEntry[];
  className?: string;
}

export function ExportButtons({ entries, className }: Props) {
  const isExporting = false;

  const exportToJson = () => {
    const data = entries.map(({ id, text, photo, coords, timestamp }) => ({
      id,
      text,
      photo,
      coords: coords ? {
        latitude: coords.latitude,
        longitude: coords.longitude
      } : undefined,
      timestamp
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `briqwerk-export-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToCsv = () => {
    const headers = ['ID', 'Text', 'Foto-URL', 'Latitude', 'Longitude', 'Zeitstempel'];
    const rows = entries.map(e => [
      e.id,
      `"${e.text.replace(/"/g, '""')}"`,
      e.photo,
      e.coords?.latitude ?? "",
      e.coords?.longitude ?? "",
      e.timestamp
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `briqwerk-export-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToKml = () => {
    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>BriqWerk Export</name>
    <description>Exportierte Fotos und Standorte</description>
    ${entries.map(e => `
      <Placemark>
        <name>${e.text.substring(0, 30)}${e.text.length > 30 ? '...' : ''}</name>
        <description>
          <![CDATA[
            <div>
              ${e.text}
              ${e.photo ? `<br/><img src="${e.photo}" style="max-width:300px;"/>` : ''}
            </div>
          ]]>
        </description>
        ${e.coords ? `
          <Point>
            <coordinates>${e.coords.longitude},${e.coords.latitude}</coordinates>
          </Point>
        ` : ''}
      </Placemark>
    `).join('')}
  </Document>
</kml>`;

    const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `briqwerk-export-${new Date().toISOString()}.kml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className || ''}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={exportToJson}
        disabled={isExporting || entries.length === 0}
      >
        Als JSON exportieren
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={exportToCsv}
        disabled={isExporting || entries.length === 0}
      >
        Als CSV exportieren
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={exportToKml}
        disabled={isExporting || entries.length === 0}
      >
        Als KML exportieren
      </Button>
    </div>
  );
} 