import { z } from 'zod';
import { randomUUID } from 'node:crypto';

export const rules = { Easy: { suspects: 3, clues: 5, hints: 2, base: 100 }, Medium: { suspects: 4, clues: 7, hints: 3, base: 150 }, Hard: { suspects: 5, clues: 9, hints: 3, base: 200 } };
export const CreateSchema = z.object({ premise: z.string().trim().min(12).max(300), difficulty: z.enum(['Easy','Medium','Hard']) });
export const AccuseSchema = z.object({ suspectId: z.string().min(1).max(80) });
const SuspectSchema=z.object({id:z.string().min(1),name:z.string().min(1),description:z.string().min(1),alibi:z.string().min(1),actualActions:z.string().optional()});
const ClueSchema=z.object({id:z.string().min(1),title:z.string().min(1),description:z.string().min(1),source:z.string().min(1),artifactId:z.string().min(1)});
const EvidenceSchema=z.object({id:z.string().min(1),type:z.enum(['document','chat','cctv','audio','image','other']),title:z.string().min(1),description:z.string().min(1),status:z.literal('simulated'),clueId:z.string().min(1)});
export const GeneratedSchema=z.object({title:z.string().min(1).max(100),story:z.string().min(20),suspects:z.array(SuspectSchema),clues:z.array(ClueSchema),evidence:z.array(EvidenceSchema),timeline:z.array(z.object({id:z.string().min(1),timestamp:z.string().min(1),location:z.string().min(1),participants:z.array(z.string()),description:z.string().min(1)})).min(3),facts:z.array(z.object({id:z.string().min(1),text:z.string().min(1)})).min(1),culpritSuspectId:z.string().min(1),solution:z.object({motive:z.string().min(1),method:z.string().min(1),explanation:z.string().min(1),walkthrough:z.array(z.string().min(1)).min(2)}),hintPlan:z.array(z.string().min(1))});

export function buildFallback({ premise, difficulty }) {
  const r = rules[difficulty], title = premise.trim().replace(/[.!?]+$/, '').slice(0, 48) || 'The Vanishing';
  const suspects = [
    ['Mara Voss','The curator who knows the gallery’s security system by heart.','She says she was balancing the exhibition accounts in the west office.'],
    ['Elias Reed','A restoration specialist with a quiet reputation and a long memory.','He says he was in the conservation lab, working alone.'],
    ['June Park','A night archivist who catalogues every object that enters the building.','She says she was on a call in the records room.'],
    ['Theo Vale','A donor’s representative who has been pressing for a private viewing.','He says he left before the storm began.'],
    ['Nico Flores','The building engineer responsible for the old service corridors.','He says he was checking the generator in the basement.']
  ].slice(0,r.suspects).map((s,i)=>({id:`suspect_${i+1}`,name:s[0],description:s[1],alibi:s[2],actualActions:i===0?'Moved the object through the service passage and falsified the room log.':'Their documented movements do not place them at the scene.'}));
  const clueSeeds = [
    ['A gap in the inventory','The signed inventory lists the object after the gallery was already sealed.','Exhibition inventory'],
    ['The service passage log','A maintenance entry shows the passage door opened during the outage.','Building access register'],
    ['A time that does not fit','The curator’s account places the final inspection twelve minutes after the key log records it.','Key cabinet record'],
    ['Restoration dust','Fine blue pigment appears on the passage latch, but not on the restoration bench.','Conservation lab note'],
    ['The copied signature','A comparison with the prior day’s log shows the last signature was traced.','Archive comparison'],
    ['The generator report','The basement generator continued to run during the reported blackout.','Engineering report'],
    ['A message left unsent','A draft note asks for the service corridor to be left unlatched.','Recovered fictional draft'],
    ['A light in the east hall','A witness saw a moving light cross the hall at the reported time.','Night attendant statement'],
    ['The false alarm','The alarm log was reset manually before the storm arrived.','Security system report']
  ];
  const clues=clueSeeds.slice(0,r.clues).map((x,i)=>({id:`clue_${i+1}`,title:x[0],description:x[1],source:x[2],artifactId:`artifact_${i+1}`}));
  const evidence=clues.map((c,i)=>({id:`artifact_${i+1}`,type:i===1?'cctv':i===6?'chat':'document',title:c.source,description:`A fictional ${c.source.toLowerCase()} prepared for this case.`,status:'simulated',clueId:c.id}));
  const timeline=[{id:'event_1',timestamp:'21:10',location:'East Gallery',participants:[suspects[0].id],description:'The gallery closes for the evening.'},{id:'event_2',timestamp:'21:42',location:'Service Passage',participants:[suspects[0].id],description:'A service access record is created during the storm.'},{id:'event_3',timestamp:'22:05',location:'East Gallery',participants:[],description:'The missing object is reported.'}];
  const hintPlan = ['Compare the access record with the curator’s stated timeline.','Look for the clue that connects the service passage to the inventory.','An alibi can be true in part and still omit a crucial journey.'].slice(0,r.hints);
  return {id:randomUUID(),title,premise,story:`${premise.trim()} A valuable object has vanished, and the storm has left everyone’s account under scrutiny. The case file contains a fictional evidence trail assembled from one verified timeline.`,difficulty,generationMode:'simulated fallback',canonicalCase:{incident:premise.trim(),timeline,suspects,culpritSuspectId:'suspect_1',solution:{motive:'To conceal an undisclosed transfer of the object.',method:'Used the service passage during the outage and altered the inventory record.',explanation:`${suspects[0].name} used the storm as cover to move the object through the service passage, then changed the inventory timeline. The access record and mismatched signature place the curator’s account at the center of the contradiction.`,walkthrough:['The service passage access record establishes a route into and out of the gallery during the storm.','The inventory timing conflicts with the curator’s account of the final inspection.','The copied signature shows the record was altered after the disappearance.','The other suspects’ alibis are not contradicted by the access or inventory evidence.']},facts:clues.map(c=>({id:c.id,text:c.description})),clues,hintPlan},suspects,clues,evidence,progress:{discoveredClueIds:[],deliveredHints:[],hintsRemaining:r.hints,status:'active'},createdAt:new Date()};
}

export function serializeCase(c) {
  return { case:{id:c.id,title:c.title,premise:c.premise,story:c.story,difficulty:c.difficulty,generationMode:c.generationMode||'Gemini',suspects:c.suspects.map(({id,name,description,alibi})=>({id,name,description,alibi})),clues:c.clues.map(x=>c.progress.discoveredClueIds.includes(x.id)?x:{id:x.id,title:'Undiscovered evidence'}),evidence:c.evidence.map(({id,type,title,status,clueId,description})=>{const available=c.progress.discoveredClueIds.includes(clueId);return {id,type,title,status,available,...(available?{description}:{}),clueId}}),progress:{discoveredClueIds:c.progress.discoveredClueIds,hintsRemaining:c.progress.hintsRemaining,status:c.progress.status},scoreEstimate:Math.max(0,(c.accusation?.correct?rules[c.difficulty].base:0)+c.progress.discoveredClueIds.length*5-c.progress.deliveredHints.length*10)} };
}
