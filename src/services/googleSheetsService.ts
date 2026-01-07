// FREE VERSION - No API key needed!

import axios from 'axios';

// Your published CSV URLs for each pathway
const CSV_URLS = {
  before: import.meta.env.VITE_SHEET_CSV_URL_BEFORE || '',
  crisis: import.meta.env.VITE_SHEET_CSV_URL_CRISIS || '',
  divorce: import.meta.env.VITE_SHEET_CSV_URL_DIVORCE || '',
  married: import.meta.env.VITE_SHEET_CSV_URL_MARRIED || '',
  weights: import.meta.env.VITE_SHEET_CSV_URL_WEIGHTS || '', // NOWY!
};

export type PathwayType = 'before' | 'crisis' | 'divorce' | 'married';

export interface QuestionOption {
  text: string;
  next?: string;
}

export interface Question {
  id: string;
  q: string;
  opts: (string | QuestionOption)[];
}

// NOWE TYPY DLA WAG
export interface RiskWeight {
  questionId: string; // ID pytania (np. "1")
  questionText: string; // Tekst pytania
  answer: string; // Dokładny tekst odpowiedzi
  riskPoints: number; // Punkty ryzyka (0-10)
  mainRisk: string; // Ryzyko główne (np. "Rozstanie/Rozwód")
  sideRisks: string[]; // Ryzyka poboczne (array)
  comment?: string; // Opcjonalny komentarz
}

export interface WeightsData {
  weights: RiskWeight[];
  riskCategories: string[]; // Unikalne kategorie ryzyk
}

/**
 * Fetches questions from published Google Sheets CSV
 */
export async function fetchQuestionsFromSheets(pathway: PathwayType): Promise<Question[]> {
  const csvUrl = CSV_URLS[pathway];
  
  if (!csvUrl) {
    throw new Error(`No CSV URL configured for pathway: ${pathway}`);
  }
  try {
    const response = await axios.get(csvUrl, {
      responseType: 'arraybuffer',
      headers: {
        'Accept': 'text/csv; charset=utf-8'
      }
    });
    
    const decoder = new TextDecoder('utf-8');
    const csvData = decoder.decode(response.data);
    const lines = csvData.trim().split('\n');
    const dataLines = lines.slice(1);
    
    const questions: Question[] = dataLines
      .filter((line: string) => line.trim())
      .map((line: string) => {
        const columns = parseCSVLine(line);
        
        if (columns.length < 3) {
          console.warn('Invalid row:', line);
          return null;
        }
        
        const [id, question, optionsStr, nextConditionsStr = ''] = columns;
        
        const optionsArray = optionsStr
          .split('|')
          .map(opt => opt.trim())
          .filter(opt => opt.length > 0);

        let opts: QuestionOption[] = [];
        
        if (nextConditionsStr && nextConditionsStr.trim()) {
          const conditions = nextConditionsStr.split(';').map(c => c.trim());
          const nextMap: Record<string, string> = {};
          
          conditions.forEach(condition => {
            const [option, nextId] = condition.split('->').map(s => s.trim());
            if (option && nextId) {
              nextMap[option] = nextId;
            }
          });

          opts = optionsArray.map(opt => {
            if (nextMap[opt]) {
              return { text: opt, next: nextMap[opt] };
            }
            return { text: opt };
          });
        } else {
          opts = optionsArray.map(opt => ({ text: opt }));
        }

        return {
          id: id.trim(),
          q: question.trim(),
          opts
        };
      })
      .filter((q): q is Question => q !== null);

    if (questions.length === 0) {
      throw new Error('No valid questions found in sheet');
    }

    return questions;
  } catch (error) {
    console.error('Error fetching questions from Google Sheets:', error);
    throw error;
  }
}

/**
 * NOWA FUNKCJA: Pobiera wagi/ryzyko z arkusza
 * Format CSV: Question | Odpowiedź | Punkty ryzyka | Ryzyko główne | Ryzyka poboczne | Komentarz
 */
