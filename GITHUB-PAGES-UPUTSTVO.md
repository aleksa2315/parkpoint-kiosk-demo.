# ParkPoint demo – GitHub Pages

Ovo je zaseban Angular demo parking kioska bez stvarne naplate, kamere, baze ili prijema novca.

## Postavljanje u novi javni GitHub repozitorijum

1. Na https://github.com/new napravi **Public** repozitorijum, npr. `parkpoint-kiosk-demo`. Ne moraš da dodaješ README pri kreiranju.
2. Raspakuj ovaj ZIP i otvori terminal u njegovoj glavnoj fascikli (`package.json` i skriveni `.github` folder moraju biti na samom vrhu repozitorijuma).
3. Izvrši (zameni USERNAME svojim GitHub korisničkim imenom):

   git init
   git add .
   git commit -m "ParkPoint kiosk demo"
   git branch -M main
   git remote add origin https://github.com/USERNAME/parkpoint-kiosk-demo.git
   git push -u origin main

4. Otvori na GitHub-u svoj repo > **Settings > Pages** > pod `Build and deployment` izaberi **Source: GitHub Actions**.
5. Otvori karticu **Actions**. Ako objavljivanje već nije uspešno završeno, pokreni **Deploy ParkPoint kiosk to GitHub Pages > Run workflow** (ili ponovo pokreni prethodni workflow).
6. Kada deployment završi uspešno, link je oblika: https://USERNAME.github.io/parkpoint-kiosk-demo/

Naziv repozitorijuma može biti i drugi; workflow automatski podešava Angular base href.

Proba: tablica `BG100AA`, dug 100 RSD, klik na novčanicu 200 RSD -> dijalog za jednodnevnu demo pretplatu ili povrat novčanice. Sve je simulacija.

## Ako već imaš lokalni projekat

Kopiraj samo `.github/workflows/deploy.yml` u koren repozitorijuma i pushuj; postupak dalje je isti.

Upozorenje: GitHub Pages je javni hosting za statičke aplikacije; ne stavljati lozinke, API ključeve ni produkcione podatke u frontend.
