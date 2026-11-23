import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DemoParkingService, ParkingQuote, DEMO_TARIFF } from '../services/demo-parking.service';

type KioskStep = 'search' | 'details' | 'payment' | 'note-choice' | 'completed';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, DecimalPipe],
  templateUrl: './kiosk.component.html',
  styleUrls: ['./kiosk.component.css']
})
export class KioskComponent implements OnInit, OnDestroy {
  step: KioskStep = 'search';
  plateInput = '';
  searchError = '';
  quote: ParkingQuote | null = null;
  insertedRsd = 0;
  insertedNotes: number[] = [];
  paymentTime: Date | null = null;
  pendingNoteRsd = 0;
  paymentKind: 'parking' | 'subscription' = 'parking';
  subscriptionExpiry: string | null = null;
  readonly subscriptionPriceRsd = 200; // DEMO paket, nije stvarna tarifa
  readonly subscriptionDurationDays = 1; // DEMO trajanje
  clock = new Date();
  readonly tariff = DEMO_TARIFF;
  readonly quickPlates = [
    { plate: 'BG100AA', label: '100 RSD — probaj 200' },
    { plate: 'BG123AA', label: 'Za naplatu' },
    { plate: 'NS246BB', label: 'Za naplatu' },
    { plate: 'KG777CC', label: 'Besplatno' },
    { plate: 'NI2020DD', label: 'Već plaćeno' },
    { plate: 'SU555EE', label: 'Pretplata' },
    { plate: 'BG888ZZ', label: 'Istekla pretplata' }
  ];
  readonly denominations = [100, 200, 500, 1000, 2000];
  readonly keyboardRows = ['1234567890', 'QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map(row => row.split(''));
  private clockInterval?: ReturnType<typeof setInterval>;

  constructor(private readonly parking: DemoParkingService) {}
  ngOnInit(): void { this.clockInterval = setInterval(() => this.clock = new Date(), 30_000); }
  ngOnDestroy(): void { if (this.clockInterval) clearInterval(this.clockInterval); }

  get hasSearch(): boolean { return this.parking.normalizePlate(this.plateInput).length >= 4; }
  get remainingRsd(): number { return Math.max(0, (this.quote?.amountRsd || 0) - this.insertedRsd); }
  get changeRsd(): number { return Math.max(0, this.insertedRsd - (this.quote?.amountRsd || 0)); }
  get canConfirmPayment(): boolean { return this.step === 'payment' && !!this.quote && this.insertedRsd === this.quote.amountRsd && this.quote.amountRsd > 0 && !this.pendingNoteRsd; }
  get canOfferSubscription(): boolean { return !!this.quote && this.quote.amountRsd === 100 && this.insertedRsd === 0 && this.pendingNoteRsd === this.subscriptionPriceRsd; }

  get readableDuration(): string {
    if (!this.quote) return '—';
    const mins = this.quote.minutesParked;
    const hours = Math.floor(mins / 60);
    return hours > 0 ? `${hours} h ${mins % 60} min` : `${mins} min`;
  }

  updatePlate(next: string): void { this.plateInput = this.parking.normalizePlate(next); this.searchError = ''; }
  choosePlate(plate: string): void { this.updatePlate(plate); this.lookup(); }
  virtualKey(char: string): void { this.updatePlate(this.plateInput + char); }
  backspace(): void { this.updatePlate(this.plateInput.slice(0, -1)); }

  lookup(): void {
    this.searchError = '';
    const plate = this.parking.normalizePlate(this.plateInput);
    if (plate.length < 4) { this.searchError = 'Unesite najmanje 4 karaktera registarske oznake.'; return; }
    const quote = this.parking.find(plate);
    if (!quote) { this.searchError = `Nije pronađena aktivna demo parking sesija za ${plate}.`; return; }
    this.quote = quote;
    this.plateInput = plate;
    this.step = 'details';
    this.insertedRsd = 0;
    this.insertedNotes = [];
    this.paymentTime = null;
    this.pendingNoteRsd = 0;
    this.paymentKind = 'parking';
    this.subscriptionExpiry = null;
  }

  beginPayment(): void {
    if (this.quote?.status !== 'UNPAID' || this.quote.amountRsd <= 0) return;
    this.step = 'payment';
  }
  insertNote(value: number): void {
    if (this.step !== 'payment' || this.canConfirmPayment || !this.quote || this.pendingNoteRsd) return;
    if (value > this.remainingRsd) {
      // Banknota je prepoznata, ali je samo u escrow poziciji.
      // Ovde jos NE smemo knjiziti novac kao primljen.
      this.pendingNoteRsd = value;
      this.step = 'note-choice';
      return;
    }
    this.insertedRsd += value;
    this.insertedNotes.push(value);
  }
  returnPendingNote(): void {
    if (this.step !== 'note-choice') return;
    // DEMO simulira komandu validatoru da vrati escrow novcanicu.
    this.pendingNoteRsd = 0;
    this.step = 'payment';
  }
  activateSubscription(): void {
    if (this.step !== 'note-choice' || !this.canOfferSubscription || !this.quote) return;
    // DEMO simulira stack/accept tek nakon odluke korisnika.
    this.insertedRsd = this.pendingNoteRsd;
    this.insertedNotes.push(this.pendingNoteRsd);
    this.pendingNoteRsd = 0;
    this.paymentKind = 'subscription';
    this.subscriptionExpiry = this.parking.markSubscribed(this.quote.session.plate, this.subscriptionDurationDays);
    this.paymentTime = new Date();
    this.step = 'completed';
  }
  undoNote(): void {
    if (this.step !== 'payment') return;
    const value = this.insertedNotes.pop();
    if (value !== undefined) this.insertedRsd -= value;
  }
  cancelPayment(): void {
    // In a real kiosk, cash refunds would require hardware reconciliation.
    // Here the money is entirely simulated; returning to details discards it.
    this.insertedRsd = 0;
    this.insertedNotes = [];
    this.pendingNoteRsd = 0;
    this.step = 'details';
  }
  confirmPayment(): void {
    if (!this.canConfirmPayment || !this.quote) return;
    this.parking.markPaid(this.quote.session.plate);
    this.paymentKind = 'parking';
    this.paymentTime = new Date();
    this.step = 'completed';
  }
  startOver(): void {
    this.step = 'search';
    this.plateInput = '';
    this.searchError = '';
    this.quote = null;
    this.insertedRsd = 0;
    this.insertedNotes = [];
    this.paymentTime = null;
    this.pendingNoteRsd = 0;
    this.paymentKind = 'parking';
    this.subscriptionExpiry = null;
  }
  resetDemo(): void { this.parking.resetAllDemoPayments(); this.startOver(); }
  currentStepIndex(): number { return this.step === 'search' ? 0 : this.step === 'details' ? 1 : (this.step === 'payment' || this.step === 'note-choice') ? 2 : 3; }
}
