import { Button } from './ui/Button'

export default function LandingQR() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            📲 BriqWerk installieren
          </h1>
          
          <p className="text-gray-600 dark:text-gray-300">
            Scanne den QR-Code oder klicke auf den Button unten:
          </p>

          <div className="p-4 bg-white rounded-xl shadow-inner">
            <img 
              src="/qr-code.svg" 
              alt="QR-Code zur BriqWerk App" 
              className="mx-auto w-48 h-48"
              width={192}
              height={192}
            />
          </div>

          <div className="pt-4">
            <a 
              href="https://briqwerk.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full justify-center">
                App öffnen
              </Button>
            </a>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nach dem Öffnen wähle "Zum Startbildschirm hinzufügen" im Browser-Menü
          </p>
        </div>
      </div>
    </div>
  )
} 