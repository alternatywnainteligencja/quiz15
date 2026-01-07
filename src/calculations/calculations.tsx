/**
 * ten program bierze odpowiedzi użytkowników i oblicza na ich podstawie rezultat, który przekaże do Results
 * Dynamicznie generuje content na podstawie danych, nie statycznych szablonów
 */

import { fetchWeightsWithCache, type WeightsData } from '../services/googleSheetsService';

interface CalculationResult {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  mainTitle: string;
  mainDescription: string;
  
  overallRiskPercentage: number;
  riskBreakdown: Record<string, number>;
  
  probabilities: {
    divorce: number;
    falseAccusation: number;
    alienation: number;
    financialLoss: number;
  };
  scenarios: Array<{
    scenario: string;
    probability: number;
    why: string;
    impactScore: number;
  }>;
  actionItems: Array<{
    priority: string;
    action: string;
  }>;
  recommendations: Array<{
    type: string;
    text: string;
  }>;
  timeline: {
    days30: string[];
    days90: string[];
    days365: string[];
  };
  readingList: Array<{
    title: string;
    author: string;
    description: string;
  }>;
  psychologicalProfiles: {
    user: Array<{ label: string; value: string }>;
    partner: Array<{ label: string; value: string }>;
  };
  conclusion: {
    summary: string;
    cta: string;
  };
  meta: {
    source: string;
    score: number;
    generatedAt: string;
    totalQuestions: number;
    answeredQuestions: number;
  };
}

// Cache dla wag
let weightsDataCache: WeightsData | null = null;

async function getWeightsData(): Promise<WeightsData> {
  if (!weightsDataCache) {
    try {
      weightsDataCache = await fetchWeightsWithCache();
      console.log('✅ Loaded weights from API:', weightsDataCache.weights?.length || 0);
    } catch (error) {
      console.error('❌ Failed to load weights:', error);
      // Fallback do pustej struktury
      weightsDataCache = { weights: [], lastUpdated: new Date().toISOString() };
    }
  }
  return weightsDataCache;
}


/**
 * 🧪 Mock data do testowania - używane gdy API nie działa
 */
function createMockWeights() {
  return [
    // Before pathway
    { questionId: 'communication_quality', answer: 'Bardzo dobra', riskPoints: 1, mainRisk: '-', sideRisks: [] },
    { questionId: 'communication_quality', answer: 'Dobra', riskPoints: 2, mainRisk: '-', sideRisks: [] },
    { questionId: 'communication_quality', answer: 'Średnia', riskPoints: 4, mainRisk: 'Rozstanie/Rozwód', sideRisks: [] },
    { questionId: 'communication_quality', answer: 'Zła', riskPoints: 7, mainRisk: 'Rozstanie/Rozwód', sideRisks: ['Manipulacja'] },
    { questionId: 'communication_quality', answer: 'Bardzo zła', riskPoints: 9, mainRisk: 'Rozstanie/Rozwód', sideRisks: ['Manipulacja'] },
    
    { questionId: 'financial_control', answer: 'Wspólna kontrola', riskPoints: 1, mainRisk: '-', sideRisks: [] },
    { questionId: 'financial_control', answer: 'Głównie ja', riskPoints: 2, mainRisk: '-', sideRisks: [] },
    { questionId: 'financial_control', answer: 'Głównie partnerka', riskPoints: 5, mainRisk: 'Straty finansowe', sideRisks: ['Manipulacja'] },
    { questionId: 'financial_control', answer: 'Tylko partnerka', riskPoints: 9, mainRisk: 'Straty finansowe', sideRisks: ['Manipulacja'] },
    
    { questionId: 'has_kids', answer: 'Tak', riskPoints: 0, mainRisk: '-', sideRisks: [] },
    { questionId: 'has_kids', answer: 'Nie', riskPoints: 0, mainRisk: '-', sideRisks: [] },
    
    { questionId: 'kids_relationship', answer: 'Dobra', riskPoints: 1, mainRisk: '-', sideRisks: [] },
    { questionId: 'kids_relationship', answer: 'Średnia', riskPoints: 4, mainRisk: 'Alienacja rodzicielska', sideRisks: [] },
    { questionId: 'kids_relationship', answer: 'Konfliktowa', riskPoints: 7, mainRisk: 'Alienacja rodzicielska', sideRisks: ['Fałszywe oskarżenia'] },
    { questionId: 'kids_relationship', answer: 'Bardzo konfliktowa', riskPoints: 10, mainRisk: 'Alienacja rodzicielska', sideRisks: ['Fałszywe oskarżenia'] },
    
    { questionId: 'emotional_abuse', answer: 'Nie', riskPoints: 0, mainRisk: '-', sideRisks: [] },
    { questionId: 'emotional_abuse', answer: 'Czasami', riskPoints: 5, mainRisk: 'Manipulacja', sideRisks: ['Rozstanie/Rozwód'] },
    { questionId: 'emotional_abuse', answer: 'Często', riskPoints: 8, mainRisk: 'Manipulacja', sideRisks: ['Rozstanie/Rozwód', 'Fałszywe oskarżenia'] },
    { questionId: 'emotional_abuse', answer: 'Bardzo często', riskPoints: 10, mainRisk: 'Manipulacja', sideRisks: ['Rozstanie/Rozwód', 'Fałszywe oskarżenia'] },
    
    { questionId: 'support_network', answer: 'Tak, mam wsparcie', riskPoints: 0, mainRisk: '-', sideRisks: [] },
    { questionId: 'support_network', answer: 'Niewielkie', riskPoints: 3, mainRisk: 'Manipulacja', sideRisks: [] },
    { questionId: 'support_network', answer: 'Nie, jestem odcięty', riskPoints: 8, mainRisk: 'Manipulacja', sideRisks: ['Straty finansowe'] },
    
    // Crisis pathway
    { questionId: 'conflict_level', answer: 'Niski', riskPoints: 2, mainRisk: '-', sideRisks: [] },
    { questionId: 'conflict_level', answer: 'Średni', riskPoints: 5, mainRisk: 'Rozstanie/Rozwód', sideRisks: [] },
    { questionId: 'conflict_level', answer: 'Wysoki', riskPoints: 8, mainRisk: 'Rozstanie/Rozwód', sideRisks: ['Fałszywe oskarżenia'] },
    { questionId: 'conflict_level', answer: 'Ekstremalny', riskPoints: 10, mainRisk: 'Rozstanie/Rozwód', sideRisks: ['Fałszywe oskarżenia', 'Alienacja rodzicielska'] },
    
    // Divorce pathway
    { questionId: 'legal_representation', answer: 'Tak, mam prawnika', riskPoints: 0, mainRisk: '-', sideRisks: [] },
    { questionId: 'legal_representation', answer: 'Nie', riskPoints: 7, mainRisk: 'Straty finansowe', sideRisks: ['Fałszywe oskarżenia'] },
    
    // Married pathway
    { questionId: 'relationship_satisfaction', answer: 'Bardzo zadowolony', riskPoints: 0, mainRisk: '-', sideRisks: [] },
    { questionId: 'relationship_satisfaction', answer: 'Zadowolony', riskPoints: 2, mainRisk: '-', sideRisks: [] },
    { questionId: 'relationship_satisfaction', answer: 'Średnio', riskPoints: 5, mainRisk: 'Rozstanie/Rozwód', sideRisks: [] },
    { questionId: 'relationship_satisfaction', answer: 'Niezadowolony', riskPoints: 8, mainRisk: 'Rozstanie/Rozwód', sideRisks: ['Manipulacja'] },
  ];
}


