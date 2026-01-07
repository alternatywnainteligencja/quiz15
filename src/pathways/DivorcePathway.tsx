import React, { useState, useEffect } from 'react';
import QuestionScreen from '../components/QuestionScreen';
import { calculateDivorce } from '../calculations/calculations';
import { fetchQuestionsWithCache, Question, QuestionOption } from '../services/googleSheetsService';

interface DivorcePathwayProps {
  onResult: (result: any) => void;
  onBack: () => void;
}

const DivorcePathway: React.FC<DivorcePathwayProps> = ({ onResult, onBack }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);

  // Fallback questions - pełne przykłady dla ścieżki "rozwód/rozstanie"
  const fallbackQuestions: Question[] = [
    {
      id: '1',
      q: 'Na jakim etapie procesu rozstania jesteś?',
      opts: [
        { text: 'Myślę o rozstaniu, ale jeszcze nie podjąłem decyzji' },
        { text: 'Zdecydowałem, ale nie powiedziałem partnerce' },
        { text: 'Powiedziałem partnerce o rozstaniu' },
        { text: 'Mieszkamy osobno' },
        { text: 'Toczy się postępowanie rozwodowe' }
      ]
    },
    {
      id: '2',
      q: 'Kto zainicjował rozstanie?',
      opts: [
        { text: 'Ja' },
        { text: 'Ona' },
        { text: 'Oboje doszliśmy do tego' },
        { text: 'Jeszcze nie wiem, proces się toczy' }
      ]
    },
    {
      id: '3',
      q: 'Czy macie wspólne dzieci?',
      opts: [
        { text: 'Nie' },
        { text: 'Tak, jedno dziecko' },
        { text: 'Tak, dwoje lub więcej dzieci' },
        { text: 'Dzieci z poprzednich związków' }
      ]
    },
    {
      id: '4',
      q: 'Jak partnerka reaguje na rozstanie?',
      opts: [
        { text: 'Spokojnie, chce dobrego dla obu stron' },
        { text: 'Jest smutna, ale akceptuje sytuację' },
        { text: 'Jest wściekła, grozi konsekwencjami' },
        { text: 'Manipuluje emocjonalnie, używa dzieci jako narzędzia' },
        { text: 'Agresywnie, obawiam się o swoje bezpieczeństwo' }
      ]
    },
    {
      id: '5',
      q: 'Czy masz swojego prawnika?',
      opts: [
        { text: 'Tak, jestem w stałym kontakcie' },
        { text: 'Tak, ale rzadko się kontaktuję' },
        { text: 'Nie, ale planuję wynająć' },
        { text: 'Nie, nie widzę potrzeby' },
        { text: 'Nie stać mnie na prawnika' }
      ]
    },
    {
      id: '6',
      q: 'Czy partnerka próbowała ograniczyć Ci kontakt z dziećmi?',
      opts: [
        { text: 'Nie dotyczy - nie mamy dzieci' },
        { text: 'Nie, kontakt jest normalny' },
        { text: 'Tak, utrudnia spotkania' },
        { text: 'Tak, całkowicie zablokowała kontakt' },
        { text: 'Tak, grozi odebraniem dzieci' }
      ]
    },
    {
      id: '7',
      q: 'Czy partnerka wysuwała fałszywe oskarżenia (przemoc, molestowanie)?',
      opts: [
        { text: 'Nie' },
        { text: 'Groziła, że to zrobi' },
        { text: 'Tak, w rozmowach prywatnych' },
        { text: 'Tak, zgłosiła to na policję/prokuraturę' },
        { text: 'Tak, toczy się postępowanie' }
      ]
    },
    {
      id: '8',
      q: 'Jak wygląda podział majątku?',
      opts: [
        { text: 'Nie mamy wspólnego majątku' },
        { text: 'Dogadujemy się polubownie' },
        { text: 'Są spory, ale rozwiązywalne' },
        { text: 'Partnerka żąda więcej niż jej się należy' },
        { text: 'Toczy się batalia sądowa o majątek' }
      ]
    }
  ];

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        console.log('Fetching questions for "divorce" pathway...');
        const fetchedQuestions = await fetchQuestionsWithCache('divorce');
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
        const res = await calculateDivorce(newAnswers);
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
        title="💔 Rozwód/Rozstanie"
        question={q.q}
        options={q.opts.map(opt => typeof opt === 'string' ? opt : opt.text)}
        onAnswer={handleAnswer}
        onBack={handleBack}
        progress={progress}
        step={step + 1}
        total={questions.length}
        color="red"
      />
    </>
  );
};

export default DivorcePathway;
