import { useEffect, useRef } from "react";
import { Map, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Button } from "@/components/ui/Button";
import { Locate } from "lucide-react";

interface MapViewProps {
  markers: Array<{
    id: string;
    lat: number;
    lng: number;
    imageUrl: string;
    description: string;
  }>;
  onMarkerClick?: (markerId: string) => void;
}

export default function MapView({ markers, onMarkerClick }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new Map({
      container: mapContainer.current,
      style: "https://api.maptiler.com/maps/streets/style.json?key=YOUR_MAPTILER_KEY",
      center: [10.4515, 51.1657], // Germany center
      zoom: 6
    });

    // Add markers
    markers.forEach(marker => {
      // Create custom marker element
      const el = document.createElement("div");
      el.className = "w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-md cursor-pointer";
      
      const img = document.createElement("img");
      img.src = marker.imageUrl;
      img.className = "w-full h-full object-cover";
      el.appendChild(img);

      // Add marker to map
      new Marker({ element: el })
        .setLngLat([marker.lng, marker.lat])
        .addTo(map.current!);

      // Add click handler
      el.addEventListener("click", () => {
        onMarkerClick?.(marker.id);
      });
    });

    return () => {
      map.current?.remove();
    };
  }, [markers, onMarkerClick]);

  const handleLocateMe = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        map.current?.flyTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 14,
          duration: 2000
        });
      });
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)]">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Controls */}
      <div className="absolute bottom-6 right-4 z-10">
        <Button
          variant="secondary"
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg bg-white hover:bg-gray-100"
          onClick={handleLocateMe}
        >
          <Locate className="h-5 w-5" />
          <span className="sr-only">Standort anzeigen</span>
        </Button>
      </div>
    </div>
  );
} 