/**
 * 🔥 GŁÓWNA FUNKCJA - POPRAWIONA
 */
async function calculateRisk(
  answers: Record<string, string>,
  pathway: string
): Promise<CalculationResult> {
  console.log('🎯 Starting calculation for pathway:', pathway);
  console.log('📝 User answers:', answers);
  
  const weightsData = await getWeightsData();
  // Na początek calculateRisk(), zaraz po getWeightsData():
if (!weightsData.weights || weightsData.weights.length === 0) {
  console.warn('⚠️ NO WEIGHTS - using MOCK data');
  weightsData.weights = createMockWeights(); // Stwórz przykładowe wagi
}
  // 1. Zbierz punkty ryzyka dla każdej odpowiedzi
  let totalRiskPoints = 0;
  let maxPossiblePoints = 0;
  const riskScores: Record<string, number> = {};
  const matchedWeights: Array<any> = []; // Do debugowania
  
  Object.entries(answers).forEach(([questionId, answerText]) => {
    const weight = weightsData.weights.find(
      w => w.questionId === questionId && w.answer === answerText
    );
    
    if (weight) {
      console.log(`✓ Match: ${questionId} = "${answerText}" → ${weight.riskPoints} pts`);
      matchedWeights.push(weight);
      totalRiskPoints += weight.riskPoints;
      
      // Dodaj do głównego ryzyka
      if (weight.mainRisk && weight.mainRisk !== '-') {
        riskScores[weight.mainRisk] = (riskScores[weight.mainRisk] || 0) + weight.riskPoints;
      }
      
      // Dodaj do ryzyk pobocznych (z mniejszą wagą)
      weight.sideRisks?.forEach(sideRisk => {
        if (sideRisk && sideRisk !== '-') {
          riskScores[sideRisk] = (riskScores[sideRisk] || 0) + (weight.riskPoints * 0.5);
        }
      });
    } else {
      console.warn(`✗ No match: ${questionId} = "${answerText}"`);
    }
    
    maxPossiblePoints += 10; // Zakładamy max 10 punktów na pytanie
  });
  
  console.log('💯 Total risk points:', totalRiskPoints, '/', maxPossiblePoints);
  console.log('📊 Risk breakdown:', riskScores);
  
  // 2. Oblicz procentowe ryzyko ogólne
  const overallRiskPercentage = maxPossiblePoints > 0 
    ? Math.round((totalRiskPoints / maxPossiblePoints) * 100)
    : 0;
  
  // 3. Oblicz procentowy breakdown dla każdej kategorii
  const totalCategoryPoints = Object.values(riskScores).reduce((sum, val) => sum + val, 0);
  const riskBreakdown: Record<string, number> = {};
  
  Object.entries(riskScores).forEach(([category, points]) => {
    riskBreakdown[category] = totalCategoryPoints > 0
      ? Math.round((points / totalCategoryPoints) * 100)
      : 0;
  });
  
  // 4. Określ poziom ryzyka
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  if (overallRiskPercentage < 25) riskLevel = 'low';
  else if (overallRiskPercentage < 50) riskLevel = 'medium';
  else if (overallRiskPercentage < 75) riskLevel = 'high';
  else riskLevel = 'critical';
  
  console.log('🎚️ Risk level:', riskLevel, `(${overallRiskPercentage}%)`);
  
  // 5. 🔥 DYNAMICZNIE generuj content na podstawie RZECZYWISTYCH danych
  const dynamicContent = generateDynamicContent(
    pathway,
    riskLevel,
    answers,
    riskBreakdown,
    overallRiskPercentage,
    matchedWeights
  );
  
  // 6. Zwróć wynik
  return {
    ...dynamicContent,
    riskLevel,
    overallRiskPercentage,
    riskBreakdown,
    confidence: Math.min(95, 70 + (Object.keys(answers).length * 0.5)),
    meta: {
      source: pathway,
      score: overallRiskPercentage,
      generatedAt: new Date().toISOString(),
      totalQuestions: 50,
      answeredQuestions: Object.keys(answers).length
    }
  };
}

