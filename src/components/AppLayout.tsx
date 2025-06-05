import React, { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { Outlet } from "react-router-dom";
import BottomNav from "./BottomNav";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import PhotoUploadForm from "./PhotoUploadForm";

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();

  // Helper function to check if a link is active
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <img src="/logo.svg" alt="BriqWerk Core" className="h-8 w-8 text-primary" />
          <span className="ml-2 text-xl font-semibold text-gray-800">BriqWerk Core</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link
            to="/dashboard"
            className={`block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 ${
              isActive('/dashboard') && 'bg-gray-100 font-medium'
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/entries"
            className={`block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 ${
              isActive('/entries') && 'bg-gray-100 font-medium'
            }`}
          >
            Meine Einträge
          </Link>
          <Link
            to="/profile"
            className={`block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 ${
              isActive('/profile') && 'bg-gray-100 font-medium'
            }`}
          >
            Profil
          </Link>
          <Link
            to="/settings"
            className={`block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 ${
              isActive('/settings') && 'bg-gray-100 font-medium'
            }`}
          >
            Einstellungen
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center justify-between bg-white border-b border-gray-200 px-6">
          {/* Header-Links (Logo) */}
          <div className="flex items-center space-x-4">
            <img src="/logo.svg" alt="BriqWerk Core" className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-gray-800">BriqWerk Core</span>
          </div>
          {/* Settings-Icon */}
          <div className="flex items-center space-x-4">
            <Link
              to="/settings"
              className="p-2 rounded-full hover:bg-gray-100"
              aria-label="Einstellungen"
            >
              <Settings className="h-6 w-6 text-gray-600 hover:text-gray-800" />
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export function AppLayoutOld() {
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