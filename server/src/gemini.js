import { GoogleGenAI } from '@google/genai';
import { rules } from './domain.js';

export async function generateCase(input) {
  if(!process.env.GEMINI_API_KEY) return null;
  const ai=new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});
  const prompt=`Create a coherent fictional detective case. Return JSON only with keys title, story, suspects, clues, evidence, timeline, facts, culpritSuspectId, solution, hintPlan. Input: ${JSON.stringify(input)}. Requirements: exactly ${rules[input.difficulty].suspects} suspects, ${rules[input.difficulty].clues} clues and ${rules[input.difficulty].hints} hints. suspects are objects {id,name,description,alibi,actualActions}; clues are {id,title,description,source,artifactId}; evidence are {id,type,title,description,status,clueId}; timeline is at least 3 objects {id,timestamp,location,participants:[suspect IDs],description}; facts is [{id,text}] and must define every decisive fact. solution is {motive,method,explanation,walkthrough}. Every clue must support solution and derive from timeline/facts. No real people. Evidence status must be simulated and never imply binary media exists.`;
  const response=await ai.models.generateContent({model:process.env.GEMINI_MODEL||'gemini-2.5-flash',contents:prompt,config:{responseMimeType:'application/json'}});
  return JSON.parse(response.text);
}