/**
 * 🔥 NOWA FUNKCJA - Dynamiczne generowanie contentu
 */
function generateDynamicContent(
  pathway: string,
  riskLevel: string,
  answers: Record<string, string>,
  riskBreakdown: Record<string, number>,
  overallRiskPercentage: number,
  matchedWeights: Array<any>
): Partial<CalculationResult> {
  
  // Analiza odpowiedzi użytkownika
  const analysis = analyzeAnswers(answers, riskBreakdown);
  
  return {
    mainTitle: generateTitle(pathway, riskLevel, overallRiskPercentage, analysis),
    mainDescription: generateDescription(pathway, riskLevel, analysis, riskBreakdown),
    probabilities: generateProbabilities(riskBreakdown, analysis),
    scenarios: generateScenarios(pathway, riskBreakdown, analysis, matchedWeights),
    actionItems: generateActionItems(riskLevel, riskBreakdown, analysis),
    recommendations: generateRecommendations(pathway, riskBreakdown, analysis),
    timeline: generateTimeline(pathway, riskLevel, analysis),
    readingList: generateReadingList(pathway, riskBreakdown),
    psychologicalProfiles: generateProfiles(pathway, riskLevel, analysis),
    conclusion: generateConclusion(riskLevel, overallRiskPercentage, analysis)
  };
}

/**
 * 🔍 Analiza odpowiedzi użytkownika
 */
function analyzeAnswers(
  answers: Record<string, string>,
  riskBreakdown: Record<string, number>
) {
  return {
    // Dzieci
    hasKids: checkAnswer(answers, ['has_kids', 'kids', 'children'], ['Tak', 'yes']),
    kidsConflict: checkAnswer(answers, ['kids_relationship', 'contact_kids'], ['konflikt', 'trudny', 'niemożliwy']),
    
    // Finanse
    financialControl: checkAnswer(answers, ['financial', 'money', 'control'], ['kontroluje', 'brak dostępu', 'całkowita']),
    sharedAssets: checkAnswer(answers, ['assets', 'property', 'majątek'], ['wspólny', 'shared']),
    
    // Komunikacja
    poorCommunication: checkAnswer(answers, ['communication', 'talk', 'rozmowy'], ['zła', 'brak', 'trudna', 'niemożliwa']),
    manipulation: checkAnswer(answers, ['manipulation', 'control', 'gaslighting'], ['tak', 'często', 'czasami']),
    
    // Emocje
    emotionalAbuse: checkAnswer(answers, ['abuse', 'emotional', 'verbal'], ['tak', 'często']),
    fearLevel: checkAnswer(answers, ['fear', 'afraid', 'strach'], ['wysoki', 'bardzo', 'tak']),
    
    // Wsparcie
    hasSupport: checkAnswer(answers, ['support', 'friends', 'family', 'wsparcie'], ['tak', 'mam']),
    isolatedFromFriends: checkAnswer(answers, ['friends', 'isolated', 'izolacja'], ['nie', 'brak', 'odcięty']),
    
    // Top ryzyka
    topRisks: Object.entries(riskBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([risk]) => risk),
    
    // Poziom każdego ryzyka
    divorceRisk: riskBreakdown['Rozstanie/Rozwód'] || 0,
    alienationRisk: riskBreakdown['Alienacja rodzicielska'] || 0,
    falseAccusationRisk: riskBreakdown['Fałszywe oskarżenia'] || 0,
    financialRisk: riskBreakdown['Straty finansowe'] || 0,
    manipulationRisk: riskBreakdown['Manipulacja'] || 0
  };
}

/**
 * Helper: sprawdza czy odpowiedź zawiera określone słowa kluczowe
 */
