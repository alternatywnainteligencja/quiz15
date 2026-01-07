import { defineConfig } from 'vite';
// Co robi: Importuje funkcję defineConfig z Vite.  Dlaczego jest potrzebna:  Ułatwia pisanie konfiguracji Vite w czytelny sposób.  W TypeScript pozwala na autouzupełnianie i sprawdzanie typów (choć w JS też można jej używać).
// Efekt: Funkcja nie zmienia działania kodu, ale sprawia, że konfiguracja jest “formalnie poprawna” dla Vite.
import react from '@vitejs/plugin-react';
//Co robi: Importuje plugin React dla Vite. Dlaczego jest potrzebny:
// Vite sam z siebie nie rozumie JSX ani TSX, więc potrzebuje tego pluginu.
//Plugin obsługuje:
//JSX/TSX w React,
//Hot Module Replacement (HMR, czyli szybkie odświeżanie zmian bez przeładowania strony),
//inne optymalizacje bundla dla projektów React.
//Efekt: Bez tego Twój kod React może nie kompilować się poprawnie w Vite.



/**
 * Uwaga dot. base path:
 *
 * - W trybie developerskim (`npm run dev`) aplikacja działa lokalnie pod `/`
 *   → ustawienie base na `/quiz16/` powoduje białą stronę,
 *     bo Vite szuka plików JS/CSS pod nieistniejącą ścieżką.
 *
 * - W trybie produkcyjnym (`npm run build`) aplikacja jest publikowana
 *   na GitHub Pages w podkatalogu `/quiz16/`
 *   → wtedy base MUSI być ustawione na `/quiz16/`.
 *
 * Dlatego base ustawiamy warunkowo w zależności od trybu.
 */
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/quiz16/' : '/',
  plugins: [react()],
}))
