import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { CARDS } from '../cards.mjs';
import { createGame, act, restoreGame, currentFloor, pathsFrom, aliveEnemies, enemyIntent, playerDefense } from '../engine.mjs';
function routeTo(run,goal){
 const floor=currentFloor(run),start={x:run.player.x,y:run.player.y},queue=[start],paths=new Map([[`${start.x},${start.y}`,[start]]]);
 for(let i=0;i<queue.length;i++){
  const p=queue[i],path=paths.get(`${p.x},${p.y}`);if(p.x===goal.x&&p.y===goal.y)return path;
  for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){
   const x=p.x+dx,y=p.y+dy,key=`${x},${y}`,tile=floor.tiles[y]?.[x];
   if(!tile||tile==='#'||paths.has(key)||tile==='Y'&&!run.player.keys.yellow||tile==='B'&&!run.player.keys.blue||floor.groups.some(g=>!g.defeated&&g.x===x&&g.y===y))continue;
   paths.set(key,[...path,{x,y}]);queue.push({x,y});
  }
 }
 return null;
}
function expectedDamage(run){return aliveEnemies(run).reduce((sum,e)=>{const i=enemyIntent(run,e);return sum+(['attack','multi','magic'].includes(i.type)?Math.max(1,i.value-(i.type==='magic'?0:playerDefense(run)))*(i.hits||1):i.type==='poison'?i.value:0);},0);}
function candidateScore(before,after,action){
 if(after.phase==='won'||after.phase==='reward')return 10000;
 const a=before.battle,b=after.battle;if(!b||after.phase==='lost')return -10000;
 let score=a.enemies.reduce((sum,e,i)=>sum+e.hp-b.enemies[i].hp+(e.hp>0&&b.enemies[i].hp===0?13:0),0);
 score+=(after.player.hp-before.player.hp)*1.6;
 score+=Math.max(0,Math.min(b.block,expectedDamage(before))-Math.min(a.block,expectedDamage(before)))*.75;
 score+=(expectedDamage(before)-expectedDamage(after))*1.5;
 score+=(b.atkBonus-a.atkBonus)*4+(b.defBonus-a.defBonus)*5+(b.turnAtk-a.turnAtk)*1.2+(b.thorns-a.thorns)*2;
 score+=b.enemies.reduce((sum,e,i)=>sum+(e.poison-a.enemies[i].poison)*1.8+(e.weak-a.enemies[i].weak)*.8,0);
 score+=(b.spellShield-a.spellShield)*(aliveEnemies(before).some(e=>enemyIntent(before,e).skill)?5:1);
 score+=(b.mana-a.mana)*.3+(b.hand.length-a.hand.length)*.5;
 if(action.type==='play'&&CARDS[before.deck.find(c=>c.uid===action.uid).id].effect==='recall')score+=1;
 return score;
}
function battleAction(game){
 const r=game.run,b=r.battle;
 if(r.player.hp<r.player.maxHp*.45&&r.player.potions.heal)return {type:'potion',kind:'heal'};
 if(!b.mana&&r.player.potions.mana&&b.hand.some(uid=>CARDS[r.deck.find(c=>c.uid===uid).id].cost>0))return {type:'potion',kind:'mana'};
 const candidates=[];
 for(const uid of b.hand){
  const d=CARDS[r.deck.find(c=>c.uid===uid).id];
  if(d.target==='enemy')aliveEnemies(r).forEach(e=>candidates.push({type:'play',uid,target:e.uid}));
  else if(d.target==='discard')b.discard.forEach(discardUid=>candidates.push({type:'play',uid,discardUid}));
  else candidates.push({type:'play',uid});
 }
 if(!b.basicUsed)aliveEnemies(r).forEach(e=>candidates.push({type:'basic',target:e.uid}));
 let best={type:'end'},score=.05;
 for(const action of candidates){const next=act(game,action);if(!next.error){const value=candidateScore(r,next.state.run,action);if(value>score){score=value;best=action;}}}
 return best;
}
function merchantAction(game){
 const r=game.run,s=currentFloor(r).shop;
 if(r.player.potions.heal<2&&r.player.hp<r.player.maxHp*.7&&r.player.gold>=18&&s.supplies.heal<3)return {type:'buy-supply',kind:'heal'};
 if(!s.upgraded&&r.player.gold>=40){const card=r.deck.find(c=>!c.level&&['volley','storm','slash','fireball','guard'].includes(c.id))||r.deck.find(c=>!c.level);if(card)return {type:'upgrade',uid:card.uid};}
 if(s.relic.id&&!s.relic.bought&&r.player.gold>=75)return {type:'buy-relic'};
 const index=s.cards.findIndex(o=>!o.bought&&r.player.gold>=o.price&&r.deck.length<16&&['storm','volley','fireball','leech','sharpen','barrier','guard','pierce'].includes(o.id));
 if(index>=0)return {type:'buy-card',index};
 return {type:'leave'};
}
function exploreAction(game){
 const r=game.run,f=currentFloor(r),p=r.player;
 if(p.hp<p.maxHp*.45&&p.potions.heal)return {type:'potion',kind:'heal'};
 const seal=f.groups.find(g=>g.seal);
 if(seal.defeated&&p.x===7&&p.y===1)return {type:'ascend'};
 if(!r.explore.rolled)return {type:'roll'};
 let goals=[];
 if(p.hp<p.maxHp*.7&&!f.restUsed)goals.push({x:7,y:7});
 const gem=f.items.find(i=>i.type==='gem'&&i.stat==='atk'&&!i.taken);if(gem)goals.push(gem);
 if(p.hp<p.maxHp*.8){const life=f.items.find(i=>i.type==='gem'&&i.stat==='hp'&&!i.taken);if(life)goals.push(life);}
 const shop=f.shop;
 if(p.gold>=65&&(!shop||!shop.upgraded&&r.deck.some(c=>!c.level)))goals.push({x:1,y:1});
 if(!seal.defeated)for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]])goals.push({x:seal.x+dx,y:seal.y+dy,seal:true});
 else goals.push({x:7,y:1});
 const routes=goals.map(goal=>({goal,path:routeTo(r,goal)})).filter(v=>v.path);
 let selected=routes.find(v=>!v.goal.seal);
 if(!selected)selected=routes.sort((a,b)=>a.path.length-b.path.length)[0];
 if(!selected)return {type:'wait'};
 if(selected.path.length===1){
  if(selected.goal.seal)return {type:'interact'};
  if(f.tiles[p.y][p.x]==='M'||f.tiles[p.y][p.x]==='R'||f.items.some(i=>!i.taken&&i.x===p.x&&i.y===p.y))return {type:'interact'};
 }
 const reachable=pathsFrom(r);let destination;
 for(const point of selected.path.slice(1)){if(reachable.has(`${point.x},${point.y}`))destination=point;else break;}
 if(destination)return {type:'move',...destination};
 return {type:'wait'};
}
export function simulate(seed,limit=3000){
 let game=act(createGame(),{type:'new-run',seed}).state,steps=0;
 for(;steps<limit&&!['won','lost'].includes(game.run.phase);steps++){
  assert.ok(restoreGame(JSON.stringify(game)),`seed ${seed} invalid save at ${steps}`);
  const r=game.run;let action;
  if(r.phase==='explore')action=exploreAction(game);
  if(r.phase==='encounter')action={type:'enter-battle'};
  if(r.phase==='battle')action=battleAction(game);
  if(r.phase==='reward'){
   const priority=['storm','volley','leech','fireball','guard','sharpen','pierce','barrier','heavy'];
   const id=r.deck.length<16?[...r.reward.cards].sort((a,b)=>(priority.includes(a)?priority.indexOf(a):99)-(priority.includes(b)?priority.indexOf(b):99))[0]:null;action={type:'reward',id};
  }
  if(r.phase==='shop')action=merchantAction(game);
  if(r.phase==='rest')action=r.player.hp<r.player.maxHp*.7?{type:'rest-heal'}:r.deck.some(c=>!c.level)?{type:'upgrade',uid:r.deck.find(c=>!c.level&&c.id==='slash')?.uid||r.deck.find(c=>!c.level).uid}:{type:'leave'};
  assert.ok(action,`missing action ${r.phase}`);const next=act(game,action);assert.equal(next.error,null,`seed ${seed} step ${steps} ${JSON.stringify(action)}: ${next.error}`);game=next.state;
 }
 assert.ok(['won','lost'].includes(game.run.phase),`seed ${seed} stalled ${JSON.stringify({floor:game.run.floor,phase:game.run.phase,player:game.run.player,log:game.run.log.slice(-5)})}`);
 return {seed,phase:game.run.phase,floor:game.run.floor,hp:game.run.player.hp,steps,rounds:game.run.stats.rounds,bank:game.profile.gold};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const count=Number(process.argv[2]||12),results=Array.from({length:count},(_,i)=>simulate(i+1));
 console.log(JSON.stringify({runs:results.length,wins:results.filter(r=>r.phase==='won').length,averageFloor:results.reduce((sum,r)=>sum+r.floor,0)/results.length,maxSteps:Math.max(...results.map(r=>r.steps)),examples:results.slice(0,5)},null,2));
}
