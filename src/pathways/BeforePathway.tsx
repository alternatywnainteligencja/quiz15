import React, { useState, useEffect } from 'react';
import QuestionScreen from '../components/QuestionScreen';
import { calculateBefore } from '../calculations/calculations';
import { fetchQuestionsWithCache, Question, QuestionOption } from '../services/googleSheetsService';

interface BeforePathwayProps {
  onResult: (result: any) => void;
  onBack: () => void;
}

const BeforePathway: React.FC<BeforePathwayProps> = ({ onResult, onBack }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);

  // Fallback questions - pełne przykłady dla ścieżki "przed ślubem"
  const fallbackQuestions: Question[] = [
    { 
      id: '1', 
      q: 'Jak reagujesz, gdy partnerka chce porozmawiać o trudnych emocjach - otwierasz się, czy raczej wycofujesz?', 
      opts: [
        { text: 'Zmieniam temat, staram się, aby atmosfera była lżejsza.' }, 
        { text: 'Otwieram się, ale szybko przechodzę do szukania rozwiązań problemu.' },
        { text: 'Wycofuję się, potrzebuję czasu, żeby to przetrawić samemu.' },
        { text: 'Otwieram się, staram się ją wysłuchać i dzielę się swoimi uczuciami.' },
        { text: 'Złoszczę się lub oskarżam ją, że „ciągle coś wymyśla" i nie mam ochoty tego słuchać.' },
        { text: 'Milczę demonstracyjnie lub wychodzę, żeby „dać jej nauczkę".' }
      ]
    },
    {
      id: '2',
      q: 'Jak często wasza komunikacja wygląda jak „chodzenie po jajkach"?',
      opts: [
        { text: 'Prawie nigdy - mówimy otwarcie' },
        { text: 'Czasami unikam trudnych tematów' },
        { text: 'Często - boję się jej reakcji' },
        { text: 'Zawsze - czuję napięcie w każdej rozmowie' }
      ]
    },
    {
      id: '3',
      q: 'Czy partnerka respektuje Twoje granice i potrzeby?',
      opts: [
        { text: 'Tak, zawsze' },
        { text: 'Przeważnie tak' },
        { text: 'Czasami ignoruje moje potrzeby' },
        { text: 'Często narzuca swoją wolę' },
        { text: 'W ogóle nie respektuje moich granic' }
      ]
    },
    {
      id: '4',
      q: 'Jak wygląda wasza intymność fizyczna?',
      opts: [
        { text: 'Satysfakcjonująca dla obojga' },
        { text: 'Dobra, ale mogłaby być lepsza' },
        { text: 'Sporadyczna, brak inicjatywy z jej strony' },
        { text: 'Używa seksu jako narzędzia nagrody/kary' },
        { text: 'Prawie nie ma intymności' }
      ]
    },
    {
      id: '5',
      q: 'Czy myślałeś kiedyś: "To nie jest ta osoba, z którą chcę spędzić życie"?',
      opts: [
        { text: 'Nigdy' },
        { text: 'Rzadko, w trudnych momentach' },
        { text: 'Czasami to myślę' },
        { text: 'Często mam takie myśli' },
        { text: 'Codziennie o tym myślę' }
      ]
    }
  ];

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        console.log('Fetching questions for "before" pathway...');
        const fetchedQuestions = await fetchQuestionsWithCache('before');
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
        const res = await calculateBefore(newAnswers);
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
        title="💙 Przed ślubem"
        question={q.q}
        options={q.opts.map(opt => typeof opt === 'string' ? opt : opt.text)}
        onAnswer={handleAnswer}
        onBack={handleBack}
        progress={progress}
        step={step + 1}
        total={questions.length}
        color="blue"
      />
    </>
  );
};

export default BeforePathway;