export async function fetchWeightsFromSheets(): Promise<WeightsData> {
  const csvUrl = CSV_URLS.weights;
  
  if (!csvUrl) {
    throw new Error('No weights CSV URL configured');
  }

  try {
    const response = await axios.get(csvUrl, {
      responseType: 'arraybuffer',
      headers: {
        'Accept': 'text/csv; charset=utf-8'
      }
    });
    
    const decoder = new TextDecoder('utf-8');
    const csvData = decoder.decode(response.data);
    const lines = csvData.trim().split('\n');
    const dataLines = lines.slice(1); // Skip header
    
    const weights: RiskWeight[] = [];
    const riskCategoriesSet = new Set<string>();

    dataLines.forEach((line: string) => {
      if (!line.trim()) return;
      
      const columns = parseCSVLine(line);
      
      if (columns.length < 5) {
        console.warn('Invalid weight row:', line);
        return;
      }

      const [
        questionId,
        questionText,
        answer,
        riskPointsStr,
        mainRisk,
        sideRisksStr = '',
        comment = ''
      ] = columns;

      // Parse risk points
      const riskPoints = parseInt(riskPointsStr.trim()) || 0;

      // Parse side risks (separated by commas)
      const sideRisks = sideRisksStr
        .split(',')
        .map(r => r.trim())
        .filter(r => r.length > 0 && r !== '-');

      // Add to categories
      if (mainRisk && mainRisk.trim() !== '-') {
        riskCategoriesSet.add(mainRisk.trim());
      }
      sideRisks.forEach(r => riskCategoriesSet.add(r));

      weights.push({
        questionId: questionId.trim(),
        questionText: questionText.trim(),
        answer: answer.trim(),
        riskPoints,
        mainRisk: mainRisk.trim(),
        sideRisks,
        comment: comment.trim()
      });
    });

    return {
      weights,
      riskCategories: Array.from(riskCategoriesSet).filter(c => c !== '-')
    };
  } catch (error) {
    console.error('Error fetching weights from Google Sheets:', error);
    throw error;
  }
}

/**
 * Parse a CSV line handling quoted strings properly
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result.map(col => col.trim());
}

/**
 * Cache questions to avoid repeated requests
 */
const questionCache: Record<PathwayType, { questions: Question[]; timestamp: number } | null> = {
  before: null,
  crisis: null,
  divorce: null,
  married: null,
};

// NOWY CACHE DLA WAG
let weightsCache: { data: WeightsData; timestamp: number } | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function fetchQuestionsWithCache(pathway: PathwayType): Promise<Question[]> {
  const now = Date.now();
  const cached = questionCache[pathway];
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    console.log(`Using cached questions for ${pathway}`);
    return cached.questions;
  }
  
  console.log(`Fetching fresh questions from Google Sheets for ${pathway}`);
  const questions = await fetchQuestionsFromSheets(pathway);
  questionCache[pathway] = { questions, timestamp: now };
  
  return questions;
}

/**
 * NOWA FUNKCJA: Cache dla wag
 */
export async function fetchWeightsWithCache(): Promise<WeightsData> {
  const now = Date.now();
  
  if (weightsCache && (now - weightsCache.timestamp) < CACHE_DURATION) {
    console.log('Using cached weights');
    return weightsCache.data;
  }
  
  console.log('Fetching fresh weights from Google Sheets');
  const data = await fetchWeightsFromSheets();
  weightsCache = { data, timestamp: now };
  
  return data;
}

/**
 * Clear the cache manually if needed
 */
export function clearQuestionsCache(pathway?: PathwayType): void {
  if (pathway) {
    questionCache[pathway] = null;
  } else {
    Object.keys(questionCache).forEach(key => {
      questionCache[key as PathwayType] = null;
    });
  }
}

export function clearWeightsCache(): void {
  weightsCache = null;
}

export function clearAllCaches(): void {
  clearQuestionsCache();
  clearWeightsCache();
}
