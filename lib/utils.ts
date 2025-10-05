import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhoneNumber(value: string): string {
  // Remover todo excepto números
  const numbers = value.replace(/\D/g, "");

  // Limitar a 10 dígitos
  const limited = numbers.slice(0, 10);

  // Formatear como XX-XX-XX-XX-XX
  const formatted = limited.match(/.{1,2}/g)?.join("-") || limited;

  return formatted;
}
