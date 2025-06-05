import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

interface AddEntryModalProps {
  onClose: () => void;
}

export function AddEntryModal({ onClose }: AddEntryModalProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neuer Eintrag</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p className="text-gray-500">Hier kommt das Formular für neue Einträge hin.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
} 