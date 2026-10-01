import {Chess} from 'chess.js';
import {openings,openingSide} from './openings.js';
import {moveSound} from './sounds.js';
import {arrowSVG,decorateUI} from './enhancements.js';
import './style.css';

const app = document.querySelector('#app');
const files = 'abcdefgh';
const glyphs = {wk:'♔',wq:'♕',wr:'♖',wb:'♗',wn:'♘',wp:'♙',bk:'♚',bq:'♛',br:'♜',bb:'♝',bn:'♞',bp:'♟'};
const names = {p:'pion',n:'paard',b:'loper',r:'toren',q:'dame',k:'koning'};
const state = {chess:new Chess(),opening:Math.max(0,openings.findIndex(o=>o.name==='Italian Game')),variant:0,side:'w',guided:true,elo:1400,mode:'setup',setupType:'practice',directGame:false,index:0,selected:null,drag:null,last:null,notice:'',busy:false,apiError:false,lang:(localStorage.getItem('opening-lab-lang')==='en'?'en':'nl'),openingQuery:'',variantQuery:'',review:[],openingPly:0,evalScore:null,requestId:0,sound:localStorage.getItem('opening-lab-sound')!=='off'};

function line(){return openings[state.opening].variants[state.variant].moves.split(' ')}
function currentMove(){const san=line()[state.index];if(!san)return null;const clone=new Chess(state.chess.fen());try{return clone.move(san)}catch{return null}}
function isMine(){return state.chess.turn()===state.side}
function playMoveSound(move){if(state.sound)moveSound(move,state.chess)}
function squareAt(row,col){return files[state.side==='w'?col:7-col]+(state.side==='w'?8-row:row+1)}
function coords(square){const col=state.side==='w'?files.indexOf(square[0]):7-files.indexOf(square[0]);const row=state.side==='w'?8-Number(square[1]):Number(square[1])-1;return {row,col}}
function pieceLabel(p){return `${p.color==='w'?'witte':'zwarte'} ${names[p.type]}`}
function htmlEscape(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function boardHTML(){
  const expected=state.mode==='training'&&state.guided&&isMine()?currentMove():null;
  const legal=state.selected?state.chess.moves({square:state.selected,verbose:true}).map(m=>m.to):[];
  let squares='';
  for(let row=0;row<8;row++)for(let col=0;col<8;col++){
    const sq=squareAt(row,col),p=state.chess.get(sq),dark=(row+col)%2===1;
    const classes=['square',dark?'dark':'light',state.selected===sq?'selected':'',legal.includes(sq)?'legal':'',state.last?.includes(sq)?'last':'',expected?.from===sq?'hint-from':'',expected?.to===sq?'hint-to':''].filter(Boolean).join(' ');
    squares+=`<button class="${classes}" data-square="${sq}" aria-label="${sq}${p?', '+pieceLabel(p):''}" type="button">${col===0?`<span class="coord rank">${sq[1]}</span>`:''}${row===7?`<span class="coord file">${sq[0]}</span>`:''}${p?`<span class="piece ${p.color==='w'?'white':'black'}" data-piece="${p.color}${p.type}">${glyphs[p.color+p.type]}</span>`:''}${legal.includes(sq)?'<span class="move-dot"></span>':''}</button>`;
  }
  return `<div class="board-frame"><div class="board" id="board" role="grid" aria-label="Schaakbord">${squares}${arrowSVG(expected,state.side)}</div></div>`;
}
function moveListHTML(){const moves=state.chess.history();return moves.length?moves.map((m,i)=>`<span class="move-pill ${i===moves.length-1?'active':''}">${i%2===0?Math.floor(i/2)+1+'. ':''}${htmlEscape(m)}</span>`).join(''):'<span class="moves-empty">Je zetten verschijnen hier</span>'}
function statusText(){
  if(state.mode==='setup')return 'Kies een opening en begin met oefenen';
  if(state.mode==='complete')return 'Opening voltooid. Goed gespeeld!';
  if(state.review.length)return 'Bekijk een eerdere zet of herstel vanaf hier';
  if(state.mode==='engine')return state.chess.isGameOver()?'Partij afgelopen':state.busy?'Stockfish denkt na…':state.apiError?'Verbinding met Stockfish mislukt. Probeer opnieuw.':isMine()?'Jij bent aan zet':'Stockfish is aan zet';
  if(state.busy)return 'Tegenstander zet…';
  const move=currentMove();return state.guided&&move?`Speel ${move.san} · ${move.from} → ${move.to}`:'Jij bent aan zet';
}
function render(){
  const opening=openings[state.opening],variant=opening.variants[state.variant],progress=Math.round(state.index/line().length*100);
  app.innerHTML=`<main class="app-shell"><header class="header"><div class="brand-mark">♞</div><div class="brand-copy"><strong>Opening Lab</strong><span>SCHAAKTRAINER</span></div><button class="header-action" id="settingsBtn" aria-label="Opening instellen" type="button">⚙</button></header>
  <section class="game-area"><div class="player-bar opponent"><span class="avatar">${state.side==='w'?'♚':'♔'}</span><div><strong>${state.mode==='engine'?'Stockfish': 'Tegenstander'}</strong><small>${state.mode==='engine'?`≈ ${state.elo} ELO`:opening.name+' · '+variant.name}</small></div><span class="bar-tail">${state.mode==='engine'?'ENGINE':'OEFENING'}</span></div>
  ${boardHTML()}
  <div class="player-bar me"><span class="avatar">${state.side==='w'?'♔':'♚'}</span><div><strong>Jij speelt ${state.side==='w'?'wit':'zwart'}</strong><small>${state.mode==='training'?'Oefen de juiste zetten':state.mode==='engine'?'Speel de partij verder':'Klaar om te beginnen'}</small></div><span class="turn-indicator ${isMine()&&state.mode!=='setup'?'on':''}"></span></div></section>
  <section class="lower-panel"><div class="session-head"><div><span class="eyebrow">${state.mode==='engine'?'VRIJ SPEL':state.mode==='complete'?'VOLTOOID':'OPENINGSOEFENING'}</span><h1>${opening.name}<span class="heading-sep">/</span>${variant.name}</h1></div><button class="text-button" id="changeBtn" type="button">Wijzig</button></div>
  <div class="progress-track"><span style="width:${state.mode==='engine'?100:progress}%"></span></div><div class="progress-caption"><span>${state.mode==='engine'?'Vrij spelen':state.mode==='complete'?'Alle zetten goed':state.index+' van '+line().length+' zetten'}</span><span>${state.mode==='engine'?'':state.mode==='complete'?'100%':progress+'%'}</span></div>
  <div class="status-card ${state.notice?'warning':''}"><span class="status-icon">${state.notice?'↺':state.mode==='complete'?'✓':state.mode==='engine'?'♞':'◎'}</span><div><strong>${htmlEscape(state.notice||statusText())}</strong>${state.mode==='training'&&!state.notice?`<small>${state.guided?htmlEscape(variant.idea||'Volg de pijl voor de volgende zet.'):'Doe de juiste zet om verder te gaan.'}</small>`:''}</div></div>
  <div class="moves-row" aria-label="Gespeelde zetten">${moveListHTML()}</div>
  ${state.mode==='complete'?`<div class="action-row"><button id="againBtn" class="secondary-button" type="button">Opnieuw</button><button id="stopBtn" class="secondary-button" type="button">Stoppen</button><button id="continueBtn" class="primary-button" type="button">Tegen Stockfish <span>→</span></button></div>`:''}
  ${state.mode==='engine'?`<div class="action-row"><button id="againBtn" class="secondary-button" type="button">Opnieuw oefenen</button><button id="stopBtn" class="secondary-button" type="button">Stoppen</button>${state.apiError?'<button id="retryBtn" class="primary-button" type="button">Probeer opnieuw</button>':''}</div>`:''}
  ${state.mode==='setup'?`<button id="startInline" class="primary-button wide" type="button">Kies een opening <span>→</span></button>`:''}
  </section></main>${state.mode==='setup'?setupHTML():''}`;
  decorateUI(state,openings,render);
  wire();
}
function setupHTML(){const opening=openings[state.opening];return `<div class="overlay" id="overlay"><section class="setup-sheet" role="dialog" aria-modal="true" aria-labelledby="setupTitle"><div class="sheet-handle"></div><div class="sheet-top"><div><span class="eyebrow">START EEN SESSIE</span><h2 id="setupTitle">Oefen een opening</h2></div><span class="sheet-icon">♞</span></div><div class="field"><label for="openingSelect">Opening</label><select id="openingSelect">${openings.map((o,i)=>`<option value="${i}" ${state.opening===i?'selected':''}>${o.name}</option>`).join('')}</select></div><div class="field"><label for="variantSelect">Variant</label><select id="variantSelect">${opening.variants.map((v,i)=>`<option value="${i}" ${state.variant===i?'selected':''}>${v.name}</option>`).join('')}</select></div><div class="field"><label>Speel als</label><div class="segmented"><button type="button" data-side="w" class="${state.side==='w'?'active':''}">♔ &nbsp; Wit</button><button type="button" data-side="b" class="${state.side==='b'?'active':''}">♚ &nbsp; Zwart</button></div></div><div class="field"><label>Hulp bij je zetten</label><div class="segmented"><button type="button" data-guided="true" class="${state.guided?'active':''}">Met instructie</button><button type="button" data-guided="false" class="${!state.guided?'active':''}">Zonder instructie</button></div></div><div class="field elo-field"><label for="eloRange">Stockfish na de opening <strong>≈ ${state.elo} ELO</strong></label><input id="eloRange" type="range" min="800" max="2400" step="100" value="${state.elo}"/><div class="range-label"><span>800</span><span>2400</span></div></div><button class="primary-button wide start-button" id="startBtn" type="button">Start oefenen <span>→</span></button><p class="sheet-foot">${htmlEscape(opening.variants[state.variant].idea||'')}</p></section></div>`}
function start(){state.directGame=false;state.review=[];state.openingPly=0;state.evalScore=null;state.chess=new Chess();state.mode='training';state.index=0;state.selected=null;state.last=null;state.notice='';state.busy=false;state.apiError=false;render();if(state.side==='b')autoTrainingMove()}
function startDirectGame(){
  state.requestId++;state.chess=new Chess();state.mode='engine';state.directGame=true;
  state.index=0;state.openingPly=0;state.review=[];state.evalScore=null;
  state.selected=null;state.drag=null;state.last=null;state.notice='';
  state.busy=false;state.apiError=false;render();
  if(state.side==='b')engineMove();
}
function autoTrainingMove(){if(state.mode!=='training'||!currentMove()){finishTraining();return}state.busy=true;render();setTimeout(()=>{if(state.mode!=='training')return;const m=state.chess.move(line()[state.index]);state.last=[m.from,m.to];playMoveSound(m);state.index++;state.busy=false;if(state.index>=line().length)finishTraining();else render()},500)}
function finishTraining(){state.openingPly=state.chess.history().length;state.mode='complete';state.busy=false;state.notice='';render()}
function tryMove(from,to){if(state.mode==='setup'||state.mode==='complete'||state.busy||!isMine()||state.review.length)return;const legal=state.chess.moves({square:from,verbose:true}).find(m=>m.to===to);if(!legal){state.selected=null;render();return}if(state.mode==='training'){const expected=currentMove();if(!expected||legal.from!==expected.from||legal.to!==expected.to||legal.promotion!==expected.promotion){state.notice='Dat is niet de zet van deze variant. Probeer opnieuw.';state.selected=null;render();setTimeout(()=>{if(state.mode==='training'){state.notice='';render()}},1700);return}}const move=state.chess.move({from,to,promotion:legal.promotion||'q'});state.last=[move.from,move.to];playMoveSound(move);state.evalScore=null;state.selected=null;state.notice='';if(state.mode==='training'){state.index++;if(state.index>=line().length){finishTraining()}else if(!isMine()){autoTrainingMove()}else render()}else{render();if(!state.chess.isGameOver())engineMove()}}
async function engineMove(){
  if(state.mode!=='engine'||isMine()||state.chess.isGameOver())return;
  const game=state.chess,position=game.fen(),started=performance.now(),requestId=++state.requestId;
  state.busy=true;state.apiError=false;render();
  try{
    const depth=Math.max(2,Math.min(12,Math.round(2+(state.elo-800)/160)));
    const response=await fetch('https://chess-api.com/v1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fen:position,depth,maxThinkingTime:50,variants:1})});
    if(!response.ok)throw new Error('API');
    const data=await response.json();
    const uci=data.move||data.lan||data.from+data.to+(data.promotion||'');
    if(!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci))throw new Error('Zet ontbreekt');
    const remaining=Math.max(0,3000-(performance.now()-started));
    if(remaining)await new Promise(resolve=>setTimeout(resolve,remaining));
    if(state.mode!=='engine'||state.chess!==game||game.fen()!==position||requestId!==state.requestId)return;
    const move=game.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]||'q'});
    if(!move)throw new Error('Ongeldige zet');
    state.last=[move.from,move.to];state.evalScore=Number.isFinite(Number(data.eval))?Number(data.eval):null;playMoveSound(move);state.busy=false;render();
  }catch{
    if(state.mode==='engine'&&state.chess===game&&game.fen()===position&&requestId===state.requestId){state.busy=false;state.apiError=true;render()}
  }
}

