import {openingSide,popularityRank} from './openings.js';
const dictionary={
  'SCHAAKTRAINER':'CHESS TRAINER','Opening instellen':'Set up opening','Tegenstander':'Opponent',
  'OEFENING':'PRACTICE','Jij speelt wit':'You play white','Jij speelt zwart':'You play black',
  'Oefen de juiste zetten':'Practice the correct moves','Speel de partij verder':'Continue the game',
  'Klaar om te beginnen':'Ready to begin','VRIJ SPEL':'FREE PLAY','VOLTOOID':'COMPLETED',
  'OPENINGSOEFENING':'OPENING PRACTICE','Wijzig':'Change','Vrij spelen':'Free play',
  'Alle zetten goed':'All moves correct','Je zetten verschijnen hier':'Your moves appear here',
  'Kies een opening en begin met oefenen':'Choose an opening to begin',
  'Opening voltooid. Goed gespeeld!':'Opening complete. Well played!',
  'Partij afgelopen':'Game over','Stockfish denkt na…':'Stockfish is thinking…',
  'Verbinding met Stockfish mislukt. Probeer opnieuw.':'Could not reach Stockfish. Please try again.',
  'Jij bent aan zet':'Your move','Stockfish is aan zet':'Stockfish to move',
  'Tegenstander zet…':'Opponent is moving…','Bekijk een eerdere zet of herstel vanaf hier':'Review a previous move or restore from here','Doe de juiste zet om verder te gaan.':'Play the correct move to continue.',
  'Volg de pijl voor de volgende zet.':'Follow the arrow for your next move.',
  'Dat is niet de zet van deze variant. Probeer opnieuw.':'That is not the move in this variation. Try again.',
  'Opnieuw':'Again','Stoppen':'Stop','Tegen Stockfish':'Play Stockfish',
  'Opnieuw oefenen':'Practice again','Probeer opnieuw':'Try again','Kies een opening':'Choose an opening',
  'START EEN SESSIE':'START A SESSION','Oefen een opening':'Practice an opening',
  'Opening':'Opening','Variant':'Variation','Speel als':'Play as','Wit':'White','Zwart':'Black',
  'Hulp bij je zetten':'Move guidance','Met instructie':'With hints','Zonder instructie':'Without hints',
  'Stockfish na de opening':'Stockfish after the opening','Start oefenen':'Start practice'
};
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function arrowSVG(move,side){
  if(!move)return '';
  const point=square=>({x:(side==='w'?square.charCodeAt(0)-97:104-square.charCodeAt(0))*100+50,y:(side==='w'?8-Number(square[1]):Number(square[1])-1)*100+50});
  const from=point(move.from),to=point(move.to),length=Math.hypot(to.x-from.x,to.y-from.y)||1;
  const ux=(to.x-from.x)/length,uy=(to.y-from.y)/length;
  const base={x:to.x-ux*38,y:to.y-uy*38};
  const left={x:base.x-uy*23,y:base.y+ux*23};
  const right={x:base.x+uy*23,y:base.y-ux*23};
  return `<svg class="move-arrow" viewBox="0 0 800 800" aria-hidden="true"><line x1="${from.x}" y1="${from.y}" x2="${base.x}" y2="${base.y}" stroke="#f6aa39" stroke-width="19" stroke-linecap="round"/><polygon points="${to.x},${to.y} ${left.x},${left.y} ${right.x},${right.y}" fill="#f6aa39"/></svg>`;
}

