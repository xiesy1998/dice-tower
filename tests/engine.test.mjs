import test from 'node:test';
import assert from 'node:assert/strict';
import { CARDS, CARD_TYPES } from '../cards.mjs';
import { createGame, act, restoreGame, currentFloor, pathsFrom, movePath, canPlay, playerAttack, playerDefense } from '../engine.mjs';
const fresh=(seed=42)=>act(createGame(),{type:'new-run',seed}).state;
function apply(game,action){const result=act(game,action);assert.equal(result.error,null,`${JSON.stringify(action)}: ${result.error}`);return result.state;}
function fight(seed=42){let game=fresh(seed);game=apply(game,{type:'roll'});game=apply(game,{type:'move',x:2,y:7});return apply(game,{type:'enter-battle'});}
function hand(game,cards){const r=game.run,b=r.battle;r.deck=cards.map((id,i)=>({uid:'test'+i,id,level:0}));b.hand=r.deck.map(c=>c.uid);b.draw=[];b.discard=[];b.exhaust=[];return game;}
function solo(game,kind='slime'){const b=game.run.battle;b.enemies.forEach((e,i)=>{e.kind=kind;e.hp=i?0:30;e.maxHp=30;e.atk=5;e.def=0;});b.block=0;return b.enemies[0];}

test('36 cards cover all six promised types with bounded exploration and mana costs',()=>{
 assert.equal(Object.keys(CARDS).length,36);
 assert.deepEqual(Object.keys(CARD_TYPES).map(type=>Object.values(CARDS).filter(c=>c.type===type).length),[5,3,5,6,11,6]);
 for(const d of Object.values(CARDS))if(CARD_TYPES[d.type].phase==='battle')assert.ok(Number.isInteger(d.cost)&&d.cost>=0&&d.cost<=3);
});
test('new journey has fixed stats, one hero, ten cards and no shared state',()=>{
 const a=fresh(),b=fresh();assert.deepEqual([a.run.player.hp,a.run.player.atk,a.run.player.def],[70,6,1]);assert.equal(a.run.deck.length,10);assert.equal(a.run.explore.nextDice,1);assert.equal(a.run.explore.rolled,false);
 a.run.player.hp=1;assert.equal(b.run.player.hp,70);assert.ok(restoreGame(JSON.stringify(b)));
});
test('manual roll resolves once; rejected repeat cannot alter RNG or result',()=>{
 let g=fresh();g=apply(g,{type:'roll'});assert.equal(g.run.explore.dice.length,1);assert.equal(g.run.explore.steps,g.run.explore.dice[0]);
 const before=JSON.stringify(g),bad=act(g,{type:'roll'});assert.ok(bad.error);assert.strictEqual(bad.state,g);assert.equal(JSON.stringify(g),before);
});
test('point cards charge actual selected amount; insufficient and no-op changes are atomic',()=>{
 let g=fresh();g=apply(g,{type:'roll'});const start=g.run.explore.steps;g=apply(g,{type:'explore-card',id:'stride',amount:2});assert.equal(g.run.explore.steps,start+2);assert.equal(currentFloor(g.run).charges,1);
 const bad=act(g,{type:'explore-card',id:'stride',amount:2});assert.ok(bad.error);assert.strictEqual(bad.state,g);
 g=apply(g,{type:'explore-card',id:'brake',amount:1});assert.equal(g.run.prep.block,2);assert.equal(g.run.explore.steps,start+1);assert.equal(currentFloor(g.run).charges,0);
});
test('next-turn dice count is consumed by exploration only and resets after one roll',()=>{
 let g=fresh();g=apply(g,{type:'roll'});g=apply(g,{type:'explore-card',id:'twin'});g=apply(g,{type:'move',x:2,y:7});g=apply(g,{type:'enter-battle'});
 assert.equal(g.run.explore.nextDice,2);g=apply(g,{type:'end'});assert.equal(g.run.explore.nextDice,2);
 g.run.battle.enemies.forEach(e=>{e.hp=1;e.poison=1;});g=apply(g,{type:'end'});g=apply(g,{type:'reward'});g=apply(g,{type:'roll'});
 assert.equal(g.run.explore.dice.length,2);assert.equal(g.run.explore.steps,g.run.explore.dice.reduce((a,b)=>a+b,0));assert.equal(g.run.explore.nextDice,1);
});
test('triple and minimum-result contracts use one common dice tray',()=>{
 let g=fresh();g.profile.unlocked=Object.keys(CARDS);g=apply(g,{type:'roll'});g=apply(g,{type:'explore-card',id:'triple'});g=apply(g,{type:'wait'});g=apply(g,{type:'roll'});assert.equal(g.run.explore.dice.length,3);
 let h=fresh(50);h.profile.unlocked=Object.keys(CARDS);h=apply(h,{type:'roll'});h=apply(h,{type:'explore-card',id:'echo'});h=apply(h,{type:'wait'});h=apply(h,{type:'roll'});assert.equal(h.run.explore.dice.length,2);assert.ok(h.run.explore.dice.every(v=>v>=3&&v<=6));
});
test('paths stop at encounter cells and cannot pass walls or enemy units',()=>{
 let g=fresh();g=apply(g,{type:'roll'});g.run.explore.steps=12;const paths=pathsFrom(g.run);assert.ok(paths.has('2,7'));assert.equal(paths.has('3,7'),false);assert.equal(paths.has('0,7'),false);
 const path=movePath(g.run,2,7);assert.deepEqual(path,[{x:1,y:7},{x:2,y:7}]);g=apply(g,{type:'move',x:2,y:7});assert.equal(g.run.phase,'encounter');assert.equal(g.run.explore.steps,0);assert.equal(g.run.explore.turn,2);
});
test('matching key opens a door once; missing key cannot produce a path',()=>{
 let g=fresh();currentFloor(g.run).groups.forEach(group=>group.defeated=true);g.run.player.x=3;g.run.player.y=4;g=apply(g,{type:'roll'});g.run.explore.steps=5;
 assert.ok(movePath(g.run,3,3));g=apply(g,{type:'move',x:3,y:3});assert.equal(g.run.player.keys.yellow,0);assert.equal(currentFloor(g.run).tiles[3][3],'.');
 let h=fresh();currentFloor(h.run).groups.forEach(group=>group.defeated=true);h.run.player.x=3;h.run.player.y=4;h.run.player.keys.yellow=0;h.run.explore.steps=5;assert.equal(movePath(h.run,3,3),null);
});
test('treasure, gem and key pickups do not respawn on interaction or reload',()=>{
 let g=fresh();currentFloor(g.run).groups.forEach(group=>group.defeated=true);g.run.player.x=1;g.run.player.y=4;g=apply(g,{type:'roll'});g.run.explore.steps=5;
 const coins=g.run.player.gold;g=apply(g,{type:'move',x:1,y:3});assert.equal(g.run.player.gold,coins+20);assert.equal(g.run.player.potions.mana,1);
 const saved=restoreGame(JSON.stringify(g));assert.ok(saved);g=apply(saved,{type:'interact'});assert.equal(g.run.player.gold,coins+20);assert.equal(g.run.player.potions.mana,1);
});
test('all twelve floor layouts retain a route to key, gem and stairs',()=>{
 let g=fresh();for(let floor=1;floor<=12;floor++){
  if(!g.run.floors[floor]){g.run.phase='explore';g.run.player.x=7;g.run.player.y=1;currentFloor(g.run).groups.forEach(group=>group.defeated=true);g=apply(g,{type:'ascend'});}
  currentFloor(g.run).groups.forEach(group=>group.defeated=true);g.run.player.keys={yellow:10,blue:10};const paths=pathsFrom(g.run,99);
  assert.ok(paths.has('7,1'),`stairs floor ${floor}`);assert.ok(paths.has('2,5'),`key floor ${floor}`);assert.ok(paths.has('5,1'),`attack gem floor ${floor}`);
 }
});
test('encounters contain three independently targetable enemies and passive block',()=>{
 const g=fight();assert.equal(g.run.battle.enemies.length,3);assert.equal(new Set(g.run.battle.enemies.map(e=>e.uid)).size,3);assert.equal(g.run.battle.block,4);assert.equal(g.run.battle.hand.length,5);assert.equal(g.run.battle.mana,3);
});
test('basic attack is fixed by attack/defense and has one use per round',()=>{
 let g=fight();const e=g.run.battle.enemies[0];e.def=2;const hp=e.hp;g=apply(g,{type:'basic',target:e.uid});assert.equal(g.run.battle.enemies[0].hp,hp-4);assert.equal(g.run.battle.mana,3);assert.ok(act(g,{type:'basic',target:e.uid}).error);
});
test('weapon, enemy armor and consumable block resolve without double-counting attack',()=>{
 let g=hand(fight(),['slash']);const e=solo(g);e.def=2;e.block=3;g=apply(g,{type:'play',uid:'test0',target:e.uid});assert.equal(g.run.battle.enemies[0].hp,27);assert.equal(g.run.battle.enemies[0].block,0);assert.equal(g.run.battle.mana,2);assert.deepEqual(g.run.battle.discard,['test0']);assert.ok(act(g,{type:'play',uid:'test0',target:e.uid}).error);
});
test('spell damage ignores physical defense; pierce ignores armor but not block',()=>{
 let g=hand(fight(),['fireball']);const e=solo(g);e.def=20;e.block=3;g=apply(g,{type:'play',uid:'test0',target:e.uid});assert.equal(g.run.battle.enemies[0].hp,23);
 let h=hand(fight(),['pierce']);const foe=solo(h);foe.def=20;foe.block=3;h=apply(h,{type:'play',uid:'test0',target:foe.uid});assert.equal(h.run.battle.enemies[0].hp,26);
});
test('zero mana and invalid targets preserve cards, RNG and all resources',()=>{
 const g=hand(fight(),['slash']);g.run.battle.mana=0;const copy=JSON.stringify(g);const bad=act(g,{type:'play',uid:'test0',target:g.run.battle.enemies[0].uid});assert.ok(bad.error);assert.equal(JSON.stringify(g),copy);assert.strictEqual(bad.state,g);
 g.run.battle.mana=3;assert.ok(act(g,{type:'play',uid:'test0',target:'missing'}).error);
});
test('all 28 combat effects and upgrades execute with finite valid resources',()=>{
 for(const [id,d] of Object.entries(CARDS).filter(([,d])=>CARD_TYPES[d.type].phase==='battle'))for(const level of [0,1]){
  let g=hand(fight(),[id,'slash','guard']);g.run.deck[0].level=level;g.run.player.hp=40;g.run.battle.block=9;g.run.battle.mana=id==='bloodpact'?1:3;
  g.run.battle.enemies.forEach(e=>{e.hp=500;e.maxHp=500;e.def=4;});
  if(id==='recall'){g.run.battle.hand=['test0','test2'];g.run.battle.discard=['test1'];}
  g=apply(g,{type:'play',uid:'test0',target:g.run.battle.enemies[0].uid,discardUid:id==='recall'?'test1':undefined});
  assert.ok(restoreGame(JSON.stringify(g)),`${id} ${level} produces a valid save`);assert.ok(Number.isFinite(g.run.player.hp));assert.ok(g.run.battle.mana>=0&&g.run.battle.mana<=3);
 }
});
test('battle buffs persist, burst buffs expire, and each round restores bounded mana',()=>{
 let g=hand(fight(),['sharpen','fury','bulwark']);const e=solo(g);g=apply(g,{type:'play',uid:'test0'});g=apply(g,{type:'play',uid:'test1'});assert.equal(playerAttack(g.run),11);
 g=apply(g,{type:'end'});assert.equal(playerAttack(g.run),7);assert.equal(g.run.battle.mana,3);g=apply(g,{type:'play',uid:'test2'});assert.equal(playerDefense(g.run),2);g=apply(g,{type:'end'});assert.equal(playerDefense(g.run),2);assert.equal(g.run.battle.block,0);
});
test('spell shield cancels one whole hostile skill, not an enemy healing spell',()=>{
 let g=fight();solo(g,'wisp');g.run.battle.spellShield=1;const hp=g.run.player.hp;g=apply(g,{type:'end'});assert.equal(g.run.player.hp,hp);assert.equal(g.run.battle.spellShield,0);assert.equal(g.run.battle.poison,0);
 let h=fight();solo(h,'monk');h.run.battle.spellShield=1;h=apply(h,{type:'end'});assert.equal(h.run.battle.spellShield,1);h=apply(h,{type:'end'});assert.equal(h.run.battle.spellShield,0);
});
test('poison death cancels queued actions and victory pays once',()=>{
 let g=fight();const e=solo(g);e.hp=1;e.poison=2;const hp=g.run.player.hp,gold=g.run.player.gold;g=apply(g,{type:'end'});assert.equal(g.run.phase,'reward');assert.equal(g.run.player.hp,hp);assert.ok(g.run.player.gold>gold);
 const paid=g.run.player.gold;assert.ok(act(g,{type:'end'}).error);g=apply(g,{type:'reward',id:g.run.reward.cards[0]});assert.equal(g.run.player.gold,paid);assert.equal(g.run.phase,'explore');assert.ok(act(g,{type:'reward'}).error);
});
test('thorns killing a multi-hit attacker stops its subsequent hits',()=>{
 let g=fight();const e=solo(g,'archer');e.hp=1;e.atk=4;g.run.battle.thorns=1;g=apply(g,{type:'end'});assert.equal(g.run.phase,'reward');assert.equal(g.run.player.hp,67);
});
test('shop transactions, upgrades and removal have one-use inventory',()=>{
 let g=fresh();g.run.player.x=1;g.run.player.y=1;g.run.player.gold=300;g=apply(g,{type:'interact'});const price=currentFloor(g.run).shop.cards[0].price,old=g.run.deck.length;
 g=apply(g,{type:'buy-card',index:0});assert.equal(g.run.deck.length,old+1);assert.equal(g.run.player.gold,300-price);assert.ok(act(g,{type:'buy-card',index:0}).error);
 g=apply(g,{type:'upgrade',uid:g.run.deck[0].uid});assert.equal(g.run.deck[0].level,1);assert.ok(act(g,{type:'upgrade',uid:g.run.deck[1].uid}).error);
 g=apply(g,{type:'remove',uid:g.run.deck[1].uid});assert.equal(g.run.deck.length,old);assert.ok(act(g,{type:'remove',uid:g.run.deck[2].uid}).error);assert.ok(restoreGame(JSON.stringify(g)));
});
test('rest is one-use; potion cannot be spent on a full meter',()=>{
 let g=fresh();g.run.player.x=7;g.run.player.y=7;g.run.player.hp=30;g=apply(g,{type:'interact'});g=apply(g,{type:'rest-heal'});assert.equal(g.run.player.hp,51);assert.ok(currentFloor(g.run).restUsed);g=apply(g,{type:'interact'});assert.equal(g.run.phase,'explore');
 let h=fresh();assert.ok(act(h,{type:'potion',kind:'heal'}).error);assert.equal(h.run.player.potions.heal,1);
});
test('completed floor banks coins once across backtracking, while camp unlock is permanent',()=>{
 let g=fresh();currentFloor(g.run).groups.forEach(group=>group.defeated=true);g.run.player.x=7;g.run.player.y=1;g=apply(g,{type:'ascend'});assert.equal(g.profile.gold,9);
 g=apply(g,{type:'descend'});g=apply(g,{type:'ascend'});assert.equal(g.profile.gold,9);
 g.profile.gold=50;g=apply(g,{type:'unlock',id:'triple'});const bank=g.profile.gold;assert.ok(g.profile.unlocked.includes('triple'));assert.ok(act(g,{type:'unlock',id:'triple'}).error);assert.equal(g.profile.gold,bank);
 g=apply(g,{type:'new-run',seed:55});assert.equal(g.profile.gold,bank);assert.ok(g.profile.unlocked.includes('triple'));
});
test('defeat clears run currencies and items but preserves bank, collection and unlocks',()=>{
 let g=fight();g.profile.gold=13;g.run.player.hp=1;g.run.battle.block=0;g=apply(g,{type:'end'});assert.equal(g.run.phase,'lost');assert.equal(g.run.player.gold,0);assert.deepEqual(g.run.player.keys,{yellow:0,blue:0});assert.deepEqual(g.run.player.potions,{heal:0,mana:0});assert.equal(g.profile.gold,13);assert.ok(g.profile.collection.slash);assert.ok(act(g,{type:'basic',target:'x'}).error);
});
test('final boss produces a single win and a one-time floor settlement',()=>{
 let g=fight();g.run.floor=12;g.run.floors[12]=structuredClone(g.run.floors[1]);g.run.floors[12].number=12;const seal=currentFloor(g.run).groups.find(group=>group.seal);g.run.battle.groupIds=[seal.id];g.run.battle.enemies.forEach(e=>{e.hp=1;e.poison=2;});g=apply(g,{type:'end'});assert.equal(g.run.phase,'won');assert.equal(g.profile.wins,1);assert.equal(g.profile.gold,20);assert.ok(act(g,{type:'end'}).error);
});
test('save restores exact positions, RNG, hand, mana and pending dice; corruption is rejected',()=>{
 let g=fight();g.run.explore.nextDice=3;g=apply(g,{type:'end'});const restored=restoreGame(JSON.stringify(g));assert.deepEqual(restored,g);
 const target=g.run.battle.enemies.find(e=>e.hp>0).uid;assert.deepEqual(act(g,{type:'basic',target}).state,act(restored,{type:'basic',target}).state);
 const bad=structuredClone(g);bad.run.battle.hand.push(bad.run.battle.hand[0]);assert.equal(restoreGame(bad),null);bad.run.battle.hand.pop();bad.run.explore.dice=[9];assert.equal(restoreGame(bad),null);assert.equal(restoreGame('{bad json'),null);
});
