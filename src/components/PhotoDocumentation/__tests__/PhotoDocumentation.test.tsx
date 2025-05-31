import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';  // Add Jest DOM matchers
import PhotoDocumentation from '../index';
import { DocumentList } from '../index';
import type { PhotoEntry } from '@/types/photo';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn()
};
Object.defineProperty(navigator, 'geolocation', { value: mockGeolocation });

// Mock sync function
jest.mock('../hooks/usePhotoSync', () => ({
  usePhotoSync: () => ({
    sync: jest.fn().mockResolvedValue(undefined),
    isSyncing: false,
    error: null
  })
}));

describe('PhotoDocumentation', () => {
  const mockEntries: PhotoEntry[] = [
    {
      id: '1',
      photo: 'test1.jpg',
      text: 'Test entry 1',
      coords: {
        latitude: 52.520008,
        longitude: 13.404954
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      unsynced: false,
      images: []
    },
    {
      id: '2',
      photo: 'test2.jpg',
      text: 'Test entry 2',
      coords: {
        latitude: 48.137154,
        longitude: 11.576124
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      unsynced: false,
      images: []
    }
  ]

  const mockSyncProps = {
    isSyncing: false,
    lastSync: new Date("2025-05-31T00:00:00Z").toISOString(),
    onSync: jest.fn()
  };

  beforeEach(() => {
    mockLocalStorage.getItem.mockReturnValue(null);
    mockGeolocation.getCurrentPosition.mockImplementation((success) =>
      success({
        coords: {
          latitude: 52.520008,
          longitude: 13.404954
        }
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state correctly', () => {
    render(<PhotoDocumentation />);
    expect(screen.getByText('Noch keine Einträge vorhanden')).toBeInTheDocument();
  });

  it('handles photo upload and description input', async () => {
    render(<PhotoDocumentation />);
    
    // Mock file upload
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/foto auswählen/i);
    await userEvent.upload(input, file);

    // Verify preview is shown
    expect(screen.getByAltText(/vorschau/i)).toBeInTheDocument();

    // Add description
    const textarea = screen.getByLabelText(/beschreibung/i);
    await userEvent.type(textarea, 'Test description');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /speichern/i });
    await userEvent.click(submitButton);

    // Verify entry was added and localStorage was updated
    await waitFor(() => {
      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByText(/lokal/i)).toBeInTheDocument();
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  it('shows local badge for unsynced entries', async () => {
    // Mock existing unsynced entry
    const unsyncedEntry: PhotoEntry = {
      id: '1',
      photo: '',
      text: 'Test entry',
      coords: {
        latitude: 52.520008,
        longitude: 13.404954
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      unsynced: true,
      images: []
    };
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify([unsyncedEntry]));

    render(<PhotoDocumentation />);
    expect(screen.getByText(/lokal/i)).toBeInTheDocument();
  });

  it('handles sync functionality correctly', async () => {
    // Mock existing entries
    const entries: PhotoEntry[] = [{
      id: '1',
      photo: '',
      text: 'Test entry',
      coords: {
        latitude: 52.520008,
        longitude: 13.404954
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      unsynced: true,
      images: []
    }];
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(entries));

    render(<PhotoDocumentation />);

    // Click sync button
    const syncButton = screen.getByRole('button', { name: /sync/i });
    await userEvent.click(syncButton);

    // Verify sync status
    await waitFor(() => {
      expect(screen.queryByText(/lokal/i)).not.toBeInTheDocument();
    });
  });

  it('handles sync errors correctly', async () => {
    // Mock sync error
    jest.mock('../hooks/usePhotoSync', () => ({
      usePhotoSync: () => ({
        sync: jest.fn().mockRejectedValue(new Error('Sync failed')),
        isSyncing: false,
        error: 'Sync failed'
      })
    }));

    render(<PhotoDocumentation />);

    // Click sync button
    const syncButton = screen.getByRole('button', { name: /sync/i });
    await userEvent.click(syncButton);

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/sync failed/i)).toBeInTheDocument();
    });
  });

  it('handles geolocation functionality correctly', async () => {
    render(<PhotoDocumentation />);

    // Click location button
    const locationButton = screen.getByRole('button', { name: /standort hinzufügen/i });
    await userEvent.click(locationButton);

    // Verify location was added
    await waitFor(() => {
      expect(screen.getByText(/52.520008, 13.404954/i)).toBeInTheDocument();
    });
  });

  it('handles geolocation errors correctly', async () => {
    // Mock geolocation error
    mockGeolocation.getCurrentPosition.mockImplementation((_, error) =>
      error(new Error('Geolocation error'))
    );

    render(<PhotoDocumentation />);

    // Click location button
    const locationButton = screen.getByRole('button', { name: /standort hinzufügen/i });
    await userEvent.click(locationButton);

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/standort konnte nicht ermittelt werden/i)).toBeInTheDocument();
    });
  });

  it('renders entries in grid view', () => {
    const { container } = render(
      <DocumentList
        entries={mockEntries}
        onDelete={jest.fn()}
        onUpdate={jest.fn()}
        viewMode="grid"
        setViewMode={jest.fn()}
        {...mockSyncProps}
      />
    );
    const listItems = container.querySelectorAll('[role="listitem"]');
    expect(listItems).toHaveLength(2);
    
    // Verify the content of each list item
    const texts = Array.from(listItems).map(item => item.textContent);
    expect(texts.some(text => text?.includes('Test entry 1'))).toBe(true);
    expect(texts.some(text => text?.includes('Test entry 2'))).toBe(true);
  });

  it('switches between grid and list view', () => {
    const setViewMode = jest.fn();
    render(
      <DocumentList
        entries={mockEntries}
        onDelete={jest.fn()}
        onUpdate={jest.fn()}
        viewMode="grid"
        setViewMode={setViewMode}
        {...mockSyncProps}
      />
    );
    const gridButton = screen.getByTitle('Grid-Ansicht');
    const listButton = screen.getByTitle('Listen-Ansicht');

    if (gridButton && listButton) {
      fireEvent.click(listButton);
      expect(setViewMode).toHaveBeenCalledWith('list');

      fireEvent.click(gridButton);
      expect(setViewMode).toHaveBeenCalledWith('grid');
    }
  });

  it('shows delete confirmation dialog', () => {
    render(
      <DocumentList
        entries={mockEntries}
        onDelete={jest.fn()}
        onUpdate={jest.fn()}
        viewMode="grid"
        setViewMode={jest.fn()}
        {...mockSyncProps}
      />
    );
    const deleteButtons = screen.getAllByTitle('Eintrag löschen');
    const deleteButton = deleteButtons[0];

    if (deleteButton) {
      fireEvent.click(deleteButton);
      expect(screen.getByText('Eintrag löschen')).toBeInTheDocument();
      expect(screen.getByText('Möchten Sie diesen Eintrag wirklich löschen?')).toBeInTheDocument();
    }
  });

  it('handles entry deletion', () => {
    const onDelete = jest.fn();
    render(
      <DocumentList
        entries={mockEntries}
        onDelete={onDelete}
        onUpdate={jest.fn()}
        viewMode="grid"
        setViewMode={jest.fn()}
        {...mockSyncProps}
      />
    );
    const deleteButtons = screen.getAllByTitle('Eintrag löschen');
    const deleteButton = deleteButtons[0];
    const confirmButton = screen.getByText('Löschen');

    if (deleteButton && confirmButton) {
      fireEvent.click(deleteButton);
      fireEvent.click(confirmButton);
      expect(onDelete).toHaveBeenCalledWith('1');
    }
  });
}); 