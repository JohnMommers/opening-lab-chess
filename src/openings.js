import source from './openings-data.json';

const aliases=[
  ['Sicilian Najdorf','Sicilian Defense','Najdorf Variation','b'],
  ['Sicilian Dragon','Sicilian Defense','Dragon Variation','b'],
  ['Sicilian Accelerated Dragon','Sicilian Defense','Accelerated Dragon','b'],
  ['Sicilian Alapin','Sicilian Defense','Alapin Variation','w'],
  ['Fried Liver Attack','Italian Game','Fried Liver Attack','w'],
  ['Evans Gambit','Italian Game','Evans Gambit','w'],
  ['Stafford Gambit',"Petrov's Defense",'Stafford Gambit','b'],
  ['Berlin Defense','Ruy Lopez','Berlin Defense','b'],
  ['Marshall Attack','Ruy Lopez','Marshall Attack','b'],
  ['Dutch Stonewall','Dutch Defense','Stonewall Variation','b'],
  ['Stonewall Attack',"Queen's Pawn Game",'Stonewall Attack','w'],
  ['Budapest Gambit','Indian Defense','Budapest Gambit','b'],
  ['Smith-Morra Gambit','Sicilian Defense','Smith-Morra Gambit','w'],
  ['Scotch Gambit','Scotch Game','Scotch Gambit','w'],
  ['Halloween Gambit','Four Knights Game','Halloween Gambit','w'],
  ['Panov Attack','Caro-Kann Defense','Panov Attack','w'],
  ['French Advance','French Defense','Advance Variation','w'],
];
const additions=aliases.map(([name,parent,term,side])=>{
  const variants=source.find(o=>o.name===parent)?.variants.filter(v=>v.name.includes(term))||[];
  return variants.length?{name,variants,side}:null;
}).filter(Boolean);
export const openings=[...source,...additions];

const blackNames=new Set(['Benko Gambit','Englund Gambit','Latvian Gambit','Duras Gambit','Elephant Gambit','Indian Defense','Slav Defense','Semi-Slav Defense','Tarrasch Defense','Zukertort Defense',"Queen's Indian Accelerated",'Slav Indian']);
const whiteExceptions=new Set(['Benko Gambit Accepted','Benko Gambit Declined','Blumenfeld Countergambit Accepted','Englund Gambit Declined','Latvian Gambit Accepted','Vienna Gambit, with Max Lange Defense']);
export function openingSide(opening){
  if(opening.side)return opening.side;
  const name=opening.name;
  if(whiteExceptions.has(name))return 'w';
  if(blackNames.has(name)||/Defense|Defence|Countergambit|Gambit Accepted|Gambit Declined/.test(name))return 'b';
  return 'w';
}

// Lichess shows broad usage trends; its opening-name TSV has no play counts.
const popularity={
  w:['Italian Game','Ruy Lopez',"Queen's Gambit",'London System','English Opening','Scotch Game','Vienna Game','Catalan Opening','Réti Opening',"King's Indian Attack",'Trompowsky Attack','Fried Liver Attack','Evans Gambit','Sicilian Alapin','Smith-Morra Gambit','Scotch Gambit','French Advance','Four Knights Game','Ponziani Opening',"King's Gambit",'Bird Opening','Colle System','Nimzo-Larsen Attack'],
  b:['Sicilian Defense','Sicilian Najdorf','French Defense','Caro-Kann Defense','Sicilian Dragon','Pirc Defense','Scandinavian Defense','Sicilian Accelerated Dragon',"King's Indian Defense",'Nimzo-Indian Defense',"Queen's Gambit Declined",'Slav Defense','Dutch Defense',"Petrov's Defense",'Grünfeld Defense','Alekhine Defense','Modern Defense','Semi-Slav Defense',"Queen's Indian Defense",'Benoni Defense','Berlin Defense','Marshall Attack','Stafford Gambit','Budapest Gambit']
};
export function popularityRank(opening,side){const index=popularity[side].indexOf(opening.name);return index<0?1000:index}

