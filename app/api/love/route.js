import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const MODEL = 'gpt-4o-mini';
const LIMITS = new Map();
const LIMIT_WINDOW_MS = 60_000;
const LIMIT_COUNT = 12;
const MAX_BODY = 12000;

function clamp(value, min, max, fallback) {const n = Number(value);return Number.isFinite(n) ? Math.min(max,Math.max(min,n)) : fallback;}
function plain(value, max=1800) {return typeof value==='string'?value.trim().slice(0,max):'';}
function checkLimit(request) {
  // Per-IP, per-instance guard. For production/multi-region traffic use a durable shared store.
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now=Date.now();
  if(LIMITS.size>10000) for(const [key,val] of LIMITS) if(now-val.start>LIMIT_WINDOW_MS) LIMITS.delete(key);
  const item=LIMITS.get(ip);
  if(!item || now-item.start>LIMIT_WINDOW_MS){LIMITS.set(ip,{start:now,count:1});return true;}
  if(item.count>=LIMIT_COUNT) return false;
  item.count++;return true;
}
const base = `You power CRUSH CODE, a stylish English-language love and dating experience. Respond ONLY in English. Be warm, perceptive, playful and concise; avoid clichés and empty flattery. Never claim astrology or names can scientifically predict romance. Respect consent, autonomy and boundaries. Do not pretend to know what another person thinks or feels. Avoid definitive accusations and diagnoses. For potential coercion, abuse, threats, stalking, or immediate danger prioritize safety, trusted support and appropriate local emergency services. No manipulative tactics. Do not output Markdown tables or code fences.`;
const prompts = {
  calculator: `Write an entertaining personalized compatibility interpretation (75-110 words). The compatibility numbers are deterministic, fictional and entertainment-only; never present them as AI measurement or scientific fact. Discuss specific categories naturally, use provided names, and end with a lighthearted takeaway.`,
  flags: `Read a dating situation carefully. Classify it into precisely one of GREEN FLAG, MIXED SIGNALS or RED FLAG. Return ONLY valid JSON with keys "verdict", "explanation", "advice". "verdict" must be one of those three exact strings. Explanation 45-80 words; advice 35-60 words, practical, grounded, nonjudgmental. A single ambiguous text should not automatically be labeled a red flag. Explicit boundary violations, threats or coercive behavior merit concern.`,
  zodiac: `Write a lighthearted zodiac relationship reading. Return ONLY valid JSON with string keys "romanticCompatibility", "biggestStrength", "biggestChallenge", "relationshipDynamic", "loveAdvice". Each value 1-2 clear sentences; playful, non-fatalistic and never scientific.`,
  decoder: `Interpret a crush's message without mind-reading. Return ONLY valid JSON with keys "interpretations" (array of exactly three brief plausible interpretations), "sweet", "flirty", "bold" (three distinct ready-to-send replies). Replies should be natural, short and respectful, not manipulative; avoid claiming certainty.`,
  guru: `Act as a thoughtful relationship friend, balancing empathy and independent judgment. Offer realistic, actionable guidance, ask at most one useful follow-up question. Keep answers to roughly 80-150 words.`,
  letter: `Write a personalized romantic love letter with a warm opening, vivid but believable details, and an elegant sign-off. Respect relationship status and occasion, and do not fabricate specific shared memories. Return ONLY the letter, ready to copy.`,
};
function modeGuide(mode) {return ({'REALITY CHECK':'Direct, grounded and pragmatic; point out uncertainty, boundaries and evidence.','SWEET SPOT':'Warm, encouraging and balanced.','FLIRTY ENERGY':'Playful, witty and charming while staying realistic.','DELULU MODE':'Imaginative, dramatic, entertaining rom-com energy while clearly signaling playful speculation, never presenting fantasy as fact.'})[mode] || 'Warm, encouraging and balanced.';}
async function complete(messages, temperature, max_tokens=330) {
  const controller = new AbortController();const timeout=setTimeout(()=>controller.abort(),18000);
  try {
    const response=await fetch('https://api.openai.com/v1/chat/completions',{
      method:'POST',signal:controller.signal,
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.OPENAI_API_KEY}`},
      body:JSON.stringify({model:MODEL,messages,temperature,max_tokens,store:false})
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok){console.error('OpenAI error',response.status,data?.error?.type||'unknown');throw new Error(response.status===429?'The AI is busy. Try again shortly.':'AI request failed. Check the API key, account credits, or try again.');}
    return data.choices?.[0]?.message?.content?.trim()||'';
  }finally{clearTimeout(timeout);}
}
function extractJson(text) {try{return JSON.parse(text)}catch {const match=text.match(/\{[\s\S]*\}/);if(match) return JSON.parse(match[0]);throw new Error('Could not read AI response. Please retry.');}}
export async function POST(request){
  try {
    if(!process.env.OPENAI_API_KEY) return NextResponse.json({error:'OPENAI_API_KEY is not configured on the server.'},{status:503});
    if(!checkLimit(request)) return NextResponse.json({error:'A little love break ♡ Too many requests. Try again in a minute.'},{status:429,headers:{'Retry-After':'60'}});
    const raw=await request.text();if(raw.length>MAX_BODY) return NextResponse.json({error:'Your message is too long.'},{status:413});
    const body=JSON.parse(raw);const feature=plain(body.feature,30);
    if(!prompts[feature])return NextResponse.json({error:'Unknown feature.'},{status:400});
    const temperature=clamp(body.temperature,0,2,0.7);
    const mode=plain(body.mode,35)||'SWEET SPOT';
    const userText=plain(body.input,3200);
    if(!userText)return NextResponse.json({error:'Please enter something first.'},{status:400});
    const system={role:'system',content:`${base}\n${prompts[feature]}\nPersonality: ${modeGuide(mode)}`};
    if(feature==='guru'){
      const history=Array.isArray(body.history)?body.history.slice(-8).filter(m=>m&&['user','assistant'].includes(m.role)&&typeof m.content==='string').map(m=>({role:m.role,content:plain(m.content,1200)})):[];
      const messages=[system,...history,{role:'user',content:userText}];
      if(body.compare===true){
        const [reality,delulu]=await Promise.all([
          complete([{role:'system',content:`${base}\n${prompts.guru}\nPersonality: ${modeGuide('REALITY CHECK')}`},...history,{role:'user',content:userText}],0.2,240),
          complete([{role:'system',content:`${base}\n${prompts.guru}\nPersonality: ${modeGuide('DELULU MODE')}`},...history,{role:'user',content:userText}],1.7,240)
        ]);
        return NextResponse.json({reality,delulu});
      }
      return NextResponse.json({text:await complete(messages,temperature,350)});
    }
    const jsonFeature=['flags','zodiac','decoder'].includes(feature);
    const messages=[system,{role:'user',content:userText}];
    const output=await complete(messages,temperature,feature==='letter'?650:jsonFeature?440:250);
    if(jsonFeature)return NextResponse.json({result:extractJson(output)});
    return NextResponse.json({text:output});
  }catch(error){console.error('Crush Code request failed',error?.message);return NextResponse.json({error:error?.name==='AbortError'?'The request timed out. Please retry.':error?.message||'Something went wrong.'},{status:500});}
}
