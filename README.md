# Photo Documentation Component

A comprehensive React component for managing photo documentation on construction sites. Built with TypeScript, React, and TailwindCSS.

## Features

- 📸 Photo upload with drag & drop support
- 📝 Text descriptions with validation
- 📍 Optional geolocation tagging
- 🔄 Offline-first with sync functionality
- 🎨 Modern, responsive UI
- ♿ Full accessibility support
- 🌐 Internationalization ready (German)

## Installation

```bash
npm install @briqwerk/photo-documentation
```

## Usage

```tsx
import { PhotoDocumentation } from '@briqwerk/photo-documentation';

function App() {
  return (
    <PhotoDocumentation />
  );
}
```

## Components

### PhotoDocumentation

The main component that orchestrates the photo documentation functionality.

```tsx
<PhotoDocumentation />
```

### PhotoUploadForm

A standalone form component for uploading photos with descriptions.

```tsx
import { PhotoUploadForm } from '@briqwerk/photo-documentation';

<PhotoUploadForm
  onSubmit={(entry) => {
    console.log('New entry:', entry);
  }}
/>
```

### DocumentList

A component to display and manage photo entries.

```tsx
import { DocumentList } from '@briqwerk/photo-documentation';

<DocumentList
  entries={entries}
  onDelete={(id) => {
    console.log('Delete entry:', id);
  }}
/>
```

## Technical Details

### State Management

- Uses React hooks for local state management
- Implements custom hooks for photo entries and sync functionality
- Persists data in localStorage with sync capabilities

### Validation

- Text length limits
- Image size and format validation
- Geolocation validation
- Timestamp validation

### Error Handling

- Comprehensive error types
- Retry mechanism for sync failures
- User-friendly error messages
- Accessibility announcements

### Accessibility

- ARIA attributes throughout
- Keyboard navigation
- Screen reader announcements
- Touch-friendly targets (44px minimum)

### Performance

- Image compression
- Lazy loading
- Optimized re-renders
- Efficient localStorage usage

## Development

### Prerequisites

- Node.js >= 14
- npm >= 7

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Testing

```bash
# Install test dependencies
npm install --save-dev @testing-library/react @testing-library/user-event @types/jest jest

# Run unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# Run all tests with coverage
npm run test:coverage
```

### Code Quality

```bash
# Run linter
npm run lint

# Run type check
npm run typecheck

# Format code
npm run format
```

## Deployment

### Vercel

The project includes a `vercel.json` configuration file for easy deployment to Vercel:

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

### Environment Variables

For production deployment, set the following environment variables:

```env
VITE_API_URL=https://api.example.com
VITE_MAX_UPLOAD_SIZE=5000000
```

### CI/CD

The project uses GitHub Actions for CI/CD. The workflow includes:

- Lint and type checking
- Unit tests
- Build verification
- Automatic deployment to Vercel (on main branch)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT © [briqwerk GmbH]

# BriqWerk

Digitale Baustellendokumentation - Progressive Web App

## 📲 BriqWerk PWA installieren

Die App kann über den QR-Code installiert werden:

![QR-Code zur BriqWerk App](public/qr-code.svg)

Öffne https://briqwerk.vercel.app und folge den Installationsanweisungen:

### Android
- Tippe auf "App installieren" im Browser-Menü
- Oder: Warte auf den "Zum Startbildschirm hinzufügen" Dialog

### iOS
- Tippe auf "Teilen" (Share-Button)
- Wähle "Zum Home-Bildschirm"

### Desktop
- Klicke auf das Installations-Symbol in der Adressleiste
- Oder: Menü → "BriqWerk installieren"

## Offline-Funktionalität

Die App funktioniert auch offline:
- Fotos werden lokal zwischengespeichert
- Automatische Synchronisation bei Internetverbindung
- Schnellerer Zugriff auf häufig genutzte Funktionen

## Development

```bash
# Install dependencies
pnpm install

# Generate QR code
pnpm generate-qr

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Deployment

Die App wird automatisch via Vercel deployed:
- Produktions-URL: https://briqwerk.vercel.app
- Preview-Deployments für Pull Requests
- Automatische HTTPS-Zertifikate
