import { Link, useLocation } from "react-router-dom";
import { Home, Camera, Map, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Start", href: "/", icon: Home },
  { name: "Doku", href: "/documentation", icon: Camera },
  { name: "Karte", href: "/map", icon: Map },
  { name: "Einstellungen", href: "/settings", icon: Settings },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
      <div className="flex items-center justify-around h-16">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1",
                "text-sm font-medium transition-colors",
                isActive
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
} 