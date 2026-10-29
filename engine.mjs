import { CARDS, CARD_TYPES, STARTER_DECK, ENEMIES, RELICS } from './cards.mjs';

export const SAVE_VERSION=2;
const DIRECTIONS=[[0,-1],[1,0],[0,1],[-1,0]];
const MAP_TEMPLATES=[
 ['#########','#..#....#','#..#.#..#','#....#..#','#..#....#','#.......#','#.#.##..#','#.......#','#########'],
 ['#########','#.......#','#..#.#..#','#..#.#..#','#.......#','#.##.#..#','#.......#','#.......#','#########'],
 ['#########','#.......#','#.#.#...#','#...#...#','#.......#','#.#...#.#','#...#...#','#.......#','#########']
];
function rule(condition,message){if(!condition)throw new Error(message);}
function random(run){run.rng=(run.rng+0x6D2B79F5)>>>0;let t=run.rng;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}
function choose(run,values){return values[Math.floor(random(run)*values.length)];}
function shuffled(run,values){const out=[...values];for(let i=out.length-1;i>0;i--){const j=Math.floor(random(run)*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}
function hasRelic(run,id){return run.relics.includes(id);}
function logRun(run,message){run.log.push(message);run.log=run.log.slice(-40);}
function uid(run,prefix){return `${prefix}${++run.serial}`;}
function healPlayer(run,amount){const value=Math.min(amount,run.player.maxHp-run.player.hp);run.player.hp+=value;return value;}
function addCard(game,id){const run=game.run;run.deck.push({uid:uid(run,'c'),id,level:0});game.profile.collection[id]=(game.profile.collection[id]||0)+1;}
function addRelic(run,id){if(!id)return;run.relics.push(id);if(id==='branch'){run.player.maxHp+=12;healPlayer(run,12);}if(id==='feather')currentFloor(run).charges++;logRun(run,`获得遗物：${RELICS[id].name}`);}
function randomRelic(run){const pool=Object.keys(RELICS).filter(id=>!hasRelic(run,id));return pool.length?choose(run,pool):null;}
export function createGame(){return {version:SAVE_VERSION,profile:{gold:0,unlocked:Object.keys(CARDS).filter(id=>!CARDS[id].unlock),collection:{},bestFloor:0,wins:0,runs:0},run:null};}
export function currentFloor(run){return run.floors[run.floor];}
export function aliveEnemies(run){return run.battle?.enemies.filter(e=>e.hp>0)||[];}
export function adjacentGroups(run,x=run.player.x,y=run.player.y){return currentFloor(run).groups.filter(g=>!g.defeated&&Math.abs(g.x-x)+Math.abs(g.y-y)===1);}
export function createFloor(run,number){
 const tiles=MAP_TEMPLATES[(number-1)%MAP_TEMPLATES.length].map(row=>row.split(''));
 const floor={number,tiles,charges:hasRelic(run,'feather')?4:3,banked:false,restUsed:false,shop:null,items:[],groups:[],position:{x:1,y:7}};
 for(const [x,y,type,color] of [[3,3,'door','yellow'],[6,4,'door','blue']])tiles[y][x]=color==='yellow'?'Y':'B';
 const item=(x,y,type,data={})=>{tiles[y][x]='.';floor.items.push({id:`${number}-${type}-${x}-${y}`,x,y,type,taken:false,...data});};
 item(2,5,'key',{color:'yellow'});item(5,7,'key',{color:'blue'});item(1,3,'chest',{gold:18+number*2});
 item(6,3,'chest',{gold:22+number*2,locked:true,color:'blue'});item(7,4,'potion',{kind:'heal'});
 item(2,1,'gem',{stat:'hp'});item(5,1,'gem',{stat:'atk'});
 tiles[1][1]='M';tiles[7][7]='R';tiles[1][7]='>';tiles[7][1]=number>1?'<':'.';
 const group=(id,x,y,kinds,options={})=>{tiles[y][x]='.';floor.groups.push({id:`f${number}-${id}`,x,y,kinds,defeated:false,...options});};
 group('entry',3,7,number===1?['slime','bandit','wisp']:shuffled(run,['slime','bandit','spider','archer']).slice(0,3),{name:'游荡者小队',scale:number===1?.72:.86});
 group('treasure',2,3,number%2?['sentinel','monk']:['spider','archer','bandit'],{name:'宝物守卫',elite:true,scale:.95});
 group('patrol',6,6,['beast','wisp'],{name:'巡逻守卫',patrol:true,patrolIndex:0,route:[[6,6],[7,6],[7,5],[6,5]],scale:.82});
 group('seal',6,2,number===12?['oracle','monk','archer']:number===6?['gatekeeper','sentinel','wisp']:number<4?['sentinel','slime']:['sentinel','archer','monk'],{name:number===12?'最后的契约':number===6?'黄铜之誓':'楼梯守门人',seal:true,boss:number===6||number===12,scale:1});
 return floor;
}
function beginRun(game,seed){
 const profile=game.profile;profile.runs++;
 const run={id:`${Date.now()}-${profile.runs}`,seed:Number(seed)>>>0,rng:Number(seed)>>>0,serial:0,startedAt:Date.now(),finishedAt:null,floor:1,phase:'explore',floors:{},
  player:{x:1,y:7,hp:70,maxHp:70,atk:6,def:1,gold:30,keys:{yellow:1,blue:0},potions:{heal:1,mana:0}},
  explore:{turn:1,rolled:false,dice:[],steps:0,nextDice:1,nextMin:1},prep:{block:0,atk:0},deck:[],relics:[],battle:null,encounter:null,reward:null,log:[],
  stats:{kills:0,battles:0,rounds:0,moves:0,removals:0,banked:0},feedback:null};
 game.run=run;run.floors[1]=createFloor(run,1);STARTER_DECK.forEach(id=>addCard(game,id));profile.bestFloor=Math.max(profile.bestFloor,1);
 logRun(run,'一颗骰子，一位旅人。寻找钥匙与宝物，击败楼梯守门人。');
}
function canEnter(run,x,y){
 const floor=currentFloor(run),tile=floor.tiles[y]?.[x];
 if(!tile||tile==='#'||floor.groups.some(g=>!g.defeated&&g.x===x&&g.y===y))return false;
 if(tile==='Y'&&!run.player.keys.yellow||tile==='B'&&!run.player.keys.blue)return false;
 return true;
}
export function pathsFrom(run,limit=run.explore.steps){
 const start={x:run.player.x,y:run.player.y},paths=new Map([[`${start.x},${start.y}`,[start]]]),queue=[start];
 for(let i=0;i<queue.length;i++){
  const p=queue[i],path=paths.get(`${p.x},${p.y}`);
  if(path.length-1>=limit||path.length>1&&(adjacentGroups(run,p.x,p.y).length||currentFloor(run).tiles[p.y][p.x]==='M'||currentFloor(run).tiles[p.y][p.x]==='R'&&!currentFloor(run).restUsed))continue;
  for(const [dx,dy] of DIRECTIONS){const x=p.x+dx,y=p.y+dy,key=`${x},${y}`;if(!paths.has(key)&&canEnter(run,x,y)){paths.set(key,[...path,{x,y}]);queue.push({x,y});}}
 }
 return paths;
}
export function movePath(run,x,y){return pathsFrom(run).get(`${x},${y}`)||null;}
export function explorationCost(id,amount=1){return ['stride','brake'].includes(id)?Number(amount):{steady:1,lucky:2,focuswalk:1,twin:1,triple:2,echo:3}[id];}
export function canExploreCard(game,id,amount=1){
 const r=game.run,d=CARDS[id];
 if(!r||r.phase!=='explore'||!r.explore.rolled)return {ok:false,reason:'先点击中央骰子，掷出本回合点数。'};
 if(!d||CARD_TYPES[d.type].phase!=='explore'||!game.profile.unlocked.includes(id))return {ok:false,reason:'这张探索牌尚未解锁。'};
 const n=Number(amount),cost=explorationCost(id,n);
 if(!Number.isInteger(n)||n<1||n>3)return {ok:false,reason:'请选择 1–3 步。'};
 if(currentFloor(r).charges<cost)return {ok:false,reason:'本层准备额度不足；上楼会获得新额度。'};
 if(['brake','focuswalk'].includes(id)&&r.explore.steps<(id==='brake'?n:1))return {ok:false,reason:'剩余步数不足以支付这次调整。'};
 if(id==='steady'&&r.explore.steps===4||id==='lucky'&&r.explore.steps===6)return {ok:false,reason:'已经是这个点数，不需要消耗卡牌额度。'};
 if(['twin','triple','echo'].includes(id)){
  const count=id==='triple'?3:2,min=id==='echo'?3:1;
  if(r.explore.nextDice>=count&&r.explore.nextMin>=min)return {ok:false,reason:'下一次掷骰已有相同或更强的契约。'};
 }
 return {ok:true,cost};
}
function useExploreCard(game,id,amount){
 const r=game.run,n=Number(amount||1),check=canExploreCard(game,id,n);rule(check.ok,check.reason);currentFloor(r).charges-=check.cost;
 switch(id){
 case 'stride':r.explore.steps+=n;break;
 case 'brake':r.explore.steps-=n;r.prep.block=Math.min(6,r.prep.block+2*n);break;
 case 'steady':r.explore.steps=4;break;
 case 'lucky':r.explore.steps=6;break;
 case 'focuswalk':r.explore.steps--;r.prep.atk=2;break;
 default:r.explore.nextDice=Math.max(r.explore.nextDice,id==='triple'?3:2);r.explore.nextMin=Math.max(r.explore.nextMin,id==='echo'?3:1);
 }
 logRun(r,`${CARDS[id].name}：本次 ${r.explore.steps} 步，下次 ${r.explore.nextDice} 颗骰子`);
}
function setEncounter(run,groups){run.encounter={groupIds:groups.map(g=>g.id)};run.phase='encounter';run.explore.rolled=false;run.explore.steps=0;}
function patrol(run){
 const floor=currentFloor(run);for(const group of floor.groups.filter(g=>g.patrol&&!g.defeated)){
  const index=(group.patrolIndex+1)%group.route.length,[x,y]=group.route[index];
  if(floor.tiles[y][x]!=='#'&&(x!==run.player.x||y!==run.player.y)&&!floor.groups.some(g=>g!==group&&!g.defeated&&g.x===x&&g.y===y)){group.x=x;group.y=y;group.patrolIndex=index;}
 }
 const adjacent=adjacentGroups(run);if(adjacent.length)setEncounter(run,adjacent);
}
function endExplorationTurn(run){run.explore.rolled=false;run.explore.steps=0;run.explore.turn++;if(run.phase==='explore')patrol(run);}
function shopFor(game){
 const r=game.run,f=currentFloor(r);if(f.shop)return f.shop;
 const ids=shuffled(r,game.profile.unlocked.filter(id=>CARD_TYPES[CARDS[id].type].phase==='battle'));
 f.shop={cards:ids.slice(0,3).map((id,i)=>({id,price:30+i*10,bought:false})),relic:{id:randomRelic(r),price:75,bought:false},removed:false,upgraded:false,supplies:{heal:0,mana:0,yellow:0,blue:0}};
 return f.shop;
}
function collectTile(game){
 const r=game.run,f=currentFloor(r),p=r.player;
 for(const item of f.items.filter(v=>!v.taken&&v.x===p.x&&v.y===p.y)){
  if(item.locked){if(!p.keys[item.color]){logRun(r,'这只宝箱需要一把蓝钥匙，拿到后可以回来。');continue;}p.keys[item.color]--;}
  item.taken=true;
  if(item.type==='key'){p.keys[item.color]++;logRun(r,`拾取${item.color==='blue'?'蓝':'黄'}钥匙`);}
  if(item.type==='potion'){p.potions[item.kind]++;logRun(r,'收好一瓶治疗药水');}
  if(item.type==='chest'){p.gold+=item.gold;p.potions.mana++;f.charges=Math.min(hasRelic(r,'feather')?4:3,f.charges+1);logRun(r,`宝箱：${item.gold} 金币、1 瓶蓝药、恢复 1 准备额度`);}
  if(item.type==='gem'){if(item.stat==='atk'){p.atk++;logRun(r,'拾取剑之结晶，本局基础攻击 +1');}else{p.maxHp+=5;healPlayer(r,10);logRun(r,'拾取生命结晶，生命上限 +5，恢复最多 10 生命');}}
 }
 const tile=f.tiles[p.y][p.x];
 if(tile==='M'){shopFor(game);r.phase='shop';}
 if(tile==='R'&&!f.restUsed)r.phase='rest';
}
function movePlayer(game,x,y){
 const r=game.run;rule(r.phase==='explore'&&r.explore.rolled,'请先点击中央骰子。');
 const path=movePath(r,x,y);rule(path&&path.length>1,'请选择蓝色范围内的另一格。');
 for(const point of path.slice(1)){
  const tile=currentFloor(r).tiles[point.y][point.x];
  if(tile==='Y'||tile==='B'){const color=tile==='Y'?'yellow':'blue';rule(r.player.keys[color]>0,'缺少对应钥匙。');r.player.keys[color]--;currentFloor(r).tiles[point.y][point.x]='.';logRun(r,`使用${color==='yellow'?'黄':'蓝'}钥匙开门`);}
  r.player.x=point.x;r.player.y=point.y;r.stats.moves++;
  const groups=adjacentGroups(r);if(groups.length){setEncounter(r,groups);break;}
  collectTile(game);if(r.phase!=='explore')break;
 }
 logRun(r,`抵达 ${String.fromCharCode(65+r.player.x)}${r.player.y+1}`);endExplorationTurn(r);
}
function makeEnemy(run,kind,index,scale){
 const d=ENEMIES[kind],growth=1+(run.floor-1)*.065;
 const hp=Math.max(8,Math.round(d.hp*growth*scale));
 return {uid:uid(run,'e'),kind,hp,maxHp:hp,atk:Math.max(1,Math.round(d.atk*(1+(run.floor-1)*.035)*scale)),def:d.def,block:0,poison:0,weak:0,atkDown:0,defDown:0,index};
}
function drawCards(run,amount){
 const b=run.battle;for(let i=0;i<amount&&b.hand.length<10;i++){
  if(!b.draw.length){b.draw=shuffled(run,b.discard);b.discard=[];}
  if(!b.draw.length)break;b.hand.push(b.draw.pop());
 }
}
function beginBattle(game){
 const r=game.run;rule(r.phase==='encounter'&&r.encounter,'没有待开始的遭遇。');
 const groups=currentFloor(r).groups.filter(g=>r.encounter.groupIds.includes(g.id)&&!g.defeated);rule(groups.length,'这组敌人已被击败。');
 const enemies=groups.flatMap(g=>g.kinds.map((kind,index)=>makeEnemy(r,kind,index,g.scale)));
 r.battle={turn:1,enemies,groupIds:groups.map(g=>g.id),mana:3,maxMana:3,draw:shuffled(r,r.deck.map(c=>c.uid)),hand:[],discard:[],exhaust:[],basicUsed:false,block:4+r.prep.block,
  atkBonus:0,defBonus:0,turnAtk:r.prep.atk+(hasRelic(r,'ember')?2:0),spellShield:0,poison:0,weak:0,thorns:hasRelic(r,'crown')?1:0,relicHitUsed:false};
 r.prep={block:0,atk:0};r.phase='battle';drawCards(r,5);logRun(r,`交战：${enemies.map(e=>ENEMIES[e.kind].name).join('、')}。稳阵被动提供 4 格挡。`);
}
export function playerAttack(run){return run.player.atk+(run.battle?.atkBonus||0)+(run.battle?.turnAtk||0);}
export function playerDefense(run){return run.player.def+(run.battle?.defBonus||0);}
export function enemyIntent(run,enemy){
 const raw=ENEMIES[enemy.kind].pattern[(run.battle.turn-1)%ENEMIES[enemy.kind].pattern.length];
 const value=['attack','multi','magic'].includes(raw.type)?Math.max(1,enemy.atk-enemy.atkDown+(raw.bonus||0)):raw.value;
 const hits=raw.hits||1,values=Array.from({length:hits},(_,i)=>Math.max(1,value-(enemy.weak>i?2:0)));
 const names={attack:`普攻 ${values[0]}`,multi:`技能 · ${values.join('＋')}`,magic:`法术 ${values[0]}`,guard:`格挡 ${value}`,poison:`技能 · 中毒 ${value}`,weak:`技能 · 虚弱 ${value}`,heal:`技能 · 治疗 ${value}`};
 return {...raw,value,label:names[raw.type]};
}
function lose(game){
 const r=game.run;r.phase='lost';r.finishedAt=Date.now();r.lostGold=r.player.gold;r.player.gold=0;r.player.keys={yellow:0,blue:0};r.player.potions={heal:0,mana:0};
 logRun(r,'旅程结束。本局资源清空，营地金币、解锁与收藏保留。');
}
function bankFloor(game){const r=game.run,f=currentFloor(r);if(f.banked)return;const amount=8+r.floor;f.banked=true;game.profile.gold+=amount;r.stats.banked+=amount;logRun(r,`楼层结算：${amount} 金币存入营地，不会因本局失败丢失。`);}
function winBattle(game){
 const r=game.run,b=r.battle;rule(r.phase==='battle','战斗已经结束。');
 const groups=currentFloor(r).groups.filter(g=>b.groupIds.includes(g.id));groups.forEach(g=>g.defeated=true);
 const gold=15+b.enemies.length*6+(groups.some(g=>g.elite)?12:0)+(hasRelic(r,'coin')?10:0);
 r.player.gold+=gold;r.stats.kills+=b.enemies.length;r.stats.battles++;
 const recovered=hasRelic(r,'pouch')?healPlayer(r,4):0;
 const relic=groups.some(g=>g.boss||g.elite)?randomRelic(r):null;if(relic)addRelic(r,relic);
 if(random(r)<.25)r.player.potions.heal++;
 logRun(r,`战斗胜利！获得 ${gold} 金币${recovered?`，恢复 ${recovered} 生命`:''}`);
 if(r.floor===12&&groups.some(g=>g.seal)){
  bankFloor(game);r.phase='won';r.finishedAt=Date.now();game.profile.wins++;logRun(r,'十二层契印碎裂。你走出了高塔。');return;
 }
 const cards=shuffled(r,game.profile.unlocked.filter(id=>CARD_TYPES[CARDS[id].type].phase==='battle')).slice(0,3);
 r.reward={gold,healed:recovered,relic,cards};r.phase='reward';
}
function battleEndCheck(game){
 const r=game.run;if(r.player.hp<=0){r.player.hp=0;lose(game);return true;}
 if(!aliveEnemies(r).length){winBattle(game);return true;}return false;
}
function hitEnemy(run,enemy,amount,{magic=false,pierce=false}={}){
 if(enemy.hp<=0)return 0;let damage=amount;
 if(!magic){if(run.battle.weak){damage=Math.max(1,damage-2);run.battle.weak--;}damage=Math.max(1,damage-(pierce?0:Math.max(0,enemy.def-enemy.defDown)));}
 const blocked=Math.min(enemy.block,damage);enemy.block-=blocked;const actual=Math.min(enemy.hp,damage-blocked);enemy.hp-=actual;return actual;
}
function feedback(run,type,value=0,target=null){run.feedback={serial:uid(run,'fx'),type,value,target};}
export function canPlay(game,cardUid,targetId,discardUid){
 const r=game.run;if(!r||r.phase!=='battle')return {ok:false,reason:'当前不在战斗中。'};
 const b=r.battle,card=r.deck.find(c=>c.uid===cardUid),d=card&&CARDS[card.id];
 if(!card||!b.hand.includes(cardUid))return {ok:false,reason:'这张牌不在当前手牌中。'};
 if(b.mana<d.cost)return {ok:false,reason:`需要 ${d.cost} 蓝，当前只有 ${b.mana}。`};
 if(d.target==='enemy'&&!b.enemies.some(e=>e.uid===targetId&&e.hp>0))return {ok:false,reason:'请选择一名仍存活的敌人。'};
 if(d.effect==='recall'&&!b.discard.some(id=>id!==cardUid&&r.deck.find(c=>c.uid===id)?.id!=='recall'))return {ok:false,reason:'弃牌堆里还没有可以回收的牌。'};
 if(discardUid&&(!b.discard.includes(discardUid)||r.deck.find(c=>c.uid===discardUid)?.id==='recall'))return {ok:false,reason:'请选择弃牌堆中另一张牌。'};
 if(d.effect==='bloodpact'&&(r.player.hp<=(card.level?2:4)||b.mana>=b.maxMana))return {ok:false,reason:'血契需要足够生命，并且蓝量尚未满。'};
 if(d.effect==='barrier'&&b.spellShield&& !card.level)return {ok:false,reason:'已经有一层法术护盾。'};
 return {ok:true};
}
function playCard(game,cardUid,targetId,discardUid){
 const r=game.run,check=canPlay(game,cardUid,targetId,discardUid);rule(check.ok,check.reason);
 const b=r.battle,card=r.deck.find(c=>c.uid===cardUid),d=CARDS[card.id],up=card.level?1:0;
 const target=b.enemies.find(e=>e.uid===targetId&&e.hp>0);b.mana-=d.cost;b.hand=b.hand.filter(id=>id!==cardUid);
 let total=0;
 if(d.type==='weapon'){
  let power=(d.power||0)+({slash:3,heavy:5,pierce:3,sweep:3,bash:4}[d.effect]||0)*up;
  if(d.effect==='bash')power+=b.block;
  const targets=d.target==='all'?aliveEnemies(r):[target];let relicBonus=hasRelic(r,'obsidian')&&!b.relicHitUsed?2:0;
  for(const enemy of targets)for(let i=0;i<(d.effect==='volley'?2+up:1)&&enemy.hp>0;i++){
   total+=hitEnemy(r,enemy,playerAttack(r)+power+relicBonus,{pierce:d.effect==='pierce'});relicBonus=0;
  }
  b.relicHitUsed=true;
 }else switch(d.effect){
  case 'sharpen':b.atkBonus+=1+up;break;
  case 'fury':b.turnAtk+=4+up*2;break;
  case 'weaken':target.atkDown=Math.min(target.atk-1,target.atkDown+2+up);break;
  case 'roar':aliveEnemies(r).forEach(e=>e.atkDown=Math.min(e.atk-1,e.atkDown+1+up));break;
  case 'expose':target.defDown=Math.min(target.def,target.defDown+2+up*2);drawCards(r,1);break;
  case 'guard':b.block+=7+up*3;break;
  case 'bulwark':b.defBonus=Math.min(4,b.defBonus+1+up);break;
  case 'shatter':target.defDown=Math.min(target.def,target.defDown+3+up*2);break;
  case 'barrier':b.spellShield=1;if(up)b.block+=3;break;
  case 'fortify':b.block+=5+up*3;healPlayer(r,3+up*2);break;
  case 'riposte':b.thorns+=2+up;break;
  case 'fireball':total+=hitEnemy(r,target,10+up*4,{magic:true});break;
  case 'meteor':total+=hitEnemy(r,target,24+up*8,{magic:true});break;
  case 'storm':aliveEnemies(r).forEach(e=>total+=hitEnemy(r,e,8+up*3,{magic:true}));break;
  case 'poison':target.poison+=4+up*2;break;
  case 'frost':total+=hitEnemy(r,target,4+up*3,{magic:true});target.weak+=2+up;break;
  case 'insight':drawCards(r,2+up);break;
  case 'recall':{
   const chosen=discardUid||b.discard.find(id=>r.deck.find(c=>c.uid===id).id!=='recall');
   rule(b.discard.includes(chosen),'这张牌不在弃牌堆。');b.discard=b.discard.filter(id=>id!==chosen);if(b.hand.length<10)b.hand.push(chosen);else b.discard.push(chosen);if(up)drawCards(r,1);break;
  }
  case 'bloodpact':r.player.hp-=up?2:4;b.mana=Math.min(b.maxMana,b.mana+2);break;
  case 'chain':{
   const other=aliveEnemies(r).find(e=>e.uid!==target.uid);total+=hitEnemy(r,target,10+up*4,{magic:true});if(other)total+=hitEnemy(r,other,5+up*2,{magic:true});break;
  }
  case 'leech':total+=hitEnemy(r,target,9+up*4,{magic:true});healPlayer(r,4+up*2);break;
  case 'embers':aliveEnemies(r).forEach(e=>e.poison+=2+up*2);break;
 }
 (d.exhaust?b.exhaust:b.discard).push(cardUid);
 logRun(r,`${d.name}${card.level?'⁺':''}${target?' → '+ENEMIES[target.kind].name:''}${total?`，造成 ${total} 伤害`:''}`);
 feedback(r,total?'hit':'buff',total,target?.uid);battleEndCheck(game);
}
function hitPlayer(run,enemy,amount,magic){
 const b=run.battle;let damage=amount;
 if(enemy.weak){damage=Math.max(1,damage-2);enemy.weak--;}
 damage=Math.max(1,damage-(magic?0:playerDefense(run)));
 const absorbed=Math.min(b.block,damage);b.block-=absorbed;const actual=Math.min(run.player.hp,damage-absorbed);run.player.hp-=actual;
 if(actual&&b.thorns)enemy.hp=Math.max(0,enemy.hp-b.thorns);
 return actual;
}
function endBattleTurn(game){
 const r=game.run;rule(r.phase==='battle','当前不在战斗中。');const b=r.battle;r.stats.rounds++;
 b.discard.push(...b.hand);b.hand=[];
 for(const e of aliveEnemies(r))if(e.poison){const damage=Math.min(e.hp,e.poison);e.hp-=damage;e.poison--;logRun(r,`${ENEMIES[e.kind].name} 中毒，失去 ${damage} 生命`);}
 if(battleEndCheck(game))return;
 let total=0;
 for(const enemy of aliveEnemies(r)){
  if(enemy.hp<=0)continue;
  enemy.block=0;const intent=enemyIntent(r,enemy);
  if(intent.skill&&['magic','poison','weak','multi'].includes(intent.type)&&b.spellShield){b.spellShield=0;logRun(r,`法术护盾抵挡了${ENEMIES[enemy.kind].name}的技能`);continue;}
  if(['attack','multi','magic'].includes(intent.type)){
   let hurt=0;for(let i=0;i<(intent.hits||1)&&enemy.hp>0&&r.player.hp>0;i++)hurt+=hitPlayer(r,enemy,intent.value,intent.type==='magic');
   total+=hurt;logRun(r,`${ENEMIES[enemy.kind].name} ${intent.label}，实际扣血 ${hurt}`);
  }else if(intent.type==='guard')enemy.block+=intent.value;
  else if(intent.type==='poison')b.poison+=intent.value;
  else if(intent.type==='weak')b.weak+=intent.value;
  else if(intent.type==='heal'){
   const ally=aliveEnemies(r).sort((a,c)=>a.hp/a.maxHp-c.hp/c.maxHp)[0];ally.hp=Math.min(ally.maxHp,ally.hp+intent.value);logRun(r,`${ENEMIES[enemy.kind].name} 为同伴恢复生命`);
  }
  if(battleEndCheck(game))return;
 }
 if(b.poison){const damage=Math.min(r.player.hp,b.poison);r.player.hp-=damage;b.poison--;total+=damage;logRun(r,`你受到 ${damage} 中毒伤害`);}
 if(battleEndCheck(game))return;
 b.turn++;b.mana=Math.min(b.maxMana,b.mana+3);b.block=0;b.turnAtk=0;b.basicUsed=false;b.relicHitUsed=false;drawCards(r,5);feedback(r,'hurt',total);
}
function upgradeCard(game,cardUid,rest=false){
 const r=game.run,card=r.deck.find(c=>c.uid===cardUid);rule(card&&!card.level,'请选择一张未强化卡。');
 if(rest){rule(r.phase==='rest'&&!currentFloor(r).restUsed,'本层篝火已使用。');currentFloor(r).restUsed=true;r.phase='explore';}
 else {rule(r.phase==='shop','请在商店强化。');const s=shopFor(game);rule(!s.upgraded&&r.player.gold>=40,'本店已强化，或金币不足 40。');s.upgraded=true;r.player.gold-=40;}
 card.level=1;logRun(r,`强化了${CARDS[card.id].name}：${CARDS[card.id].upgrade}`);
}
function changeFloor(game,direction){
 const r=game.run,f=currentFloor(r),p=r.player;
 rule(r.phase==='explore','请先完成当前房间。');
 if(direction===1){rule(p.x===7&&p.y===1,'请先走到上行楼梯。');rule(f.groups.find(g=>g.seal).defeated,'楼梯封印尚未解除，请击败守门人。');rule(r.floor<12,'已是塔顶。');bankFloor(game);}
 else rule(r.floor>1&&p.x===1&&p.y===7,'请走到下行楼梯。');
 f.position={x:p.x,y:p.y};r.floor+=direction;if(!r.floors[r.floor])r.floors[r.floor]=createFloor(r,r.floor);
 const next=currentFloor(r);p.x=direction===1?1:7;p.y=direction===1?7:1;
 r.explore.rolled=false;r.explore.steps=0;r.explore.dice=[];r.encounter=null;game.profile.bestFloor=Math.max(game.profile.bestFloor,r.floor);logRun(r,`来到第 ${r.floor} 层。`);
}
export function act(state,action){
 const game=structuredClone(state);
 try{
  rule(action&&typeof action.type==='string','无效操作。');
  if(action.type==='new-run'){beginRun(game,action.seed??Date.now());return {state:game,error:null};}
  if(action.type==='unlock'){
   const id=action.id,d=CARDS[id];rule(d?.unlock&&!game.profile.unlocked.includes(id),'这张卡已经解锁。');rule(game.profile.gold>=d.unlock,'营地金币不足。');
   game.profile.gold-=d.unlock;game.profile.unlocked.push(id);return {state:game,error:null};
  }
  const r=game.run;rule(r&&!['won','lost'].includes(r.phase),'请先开始一段新旅程。');
  switch(action.type){
   case 'roll':{
    rule(r.phase==='explore'&&!r.explore.rolled,'这一回合已经掷过骰子。');
    const minimum=Math.max(r.explore.nextMin,hasRelic(r,'amber')?2:1);
    r.explore.dice=Array.from({length:r.explore.nextDice},()=>Math.max(minimum,Math.floor(random(r)*6)+1));r.explore.nextDice=1;r.explore.nextMin=1;
    r.explore.steps=r.explore.dice.reduce((a,b)=>a+b,0);r.explore.rolled=true;logRun(r,`点击掷骰：${r.explore.dice.join(' + ')} = ${r.explore.steps} 步`);feedback(r,'roll');break;
   }
   case 'explore-card':useExploreCard(game,action.id,action.amount);break;
   case 'move':movePlayer(game,Number(action.x),Number(action.y));break;
   case 'wait':rule(r.phase==='explore'&&r.explore.rolled,'先掷骰，再选择原地待机。');logRun(r,'原地待机，巡逻守卫继续前进。');endExplorationTurn(r);break;
   case 'interact':rule(r.phase==='explore','当前无法交互。');collectTile(game);break;
   case 'enter-battle':beginBattle(game);break;
   case 'retreat':rule(r.phase==='encounter','当前没有交战预览。');r.phase='explore';r.encounter=null;logRun(r,'暂缓交战。下一回合可以调整路线。');break;
   case 'basic':{
    rule(r.phase==='battle'&&!r.battle.basicUsed,'每回合只能普攻一次。');const enemy=aliveEnemies(r).find(e=>e.uid===action.target);rule(enemy,'请选择一名敌人。');r.battle.basicUsed=true;
    const damage=hitEnemy(r,enemy,playerAttack(r));logRun(r,`普攻 → ${ENEMIES[enemy.kind].name}，造成 ${damage} 伤害`);feedback(r,'hit',damage,enemy.uid);battleEndCheck(game);break;
   }
   case 'play':playCard(game,action.uid,action.target,action.discardUid);break;
   case 'end':endBattleTurn(game);break;
   case 'reward':{
    rule(r.phase==='reward'&&r.reward,'没有可领取奖励。');if(action.id){rule(r.reward.cards.includes(action.id),'请选择当前候选卡。');addCard(game,action.id);}
    r.reward=null;r.battle=null;r.encounter=null;r.phase='explore';collectTile(game);break;
   }
   case 'ascend':changeFloor(game,1);break;
   case 'descend':changeFloor(game,-1);break;
   case 'buy-card':{
    rule(r.phase==='shop','请先进入商店。');const offer=shopFor(game).cards[action.index];rule(offer&&!offer.bought,'商品已售出。');rule(r.player.gold>=offer.price,'冒险金币不足。');r.player.gold-=offer.price;offer.bought=true;addCard(game,offer.id);logRun(r,`购买了${CARDS[offer.id].name}`);break;
   }
   case 'buy-relic':{
    rule(r.phase==='shop','请先进入商店。');const offer=shopFor(game).relic;rule(offer.id&&!offer.bought&&!hasRelic(r,offer.id),'遗物已售出或已拥有。');rule(r.player.gold>=offer.price,'冒险金币不足。');r.player.gold-=offer.price;offer.bought=true;addRelic(r,offer.id);break;
   }
   case 'buy-supply':{
    rule(r.phase==='shop','请先进入商店。');const kind=action.kind,price={heal:18,mana:15,yellow:15,blue:25}[kind],s=shopFor(game);
    rule(price&&s.supplies[kind]<3,'这项补给已售罄。');rule(r.player.gold>=price,'冒险金币不足。');r.player.gold-=price;s.supplies[kind]++;
    if(['yellow','blue'].includes(kind))r.player.keys[kind]++;else r.player.potions[kind]++;break;
   }
   case 'remove':{
    rule(r.phase==='shop','请先进入商店。');const s=shopFor(game),price=35+15*r.stats.removals;rule(!s.removed&&r.deck.length>1,'本店已精简，或牌组已无法再删。');rule(r.player.gold>=price,'冒险金币不足。');rule(r.deck.some(c=>c.uid===action.uid),'这张牌不在牌组中。');
    r.player.gold-=price;r.deck=r.deck.filter(c=>c.uid!==action.uid);s.removed=true;r.stats.removals++;break;
   }
   case 'upgrade':upgradeCard(game,action.uid,r.phase==='rest');break;
   case 'rest-heal':rule(r.phase==='rest'&&!currentFloor(r).restUsed,'篝火已使用。');rule(r.player.hp<r.player.maxHp,'生命已满，可以选择强化。');healPlayer(r,Math.ceil(r.player.maxHp*.3));currentFloor(r).restUsed=true;r.phase='explore';logRun(r,'篝火恢复了生命。');break;
   case 'leave':rule(['shop','rest'].includes(r.phase),'当前没有可离开的房间。');r.phase='explore';break;
   case 'potion':{
    const kind=action.kind;rule(['heal','mana'].includes(kind)&&r.player.potions[kind]>0,'没有这种药水。');rule(['explore','battle','encounter','shop','rest'].includes(r.phase),'当前无法使用药水。');
    if(kind==='heal'){rule(r.player.hp<r.player.maxHp,'生命已满。');healPlayer(r,20);}
    else{rule(r.phase==='battle'&&r.battle.mana<r.battle.maxMana,'蓝药在战斗中、蓝量未满时使用。');r.battle.mana=Math.min(r.battle.maxMana,r.battle.mana+2);}
    r.player.potions[kind]--;logRun(r,`使用${kind==='heal'?'治疗':'回蓝'}药水`);feedback(r,'buff');break;
   }
   default:rule(false,'未知操作。');
  }
  return {state:game,error:null};
 }catch(error){return {state,error:error.message};}
}
export function cardDescription(card,run){
 const d=CARDS[card.id];let text=d.text;
 if(d.type==='weapon'&&run?.battle){
  const up=card.level?1:0,power=(d.power||0)+({slash:3,heavy:5,pierce:3,sweep:3,bash:4}[d.effect]||0)*up+(d.effect==='bash'?run.battle.block:0);
  const value=playerAttack(run)+power;
  text=d.effect==='volley'?`连续攻击 ${2+up} 次，每次 ${value} 物理伤害。`:d.effect==='sweep'?`对所有敌人造成 ${value} 物理伤害。`:`造成 ${value} 物理伤害${d.effect==='pierce'?'，无视防御':''}。`;
  return text+(d.effect==='pierce'?'（格挡另算）':'（防御、格挡另算）');
 }
 return text+(card.level?` 强化：${d.upgrade}`:'');
}
export function restoreGame(raw){
 try{
  const game=typeof raw==='string'?JSON.parse(raw):structuredClone(raw);rule(game?.version===SAVE_VERSION,'版本无效');
  const integer=(n,min=0,max=100000000)=>Number.isInteger(n)&&n>=min&&n<=max;
  const profile=game.profile;rule(profile&&integer(profile.gold)&&integer(profile.bestFloor,0,12)&&integer(profile.wins)&&integer(profile.runs),'档案无效');
  rule(Array.isArray(profile.unlocked)&&new Set(profile.unlocked).size===profile.unlocked.length&&profile.unlocked.every(id=>CARDS[id]),'解锁无效');
  rule(profile.collection&&Object.entries(profile.collection).every(([id,count])=>CARDS[id]&&integer(count)),'收藏无效');
  if(!game.run)return game;const r=game.run,p=r.player;
  rule(integer(r.floor,1,12)&&integer(r.rng,0,4294967295)&&integer(r.seed,0,4294967295)&&integer(r.serial),'旅程无效');
  rule(['explore','encounter','battle','reward','shop','rest','won','lost'].includes(r.phase),'阶段无效');
  rule(p&&integer(p.hp,0,500)&&integer(p.maxHp,1,500)&&p.hp<=p.maxHp&&integer(p.atk,1,100)&&integer(p.def,0,100)&&integer(p.gold)&&integer(p.x,0,8)&&integer(p.y,0,8),'角色无效');
  rule(p.keys&&['yellow','blue'].every(k=>integer(p.keys[k],0,100))&&p.potions&&['heal','mana'].every(k=>integer(p.potions[k],0,100)),'道具无效');
  rule(r.floors&&r.floors[r.floor]&&Object.entries(r.floors).length<=12,'楼层无效');
  for(const [number,f] of Object.entries(r.floors)){
   rule(integer(Number(number),1,12)&&f.number===Number(number)&&integer(f.charges,0,4),'楼层资源无效');
   rule(Array.isArray(f.tiles)&&f.tiles.length===9&&f.tiles.every(row=>Array.isArray(row)&&row.length===9&&row.every(t=>'#.YBMR><'.includes(t)&&t.length===1)),'地图无效');
   rule(Array.isArray(f.groups)&&f.groups.length<=12&&new Set(f.groups.map(g=>g.id)).size===f.groups.length&&f.groups.every(g=>typeof g.id==='string'&&integer(g.x,1,7)&&integer(g.y,1,7)&&Array.isArray(g.kinds)&&g.kinds.length>0&&g.kinds.every(id=>ENEMIES[id])),'敌群无效');
   rule(Array.isArray(f.items)&&f.items.every(i=>integer(i.x,1,7)&&integer(i.y,1,7)&&['key','potion','chest','gem'].includes(i.type)),'物品无效');
   if(f.shop)rule(f.shop.cards.every(o=>CARDS[o.id]&&integer(o.price))&&(!f.shop.relic.id||RELICS[f.shop.relic.id]),'商店无效');
  }
  rule(Array.isArray(r.deck)&&r.deck.length>0&&r.deck.length<=200&&new Set(r.deck.map(c=>c.uid)).size===r.deck.length&&r.deck.every(c=>typeof c.uid==='string'&&CARDS[c.id]&&CARD_TYPES[CARDS[c.id].type].phase==='battle'&&integer(c.level,0,1)),'牌组无效');
  rule(Array.isArray(r.relics)&&new Set(r.relics).size===r.relics.length&&r.relics.every(id=>RELICS[id]),'遗物无效');
  const x=r.explore;rule(x&&integer(x.turn,1)&&integer(x.steps,0,32)&&integer(x.nextDice,1,3)&&integer(x.nextMin,1,3)&&Array.isArray(x.dice)&&x.dice.length<=3&&x.dice.every(v=>integer(v,1,6)),'探索无效');
  rule(r.prep&&integer(r.prep.block,0,6)&&integer(r.prep.atk,0,2)&&Array.isArray(r.log)&&r.log.every(v=>typeof v==='string'),'记录无效');
  rule(r.stats&&['kills','battles','rounds','moves','removals','banked'].every(k=>integer(r.stats[k])),'统计无效');
  if(r.phase==='encounter')rule(r.encounter?.groupIds.length&&r.encounter.groupIds.every(id=>currentFloor(r).groups.some(g=>g.id===id&&!g.defeated)),'遭遇无效');
  if(r.battle){const b=r.battle;rule(integer(b.turn,1)&&integer(b.mana,0,3)&&b.maxMana===3&&integer(b.block)&&integer(b.atkBonus)&&integer(b.defBonus,0,4)&&integer(b.spellShield,0,1),'战斗资源无效');
   rule(Array.isArray(b.enemies)&&b.enemies.length>0&&b.enemies.every(e=>ENEMIES[e.kind]&&integer(e.hp,0,e.maxHp)&&integer(e.maxHp,1,1000)&&integer(e.atk,1,100)),'战斗敌人无效');
   const partition=['hand','draw','discard','exhaust'].flatMap(k=>{rule(Array.isArray(b[k]),'牌堆无效');return b[k];});
   rule(partition.length===r.deck.length&&new Set(partition).size===partition.length&&partition.every(id=>r.deck.some(c=>c.uid===id))&&b.hand.length<=10,'牌堆不一致');
  }
  if(r.phase==='battle')rule(r.battle&&aliveEnemies(r).length&&p.hp>0,'战斗缺失');
  if(r.phase==='reward')rule(r.reward&&r.reward.cards.length===3&&r.reward.cards.every(id=>CARDS[id]),'奖励无效');
  if(r.phase==='shop')rule(currentFloor(r).shop,'商店缺失');
  return game;
 }catch{return null;}
}
