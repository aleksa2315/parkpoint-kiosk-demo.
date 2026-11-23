import { Injectable } from '@angular/core';

export interface ParkingSession {
  plate: string;
  entryAt: string;
  paidAt?: string;
  subscriptionUntil?: string;
}

export type ParkingStatus = 'UNPAID' | 'PAID' | 'SUBSCRIPTION' | 'FREE';

export interface ParkingQuote {
  session: ParkingSession;
  status: ParkingStatus;
  minutesParked: number;
  amountRsd: number;
}

// Demo tariff: free first 15 min, then 100 RSD per started hour.
// Only test data. Nothing is sent to a real backend or payment provider.
export const DEMO_TARIFF = { freeMinutes: 15, hourlyRsd: 100 } as const;

const STORAGE_KEY = 'parking-kiosk-demo-v1';
const SUBSCRIPTION_KEY = 'parking-kiosk-demo-subscriptions-v1';

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}
function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

@Injectable({ providedIn: 'root' })
export class DemoParkingService {
  private readonly entries: ParkingSession[] = [
    { plate: 'BG100AA', entryAt: minutesAgo(35) },
    { plate: 'BG123AA', entryAt: minutesAgo(145) },
    { plate: 'NS246BB', entryAt: minutesAgo(68) },
    { plate: 'KG777CC', entryAt: minutesAgo(14) },
    { plate: 'NI2020DD', entryAt: minutesAgo(215), paidAt: minutesAgo(11) },
    { plate: 'SU555EE', entryAt: minutesAgo(131), subscriptionUntil: daysFromNow(8) },
    { plate: 'BG888ZZ', entryAt: minutesAgo(95), subscriptionUntil: daysFromNow(-2) }
  ];

  constructor() {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const paid = JSON.parse(saved) as Record<string, string>;
        for (const entry of this.entries) {
          if (paid[entry.plate]) entry.paidAt = paid[entry.plate];
        }
      }
      const subscriptions = sessionStorage.getItem(SUBSCRIPTION_KEY);
      if (subscriptions) {
        const active = JSON.parse(subscriptions) as Record<string, string>;
        for (const entry of this.entries) {
          if (active[entry.plate]) entry.subscriptionUntil = active[entry.plate];
        }
      }
    } catch { /* Session storage may be disabled. Demo still works. */ }
  }

  normalizePlate(value: string): string {
    return (value || '').toUpperCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Z0-9]/g, '').slice(0, 12);
  }

  find(plateText: string): ParkingQuote | null {
    const plate = this.normalizePlate(plateText);
    const session = this.entries.find(entry => entry.plate === plate);
    if (!session) return null;
    const now = Date.now();
    const minutesParked = Math.max(0, Math.floor((now - new Date(session.entryAt).getTime()) / 60_000));
    const subscriptionActive = !!session.subscriptionUntil && new Date(session.subscriptionUntil).getTime() >= now;
    const free = minutesParked <= DEMO_TARIFF.freeMinutes;
    const status: ParkingStatus = subscriptionActive ? 'SUBSCRIPTION' : session.paidAt ? 'PAID' : free ? 'FREE' : 'UNPAID';
    const amountRsd = status !== 'UNPAID' ? 0 : Math.ceil(minutesParked / 60) * DEMO_TARIFF.hourlyRsd;
    return { session: { ...session }, status, minutesParked, amountRsd };
  }

  markPaid(plate: string): void {
    const entry = this.entries.find(x => x.plate === plate);
    if (!entry) return;
    entry.paidAt = new Date().toISOString();
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      const state = saved ? JSON.parse(saved) as Record<string,string> : {};
      state[plate] = entry.paidAt;
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* No persistent demo state if storage unavailable. */ }
  }

  markSubscribed(plate: string, durationDays: number): string {
    const entry = this.entries.find(x => x.plate === plate);
    if (!entry) throw new Error('Nepoznata registracija');
    const expiry = daysFromNow(durationDays);
    entry.subscriptionUntil = expiry;
    try {
      const saved = sessionStorage.getItem(SUBSCRIPTION_KEY);
      const state = saved ? JSON.parse(saved) as Record<string, string> : {};
      state[plate] = expiry;
      sessionStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(state));
    } catch { /* Demo i bez sessionStorage */ }
    return expiry;
  }

  resetAllDemoPayments(): void {
    try { sessionStorage.removeItem(STORAGE_KEY); sessionStorage.removeItem(SUBSCRIPTION_KEY); } catch { /* ignore */ }
    for (const entry of this.entries) {
      if (entry.plate !== 'NI2020DD') entry.paidAt = undefined;
      if (entry.plate !== 'SU555EE' && entry.plate !== 'BG888ZZ') entry.subscriptionUntil = undefined;
    }
  }
}
