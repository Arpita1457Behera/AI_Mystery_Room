import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { rateLimit } from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AccuseSchema, buildFallback, CreateSchema, GeneratedSchema, rules, serializeCase } from './domain.js';
import { CaseModel } from './model.js';
import { generateCase } from './gemini.js';

const app=express();app.disable('x-powered-by');app.use(express.json({limit:'20kb'}));
const currentDir=path.dirname(fileURLToPath(import.meta.url));
const clientDist=path.resolve(currentDir,'../../client/dist');
const origins = [
  'http://localhost:5173',
  'https://ai-mystery-room-jmu9md0r7-arpita1457behera.vercel.app',
  'https://ai-mystery-room-j9md0r7-arpita1457behera.vercel.app',
  ...(process.env.CLIENT_URL || '')
    .split(',')
    .map(url => url.trim())
    .filter(Boolean)
];
app.use(cors({
  origin: (origin, cb) =>
    !origin || origins.includes(origin)
      ? cb(null, true)
      : cb(new Error('Origin not allowed')),
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
const generationLimit=rateLimit({windowMs:60*60*1000,limit:10,standardHeaders:true,legacyHeaders:false});
const actionLimit=rateLimit({windowMs:60*1000,limit:40,standardHeaders:true,legacyHeaders:false});
const memory=new Map();const mongoReady=()=>mongoose.connection.readyState===1;
async function findCase(id){if(mongoReady()){const d=await CaseModel.findOne({id}).lean();return d?{...d, id:d.id}:null;}return memory.get(id)||null;}
async function saveCase(c){if(mongoReady()){await CaseModel.findOneAndUpdate({id:c.id},c,{upsert:true,new:true,setDefaultsOnInsert:true});}else memory.set(c.id,c);return c;}
async function finalizeCase(c){if(mongoReady()){const updated=await CaseModel.findOneAndUpdate({id:c.id,'progress.status':'active'},{$set:{accusation:c.accusation,result:c.result,progress:c.progress,completedAt:c.completedAt}},{new:true});return Boolean(updated);}const current=memory.get(c.id);if(!current||current.progress.status!=='active')return false;memory.set(c.id,c);return true;}
function fail(res,status,code,message){return res.status(status).json({error:{code,message}})}
app.get('/api/health',(req,res)=>res.json({status:'ok',database:mongoReady()?'connected':'memory-fallback'}));
app.post('/api/cases',generationLimit,async(req,res)=>{const parsed=CreateSchema.safeParse(req.body);if(!parsed.success)return fail(res,400,'INVALID_REQUEST','Enter a premise of 12 to 300 characters and choose a supported difficulty.');try{let generated;try{generated=await generateCase(parsed.data)}catch(e){console.error(JSON.stringify({event:'gemini_generation_failed',message:e.message}));}let c=buildFallback(parsed.data);if(generated&&validGenerated(generated,parsed.data.difficulty)){c.title=generated.title;c.story=generated.story;c.suspects=generated.suspects;c.clues=generated.clues;c.evidence=generated.evidence;c.generationMode='Gemini';c.canonicalCase={incident:parsed.data.premise,timeline:generated.timeline,facts:generated.facts,suspects:generated.suspects,culpritSuspectId:generated.culpritSuspectId,solution:generated.solution,clues:generated.clues,hintPlan:generated.hintPlan};}await saveCase(c);res.status(201).json(serializeCase(c));}catch(e){console.error(JSON.stringify({event:'case_creation_failed',message:e.message}));fail(res,500,'GENERATION_FAILED','We could not prepare this case. Please try again.');}});
function validGenerated(g,difficulty){const parsed=GeneratedSchema.safeParse(g);if(!parsed.success)return false;const x=parsed.data,r=rules[difficulty];const unique=(a)=>new Set(a).size===a.length;const suspectIds=x.suspects.map(s=>s.id);return x.suspects.length===r.suspects&&x.clues.length===r.clues&&x.hintPlan.length===r.hints&&x.suspects.some(s=>s.id===x.culpritSuspectId)&&unique(suspectIds)&&unique(x.clues.map(c=>c.id))&&unique(x.evidence.map(e=>e.id))&&unique(x.timeline.map(e=>e.id))&&unique(x.facts.map(f=>f.id))&&x.timeline.every(e=>e.participants.every(id=>suspectIds.includes(id)))&&x.clues.every(c=>x.evidence.some(e=>e.id===c.artifactId&&e.clueId===c.id))&&x.evidence.every(e=>x.clues.some(c=>c.id===e.clueId));}
app.get('/api/cases/:id',actionLimit,async(req,res)=>{const c=await findCase(req.params.id);if(!c)return fail(res,404,'CASE_NOT_FOUND','This case could not be found.');if(c.progress.status==='completed')return res.json(serializeCase(c));res.json(serializeCase(c));});
app.post('/api/cases/:id/clues/:clueId/discover',actionLimit,async(req,res)=>{const c=await findCase(req.params.id);if(!c)return fail(res,404,'CASE_NOT_FOUND','This case could not be found.');if(c.progress.status!=='active')return fail(res,409,'INVALID_STATE','This case is already complete.');const clue=c.clues.find(x=>x.id===req.params.clueId);if(!clue)return fail(res,404,'CLUE_NOT_FOUND','This clue is not part of this case.');if(!c.progress.discoveredClueIds.includes(clue.id))c.progress.discoveredClueIds.push(clue.id);await saveCase(c);res.json(serializeCase(c));});
app.post('/api/cases/:id/hints',actionLimit,async(req,res)=>{const c=await findCase(req.params.id);if(!c)return fail(res,404,'CASE_NOT_FOUND','This case could not be found.');if(c.progress.status!=='active')return fail(res,409,'INVALID_STATE','This case is already complete.');if(c.progress.hintsRemaining<=0)return fail(res,409,'HINT_LIMIT_REACHED','No hints remain for this case.');const index=c.progress.deliveredHints.length,hint={id:`hint_${index+1}`,text:c.canonicalCase.hintPlan[index]};c.progress.deliveredHints.push(hint.id);c.progress.hintsRemaining-=1;await saveCase(c);res.json({case:serializeCase(c).case,hint});});
app.post('/api/cases/:id/accuse',actionLimit,async(req,res)=>{const parsed=AccuseSchema.safeParse(req.body);if(!parsed.success)return fail(res,400,'INVALID_REQUEST','Choose a valid suspect.');const c=await findCase(req.params.id);if(!c)return fail(res,404,'CASE_NOT_FOUND','This case could not be found.');if(c.progress.status!=='active')return fail(res,409,'CASE_COMPLETED','An accusation has already been recorded.');if(!c.suspects.some(s=>s.id===parsed.data.suspectId))return fail(res,404,'SUSPECT_NOT_FOUND','That suspect is not part of this case.');const correct=parsed.data.suspectId===c.canonicalCase.culpritSuspectId,baseScore=correct?rules[c.difficulty].base:0,cluePoints=c.progress.discoveredClueIds.length*5,hintPenalty=c.progress.deliveredHints.length*10;c.accusation={suspectId:parsed.data.suspectId,correct,submittedAt:new Date()};c.result={correct,accused:c.suspects.find(s=>s.id===parsed.data.suspectId),culprit:c.suspects.find(s=>s.id===c.canonicalCase.culpritSuspectId),solution:c.canonicalCase.solution,score:{baseScore,cluePoints,hintPenalty,finalScore:Math.max(0,baseScore+cluePoints-hintPenalty)}};c.progress.status='completed';c.completedAt=new Date();if(!await finalizeCase(c))return fail(res,409,'CASE_COMPLETED','An accusation has already been recorded.');res.json({accepted:true});});
app.get('/api/cases/:id/result',actionLimit,async(req,res)=>{const c=await findCase(req.params.id);if(!c)return fail(res,404,'CASE_NOT_FOUND','This case could not be found.');if(c.progress.status!=='completed'||!c.result)return fail(res,409,'RESULTS_SEALED','Complete your accusation before viewing the results.');res.json({result:{...c.result,score:c.result.score}});});
app.use(express.static(clientDist,{index:false}));
app.get(/^(?!\/api\/).*/, (req,res,next)=>res.sendFile(path.join(clientDist,'index.html'),err=>err&&next(err)));
app.use((err,req,res,next)=>{console.error(JSON.stringify({event:'request_error',message:err.message}));fail(res,500,'INTERNAL_ERROR','Something went wrong. Please try again.');});
const port=Number(process.env.PORT)||5000;
if(process.env.MONGODB_URI){mongoose.connect(process.env.MONGODB_URI).then(()=>console.log('MongoDB connected')).catch(e=>console.error(JSON.stringify({event:'mongodb_connection_failed',message:e.message})));}
app.listen(port,()=>console.log(`AI Mystery Room API listening on ${port}`));
