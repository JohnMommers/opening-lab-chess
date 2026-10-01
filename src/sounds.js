let context;
const soundOn=()=>localStorage.getItem('opening-lab-sound')!=='off';
export function playSound(kind='move'){
  if(!soundOn())return;
  try{
    context ||= new (window.AudioContext||window.webkitAudioContext)();
    if(context.state==='suspended')context.resume();
    const now=context.currentTime;
    const notes=kind==='mate'?[[392,0,.13],[294,.14,.18],[196,.33,.3]]:kind==='check'?[[690,0,.075],[880,.09,.13]]:kind==='capture'?[[180,0,.09],[125,.075,.1]]:[[210,0,.055],[155,.052,.075]];
    for(const [frequency,delay,duration] of notes){
      const oscillator=context.createOscillator(),gain=context.createGain();
      oscillator.type=kind==='move'?'triangle':'sine';oscillator.frequency.setValueAtTime(frequency,now+delay);
      gain.gain.setValueAtTime(.0001,now+delay);gain.gain.exponentialRampToValueAtTime(kind==='mate'?.18:.12,now+delay+.008);gain.gain.exponentialRampToValueAtTime(.0001,now+delay+duration);
      oscillator.connect(gain).connect(context.destination);oscillator.start(now+delay);oscillator.stop(now+delay+duration+.01);
    }
  }catch{}
}
export function moveSound(move,chess){playSound(chess.isCheckmate()?'mate':chess.isCheck()?'check':move.captured?'capture':'move')}
