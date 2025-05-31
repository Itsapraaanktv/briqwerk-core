import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names using clsx and tailwind-merge
 * This allows for conditional classes and proper Tailwind class merging
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a file size in bytes to a human readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Creates a URL for a Blob or File object
 * Remember to revoke the URL when no longer needed
 */
export function createObjectURL(file: Blob | File): string {
  return URL.createObjectURL(file);
}

/**
 * Revokes a previously created object URL
 */
export function revokeObjectURL(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Validates if a file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

/**
 * Validates if a file size is within limits
 */
export function isFileSizeValid(file: File, maxSizeInMB: number): boolean {
  return file.size <= maxSizeInMB * 1024 * 1024;
}

/**
 * Formats coordinates to a human readable string
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)}°, ${lng.toFixed(6)}°`;
}

/**
 * Delays execution for a specified number of milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
} 