function checkAnswer(
  answers: Record<string, string>,
  questionKeys: string[],
  valueKeys: string[]
): boolean {
  for (const qKey of questionKeys) {
    for (const [question, answer] of Object.entries(answers)) {
      if (question.toLowerCase().includes(qKey.toLowerCase())) {
        const answerLower = answer.toLowerCase();
        if (valueKeys.some(vKey => answerLower.includes(vKey.toLowerCase()))) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * 🎯 Dynamiczny tytuł
 */
function generateTitle(
  pathway: string,
  riskLevel: string,
  percentage: number,
  analysis: any
): string {
  const titles: Record<string, Record<string, string>> = {
    before: {
      low: `Stabilny początek (${percentage}% ryzyka)`,
      medium: `Sygnały ostrzegawcze (${percentage}% ryzyka) - obserwuj`,
      high: `Poważne sygnały alarmowe (${percentage}% ryzyka) - działaj`,
      critical: `KRYTYCZNE ryzyko (${percentage}%) - natychmiastowa interwencja`
    },
    crisis: {
      low: `Kryzys pod kontrolą (${percentage}% ryzyka)`,
      medium: `Relacja na ostrzu noża (${percentage}% ryzyka)`,
      high: `Głęboki kryzys (${percentage}% ryzyka) - pilna interwencja`,
      critical: `KRYZYS KRYTYCZNY (${percentage}%) - zabezpiecz się TERAZ`
    },
    divorce: {
      low: `Rozstanie pod kontrolą (${percentage}% ryzyka)`,
      medium: `Rozwód - maksymalne zabezpieczenie (${percentage}% ryzyka)`,
      high: `Rozwód wysokiego konfliktu (${percentage}%) - OCHRONA priorytetem`,
      critical: `EKSTREMALNIE trudna sytuacja (${percentage}%) - NIE działaj sam`
    },
    married: {
      low: `Zdrowy związek (${percentage}% ryzyka) - utrzymaj balans`,
      medium: `Stabilny związek (${percentage}%) - obserwuj równowagę`,
      high: `Rutyna szkodzi (${percentage}%) - potrzeba zmian`,
      critical: `Stagnacja zaawansowana (${percentage}%) - radykalne zmiany TERAZ`
    }
  };
  
  return titles[pathway]?.[riskLevel] || `Analiza: ${percentage}% ryzyka`;
}

/**
 * 📝 Dynamiczny opis
 */
function generateDescription(
  pathway: string,
  riskLevel: string,
  analysis: any,
  riskBreakdown: Record<string, number>
): string {
  const parts: string[] = [];
  
  // Wstęp zależny od poziomu
  if (riskLevel === 'critical') {
    parts.push('⚠️ UWAGA: Znajdujesz się w sytuacji wysokiego ryzyka.');
  } else if (riskLevel === 'high') {
    parts.push('Twoja sytuacja wymaga pilnej uwagi i działania.');
  } else if (riskLevel === 'medium') {
    parts.push('Widzę niepokojące sygnały, które wymagają monitorowania.');
  } else {
    parts.push('Ogólnie sytuacja wygląda stabilnie, ale czujność zawsze się opłaca.');
  }
  
  // Najwyższe ryzyka
  if (analysis.topRisks.length > 0) {
    parts.push(`Główne obszary ryzyka: ${analysis.topRisks.join(', ')}.`);
  }
  
  // Dzieci
  if (analysis.hasKids && analysis.alienationRisk > 30) {
    parts.push('🚨 Wykryto ryzyko alienacji rodzicielskiej - wymaga natychmiastowej uwagi.');
  } else if (analysis.hasKids && analysis.kidsConflict) {
    parts.push('Konflikt dotyczący dzieci może eskalować - dokumentuj wszystko.');
  }
  
  // Finanse
  if (analysis.financialRisk > 40) {
    parts.push('💰 Wysokie ryzyko strat finansowych - zabezpiecz majątek i konta.');
  } else if (analysis.financialControl) {
    parts.push('Brak kontroli nad finansami to poważny sygnał ostrzegawczy.');
  }
  
  // Manipulacja
  if (analysis.manipulationRisk > 35 || analysis.manipulation) {
    parts.push('🎭 Zauważam wzorce manipulacji - nie daj się kontrolować emocjonalnie.');
  }
  
  // Fałszywe oskarżenia
  if (analysis.falseAccusationRisk > 30) {
    parts.push('⚖️ Ryzyko fałszywych oskarżeń - DOKUMENTUJ każdą interakcję.');
  }
  
  // Wsparcie
  if (!analysis.hasSupport || analysis.isolatedFromFriends) {
    parts.push('Brak sieci wsparcia zwiększa ryzyko - odbuduj kontakty ze znajomymi.');
  }
  
  return parts.join(' ');
}

/**
 * 📊 Dynamiczne prawdopodobieństwa
 */
function generateProbabilities(
  riskBreakdown: Record<string, number>,
  analysis: any
) {
  return {
    divorce: Math.min(95, riskBreakdown['Rozstanie/Rozwód'] || 15),
    falseAccusation: Math.min(90, riskBreakdown['Fałszywe oskarżenia'] || 5),
    alienation: Math.min(95, riskBreakdown['Alienacja rodzicielska'] || 10),
    financialLoss: Math.min(90, riskBreakdown['Straty finansowe'] || 10)
  };
}

/**
 * 🎬 Dynamiczne scenariusze
 */
function generateScenarios(
  pathway: string,
  riskBreakdown: Record<string, number>,
  analysis: any,
  matchedWeights: Array<any>
): Array<any> {
  const scenarios: Array<any> = [];
  
  // Rozwód/rozstanie
  if (riskBreakdown['Rozstanie/Rozwód'] > 30) {
    scenarios.push({
      scenario: "Rozwód lub trwałe rozstanie",
      probability: Math.min(95, riskBreakdown['Rozstanie/Rozwód']),
      why: analysis.poorCommunication 
        ? "Brak komunikacji i narastające konflikty wskazują na nieuchronność"
        : "Zauważalne wzorce dystansowania się i zmiany w relacji",
      impactScore: 9
    });
  }
  
  // Alienacja
  if (analysis.hasKids && riskBreakdown['Alienacja rodzicielska'] > 25) {
    scenarios.push({
      scenario: "Alienacja rodzicielska",
      probability: Math.min(90, riskBreakdown['Alienacja rodzicielska']),
      why: analysis.kidsConflict
        ? "Konflikt dotyczący dzieci i próby ich izolowania"
        : "Wzorce zachowań mogące prowadzić do alienacji",
      impactScore: 10
    });
  }
  
  // Fałszywe oskarżenia
  if (riskBreakdown['Fałszywe oskarżenia'] > 20) {
    scenarios.push({
      scenario: "Fałszywe oskarżenia (przemoc, zaniedbanie)",
      probability: Math.min(85, riskBreakdown['Fałszywe oskarżenia']),
      why: analysis.manipulation
        ? "Zauważone wzorce manipulacji mogą eskalować do fałszywych oskarżeń"
        : "Sytuacja konfliktowa stwarza ryzyko wykorzystania oskarżeń jako broni",
      impactScore: 10
    });
  }
  
  // Straty finansowe
  if (riskBreakdown['Straty finansowe'] > 30) {
    scenarios.push({
      scenario: "Znaczne straty finansowe",
      probability: Math.min(88, riskBreakdown['Straty finansowe']),
      why: analysis.financialControl
        ? "Brak kontroli nad finansami zwiększa ryzyko manipulacji majątkiem"
        : "Wspólne aktywa i brak przejrzystości finansowej",
      impactScore: 8
    });
  }
  
  // Manipulacja emocjonalna
  if (riskBreakdown['Manipulacja'] > 25) {
    scenarios.push({
      scenario: "Eskalacja manipulacji emocjonalnej",
      probability: Math.min(80, riskBreakdown['Manipulacja']),
      why: "Wykryte wzorce manipulacji często nasilają się w czasie",
      impactScore: 7
    });
  }
  
  // Jeśli brak konkretnych scenariuszy, dodaj ogólny
  if (scenarios.length === 0) {
    scenarios.push({
      scenario: "Stopniowe oddalanie się",
      probability: 30,
      why: "Naturalna ewolucja związków bez aktywnej pracy nad relacją",
      impactScore: 5
    });
  }
  
  return scenarios.sort((a, b) => b.probability - a.probability).slice(0, 5);
}

/**
 * ✅ Dynamiczne akcje
 */
function generateActionItems(
  riskLevel: string,
  riskBreakdown: Record<string, number>,
  analysis: any
): Array<any> {
  const actions: Array<any> = [];
  
  // Krytyczne akcje
  if (riskLevel === 'critical' || riskLevel === 'high') {
    actions.push({
      priority: "🚨 NATYCHMIASTOWE",
      action: "Skonsultuj się z prawnikiem specjalizującym się w prawie rodzinnym"
    });
    
    if (analysis.hasKids && analysis.alienationRisk > 30) {
      actions.push({
        priority: "🚨 KRYTYCZNE",
        action: "Dokumentuj WSZYSTKIE interakcje z dziećmi - nagrania audio (jeśli legalne), SMS, email"
      });
    }
    
    if (analysis.financialRisk > 40) {
      actions.push({
        priority: "🚨 PILNE",
        action: "Zabezpiecz finanse: osobne konto, zmień hasła, skopiuj wszystkie dokumenty"
      });
    }
    
    if (analysis.falseAccusationRisk > 30) {
      actions.push({
        priority: "🚨 KRYTYCZNE",
        action: "NIE spotykaj się sam na sam bez świadków - każda interakcja musi być udokumentowana"
      });
    }
  }
  
  // Średnie ryzyko
  if (riskLevel === 'medium' || riskLevel === 'high') {
    actions.push({
      priority: "⚠️ WAŻNE",
      action: "Rozpocznij prowadzenie dziennika zdarzeń - daty, fakty, kontekst (bez emocji)"
    });
    
    if (!analysis.hasSupport) {
      actions.push({
        priority: "⚠️ WAŻNE",
        action: "Odbuduj sieć wsparcia - zaufani przyjaciele, rodzina, grupa wsparcia"
      });
    }
    
    actions.push({
      priority: "⚠️ ZALECANE",
      action: "Rozważ konsultację z terapeutą specjalizującym się w sytuacjach kryzysowych"
    });
  }
  
  // Niskie ryzyko
  if (riskLevel === 'low') {
    actions.push({
      priority: "✓ ZALECANE",
      action: "Kontynuuj obserwację - zwracaj uwagę na zmiany w zachowaniu"
    });
    
    actions.push({
      priority: "✓ ROZWÓJ",
      action: "Pracuj nad sobą: trening, hobby, rozwój osobisty - utrzymuj niezależność"
    });
  }
  
  // Zawsze dodaj
  actions.push({
    priority: "💪 FUNDAMENTALNE",
    action: "Zachowaj spokój i kontrolę emocjonalną - nie reaguj impulsywnie"
  });
  
  return actions.slice(0, 6);
}

/**
 * 💡 Dynamiczne rekomendacje
 */
function generateRecommendations(
  pathway: string,
  riskBreakdown: Record<string, number>,
  analysis: any
): Array<any> {
  const recs: Array<any> = [];
  
  // Komunikacja
  if (analysis.poorCommunication || analysis.manipulation) {
    recs.push({
      type: "komunikacja",
      text: "TYLKO pisemna komunikacja (SMS, email) - nic ustnie, wszystko udokumentowane"
    });
    
    recs.push({
      type: "komunikacja",
      text: "Bądź konkretny, rzeczowy, bez emocji - nie daj się sprowokować"
    });
  }
  
  // Mentalne
  recs.push({
    type: "mentalne",
    text: "Techniki oddychania i mindfulness - kontroluj reakcje w stresie"
  });
  
  if (analysis.emotionalAbuse) {
    recs.push({
      type: "mentalne",
      text: "Praca z terapeutą nad trauma bond i manipulacją emocjonalną"
    });
  }
  
  // Prawne
  if (riskBreakdown['Fałszywe oskarżenia'] > 20 || riskBreakdown['Straty finansowe'] > 30) {
    recs.push({
      type: "prawne",
      text: "Przygotuj teczką obronną: dokumenty, nagrania, świadkowie, timeline zdarzeń"
    });
  }
  
  // Fizyczne
  recs.push({
    type: "fizyczne",
    text: "Regularny trening - redukuje stres i buduje odporność psychiczną"
  });
  
  // Społeczne
  if (!analysis.hasSupport) {
    recs.push({
      type: "społeczne",
      text: "Odbuduj relacje społeczne - izolacja jest bronią manipulatora"
    });
  }
  
  return recs.slice(0, 6);
}

/**
 * 📅 Timeline (użyj istniejącej funkcji, ale dodaj dynamikę)
 */
function generateTimeline(pathway: string, riskLevel: string, analysis: any) {
  // Bazowa timeline z poprzedniej wersji
  const baseTimeline = getBaseTimeline(pathway);
  
  // Dodaj dynamiczne elementy dla high/critical
  if (riskLevel === 'critical' || riskLevel === 'high') {
    if (analysis.hasKids && analysis.alienationRisk > 30) {
      baseTimeline.days30.unshift("⚠️ Skontaktuj się z prawnikiem nt. zabezpieczenia kontaktów z dziećmi");
    }
    
    if (analysis.falseAccusationRisk > 30) {
      baseTimeline.days30.unshift("🚨 Zainstaluj aplikację do nagrywania rozmów (jeśli legalne w PL)");
    }
  }
  
  return baseTimeline;
}

function getBaseTimeline(pathway: string) {
  const timelines: Record<string, any> = {
    before: {
      days30: [
        "Zacznij prowadzić dziennik obserwacji",
        "Wzmocnij swoją niezależność",
        "Nie konfrontuj się emocjonalnie"
      ],
      days90: [
        "Oceń czy sytuacja się poprawia",
        "Rozważ rozmowę z terapeutą",
        "Ustanów granice"
      ],
      days365: [
        "Podejmij decyzję: kontynuacja czy rozstanie",
        "Jeśli kontynuacja - wspólne cele",
        "Jeśli rozstanie - przygotuj się prawnie"
      ]
    },
    crisis: {
      days30: [
        "Skonsultuj się z prawnikiem",
        "Zabezpiecz dokumenty",
        "Ogranicz kontakt do minimum",
        "NIE podpisuj niczego bez prawnika"
      ],
      days90: [
        "Jeśli są dzieci: ustal harmonogram",
        "Oddziel finanse",
        "Zbuduj sieć wsparcia",
        "Przygotuj plan awaryjny"
      ],
      days365: [
        "Doprowadź sprawę do końca",
        "Odbuduj stabilność",
        "Pracuj z terapeutą",
        "Buduj relację z dziećmi"
      ]
    },
    divorce: {
      days30: [
        "ZABEZPIECZ dokumenty finansowe",
        "KRYTYCZNE: żadnych ruchów bez prawnika",
        "Zmień hasła do wszystkiego",
        "Dokumentuj WSZYSTKO",
        "Jeśli dzieci: plan kontaktów"
      ],
      days90: [
        "Sfinalizuj podział majątku",
        "Ustabilizuj finanse",
        "Walcz o sprawiedliwy harmonogram",
        "Praca z terapeutą",
        "Odciąć toksyczne kontakty"
      ],
      days365: [
        "Zamknij sprawy prawne",
        "Odbuduj życie",
        "Utrzymuj relację z dziećmi",
        "Trening i rozwój",
        "Wyciągnij wnioski"
      ]
    },
    married: {
      days30: [
        "Oceń stan relacji",
        "Wspólna aktywność",
        "Zadbaj o swoją przestrzeń"
      ],
      days90: [
        "Wprowadź zmiany",
        "Oceń czy partnerka się rozwija",
        "Finanse przejrzyste"
      ],
      days365: [
        "Podsumuj rok",
        "Wspólne cele",
        "Balans relacja/rozwój osobisty"
      ]
    }
  };
  
  return timelines[pathway] || timelines.before;
}

/**
 * 📚 Reading list (z dodatkową dynamiką)
 */
function generateReadingList(pathway: string, riskBreakdown: Record<string, number>) {
  const baseList = getBaseReadingList(pathway);
  
  // Dodaj specyficzne książki jeśli wysokie ryzyko w danej kategorii
  if (riskBreakdown['Alienacja rodzicielska'] > 40) {
    baseList.unshift({
      title: "Alienacja rodzicielska - Poradnik dla ojców",
      author: "Eksperci prawa rodzinnego",
      description: "Jak rozpoznać i przeciwdziałać alienacji - praktyczne strategie"
    });
  }
  
  if (riskBreakdown['Manipulacja'] > 40) {
    baseList.unshift({
      title: "W pułapce toksycznego związku",
      author: "Shannon Thomas",
      description: "Rozpoznawanie i wychodzenie z relacji z osobami narcystycznymi"
    });
  }
  
  return baseList.slice(0, 5); // Max 5 książek
}

function getBaseReadingList(pathway: string) {
  const lists: Record<string, any> = {
    before: [
      {
        title: "No More Mr. Nice Guy",
        author: "Robert Glover",
        description: "Jak przestać się dostosowywać i odzyskać męską pewność siebie"
      },
      {
        title: "Attached",
        author: "Amir Levine",
        description: "Zrozumienie stylów przywiązania i ich wpływu na relacje"
      },
      {
        title: "Męska energia w związku",
        author: "David Deida",
        description: "Jak utrzymać siłę i autonomię nie tracąc bliskości"
      }
    ],
    crisis: [
      {
        title: "48 praw władzy",
        author: "Robert Greene",
        description: "Strategiczne myślenie - nie daj się manipulować"
      },
      {
        title: "Prawo rodzinne dla ojców",
        author: "Zespół prawników",
        description: "Praktyczny przewodnik po prawach ojców w Polsce"
      },
      {
        title: "Emocjonalna inteligencja 2.0",
        author: "Travis Bradberry",
        description: "Kontrola emocji w sytuacjach kryzysowych"
      },
      {
        title: "Granice w związkach",
        author: "Henry Cloud",
        description: "Ustalanie i utrzymywanie zdrowych granic"
      }
    ],
    divorce: [
      {
        title: "Rozwód i alimenty - praktyczny poradnik",
        author: "Kancelaria prawna",
        description: "Kompleksowy przewodnik po procesie rozwodowym w Polsce"
      },
      {
        title: "Ojcowie po rozwodzie",
        author: "Eksperci prawa rodzinnego",
        description: "Walka o prawa do dzieci i unikanie alienacji"
      },
      {
        title: "Sztuka wojny",
        author: "Sun Tzu",
        description: "Strategia - zachowaj spokój i myśl długoterminowo"
      },
      {
        title: "Medytacje",
        author: "Marek Aureliusz",
        description: "Stoicka filozofia - kontroluj tylko to, co możesz"
      },
      {
        title: "Odporność psychiczna",
        author: "Monika Górska",
        description: "Jak przetrwać najtrudniejsze momenty"
      }
    ],
    married: [
      {
        title: "5 języków miłości",
        author: "Gary Chapman",
        description: "Skuteczna komunikacja w długoletnim związku"
      },
      {
        title: "Atomic Habits",
        author: "James Clear",
        description: "Małe zmiany, wielkie efekty - rozwój osobisty"
      },
      {
        title: "Siła woli",
        author: "Kelly McGonigal",
        description: "Kontrola impulsów i budowanie dobrych nawyków"
      }
    ]
  };
  
  return lists[pathway] || lists.before;
}

/**
 * 🧠 Dynamiczne profile psychologiczne
 */
function generateProfiles(pathway: string, riskLevel: string, analysis: any) {
  const userProfile: Array<any> = [];
  const partnerProfile: Array<any> = [];
  
  // Profil użytkownika
  if (riskLevel === 'critical' || riskLevel === 'high') {
    userProfile.push({
      label: "Stan emocjonalny",
      value: "Wysoki stres - ryzyko impulsywnych decyzji ⚠️"
    });
    userProfile.push({
      label: "Priorytet",
      value: "Zachowanie kontroli i spokoju - NIE reaguj emocjonalnie"
    });
  } else if (riskLevel === 'medium') {
    userProfile.push({
      label: "Stan emocjonalny",
      value: "Niepewność, wyczulenie na sygnały"
    });
    userProfile.push({
      label: "Wyzwanie",
      value: "Balans między troską a niepotrzebnym stresem"
    });
  } else {
    userProfile.push({
      label: "Stan emocjonalny",
      value: "Względnie stabilny, świadomy"
    });
    userProfile.push({
      label: "Zalecenie",
      value: "Utrzymuj czujność bez paranoi"
    });
  }
  
  if (analysis.fearLevel) {
    userProfile.push({
      label: "Wykryty wzorzec",
      value: "Wysoki poziom lęku - może wpływać na postrzeganie sytuacji"
    });
  }
  
  if (!analysis.hasSupport) {
    userProfile.push({
      label: "Izolacja społeczna",
      value: "⚠️ Brak sieci wsparcia - krytyczne zagrożenie"
    });
  }
  
  // Profil partnerki
  if (analysis.manipulation || analysis.manipulationRisk > 30) {
    partnerProfile.push({
      label: "Wykryte wzorce",
      value: "🚨 Manipulacja emocjonalna - gaslighting, kontrola"
    });
  }
  
  if (analysis.poorCommunication) {
    partnerProfile.push({
      label: "Komunikacja",
      value: "Dystans, unikanie, emocjonalny chłód"
    });
  }
  
  if (analysis.financialControl) {
    partnerProfile.push({
      label: "Kontrola finansowa",
      value: "⚠️ Próby kontroli majątku i dostępu do pieniędzy"
    });
  }
  
  if (analysis.kidsConflict && analysis.hasKids) {
    partnerProfile.push({
      label: "Strategia",
      value: "🚨 Wykorzystywanie dzieci jako broni w konflikcie"
    });
  }
  
  if (analysis.alienationRisk > 30) {
    partnerProfile.push({
      label: "Sygnały alarmowe",
      value: "🔴 Wzorce alienacyjne - izolowanie od dzieci"
    });
  }
  
  if (partnerProfile.length === 0) {
    partnerProfile.push({
      label: "Obserwowane zachowanie",
      value: "Brak wyraźnych sygnałów alarmowych"
    });
  }
  
  return {
    user: userProfile.slice(0, 5),
    partner: partnerProfile.slice(0, 5)
  };
}

/**
 * ✅ Dynamiczne podsumowanie
 */
function generateConclusion(
  riskLevel: string,
  percentage: number,
  analysis: any
) {
  let summary = "";
  let cta = "";
  
  if (riskLevel === 'critical') {
    summary = `Twoja sytuacja wymaga NATYCHMIASTOWEJ interwencji (${percentage}% ryzyka). Nie działaj sam - skontaktuj się z prawnikiem i terapeutą DZIŚ.`;
    cta = "🚨 Działaj TERAZ - każda godzina ma znaczenie";
  } else if (riskLevel === 'high') {
    summary = `Znajdujesz się w sytuacji wysokiego ryzyka (${percentage}%). Potrzebujesz profesjonalnej pomocy i konkretnego planu działania.`;
    cta = "⚠️ Zacznij działać w ciągu 48 godzin";
  } else if (riskLevel === 'medium') {
    summary = `Widzę niepokojące sygnały (${percentage}% ryzyka). To moment na zwiększoną czujność i potencjalne działania prewencyjne.`;
    cta = "📋 Rozpocznij dokumentację i obserwację";
  } else {
    summary = `Sytuacja wydaje się stabilna (${percentage}% ryzyka), ale nie zapominaj o ciągłej pracy nad sobą i relacją.`;
    cta = "✅ Kontynuuj dobre praktyki";
  }
  
  // Dodaj akcent na najważniejsze ryzyko
  if (analysis.alienationRisk > 40) {
    summary += " KRYTYCZNE: Wysokie ryzyko alienacji rodzicielskiej!";
  } else if (analysis.falseAccusationRisk > 40) {
    summary += " KRYTYCZNE: Wysokie ryzyko fałszywych oskarżeń!";
  }
  
  return { summary, cta };
}

/**
 * 🔥 EKSPORTOWANE FUNKCJE
 */
export async function calculateBefore(answers: Record<string, string>) {
  console.log('🎯 calculateBefore called with', Object.keys(answers).length, 'answers');
  return calculateRisk(answers, 'before');
}

export async function calculateCrisis(answers: Record<string, string>) {
  console.log('🎯 calculateCrisis called with', Object.keys(answers).length, 'answers');
  return calculateRisk(answers, 'crisis');
}

export async function calculateDivorce(answers: Record<string, string>) {
  console.log('🎯 calculateDivorce called with', Object.keys(answers).length, 'answers');
  return calculateRisk(answers, 'divorce');
}

export async function calculateMarried(answers: Record<string, string>) {
  console.log('🎯 calculateMarried called with', Object.keys(answers).length, 'answers');
  return calculateRisk(answers, 'married');
}

/**
 * 🧪 FUNKCJA TESTOWA - użyj do debugowania
 */
export async function testCalculation() {
  console.log('🧪 Running test calculation...');
  
  const testAnswers = {
    'communication_quality': 'Bardzo zła, ciągłe konflikty',
    'financial_control': 'Partnerka kontroluje wszystkie finanse',
    'has_kids': 'Tak',
    'kids_relationship': 'Bardzo konfliktowe, utrudnia kontakt',
    'emotional_abuse': 'Tak, często',
    'support_network': 'Nie, jestem odcięty od znajomych'
  };
  
  const result = await calculateRisk(testAnswers, 'crisis');
  
  console.log('📊 Test Result:');
  console.log('- Risk Level:', result.riskLevel);
  console.log('- Overall %:', result.overallRiskPercentage);
  console.log('- Breakdown:', result.riskBreakdown);
  console.log('- Title:', result.mainTitle);
  console.log('- Scenarios:', result.scenarios?.length);
  
  return result;
}
