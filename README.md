QUIZ MAŁŻEŃSKI




Logika działania programu:
Main
 ↓ 
App.tsx
  ↓ (questions + answers) 
  marriage.txs
  ↓ 
   .env
   ↓ 
   google.csv files (questions pobierane z .env - zawiera linki do plików CSV z pytaniami, wagami, kategoriami oraz polecanymi książkami)
   ↓ 
   jedna z 4 paths (Crisis, Marriage, Divorce etc)
      ↓ 
ResultDisplay.tsx
  ↓ (delegacja)
calculations.tsx
  ↓ (obliczony wynik)
ResultDisplay.tsx
  ↓
UI (ikony, tekst, opis)

