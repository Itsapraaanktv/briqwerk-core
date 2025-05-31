import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import PhotoUploadForm from "./PhotoUploadForm";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Main Content Area */}
      <main className="flex-1 container max-w-7xl mx-auto px-4 pb-20">
        <Outlet />
      </main>

      {/* Floating Action Button */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-6 w-6" />
            <span className="sr-only">Neuer Eintrag</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl">
          <div className="flex-1 overflow-y-auto p-4">
            <PhotoUploadForm onSubmit={(entry) => console.log('Form submitted:', entry)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
} 