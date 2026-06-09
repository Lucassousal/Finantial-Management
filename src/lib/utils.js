import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrencyInput(value) {
  if (value === undefined || value === null) return '';
  // Se já for um número (ex: ao carregar dados existentes no formulário se houver)
  const stringValue = typeof value === 'number' ? (value * 100).toFixed(0) : String(value);
  
  const digits = stringValue.replace(/\D/g, '');
  if (!digits) return '';
  
  const number = parseFloat(digits) / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(number);
}

export function parseCurrencyToNumber(formattedValue) {
  if (!formattedValue) return 0;
  if (typeof formattedValue === 'number') return formattedValue;
  const clean = formattedValue
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  return parseFloat(clean) || 0;
}

