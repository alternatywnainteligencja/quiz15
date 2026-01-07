/**
 * QuestionScreen.tsx
 *
 * Komponent wyświetlający pojedyncze pytanie quizu wraz z możliwymi odpowiedziami.
 * 
 * Funkcje:
 * - Pokazuje tytuł sekcji quizu (title)
 * - Wyświetla treść pytania (question)
 * - Renderuje listę przycisków odpowiedzi (options)
 * - Obsługuje wybór odpowiedzi przez wywołanie onAnswer
 * - Obsługuje przycisk "Wstecz" przez wywołanie onBack
 * - Pokazuje pasek postępu i numer aktualnego pytania (progress, step, total)
 * - Dostosowuje kolorystykę elementów w zależności od kontekstu quizu (color)
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react'; // Ikona strzałki używana w przycisku "Wstecz"

// Interfejs właściwości komponentu QuestionScreen
interface QuestionScreenProps {
  title: string; // Tytuł ekranu / sekcji quizu
  question: string; // Tekst pytania
  options: string[]; // Lista możliwych odpowiedzi
  onAnswer: (value: string) => void; // Funkcja wywoływana po wybraniu odpowiedzi
  onBack: () => void; // Funkcja wywoływana po kliknięciu "Wstecz"
  progress: number; // Postęp quizu w procentach (0-100)
  step: number; // Numer aktualnego pytania
  total: number; // Łączna liczba pytań
  color: 'blue' | 'green' | 'orange' | 'red'; // Kolor używany dla progresu i borderów
}

// Główny komponent wyświetlający pytanie i opcje odpowiedzi
const QuestionScreen: React.FC<QuestionScreenProps> = ({
  title,
  question,
  options,
  onAnswer,
  onBack,
  progress,
  step,
  total,
  color
}) => {
  // Mapowanie kolorów do klas Tailwind dla progress bar
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500'
  };

  // Mapowanie kolorów do klas Tailwind dla efektu hover przycisków
  const borderColors = {
    blue: 'hover:border-blue-500',
    green: 'hover:border-green-500',
    orange: 'hover:border-orange-500',
    red: 'hover:border-red-500'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4">
      {/* Kontener centralny */}
      <div className="max-w-2xl mx-auto py-8">
        <div className="bg-gray-800 rounded-lg shadow-2xl p-8 border border-gray-700">
          
          {/* Nagłówek z tytułem i przyciskiem "Wstecz" */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">{title}</h1>
            <button
              onClick={onBack} // Wywołanie funkcji cofania
              className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
            >
              <ArrowLeft size={20} /> Wstecz
            </button>
          </div>

          {/* Pasek postępu */}
          <div className="mb-6">
            <div className="bg-gray-700 rounded-full h-2 mb-2">
              {/* Wypełnienie paska w zależności od progress */}
              <div
                className={`${colors[color]} h-2 rounded-full transition-all`}
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Informacja tekstowa o aktualnym numerze pytania */}
            <p className="text-sm text-gray-400 text-center">
              Pytanie {step} z {total}
            </p>
          </div>

          {/* Treść pytania */}
          <h2 className="text-xl font-semibold mb-6">{question}</h2>

          {/* Lista przycisków odpowiedzi */}
          <div className="space-y-3">
            {options.map((opt, idx) => (
              <button
                key={idx} // Klucz wymagany przez React dla listy elementów
                onClick={() => onAnswer(opt)} // Wywołanie funkcji z wybraną odpowiedzią
                className={`w-full bg-gray-700 hover:bg-gray-600 text-left p-4 rounded-lg transition-colors border border-gray-600 ${borderColors[color]}`}
              >
                {opt} {/* Tekst odpowiedzi */}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionScreen;