function backMove(){
  const floor=state.mode==='engine'?state.openingPly:0;
  if(state.chess.history().length<=floor)return;
  state.busy=false;state.requestId++;
  const move=state.chess.undo();if(!move)return;
  state.review.push(move);
  if(state.mode==='training')state.index=Math.max(0,state.index-1);
  state.last=null;state.selected=null;state.evalScore=null;render();
}
function forwardMove(){
  const move=state.review.pop();if(!move)return;
  const replay=state.chess.move({from:move.from,to:move.to,promotion:move.promotion||'q'});
  if(state.mode==='training')state.index++;
  state.last=[replay.from,replay.to];render();
  if(!state.review.length&&state.mode==='engine'&&!isMine()&&!state.chess.isGameOver())engineMove();
}
function recoverMove(){
  if(state.mode!=='engine')return;
  let removedOwn=state.review.some(m=>m.color===state.side);
  while(state.chess.history().length>state.openingPly&&(!removedOwn||!isMine())){
    const move=state.chess.undo();if(!move)break;
    if(move.color===state.side)removedOwn=true;
  }
  state.requestId++;state.review=[];state.busy=false;state.apiError=false;state.evalScore=null;
  state.selected=null;state.last=null;state.notice='';render();
  if(!isMine()&&!state.chess.isGameOver())engineMove();
}
function wire(){
  const $=id=>document.getElementById(id);
  $('soundBtn')?.addEventListener('click',()=>{state.sound=!state.sound;localStorage.setItem('opening-lab-sound',state.sound?'on':'off');render()});$('backBtn')?.addEventListener('click',backMove);$('forwardBtn')?.addEventListener('click',forwardMove);$('recoverBtn')?.addEventListener('click',recoverMove);
  $('settingsBtn')?.addEventListener('click',()=>{state.mode='setup';state.notice='';render()});$('changeBtn')?.addEventListener('click',()=>{state.mode='setup';state.notice='';render()});$('startInline')?.addEventListener('click',()=>{state.mode='setup';render()});$('startBtn')?.addEventListener('click',()=>state.setupType==='play'?startDirectGame():start());$('againBtn')?.addEventListener('click',()=>state.directGame?startDirectGame():start());$('stopBtn')?.addEventListener('click',()=>{state.mode='setup';state.requestId++;state.chess=new Chess();state.index=0;state.last=null;state.directGame=false;state.review=[];state.openingPly=0;state.evalScore=null;render()});$('continueBtn')?.addEventListener('click',()=>{state.mode='engine';state.directGame=false;state.review=[];state.openingPly=state.chess.history().length;render();if(!isMine())engineMove()});$('retryBtn')?.addEventListener('click',engineMove);
  document.querySelectorAll('[data-activity]').forEach(b=>b.addEventListener('click',()=>{state.setupType=b.dataset.activity;state.notice='';render()}));
  $('openingSelect')?.addEventListener('change',e=>{state.opening=Number(e.target.value);state.variant=0;render()});$('variantSelect')?.addEventListener('change',e=>{state.variant=Number(e.target.value);render()});document.querySelectorAll('[data-side]').forEach(b=>b.addEventListener('click',()=>{state.side=b.dataset.side;const first=state.side==='b'?openings.findIndex(o=>o.name==='Sicilian Defense'):openings.findIndex(o=>o.name==='Italian Game');if(openingSide(openings[state.opening])!==state.side){state.opening=first;state.variant=0;state.openingQuery='';state.variantQuery=''}render()}));document.querySelectorAll('[data-guided]').forEach(b=>b.addEventListener('click',()=>{state.guided=b.dataset.guided==='true';render()}));$('eloRange')?.addEventListener('input',e=>{state.elo=Number(e.target.value);document.querySelector('.elo-field strong').textContent=`≈ ${state.elo} ELO`});
  document.querySelectorAll('.square').forEach(b=>{b.addEventListener('click',()=>{const sq=b.dataset.square,p=state.chess.get(sq);if(state.selected){if(sq===state.selected){state.selected=null;render()}else if(p?.color===state.side){state.selected=sq;render()}else tryMove(state.selected,sq)}else if(p?.color===state.side&&isMine()&&state.mode!=='complete'&&!state.review.length){state.selected=sq;render()}});b.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;const p=state.chess.get(b.dataset.square);if(!p||p.color!==state.side||!isMine()||state.busy||state.mode==='setup'||state.mode==='complete'||state.review.length)return;state.drag={from:b.dataset.square,x:e.clientX,y:e.clientY};b.setPointerCapture(e.pointerId)});b.addEventListener('pointerup',e=>{if(!state.drag)return;const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.square');const from=state.drag.from;state.drag=null;if(target&&target.dataset.square!==from){e.preventDefault();tryMove(from,target.dataset.square)}})})
}
render();

// Structured access to the same opening practice flow when WebMCP is available.
const modelContext = document.modelContext;
if (modelContext?.registerTool) {
  const register = tool => { try { Promise.resolve(modelContext.registerTool(tool)).catch(() => {}); } catch {} };
  register({
    name: 'list_chess_openings', title: 'List chess openings',
    description: 'Show the openings and variations available for practice.',
    inputSchema: {type:'object',properties:{},additionalProperties:false},
    annotations: {readOnlyHint:true,untrustedContentHint:false},
    execute: () => openings.map((o,openingIndex) => ({openingIndex,name:o.name,variationCount:o.variants.length}))
  });
  register({
    name: 'list_opening_variations', title: 'List opening variations',
    description: 'List every variation for one opening family.',
    inputSchema: {type:'object',properties:{openingIndex:{type:'integer'}},required:['openingIndex'],additionalProperties:false},
    annotations: {readOnlyHint:true,untrustedContentHint:false},
    execute: input => {const opening=openings[input.openingIndex];if(!opening)throw new Error('Unknown opening');return opening.variants.map((v,variantIndex)=>({variantIndex,name:v.name,eco:v.eco}))}
  });
  register({
    name: 'start_opening_practice', title: 'Start opening practice',
    description: 'Start a visible practice session for an opening and variation.',
    inputSchema: {type:'object',properties:{openingIndex:{type:'integer'},variantIndex:{type:'integer'},side:{type:'string',enum:['w','b']},guided:{type:'boolean'}},required:['openingIndex','variantIndex','side','guided'],additionalProperties:false},
    annotations: {readOnlyHint:false,untrustedContentHint:false},
    execute: input => {if(!openings[input.openingIndex]?.variants[input.variantIndex]||!['w','b'].includes(input.side)||typeof input.guided!=='boolean')throw new Error('Ongeldige opening of instelling');state.opening=input.openingIndex;state.variant=input.variantIndex;state.side=input.side;state.guided=input.guided;start();return {opening:openings[state.opening].name,variant:openings[state.opening].variants[state.variant].name,side:state.side,mode:state.mode}}
  });
  register({
    name: 'play_opening_move', title: 'Play opening move',
    description: 'Play a move in the current opening practice; wrong moves are rejected.',
    inputSchema: {type:'object',properties:{from:{type:'string',pattern:'^[a-h][1-8]$'},to:{type:'string',pattern:'^[a-h][1-8]$'}},required:['from','to'],additionalProperties:false},
    annotations: {readOnlyHint:false,untrustedContentHint:false},
    execute: input => {if(state.mode!=='training'||!isMine()||state.busy)throw new Error('Niet aan zet');const before=state.chess.fen();tryMove(input.from,input.to);if(state.chess.fen()===before)throw new Error('Niet de juiste zet');return {move:state.chess.history().at(-1),progress:state.index,total:line().length,mode:state.mode}}
  });
}

