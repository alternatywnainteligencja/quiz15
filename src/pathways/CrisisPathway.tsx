import React, { useState, useEffect } from 'react';
import QuestionScreen from '../components/QuestionScreen';
import { calculateCrisis } from '../calculations/calculations';
import { fetchQuestionsWithCache, Question, QuestionOption } from '../services/googleSheetsService';

interface CrisisPathwayProps {
  onResult: (result: any) => void;
  onBack: () => void;
}

const CrisisPathway: React.FC<CrisisPathwayProps> = ({ onResult, onBack }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);

  // Fallback questions - pełne przykłady dla ścieżki "kryzys"
  const fallbackQuestions: Question[] = [
    {
      id: '1',
      q: 'Jak często dochodzi do intensywnych kłótni w ostatnim czasie?',
      opts: [
        { text: 'Rzadko - raz na kilka miesięcy' },
        { text: 'Kilka razy w miesiącu' },
        { text: 'Co tydzień' },
        { text: 'Prawie codziennie' },
        { text: 'Kilka razy dziennie - żyjemy w stałym konflikcie' }
      ]
    },
    {
      id: '2',
      q: 'Czy partnerka groziła Ci już rozstaniem/rozwodem?',
      opts: [
        { text: 'Nigdy' },
        { text: 'Raz, w emocjach' },
        { text: 'Kilka razy' },
        { text: 'Często to robi' },
        { text: 'Używa tego jako narzędzia manipulacji' }
      ]
    },
    {
      id: '3',
      q: 'Czy w kłótniach pojawia się agresja fizyczna (popychanie, rzucanie rzeczami)?',
      opts: [
        { text: 'Nigdy' },
        { text: 'Raz się zdarzyło' },
        { text: 'Kilka razy - z jej strony' },
        { text: 'Kilka razy - z obu stron' },
        { text: 'Regularnie - sytuacja jest niebezpieczna' }
      ]
    },
    {
      id: '4',
      q: 'Czy partnerka kontroluje Twoje finanse, telefon, kontakty ze znajomymi?',
      opts: [
        { text: 'Nie, mam pełną swobodę' },
        { text: 'Czasami pyta o szczegóły' },
        { text: 'Sprawdza mój telefon/konta bez pytania' },
        { text: 'Wymaga dostępu do wszystkiego' },
        { text: 'Kontroluje każdy aspekt mojego życia' }
      ]
    },
    {
      id: '5',
      q: 'Czy myślałeś o tym, żeby szukać pomocy prawnika lub terapeuty?',
      opts: [
        { text: 'Nie, nie widzę potrzeby' },
        { text: 'Myślałem, ale jeszcze nie działałem' },
        { text: 'Już poszukuję informacji' },
        { text: 'Umówiłem się na konsultację' },
        { text: 'Jestem w trakcie procesu prawnego/terapii' }
      ]
    },
    {
      id: '6',
      q: 'Czy są dzieci w związku?',
      opts: [
        { text: 'Nie' },
        { text: 'Tak, jedno dziecko' },
        { text: 'Tak, dwoje lub więcej dzieci' },
        { text: 'Partnerka jest w ciąży' }
      ]
    }
  ];

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        console.log('Fetching questions for "crisis" pathway...');
        const fetchedQuestions = await fetchQuestionsWithCache('crisis');
        console.log(`Loaded ${fetchedQuestions.length} questions`);
        setQuestions(fetchedQuestions);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch questions, using fallback:', err);
        setError('Używam lokalnych pytań (problem z połączeniem do Google Sheets)');
        setQuestions(fallbackQuestions);
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, []);

  const handleAnswer = async (value: string) => {
    const currentQuestion = questions[step];
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    console.log(`Question ${currentQuestion.id}: "${value}"`);

    const chosenOpt = currentQuestion.opts.find(opt =>
      typeof opt === 'string' ? opt === value : opt.text === value
    );

    let nextStep = step + 1;

    if (chosenOpt && typeof chosenOpt === 'object' && chosenOpt.next) {
      const nextIndex = questions.findIndex(q => q.id === chosenOpt.next);
      if (nextIndex !== -1) {
        nextStep = nextIndex;
        console.log(`Conditional jump to question: ${chosenOpt.next}`);
      } else {
        console.warn(`Next question with id "${chosenOpt.next}" not found. Proceeding to next question.`);
      }
    }

    if (nextStep < questions.length) {
      setStep(nextStep);
    } else {
      console.log('Quiz completed! Calculating results...');
      console.log('Answers:', newAnswers);
      
      try {
        setCalculating(true);
        const res = await calculateCrisis(newAnswers);
        console.log('Calculation result:', res);
        onResult(res);
      } catch (err) {
        console.error('Error calculating results:', err);
        setError('Błąd podczas obliczania wyników. Spróbuj ponownie.');
        setCalculating(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      const currentQuestionId = questions[step].id;
      const newAnswers = { ...answers };
      delete newAnswers[currentQuestionId];
      setAnswers(newAnswers);
    } else {
      onBack();
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem' }}>⏳</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
          Ładowanie pytań...
        </div>
        <div style={{ fontSize: '0.875rem', color: '#666' }}>
          Pobieranie danych z Google Sheets
        </div>
      </div>
    );
  }

  if (calculating) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem' }}>🧮</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
          Analizuję Twoje odpowiedzi...
        </div>
        <div style={{ fontSize: '0.875rem', color: '#666' }}>
          Kalkulacja ryzyka na podstawie wag z arkusza
        </div>
      </div>
    );
  }

  const q = questions[step];
  const progress = ((step + 1) / questions.length) * 100;

  return (
    <>
      {error && (
        <div style={{ 
          padding: '0.75rem 1rem', 
          backgroundColor: '#fff3cd', 
          color: '#856404',
          textAlign: 'center',
          fontSize: '0.875rem',
          borderBottom: '1px solid #ffeaa7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          <span>{error}</span>
        </div>
      )}
      <QuestionScreen
        title="⚠️ W kryzysie"
        question={q.q}
        options={q.opts.map(opt => typeof opt === 'string' ? opt : opt.text)}
        onAnswer={handleAnswer}
        onBack={handleBack}
        progress={progress}
        step={step + 1}
        total={questions.length}
        color="orange"
      />
    </>
  );
};

export default CrisisPathway;
