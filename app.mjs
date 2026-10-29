import { CARDS, CARD_TYPES, RELICS, ENEMIES } from './cards.mjs';
import { createGame, act, restoreGame, currentFloor, aliveEnemies, pathsFrom, movePath, canExploreCard, canPlay, playerAttack, playerDefense, enemyIntent, cardDescription } from './engine.mjs';
import { icon, creature, towerArt } from './art.mjs';

const app=document.querySelector('#app'),modal=document.querySelector('#modal'),toastElement=document.querySelector('#toast');
const SAVE_KEY='dicebound.game.v2',SOUND_KEY='dicebound.sound.v2';
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let game=createGame(),home=true,homeTab='journey',sound=false,selectedCell=null,selectedCard=null,selectedEnemy=null,amount=1,showDice=true,rolling=false,movement=null;
let returnFocus,toastTimer,audioContext,storageWarning=false,catalogType='all',catalogCost='all';
try{const raw=localStorage.getItem(SAVE_KEY);if(raw){const restored=restoreGame(raw);if(restored)game=restored;else storageWarning=true;}sound=localStorage.getItem(SOUND_KEY)==='true';}catch{storageWarning=true;}
function viewedRun(){return movement?.run||game.run;}
function isBusy(){return rolling||!!movement;}
function toast(message){clearTimeout(toastTimer);toastElement.textContent=message;toastElement.classList.add('visible');toastTimer=setTimeout(()=>toastElement.classList.remove('visible'),3400);}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(game));}catch{if(!storageWarning){storageWarning=true;toast('当前浏览器无法保存，请保持页面打开。');}}}
function soundFx(type){
 if(!sound)return;try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;audioContext||=new Audio();audioContext.resume();
  const oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),now=audioContext.currentTime,[start,end]={roll:[230,600],hit:[180,65],buff:[390,650],hurt:[120,60],choose:[420,530]}[type]||[420,530];
  oscillator.type=type==='hit'?'triangle':'sine';oscillator.frequency.setValueAtTime(start,now);oscillator.frequency.exponentialRampToValueAtTime(end,now+.13);gain.gain.setValueAtTime(.001,now);gain.gain.exponentialRampToValueAtTime(.05,now+.01);gain.gain.exponentialRampToValueAtTime(.001,now+.19);oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start();oscillator.stop(now+.2);
 }catch{}
}
function button(label,action,attributes='',style=''){return `<button class="btn ${style}" data-action="${action}" ${attributes}>${label}</button>`;}
function header(){return `<header class="topbar"><button class="brand" data-action="home" aria-label="返回骰契之塔首页"><span class="brand-mark">${icon('dice')}</span><span><strong>骰契之塔</strong><small>DICEBOUND TOWER</small></span></button><nav aria-label="游戏工具">${!home?`<button class="text-button" data-action="camp" aria-label="前往旅人营地" title="营地">${icon('castle')}<span class="desktop-label">营地</span></button>`:''}<button class="text-button" data-action="catalog" aria-label="查看卡牌图鉴" title="图鉴">${icon('book')}<span class="desktop-label">图鉴</span></button><button class="icon-button" data-action="sound" aria-label="${sound?'关闭声音':'开启声音'}" aria-pressed="${sound}">${icon(sound?'sound':'mute')}</button><button class="icon-button" data-action="help" aria-label="查看玩法说明">${icon('help')}</button></nav></header>`;}
function hud(r){const p=r.player;return `<section class="run-hud" aria-label="旅程状态"><div class="floor-name">第 ${String(r.floor).padStart(2,'0')} 层 <small>/ 十二层高塔</small></div><div class="hud-values"><span class="health" title="生命">${icon('heart')} ${p.hp}<small>/ ${p.maxHp}</small></span><span class="gold" title="本局冒险金币">${icon('coin')} ${p.gold}</span><span class="key yellow" title="黄钥匙">${icon('key')} ${p.keys.yellow}</span><span class="key blue" title="蓝钥匙">${icon('key')} ${p.keys.blue}</span><button class="hud-button" data-action="deck" aria-label="查看 ${r.deck.length} 张牌组">${icon('book')} ${r.deck.length}</button></div></section><div class="under-hud"><div class="relic-strip">${r.relics.length?r.relics.map(id=>`<button class="relic" data-action="relics" title="${escapeHtml(RELICS[id].name+'：'+RELICS[id].text)}" aria-label="${RELICS[id].name}">${icon(RELICS[id].icon)}</button>`).join(''):'<span class="muted small">稳阵 · 每场开战获得 4 格挡</span>'}</div><div class="potions"><button data-action="potion" data-kind="heal" title="恢复20生命" aria-label="治疗药水，剩余 ${p.potions.heal} 瓶" ${p.potions.heal<=0?'disabled':''}>${icon('potion')} ${p.potions.heal}</button><button data-action="potion" data-kind="mana" title="战斗中恢复2蓝" aria-label="回蓝药水，剩余 ${p.potions.mana} 瓶" ${p.potions.mana<=0||r.phase!=='battle'?'disabled':''}>${icon('drop')} ${p.potions.mana}</button></div></div>`;}
function routeProgress(r){return `<div class="route" aria-label="楼层进度">${Array.from({length:12},(_,i)=>`<span class="${i+1===r.floor?'current':i+1<r.floor?'past':''}" title="第 ${i+1} 层${[6,12].includes(i+1)?'首领':''}" ${i+1===r.floor?'aria-current="step"':''}>${[6,12].includes(i+1)?icon('crown'):i+1}</span>`).join('')}</div>`;}
function cardView(card,mode='display',r=viewedRun()){
 const d=CARDS[card.id],type=CARD_TYPES[d.type],isExplore=type.phase==='explore';
 const interactive=['hand','reward','upgrade','remove','recall'].includes(mode);
 let attrs='',check={ok:true};
 if(mode==='hand'){const target=selectedEnemy||aliveEnemies(r)[0]?.uid;check=canPlay(game,card.uid,target);attrs=`data-action="select-card" data-uid="${card.uid}" aria-disabled="${!check.ok}" title="${escapeHtml(check.reason||'选择这张牌')}"`;}
 if(mode==='reward')attrs=`data-action="reward" data-id="${card.id}"`;
 if(['upgrade','remove','recall'].includes(mode))attrs=`data-action="${mode}-confirm" data-uid="${card.uid}"`;
 return `<${interactive?'button':'article'} class="game-card type-${d.type} ${mode==='hand'&&!check.ok?'unavailable':''} ${selectedCard===card.uid&&mode==='hand'?'selected':''}" ${attrs}><div class="card-top"><span class="card-cost ${isExplore?'explore-cost':''}" title="${isExplore?'探索准备额度':'蓝耗'}">${isExplore?icon('dice'):d.cost}</span><h3>${d.name}${card.level?'<sup>＋</sup>':''}</h3></div><div class="card-art"><div class="card-orbit"></div>${icon(d.icon)}</div><div class="card-type">${type.name}卡 <span>${isExplore?'探索':'战斗'}</span></div><p class="card-description">${escapeHtml(cardDescription(card,r))}</p>${mode==='upgrade'?`<p class="upgrade-text">强化：${d.upgrade}</p>`:''}<div class="card-bottom"><span>${d.exhaust?'消耗 · 本场仅用一次':isExplore?'有限准备 · 改变路线':'骰契 · '+type.name}</span>${icon(card.level?'star':type.icon)}</div></${interactive?'button':'article'}>`;
}
function homeScreen(){
 if(homeTab==='camp')return campScreen();
 const r=game.run,active=r&&!['won','lost'].includes(r.phase);
 return `<main class="home screen-enter"><div class="home-copy"><p class="eyebrow">ONE DIE. A THOUSAND POSSIBILITIES.</p><h1>骰契之塔</h1><p class="home-sub">每一步，都在改写命运。</p><p class="home-description">掷出中央的命运骰，走进藏着宝物的古塔。<br>用钥匙选择道路，用卡牌突破敌阵。<br>十二层之上，最后的契约等你揭开。</p><div class="home-actions">${button(icon('dice')+(active?'继续旅程':'签订契约 · 开始'),active?'continue':'start','','primary')}${button(active?'开始新旅程':'如何游玩',active?'new':'help','','ghost')}</div>${active?`<p class="saved-note">已保存：第 ${r.floor} 层 · ${r.player.hp}/${r.player.maxHp} 生命</p>`:''}<div class="home-meta"><span>${icon('tower')} 十二层探索</span><span>${icon('book')} 36 种卡牌</span><span>${icon('sword')} 多敌人对决</span></div><button class="camp-link" data-action="camp">${icon('castle')} 营地解锁 <span>${icon('coin')} ${game.profile.gold}</span>${icon('chevron')}</button></div><div class="home-visual">${towerArt()}<span class="tower-caption">THE TOWER REMEMBERS</span></div></main><footer class="home-footer"><span>方格探索 · 卡组构筑 · 魔塔资源</span><span>${game.profile.bestFloor?`最高 ${game.profile.bestFloor} 层 · 通关 ${game.profile.wins} 次`:'中文单人冒险 · 手机与电脑即开即玩'}</span></footer>`;
}
function campScreen(){
 const locked=Object.entries(CARDS).filter(([,d])=>d.unlock);
 return `<main class="camp-screen screen-enter"><div class="section-title"><div><p class="eyebrow">THE CAMP BETWEEN JOURNEYS</p><h1>旅人的营地</h1><p>新的可能，会陪你走进下一段旅程。</p></div><div class="bank-balance">${icon('coin')} ${game.profile.gold}<small>已结算营地金币</small></div></div><div class="camp-note panel">${icon('spark')} 首次完成每层后，${'8＋楼层数'} 金币存入营地。失败保留营地金币、解锁和收藏；冒险钱包与钥匙重新开始。解锁后的卡会出现在商店和战后奖励中。</div><div class="catalog-grid">${locked.map(([id,d])=>`<section class="camp-offer">${cardView({id,level:0})}${button(game.profile.unlocked.includes(id)?'已解锁':`${icon('coin')} ${d.unlock} · 解锁`,'unlock',`data-id="${id}" ${game.profile.unlocked.includes(id)||game.profile.gold<d.unlock?'disabled':''}`,game.profile.unlocked.includes(id)?'ghost':'primary')}</section>`).join('')}</div><div class="center-actions">${button(game.run&&!['won','lost'].includes(game.run.phase)?'返回当前旅程':'返回首页',game.run&&!['won','lost'].includes(game.run.phase)?'continue':'home','','ghost')}</div></main>`;
}
function diceMarkup(value,large=false){const points={1:[5],2:[1,9],3:[1,5,9],4:[1,3,7,9],5:[1,3,5,7,9],6:[1,3,4,6,7,9]};return `<span class="die ${large?'large':''}">${points[value].map(n=>`<i style="grid-column:${(n-1)%3+1};grid-row:${Math.floor((n-1)/3)+1}"></i>`).join('')}</span>`;}
function tileContent(r,x,y){
 const f=currentFloor(r),p=r.player,group=f.groups.find(g=>!g.defeated&&g.x===x&&g.y===y),item=f.items.find(i=>!i.taken&&i.x===x&&i.y===y),tile=f.tiles[y][x];
 if(p.x===x&&p.y===y)return {html:creature('hero'),label:'契约旅人',cls:'hero'};
 if(group){const d=ENEMIES[group.kinds[0]];return {html:creature(d.art,d.color)+`<span class="enemy-count">${group.kinds.length}</span>`,label:`${group.name}，${group.kinds.length} 名敌人${group.patrol?'，巡逻中':''}`,cls:'monster '+(group.boss?'boss':'')};}
 if(tile==='#')return {html:'',label:'石墙',cls:'wall'};
 if(tile==='Y'||tile==='B')return {html:icon('key'),label:(tile==='Y'?'黄':'蓝')+'钥匙门',cls:'door '+(tile==='Y'?'yellow':'blue')};
 if(tile==='M')return {html:icon('coin'),label:'流浪商店',cls:'merchant'};
 if(tile==='R')return {html:icon('flame'),label:f.restUsed?'已使用的篝火':'旅人篝火',cls:'rest'};
 if(tile==='>'||tile==='<')return {html:icon('stairs'),label:tile==='>'?'上行楼梯':'下行楼梯',cls:'stairs'};
 if(item)return {html:icon({key:'key',chest:'chest',potion:'potion',gem:'gem'}[item.type]),label:{key:(item.color==='blue'?'蓝':'黄')+'钥匙',chest:item.locked?'蓝锁宝箱':'宝箱',potion:'治疗药水',gem:item.stat==='atk'?'攻击结晶':'生命结晶'}[item.type],cls:'loot '+(item.color||'')};
 return {html:'<span class="tile-dot"></span>',label:'地板',cls:'floor'};
}
function explorationCards(r){
 return `<div class="prep-title"><div><h3>探索手册</h3><p>点数改变路线，契约改变下一次掷骰。</p></div><span class="prep-charge">${currentFloor(r).charges}<small> 本层准备</small></span></div><label class="amount-control">加减步数 <select id="step-amount" aria-label="选择加减步数">${[1,2,3].map(n=>`<option value="${n}" ${amount===n?'selected':''}>${n} 步</option>`).join('')}</select></label><div class="explore-cards">${Object.entries(CARDS).filter(([id,d])=>CARD_TYPES[d.type].phase==='explore'&&game.profile.unlocked.includes(id)).map(([id,d])=>{const check=canExploreCard(game,id,amount);return `<button class="explore-card ${check.ok?'available':''}" data-action="explore-card" data-id="${id}" aria-disabled="${!check.ok}" title="${escapeHtml(check.reason||d.text)}"><span class="mini-symbol">${icon(d.icon)}</span><span><b>${d.name}</b><small>${escapeHtml(d.text)}</small></span></button>`;}).join('')}</div>`;
}
function mapScreen(r){
 const f=currentFloor(r),paths=r.explore.rolled?pathsFrom(r):new Map(),path=selectedCell&&r.explore.rolled?movePath(r,selectedCell.x,selectedCell.y):null;
 const pathKeys=new Set(path?.slice(1).map(p=>`${p.x},${p.y}`)||[]),selected=path?.at(-1),sealed=!f.groups.find(g=>g.seal).defeated;
 const activeDice=r.explore.rolled?r.explore.dice:Array.from({length:r.explore.nextDice},()=>1),overlay=(!r.explore.rolled||showDice||rolling)&&!movement;
 return `<main class="explore-layout"><section class="map-main"><div class="map-heading"><div><p class="eyebrow">THE ${r.floor===6||r.floor===12?'SEALED':'FORGOTTEN'} FLOOR</p><h2>${r.floor===12?'最后的契约':r.floor===6?'黄铜之誓':'石阶之间，另有道路'}</h2></div><span class="chip">探索 ${r.explore.turn}</span></div><div class="map-frame"><div class="map-scroll" aria-label="楼层地图，可横向滚动"><div class="map-grid" role="grid" aria-label="九乘九楼层棋盘">${f.tiles.map((row,y)=>row.map((tile,x)=>{const c=tileContent(r,x,y),key=`${x},${y}`,reachable=paths.has(key)&&pathKeys.size>=0;return `<button role="gridcell" class="map-tile ${c.cls} ${reachable?'reachable':''} ${pathKeys.has(key)?'path':''} ${selected?.x===x&&selected?.y===y?'destination':''}" data-action="tile" data-x="${x}" data-y="${y}" aria-label="${String.fromCharCode(65+x)}${y+1} ${c.label}${reachable?'，可到达':''}" tabindex="${r.player.x===x&&r.player.y===y?0:-1}" ${tile==='#'||!r.explore.rolled||isBusy()?'disabled':''}>${c.html}</button>`;}).join('')).join('')}</div></div>${overlay?`<div class="dice-overlay ${rolling?'rolling':''}"><p class="eyebrow">${rolling?'FATE IS IN MOTION':'THE DICE OF DESTINY'}</p><button class="central-dice" data-action="${r.explore.rolled?'hide-dice':'roll'}" aria-label="${r.explore.rolled?'收起骰子，选择移动位置':'点击中央骰子开始掷骰'}" ${rolling?'disabled':''}><span class="dice-group">${activeDice.map(v=>diceMarkup(v,true)).join('')}</span><strong>${rolling?'命运正在落定…':r.explore.rolled?`${r.explore.steps} 步 · 点击收起`:'点击掷出命运骰'}</strong></button><p>${r.explore.nextDice>1&&!r.explore.rolled?`下一次契约：${r.explore.nextDice} 颗骰子，点数相加`:'点数决定这次可以走多远'}</p></div>`:''}</div><div class="map-status"><button class="dice-summary" data-action="${r.explore.rolled?'show-dice':'roll'}" ${isBusy()?'disabled':''}>${icon('dice')} ${r.explore.rolled?`${r.explore.dice.join('＋')} · 可走 ${r.explore.steps} 步`:`${r.explore.nextDice} 颗骰子 · 点击掷骰`}</button><span>${icon(sealed?'key':'check')} ${sealed?'击败楼梯守门人解除封印':'楼梯封印已解除'}</span></div><div class="move-panel"><div><strong>${movement?'旅人正在逐格前进…':selected?`目的地 ${String.fromCharCode(65+selected.x)}${selected.y+1} · ${path.length-1} 步`:r.explore.rolled?'选择蓝色格子，预览移动路径':'先点击画面中央的骰子'}</strong><small>${selected&&r.explore.rolled?'遇到相邻敌群会停步；蓝锁宝箱需要钥匙。':'蓝色可达 · 金色路径 · 红色敌群 · 钥匙开启同色门'}</small></div>${button('确认移动 '+icon('chevron'),'move',`${!path||path.length<2||isBusy()?'disabled':''}`,'primary')}</div><div class="map-actions">${button(icon('book')+' 探索卡 · '+f.charges,'explore-menu','','ghost mobile-only')}${r.explore.rolled?button('原地待机','wait',isBusy()?'disabled':'','ghost'):''}${f.tiles[r.player.y][r.player.x]==='>'?button(sealed?'先击败守门人':'登上下一层','ascend',sealed?'disabled':'','primary'):''}${f.tiles[r.player.y][r.player.x]==='<'?button('返回上一层','descend','','ghost'):''}${['M','R'].includes(f.tiles[r.player.y][r.player.x])?button(f.tiles[r.player.y][r.player.x]==='M'?'查看商店':'查看篝火','interact','','ghost'):''}${f.items.some(i=>!i.taken&&i.x===r.player.x&&i.y===r.player.y)?button('拾取脚下物品','interact','','ghost'):''}</div><p class="map-footnote">${icon('eye')} 巡逻守卫会在探索回合结束后移动。手机可横向拖动地图查看完整楼层。</p></section><aside class="explore-sidebar"><section class="panel prep-panel">${explorationCards(r)}<p class="next-contract">${icon('dice')} 下次探索：${r.explore.nextDice} 颗${r.explore.nextMin>1?'，每颗最低 3':''} · 战备格挡 ${r.prep.block}</p></section><section class="panel journey-panel">${routeProgress(r)}<p class="eyebrow">THE JOURNEY SO FAR</p><ol class="log-list">${r.log.slice(-4).map(s=>`<li>${escapeHtml(s)}</li>`).join('')}</ol></section></aside></main>`;
}
function encounterScreen(r){
 const groups=currentFloor(r).groups.filter(g=>r.encounter.groupIds.includes(g.id));
 return `<main class="center-stage encounter-screen screen-enter"><p class="eyebrow">THE PATH IS GUARDED</p><h1>前方，契约的守卫</h1><p>你已进入敌群的一格邻域。准备好，再向前。</p><div class="encounter-enemies">${groups.flatMap(g=>g.kinds).map(kind=>{const e=ENEMIES[kind];return `<article>${creature(e.art,e.color)}<h3>${e.name}</h3></article>`;}).join('')}</div><div class="encounter-summary"><span class="chip">${groups.reduce((sum,g)=>sum+g.kinds.length,0)} 名敌人</span>${groups.some(g=>g.boss)?'<span class="chip gold">首领遭遇</span>':''}<span class="chip">攻击 ${r.player.atk} · 防御 ${r.player.def}</span></div><div class="center-actions">${button(icon('sword')+' 进入战斗','enter-battle','','primary')}${button('暂缓交战，调整路线','retreat','','ghost')}</div><p class="footnote">战斗不会消耗“下一探索回合”的骰数契约。</p></main>`;
}
function healthBar(value,max,label){return `<div class="health-track" role="progressbar" aria-label="${label}" aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${value}"><span style="width:${Math.max(0,value/max*100)}%"></span></div><span class="health-number">${value} / ${max}</span>`;}
function statusChips(entity){return `<div class="status-chips">${[['block','shield','格挡'],['poison','leaf','中毒'],['weak','eye','虚弱'],['spellShield','gem','法术护盾'],['thorns','thorn','荆棘'],['atkDown','sword','攻击降低'],['defDown','castle','防御降低']].filter(([key])=>entity[key]>0).map(([key,name,label])=>`<span class="status-chip" title="${label}">${icon(name)} ${entity[key]}<span class="visually-hidden">${label}</span></span>`).join('')}</div>`;}
function battleScreen(r){
 const b=r.battle,enemies=aliveEnemies(r);if(!enemies.some(e=>e.uid===selectedEnemy))selectedEnemy=enemies[0]?.uid;
 const picked=selectedCard&&r.deck.find(c=>c.uid===selectedCard),target=enemies.find(e=>e.uid===selectedEnemy);
 return `<main class="battle-screen"><div class="battle-heading"><div><p class="eyebrow">THE CONTRACT OF STEEL & SPELL</p><h2>${b.enemies.some(e=>['gatekeeper','oracle'].includes(e.kind))?'首领之战':'古塔遭遇'}</h2></div><div class="battle-round"><span class="chip">回合 ${b.turn}</span><span>${enemies.length} / ${b.enemies.length} 名敌人</span></div></div><section class="battle-arena" aria-label="战斗场景"><div class="hero-combatant"><div class="hero-portrait">${creature('hero')}</div><h3>契约旅人</h3><p class="combat-stats">${icon('sword')} ${playerAttack(r)} <span>${icon('castle')} ${playerDefense(r)}</span></p>${healthBar(r.player.hp,r.player.maxHp,'角色生命')}${statusChips(b)}</div><div class="arena-divider"><span>VS</span></div><div class="enemy-lineup ${b.enemies.length>3?'many-enemies':''}">${b.enemies.map(e=>{const d=ENEMIES[e.kind],intent=enemyIntent(r,e);return `<button class="enemy-combatant ${e.hp<=0?'defeated':''} ${selectedEnemy===e.uid?'targeted':''} ${picked&&e.hp>0?'valid-target':''}" data-action="enemy" data-id="${e.uid}" aria-label="${d.name}，生命 ${e.hp}/${e.maxHp}，${e.hp>0?'下回合'+intent.label:'已击败'}" aria-pressed="${selectedEnemy===e.uid}" ${e.hp<=0?'disabled':''}><span class="intent ${intent.skill?'spell-intent':''}">${icon(intent.skill?'spark':intent.type==='guard'?'shield':'sword')} ${e.hp<=0?'已击败':intent.label}</span>${creature(d.art,d.color)}<h3>${d.name}</h3><p class="enemy-defense">${icon('castle')} ${Math.max(0,e.def-e.defDown)} 防御</p>${healthBar(e.hp,e.maxHp,d.name+'生命')}${statusChips(e)}</button>`;}).join('')}</div></section><div class="battle-toolbar"><div class="mana-display" aria-label="蓝量 ${b.mana}/${b.maxMana}"><span>${icon('drop')}</span><strong>${b.mana}</strong><small>/ ${b.maxMana}<br>每轮恢复 3</small><div class="mana-dots">${Array.from({length:3},(_,i)=>`<i class="${i<b.mana?'full':''}"></i>`).join('')}</div></div><div class="target-guide">${picked?`<strong>已选择「${CARDS[picked.id].name}」</strong><span>点击一名敌人释放 · 确认前不扣蓝</span>`:`<strong>${target?'当前目标：'+ENEMIES[target.kind].name:'选择目标'}</strong><span>点击武器或技能牌，再点击敌人</span>`}${picked?'<button class="text-button" data-action="cancel-card">取消选牌</button>':''}</div><div class="turn-controls">${button(b.basicUsed?'本回合已普攻':`${icon('sword')} 普攻 · ${playerAttack(r)}`,'basic',`${b.basicUsed?'disabled':''} title="每回合一次，不耗蓝"`,'ghost')}${button('结束回合 '+icon('chevron'),'end','','primary')}</div></div><section class="hand-section" aria-label="战斗手牌"><div class="hand-heading"><strong>本回合手牌 <small>${b.hand.length} 张</small></strong><div><button class="text-button" data-action="pile" data-pile="draw">抽牌 ${b.draw.length}</button><button class="text-button" data-action="pile" data-pile="discard">弃牌 ${b.discard.length}</button><button class="text-button" data-action="pile" data-pile="exhaust">消耗 ${b.exhaust.length}</button></div></div><div class="hand">${b.hand.length?b.hand.map(id=>cardView(r.deck.find(c=>c.uid===id),'hand',r)).join(''):'<div class="empty-hand">手牌已用完。你仍可以普攻或使用药水，然后结束回合。</div>'}</div></section><details class="battle-log"><summary>战斗记录 <span>查看最近行动</span></summary><ol class="log-list">${r.log.slice(-8).map(s=>`<li>${escapeHtml(s)}</li>`).join('')}</ol></details></main>`;
}
function rewardScreen(r){const reward=r.reward;return `<main class="center-stage screen-enter"><div class="large-emblem">${icon('spark')}</div><p class="eyebrow">A VICTORY. A NEW POSSIBILITY.</p><h1>胜利之后，新的可能</h1><p>选择一张卡牌加入本局牌组，也可以保持精简。</p><div class="reward-summary"><span class="chip gold">${icon('coin')} +${reward.gold} 冒险金币</span>${reward.healed?`<span class="chip green">${icon('heart')} +${reward.healed} 生命</span>`:''}${reward.relic?`<button class="chip gold" data-action="relics">${icon(RELICS[reward.relic].icon)} ${RELICS[reward.relic].name}</button>`:''}</div><div class="reward-cards">${reward.cards.map(id=>cardView({id,level:0},'reward',r)).join('')}</div>${button('跳过，返回地图 '+icon('chevron'),'reward','','ghost')}<p class="footnote">选择会保存在当前浏览器。返回地图后，本次移动结束。</p></main>`;}
function shopScreen(r){
 const s=currentFloor(r).shop,p=r.player,removeCost=35+r.stats.removals*15;
 return `<main class="shop-screen screen-enter"><div class="section-title"><div><p class="eyebrow">THE WANDERING MERCHANT</p><h1>流浪商人的行囊</h1><p>“正确的一张牌，比满袋金币更珍贵。”</p></div>${button('返回地图 '+icon('chevron'),'leave','','primary')}</div><div class="shop-cards">${s.cards.map((offer,index)=>`<section>${cardView({id:offer.id,level:0},'display',r)}${button(offer.bought?'已售出':`${icon('coin')} ${offer.price} · ${p.gold<offer.price?'金币不足':'购买'}`,'buy-card',`data-index="${index}" ${offer.bought||p.gold<offer.price?'disabled':''}`,offer.bought?'ghost':'')}</section>`).join('')}</div><div class="shop-services">${s.relic.id?`<section class="panel"><div class="service-heading">${icon(RELICS[s.relic.id].icon)}<h3>${RELICS[s.relic.id].name}</h3></div><p>${RELICS[s.relic.id].text}</p>${button(s.relic.bought?'已售出':`${icon('coin')} 75 · ${p.gold<75?'金币不足':'购买遗物'}`,'buy-relic',s.relic.bought||p.gold<75||r.relics.includes(s.relic.id)?'disabled':'','ghost')}</section>`:''}<section class="panel"><h3>磨砺与取舍</h3><p>强化一张卡，或为关键组合精简牌组；本店各限一次。</p>${button(s.upgraded?'本店已强化':`${icon('coin')} 40 · 强化一张卡`,'upgrade-picker',`${s.upgraded||p.gold<40||r.deck.every(c=>c.level)?'disabled':''}`,'ghost')}${button(s.removed?'本店已精简':`${icon('coin')} ${removeCost} · 精简牌组`,'remove-picker',`${s.removed||p.gold<removeCost||r.deck.length<=1?'disabled':''}`,'ghost')}</section><section class="panel"><h3>路上的补给</h3><div class="supply-list">${[['heal','治疗药水',18,'potion'],['mana','回蓝药水',15,'drop'],['yellow','黄钥匙',15,'key'],['blue','蓝钥匙',25,'key']].map(([id,name,price,glyph])=>button(`${icon(glyph)} ${name}<small>${s.supplies[id]>=3?'售罄':price+' 金'}</small>`,'buy-supply',`data-kind="${id}" ${p.gold<price||s.supplies[id]>=3?'disabled':''}`,'ghost')).join('')}</div></section></div><p class="footnote">使用本局冒险金币。营地解锁使用已结算的营地金币。</p></main>`;
}
function restScreen(r){return `<main class="center-stage screen-enter"><div class="large-emblem">${icon('flame')}</div><p class="eyebrow">A MOMENT BY THE FIRE</p><h1>火光尚温，旅途仍长</h1><p>这一层的篝火，只能选择一项整备。</p><div class="rest-choices"><section class="panel">${icon('heart')}<h3>歇一歇，养精蓄锐</h3><p>恢复最大生命的 30%。当前可恢复 ${Math.min(Math.ceil(r.player.maxHp*.3),r.player.maxHp-r.player.hp)} 生命。</p>${button(r.player.hp===r.player.maxHp?'生命已满':'恢复生命','rest-heal',r.player.hp===r.player.maxHp?'disabled':'','primary')}</section><section class="panel">${icon('spark')}<h3>磨砺一张卡牌</h3><p>选择一张未强化卡，本局永久强化。每张卡最多强化一次。</p>${button('选择要强化的牌','upgrade-picker',r.deck.every(c=>c.level)?'disabled':'','ghost')}</section></div>${button('暂不整备，返回地图','leave','','ghost')}</main>`;}
function resultScreen(r){const won=r.phase==='won';return `<main class="center-stage result-screen screen-enter"><div class="large-emblem">${icon(won?'crown':'feather')}</div><p class="eyebrow">${won?'THE CONTRACT IS REWRITTEN':'EVERY ENDING IS A BEGINNING'}</p><h1>${won?'塔顶之上，命运由你书写':'这一次，先到这里'}</h1><p class="event-story">${won?'最后一道契印悄然碎裂。你收起骰子，走进清晨的光。':'营地的灯还亮着。带上这一次学会的东西，再次走进高塔。'}</p><div class="result-stats">${[[r.floor+'/12','到达楼层'],[r.stats.kills,'击败敌人'],[r.stats.rounds,'战斗回合'],[r.stats.banked,'已存营地金币']].map(([value,label])=>`<div><strong>${value}</strong><small>${label}</small></div>`).join('')}</div><div class="center-actions">${button('再次签订契约','new','','primary')}${button('前往营地解锁','camp','','ghost')}${button('回顾本局牌组','deck','','ghost')}</div><p class="footnote">${won?'已记录通关。':'本局金币、钥匙和药水已清空。'}解锁、收藏和已结算营地金币保留。</p></main>`;}
function render(){
 const active=document.activeElement,focus=active?.closest?.('[data-action]'),focusData=focus&&app.contains(focus)?{...focus.dataset}:null;
 const previousScroll=[...app.querySelectorAll('.map-scroll,.hand')].map(e=>({className:e.className,left:e.scrollLeft}));
 const r=viewedRun();let content=home||!r?homeScreen():({explore:mapScreen,encounter:encounterScreen,battle:battleScreen,reward:rewardScreen,shop:shopScreen,rest:restScreen,won:resultScreen,lost:resultScreen})[r.phase](r);
 app.innerHTML=`<div class="app-shell ${!home&&r?.phase==='battle'?'wide-shell':''}">${header()}${!home&&r?hud(r):''}${content}</div>`;
 for(const pos of previousScroll){const element=app.getElementsByClassName(pos.className)[0];if(element)element.scrollLeft=pos.left;}
 if(focusData){const target=[...app.querySelectorAll('[data-action]:not(:disabled)')].find(e=>Object.entries(focusData).every(([key,value])=>e.dataset[key]===value));
  (target||app.querySelector('.central-dice:not(:disabled), [data-action="tile"][tabindex="0"]:not(:disabled), main button:not(:disabled):not([aria-disabled="true"])'))?.focus({preventScroll:true});}
}
function closeModal(){if(!modal.open)return;modal.close();if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});else app.querySelector('[data-action="help"]')?.focus({preventScroll:true});}
function showModal(title,body){if(!modal.open)returnFocus=document.activeElement;modal.innerHTML=`<div class="modal-header"><h2 id="modal-title">${title}</h2><button class="icon-button" data-action="close" aria-label="关闭弹窗">${icon('close')}</button></div><div class="modal-body">${body}</div>`;if(!modal.open)modal.showModal();modal.querySelector('button')?.focus();}
function showHelp(){showModal('一份登塔指南',`<ol class="help-steps"><li><strong>地图探索：点中央骰子，再选落点</strong>默认一颗骰子，点数决定最多能走几格。先点蓝格预览路径，再确认移动。不能穿墙或敌人。</li><li><strong>点数卡与骰数卡</strong>点数卡调整本次总步数。骰数卡影响下一次探索投掷，战斗回合不会消耗它。探索卡使用本层有限准备额度。</li><li><strong>遇到敌群，进入卡牌战斗</strong>上下左右一格相邻会停步并显示交战预览。每场可同时面对多名敌人，各自有提前公开的行动意图。</li><li><strong>蓝量控制出牌</strong>角色攻击6、防御1，开战3蓝和4格挡。点击目标牌，再点敌人。自用或群体牌点按即释放。每轮结束、敌人行动后回复3蓝，最多3。</li><li><strong>三种防护</strong>防御减物理伤害，临时格挡吸收伤害后消耗；下回合开始格挡清空。法术护盾抵挡一次敌方技能行动及其负面效果，最多1层。中毒无视格挡。</li><li><strong>资源与成长</strong>钥匙开同色门和蓝锁宝箱。怪物、宝箱不刷新。守门人被击败后，走到楼梯登层。首次完成楼层会将固定金币存入营地。</li><li><strong>失败与存档</strong>自动保存当前骰点、坐标、手牌、随机状态与购买记录。失败清空本局资源，保留解锁、收藏和营地金币。所有进度保存在当前浏览器。</li></ol><p>物理攻击先减防御（至少1），再扣格挡（可降至0）。法术不吃物理攻击力，也不受防御减伤。普通属性增益本场有效，战意等明确标注的增益仅本回合。</p><p>键盘：按钮支持 Tab / Enter；棋盘用方向键选格；1–5 选择手牌；Esc 取消选牌或关闭弹窗。声音默认关闭。</p>${button('查看全部36种卡牌','catalog','','ghost')}`);}
function catalogBody(){const ids=Object.keys(CARDS).filter(id=>(catalogType==='all'||CARDS[id].type===catalogType)&&(catalogCost==='all'||String(CARDS[id].cost)===catalogCost));return `<div class="catalog-filters"><label>类型 <select id="catalog-type">${[['all','全部六类'],...Object.entries(CARD_TYPES).map(([id,d])=>[id,d.name+'卡'])].map(([id,name])=>`<option value="${id}" ${catalogType===id?'selected':''}>${name}</option>`).join('')}</select></label><label>蓝耗 <select id="catalog-cost">${['all','0','1','2','3'].map(id=>`<option value="${id}" ${catalogCost===id?'selected':''}>${id==='all'?'全部':id+' 蓝'}</option>`).join('')}</select></label></div><p class="muted">${ids.length} 种 · 金色标记代表已经解锁；收藏记录获得次数。</p><div class="catalog-grid">${ids.map(id=>`<section>${cardView({id,level:0})}<p class="collection-label">${game.profile.unlocked.includes(id)?'已解锁':'营地可解锁'} · 收藏 ${game.profile.collection[id]||0}</p></section>`).join('')}</div>`;}
function showCatalog(){showModal('命运的三十六种写法',catalogBody());}
function showDeck(mode='display'){
 const r=game.run;if(!r){showCatalog();return;}
 const cards=mode==='upgrade'?r.deck.filter(c=>!c.level):mode==='recall'?r.battle.discard.map(uid=>r.deck.find(c=>c.uid===uid)).filter(c=>c.id!=='recall'):r.deck;
 const title={display:`本局牌组 · ${r.deck.length} 张`,upgrade:'选择一张卡牌强化',remove:'选择一张卡牌移除',recall:'选择一张弃牌回到手中'}[mode];
 const note=mode==='upgrade'?'点击卡牌确认强化。强化效果显示在下方。':mode==='remove'?`点击卡牌确认移除，支付 ${35+r.stats.removals*15} 冒险金币。`:'战斗牌抽取与弃置，探索牌在地图的探索手册里使用。';
 showModal(title,`<p>${note}</p><div class="catalog-grid">${cards.map(c=>cardView(c,mode,r)).join('')}</div>`);
}
function showRelics(){showModal('本局遗物契约',`<div class="relic-list">${game.run?.relics.length?game.run.relics.map(id=>`<section>${icon(RELICS[id].icon)}<div><h3>${RELICS[id].name}</h3><p>${RELICS[id].text}</p></div></section>`).join(''):'<p>精英与首领会掉落遗物，流浪商人也会出售一件。</p>'}</div>`);}
function perform(action){
 if(isBusy())return;
 const before=game.run?.phase,oldRun=game.run,path=action.type==='move'?movePath(oldRun,action.x,action.y):null;
 const result=act(game,action);if(result.error){toast(result.error);return false;}game=result.state;save();selectedCell=null;
 if(action.type==='new-run'){home=false;homeTab='journey';selectedEnemy=null;selectedCard=null;showDice=true;}
 if(action.type==='roll'){
  rolling=true;showDice=true;render();soundFx('roll');
  setTimeout(()=>{rolling=false;showDice=false;render();},window.matchMedia('(prefers-reduced-motion: reduce)').matches?120:900);return true;
 }
 if(action.type==='move'&&path?.length>1&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  const stop=path.findIndex(p=>p.x===game.run.player.x&&p.y===game.run.player.y),travel=path.slice(0,stop+1);movement={run:structuredClone(oldRun),path:travel,index:0};showDice=false;
  const step=()=>{if(!movement)return;movement.index++;if(movement.index>=travel.length){movement=null;render();if(game.run.phase!==before)window.scrollTo({top:0,behavior:'instant'});soundFx('choose');return;}
   const point=travel[movement.index];movement.run.player.x=point.x;movement.run.player.y=point.y;render();setTimeout(step,Math.max(45,Math.min(100,900/travel.length)));};render();setTimeout(step,60);return true;
 }
 selectedCard=null;if(game.run?.battle&&!aliveEnemies(game.run).some(e=>e.uid===selectedEnemy))selectedEnemy=aliveEnemies(game.run)[0]?.uid;
 render();if(game.run?.phase!==before){window.scrollTo({top:0,behavior:'instant'});soundFx('choose');}
 else{
  const fx=game.run?.feedback;if(fx&&fx.serial!==oldRun?.feedback?.serial){soundFx(fx.type);const scene=app.querySelector('.battle-arena');if(scene){scene.classList.add('effect-'+fx.type);if(fx.value){const hit=document.createElement('span');hit.className='damage-float';hit.textContent='−'+fx.value;(fx.target?scene.querySelector(`[data-id="${CSS.escape(fx.target)}"]`):scene.querySelector('.hero-combatant'))?.append(hit);setTimeout(()=>hit.remove(),800);}}}
 }
 return true;
}
function startRun(){let seed;try{seed=crypto.getRandomValues(new Uint32Array(1))[0];}catch{seed=Date.now();}closeModal();perform({type:'new-run',seed});}
function pickCell(x,y){
 const r=game.run;if(r?.phase!=='explore'||!r.explore.rolled||isBusy())return;
 const path=movePath(r,x,y);if(!path){toast('这个格子超出移动范围，或被墙壁、敌人、锁门阻挡。');return;}
 selectedCell={x,y};showDice=false;render();
}
function onAction(element){
 const action=element.dataset.action;if(isBusy()&&!['close','help','home','sound'].includes(action)){toast('请等当前动作结束。');return;}
 const r=game.run;
 switch(action){
  case 'home':home=true;homeTab='journey';selectedCard=null;render();window.scrollTo({top:0,behavior:'instant'});break;
  case 'camp':home=true;homeTab='camp';render();window.scrollTo({top:0,behavior:'instant'});break;
  case 'continue':home=false;selectedCard=null;showDice=!!r?.explore.rolled;render();window.scrollTo({top:0,behavior:'instant'});break;
  case 'start':startRun();break;
  case 'new':if(r&&!['won','lost'].includes(r.phase))showModal('重新签订契约？',`<p>当前旅程会结束，本局资源重新开始。营地金币、解锁和收藏保留。</p><div class="center-actions">${button('开始新旅程','start','','primary')}${button('继续当前旅程','close','','ghost')}</div>`);else startRun();break;
  case 'close':closeModal();break;
  case 'help':showHelp();break;
  case 'catalog':showCatalog();break;
  case 'deck':showDeck();break;
  case 'relics':showRelics();break;
  case 'sound':sound=!sound;try{localStorage.setItem(SOUND_KEY,String(sound));}catch{}render();soundFx('choose');toast(sound?'声音已开启':'声音已关闭');break;
  case 'roll':perform({type:'roll'});break;
  case 'show-dice':showDice=true;render();break;
  case 'hide-dice':showDice=false;render();break;
  case 'tile':pickCell(Number(element.dataset.x),Number(element.dataset.y));break;
  case 'move':if(selectedCell)perform({type:'move',...selectedCell});break;
  case 'explore-menu':showModal('探索手册',explorationCards(r));break;
  case 'explore-card':if(modal.open)closeModal();perform({type:'explore-card',id:element.dataset.id,amount});break;
  case 'wait':case 'enter-battle':case 'retreat':case 'ascend':case 'descend':case 'interact':case 'leave':case 'end':case 'buy-relic':case 'rest-heal':perform({type:action});break;
  case 'enemy':
   selectedEnemy=element.dataset.id;if(selectedCard){const card=r.deck.find(c=>c.uid===selectedCard);if(CARDS[card.id].target==='enemy')perform({type:'play',uid:selectedCard,target:selectedEnemy});else render();}else render();break;
  case 'select-card':{
   const card=r.deck.find(c=>c.uid===element.dataset.uid),d=CARDS[card.id],check=canPlay(game,card.uid,selectedEnemy||aliveEnemies(r)[0]?.uid);
   if(!check.ok){toast(check.reason);return;}
   selectedCard=card.uid;
   if(d.target==='enemy')render();else if(d.target==='discard')showDeck('recall');else perform({type:'play',uid:card.uid});break;
  }
  case 'cancel-card':selectedCard=null;render();break;
  case 'basic':perform({type:'basic',target:selectedEnemy||aliveEnemies(r)[0]?.uid});break;
  case 'reward':perform({type:'reward',id:element.dataset.id||null});break;
  case 'unlock':perform({type:'unlock',id:element.dataset.id});break;
  case 'buy-card':perform({type:'buy-card',index:Number(element.dataset.index)});break;
  case 'buy-supply':perform({type:'buy-supply',kind:element.dataset.kind});break;
  case 'upgrade-picker':showDeck('upgrade');break;
  case 'remove-picker':showDeck('remove');break;
  case 'upgrade-confirm':closeModal();perform({type:'upgrade',uid:element.dataset.uid});break;
  case 'remove-confirm':closeModal();perform({type:'remove',uid:element.dataset.uid});break;
  case 'recall-confirm':{const chosen=selectedCard;closeModal();perform({type:'play',uid:chosen,discardUid:element.dataset.uid});break;}
  case 'potion':perform({type:'potion',kind:element.dataset.kind});break;
  case 'pile':{const pile=element.dataset.pile;showModal({draw:'抽牌堆 · 顺序隐藏',discard:'弃牌堆',exhaust:'消耗堆 · 本场不再抽到'}[pile],`<div class="catalog-grid">${r.battle[pile].map(uid=>r.deck.find(c=>c.uid===uid)).sort((a,b)=>a.id.localeCompare(b.id)).map(c=>cardView(c,'display',r)).join('')||'<p>这里暂时没有牌。</p>'}</div>`);break;}
 }
}
document.addEventListener('click',event=>{const element=event.target.closest?.('button[data-action]');if(element&&!element.disabled)onAction(element);});
document.addEventListener('change',event=>{
 if(event.target.id==='step-amount'){amount=Number(event.target.value);if(modal.open){modal.querySelector('.modal-body').innerHTML=explorationCards(game.run);modal.querySelector('#step-amount')?.focus();}else render();}
 if(event.target.id==='catalog-type'||event.target.id==='catalog-cost'){
  catalogType=modal.querySelector('#catalog-type').value;catalogCost=modal.querySelector('#catalog-cost').value;const focusedId=event.target.id;modal.querySelector('.modal-body').innerHTML=catalogBody();modal.querySelector('#'+focusedId)?.focus();
 }
});
modal.addEventListener('cancel',event=>{event.preventDefault();closeModal();});
modal.addEventListener('click',event=>{if(event.target===modal){const rect=modal.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeModal();}});
document.addEventListener('keydown',event=>{
 if(modal.open||home||isBusy()||event.ctrlKey||event.altKey||event.metaKey||event.repeat||['INPUT','SELECT','TEXTAREA'].includes(event.target.tagName))return;
 const r=game.run;if(!r)return;
 if(event.key==='Escape'){selectedCard=null;selectedCell=null;render();return;}
 if(r.phase==='battle'&&/^[1-5]$/.test(event.key)){const id=r.battle.hand[Number(event.key)-1],element=id&&app.querySelector(`[data-action="select-card"][data-uid="${id}"]`);if(element){event.preventDefault();onAction(element);}}
 if(r.phase==='explore'&&r.explore.rolled&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
  event.preventDefault();const point=selectedCell||r.player,[dx,dy]={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key],x=point.x+dx,y=point.y+dy;
  if(movePath(r,x,y)){pickCell(x,y);app.querySelector(`[data-action="tile"][data-x="${x}"][data-y="${y}"]`)?.focus({preventScroll:true});}
 }
});
render();if(storageWarning)setTimeout(()=>toast('存档无法读取或保存；你仍可开始新旅程。'),400);