export function decorateUI(state,openings,render){
  document.documentElement.lang=state.lang;
  document.title=state.lang==='en'?(state.directGame?'Opening Lab — Play Stockfish':'Opening Lab — Practice chess openings'):(state.directGame?'Opening Lab — Speel tegen Stockfish':'Opening Lab — Schaakopeningen oefenen');
  const settings=document.getElementById('settingsBtn');
  settings?.insertAdjacentHTML('beforebegin',`<button class="language-action" id="languageBtn" type="button" aria-label="${state.lang==='en'?'Switch to Dutch':'Schakel naar Engels'}">${state.lang.toUpperCase()}</button>`);
  const switchLanguage=()=>{
    state.lang=state.lang==='nl'?'en':'nl';
    try{localStorage.setItem('opening-lab-lang',state.lang)}catch{}
    state.notice='';render();
  };
  document.getElementById('languageBtn')?.addEventListener('click',switchLanguage);
  document.querySelector('.sheet-icon')?.insertAdjacentHTML('beforebegin',`<button class="sheet-language" id="sheetLanguageBtn" type="button" aria-label="${state.lang==='en'?'Switch to Dutch':'Schakel naar Engels'}">${state.lang.toUpperCase()}</button>`);
  document.getElementById('sheetLanguageBtn')?.addEventListener('click',switchLanguage);
  const playSetup=state.setupType==='play';
  const sheetTop=document.querySelector('.sheet-top');
  if(sheetTop){
    const activity=document.createElement('div');activity.className='field activity-picker';
    const label=document.createElement('label');label.textContent=state.lang==='en'?'What would you like to do?':'Wat wil je doen?';
    const choices=document.createElement('div');choices.className='segmented activity-choices';
    choices.innerHTML='<button type="button" data-activity="practice" aria-pressed="'+(!playSetup)+'" class="'+(!playSetup?'active':'')+'">'+(state.lang==='en'?'Practice opening':'Opening oefenen')+'</button>'+
      '<button type="button" data-activity="play" aria-pressed="'+playSetup+'" class="'+(playSetup?'active':'')+'">'+(state.lang==='en'?'Play Stockfish':'Tegen Stockfish')+'</button>';
    activity.append(label,choices);sheetTop.after(activity);
    document.getElementById('setupTitle').textContent=playSetup?(state.lang==='en'?'Play a game':'Speel een partij'):(state.lang==='en'?'Practice an opening':'Oefen een opening');
    if(playSetup){
      document.getElementById('openingSelect')?.closest('.field')?.setAttribute('hidden','');
      document.getElementById('variantSelect')?.closest('.field')?.setAttribute('hidden','');
      document.querySelector('[data-guided]')?.closest('.field')?.setAttribute('hidden','');
      document.querySelector('.sheet-foot')?.setAttribute('hidden','');
      const eloLabel=document.querySelector('.elo-field label');
      if(eloLabel?.firstChild)eloLabel.firstChild.textContent=state.lang==='en'?'Stockfish level ':'Stockfish-niveau ';
      document.getElementById('startBtn').innerHTML=(state.lang==='en'?'Start game':'Start partij')+' <span>→</span>';
    }
  }
  if(state.directGame&&state.mode==='engine'){
    document.querySelector('.session-head h1').textContent=state.lang==='en'?'Game against Stockfish':'Partij tegen Stockfish';
    document.querySelector('.player-bar.me small').textContent=state.lang==='en'?'Play from the starting position':'Speel vanaf de beginstelling';
    document.querySelector('.progress-track')?.setAttribute('hidden','');
    document.querySelector('.progress-caption')?.setAttribute('hidden','');
    const again=document.getElementById('againBtn');if(again)again.textContent=state.lang==='en'?'New game':'Nieuwe partij';
  }
  const sound=document.createElement('button');
  sound.id='soundBtn';sound.className='sound-action';sound.type='button';
  sound.textContent=state.sound?'♪':'♪̸';
  sound.setAttribute('aria-label',state.lang==='en'?(state.sound?'Mute sounds':'Enable sounds'):(state.sound?'Geluid uit':'Geluid aan'));
  settings?.before(sound);
  const moves=document.querySelector('.moves-row');
  if(state.mode!=='setup'&&moves){
    const actions=document.createElement('div');actions.className='history-actions';
    const floor=state.mode==='engine'?state.openingPly:0;
    const canBack=state.chess.history().length>floor;
    actions.innerHTML='<button id="backBtn" type="button" '+(canBack?'':'disabled')+'>← '+(state.lang==='en'?'Previous move':'Zet terug')+'</button>'+
      (state.review.length?'<button id="forwardBtn" type="button">'+(state.lang==='en'?'Next move':'Vooruit')+' →</button>':'')+
      (state.mode==='engine'&&(canBack||state.review.length)?'<button id="recoverBtn" type="button">'+(state.lang==='en'?'Restore and retry':'Herstel')+'</button>':'');
    moves.after(actions);
  }
  if(state.mode==='engine'&&state.evalScore!==null){
    const evaluation=document.createElement('div');evaluation.className='eval-wrap';
    const percentage=Math.max(3,Math.min(97,50+50*Math.tanh(state.evalScore/4)));
    evaluation.innerHTML='<span>♚</span><div class="eval-bar"><i style="width:'+percentage+'%"></i></div><span>♔</span><strong>'+(state.evalScore>0?'+':'')+state.evalScore.toFixed(1)+'</strong>';
    evaluation.setAttribute('aria-label',(state.lang==='en'?'Stockfish evaluation':'Stockfish-evaluatie')+' '+state.evalScore.toFixed(1));
    document.querySelector('.status-card')?.before(evaluation);
  }
  const openingSelect=document.getElementById('openingSelect');
  const variantSelect=document.getElementById('variantSelect');
  if(openingSelect&&variantSelect){
    let pins;
    try{pins=JSON.parse(localStorage.getItem('opening-lab-pins')||'[]')}catch{pins=[]}
    if(!Array.isArray(pins))pins=[];
    const options=()=>openings.map((o,i)=>({o,i})).filter(({o})=>openingSide(o)===state.side)
      .filter(({o})=>!state.openingQuery.trim()||o.name.toLowerCase().includes(state.openingQuery.trim().toLowerCase())||o.variants.some(v=>v.name.toLowerCase().includes(state.openingQuery.trim().toLowerCase())))
      .sort((a,b)=>Number(pins.includes(b.o.name))-Number(pins.includes(a.o.name))||popularityRank(a.o,state.side)-popularityRank(b.o,state.side)||a.o.name.localeCompare(b.o.name));
    const variants=()=>openings[state.opening].variants.map((v,i)=>({v,i}))
      .filter(({v})=>v.name.toLowerCase().includes(state.variantQuery.trim().toLowerCase())||v.eco.toLowerCase().includes(state.variantQuery.trim().toLowerCase()));
    const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const draw=()=>{
      const list=options();
      openingSelect.innerHTML=list.map(({o,i})=>'<option value="'+i+'" '+(i===state.opening?'selected':'')+'>'+(pins.includes(o.name)?'★ ':'')+escape(o.name)+' ('+o.variants.length+')</option>').join('');
      if(!list.some(x=>x.i===state.opening)&&list.length){state.opening=list[0].i;state.variant=0}
      openingSelect.value=String(state.opening);
      const matching=variants();
      variantSelect.innerHTML=matching.map(({v,i})=>'<option value="'+i+'" '+(i===state.variant?'selected':'')+'>'+escape(v.name)+' · '+escape(v.eco)+'</option>').join('');
      if(!matching.some(x=>x.i===state.variant)&&matching.length)state.variant=matching[0].i;
      variantSelect.value=String(state.variant);
      openingSelect.disabled=!list.length;variantSelect.disabled=!matching.length;
      document.getElementById('startBtn').disabled=!playSetup&&(!list.length||!matching.length);
      pin.textContent=(pins.includes(openings[state.opening].name)?'★ ':'☆ ')+(state.lang==='en'?'Pin opening':'Zet vast');
      pin.setAttribute('aria-pressed',String(pins.includes(openings[state.opening].name)));
    };
    const search=document.createElement('input');search.className='search-field';search.id='openingSearch';search.type='search';
    search.placeholder=state.lang==='en'?'Search openings…':'Zoek een opening…';search.value=state.openingQuery;
    search.setAttribute('aria-label',state.lang==='en'?'Search openings':'Zoek openingen');
    openingSelect.before(search);
    const pin=document.createElement('button');pin.className='pin-button';pin.id='pinBtn';pin.type='button';openingSelect.after(pin);
    const order=document.createElement('small');order.className='order-note';order.textContent=state.lang==='en'?'Popular systems first · pinned openings on top':'Populaire systemen eerst · vastgezette openingen bovenaan';pin.after(order);
    const variantSearch=document.createElement('input');variantSearch.className='search-field';variantSearch.id='variantSearch';variantSearch.type='search';
    variantSearch.placeholder=state.lang==='en'?'Search variations…':'Zoek varianten…';variantSearch.value=state.variantQuery;
    variantSelect.before(variantSearch);
    draw();
    search.addEventListener('input',e=>{state.openingQuery=e.target.value;state.variantQuery='';variantSearch.value='';draw()});
    variantSearch.addEventListener('input',e=>{state.variantQuery=e.target.value;draw()});
    pin.addEventListener('click',()=>{const name=openings[state.opening].name;pins=pins.includes(name)?pins.filter(x=>x!==name):[name,...pins];localStorage.setItem('opening-lab-pins',JSON.stringify(pins));draw()});
    document.querySelector('.sheet-foot').innerHTML='<a href="https://github.com/lichess-org/chess-openings" target="_blank" rel="noopener">Lichess</a> · <a href="https://github.com/Kadagaden/chess-pieces" target="_blank" rel="noopener">Kaneo</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>';
  }
  if(state.lang==='en'){
    const walker=document.createTreeWalker(document.getElementById('app'),NodeFilter.SHOW_TEXT);
    let node;
    while((node=walker.nextNode())){
      const raw=node.nodeValue,trimmed=raw.trim();
      let result=dictionary[trimmed];
      if(!result&&/^\d+ van \d+ zetten$/.test(trimmed))result=trimmed.replace(' van ',' / ').replace(' zetten',' moves');
      if(!result&&trimmed.startsWith('Speel '))result='Play '+trimmed.slice(6);
      if(result)node.nodeValue=raw.replace(trimmed,result);
    }
    if(settings)settings.setAttribute('aria-label','Set up opening');
    document.getElementById('board')?.setAttribute('aria-label','Chessboard');
  }
}
