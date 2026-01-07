QUIZ MAŁŻEŃSKI




Logika działania programu:
App.tsx
  ↓ (questions + answers) (questions pobierane z .env - zawiera linki do plików CSV z pytaniami, wagami, kategoriami oraz polecanymi książkami)
ResultDisplay.tsx
  ↓ (delegacja)
calculations.tsx
  ↓ (obliczony wynik)
ResultDisplay.tsx
  ↓
UI (ikony, tekst, opis)

