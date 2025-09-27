import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
 // End duplicate 'cn' function and remove extraneous comment
export function createPageUrl(pageName: string): string {
  // Lowercase + replace spaces with dashes to form clean routes
  return `/${pageName.toLowerCase().replace(/\s+/g, "-")}`;
}
