# ParkPoint — Angular kiosk demo

Samostalan Angular 18 frontend za **simulaciju** naplate parkinga preko registarske tablice.
Nema stvarnog novca, nema HTTP zahteva ka API-ju, nema baze, nema fiskalizacije.

## Pokretanje

Potrebni Node.js 20 ili 22 i npm.

```bash
npm install
npm start
```

Otvori http://localhost:4200

Produkcioni build:

```bash
npm run build
```

Build izlaz: `dist/parking-kiosk-demo/browser`.

## Korisnički tok

1. Unesi tablicu (fizička tastatura ili ekranska tastatura).
2. Izaberi jednu od test tablica ili potraži unetu.
3. Prikaži trajanje i obračun po DEMO tarifi.
4. Ako nije plaćeno ni pokriveno pretplatom, idi na simulaciju novčanica.
5. Izaberi novčanice 100, 200, 500, 1000, 2000 RSD.
6. Potvrdi simuliranu uplatu, pregledaj potvrdu i resetuj kiosk.

## Test tablice

| Tablica | Situacija |
| --- | --- |
| BG123AA | parkiranje 145 minuta, za naplatu |
| NS246BB | parkiranje 68 minuta, za naplatu |
| KG777CC | 14 minuta, unutar besplatnih 15 min (dok demo radi) |
| NI2020DD | već plaćeno |
| SU555EE | aktivna pretplata |
| BG888ZZ | pretplata istekla, za naplatu |
| BG000XX | nije pronađeno |

Primeri koriste relativna vremena od pokretanja/učitavanja aplikacije. Novčani iznosi su **fiktivni**.

## Demo tarifa

- Prvih 15 minuta besplatno.
- Nakon 15 minuta: **100 RSD za svaki započeti sat** (ukupno trajanje, ne samo vreme iznad 15 minuta).
- Simulirani kusur se izračunava, ali se ne isplaćuje (nema fizičkog uređaja).

Podešavanja: `src/app/services/demo-parking.service.ts` u `DEMO_TARIFF`.

## Ograničenja i bezbednost

- `Simulacija uplate` menja podatke **isključivo u memoriji browsera/sessionStorage**.
- Nema stvarnog API poziva, fakture, naplate, uzimanja novčanica, automatskog povraćaja kusura ili potvrde sa fiskalnog uređaja.
- Pretraživanje koristi isključivo unapred definisane test tablice. Prihvaćeni unos se normalizuje na velika slova i uklanjaju se razmaci/znaci.
- `Reset demo podataka` briše privremene uplate u toj browser sesiji.
- U pravoj aplikaciji samo backend + validirani cash-acceptor događaji mogu potvrditi naplatu. Browser ne sme označiti parking plaćenim na osnovu klika.
- Za produkciju implementirati auth na kiosku, idempotentne transakcije, verzionisanje obračuna, fiskalizaciju, zaštitu API-ja i uređaja, izlazni grace period, retry/outage slučajeve i proveru normativa.

## Dodavanje u postojeći projekat

Vidi `integration/ROUTE_SNIPPET.txt`. Najjednostavnije je držati kiosk kao zaseban frontend sajt, a Angular admin panel odvojeno.

## Render Static Site

- Root Directory: ako je ovo root repo-a, prazno; ako je unutra u folderu, ime tog foldera
- Build Command: `npm install && npm run build`
- Publish Directory: `dist/parking-kiosk-demo/browser`
- Rewrite: `/*` → `/index.html` (Action: Rewrite)
- Nema environment variables u ovoj demo varijanti.


## Novčanica veća od iznosa / escrow (verzija 1.1)

Ako je cena parkiranja 100 RSD i korisnik izabere simuliranu novčanicu 200 RSD, kiosk **ne knjiži 200 RSD odmah**. Prikazuje opciju da se prihvati DEMO jednodnevna pretplata od 200 RSD ili da se novčanica vrati. Za ostale veće apoene, bez odgovarajućeg demo paketa, dozvoljen je samo povraćaj. Uplata i pretplata su samo demo podaci u sessionStorage, bez komunikacije sa stvarnim hardverom.

**VAŽNO ZA PRODUKCIJU:** pravi validator mora podržavati escrow (zadržavanje pre slaganja) i reject/return komandu. Jednom složenu novčanicu u kasetu običan validator ne može vratiti; potrebni su recycler i pouzdan hardverski kontroler. Konačna cena i trajanje paketa moraju se definisati u cenovniku.
