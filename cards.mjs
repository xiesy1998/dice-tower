export const CARD_TYPES = {
  step:{name:'点数',color:'#aa9669',icon:'arrow',phase:'explore'},
  dice:{name:'骰数',color:'#9d8ac0',icon:'dice',phase:'explore'},
  attack:{name:'攻势',color:'#bf715d',icon:'flame',phase:'battle'},
  defense:{name:'防御',color:'#659b8b',icon:'shield',phase:'battle'},
  skill:{name:'技能',color:'#7b9dbb',icon:'spark',phase:'battle'},
  weapon:{name:'武器',color:'#bd9559',icon:'sword',phase:'battle'}
};
export const CARDS = {
  stride:{name:'疾行',type:'step',icon:'arrow',effect:'stride',text:'选择增加 1–3 步，消耗相同准备额度。',upgrade:'探索牌不强化'},
  brake:{name:'蓄守',type:'step',icon:'shield',effect:'brake',text:'选择减少 1–3 步；每步为下一场战斗准备 2 格挡，最多 6。消耗相同额度。',upgrade:'探索牌不强化'},
  steady:{name:'稳步',type:'step',icon:'castle',effect:'steady',text:'将本次移动步数固定为 4。消耗 1 准备额度。',upgrade:'探索牌不强化'},
  lucky:{name:'六面契印',type:'step',icon:'star',effect:'lucky',text:'将本次移动步数固定为 6。消耗 2 准备额度。',upgrade:'探索牌不强化'},
  focuswalk:{name:'收势',type:'step',icon:'sword',effect:'focuswalk',text:'减少 1 步，下场战斗首回合攻击 +2，不叠加。消耗 1 额度。',upgrade:'探索牌不强化'},
  twin:{name:'双骰契约',type:'dice',icon:'copy',effect:'twin',text:'下一次探索改掷 2 颗骰子，点数相加。消耗 1 准备额度。',upgrade:'探索牌不强化'},
  triple:{name:'三重命运',type:'dice',icon:'dice',effect:'triple',text:'下一次探索改掷 3 颗骰子，点数相加。消耗 2 准备额度。',upgrade:'探索牌不强化',unlock:12},
  echo:{name:'琥珀回响',type:'dice',icon:'gem',effect:'echo',text:'下一次探索掷 2 颗骰子，每颗最低为 3。消耗 3 额度。',upgrade:'探索牌不强化',unlock:18},
  sharpen:{name:'磨砺',type:'attack',cost:1,target:'self',icon:'sword',effect:'sharpen',text:'本场攻击力 +1。',upgrade:'改为攻击力 +2'},
  fury:{name:'战意',type:'attack',cost:1,target:'self',icon:'flame',effect:'fury',text:'本回合攻击力 +4。',upgrade:'改为 +6'},
  weaken:{name:'威慑',type:'attack',cost:1,target:'enemy',icon:'eye',effect:'weaken',text:'目标本场攻击力 -2，最低为 1。',upgrade:'改为 -3'},
  roar:{name:'震慑',type:'attack',cost:2,target:'all',icon:'crown',effect:'roar',text:'所有敌人本场攻击力 -1，最低为 1。',upgrade:'改为 -2'},
  expose:{name:'洞悉破绽',type:'attack',cost:1,target:'enemy',icon:'eye',effect:'expose',text:'目标防御 -2，并抽 1 张牌。',upgrade:'防御改为 -4'},
  guard:{name:'守护',type:'defense',cost:1,target:'self',icon:'shield',effect:'guard',text:'获得 7 格挡，下回合开始清除。',upgrade:'改为 10 格挡'},
  bulwark:{name:'铁壁',type:'defense',cost:2,target:'self',icon:'castle',effect:'bulwark',text:'本场防御 +1。防御加成上限为 4。',upgrade:'改为 +2'},
  shatter:{name:'碎甲咒',type:'defense',cost:1,target:'enemy',icon:'axe',effect:'shatter',text:'目标本场防御 -3，最低为 0。',upgrade:'改为 -5'},
  barrier:{name:'法术屏障',type:'defense',cost:1,target:'self',icon:'gem',effect:'barrier',text:'获得 1 层法术护盾，抵挡下次敌方技能的伤害与负面效果。最多 1 层。',upgrade:'同时获得 3 格挡'},
  fortify:{name:'整备',type:'defense',cost:1,target:'self',icon:'heart',effect:'fortify',text:'获得 5 格挡，恢复 3 生命。消耗。',upgrade:'改为 8 格挡、5 生命',exhaust:true},
  riposte:{name:'荆棘甲',type:'defense',cost:2,target:'self',icon:'thorn',effect:'riposte',text:'本场荆棘 +2；被攻击扣血后反伤。',upgrade:'改为 +3'},
  fireball:{name:'火球',type:'skill',cost:1,target:'enemy',icon:'flame',effect:'fireball',text:'造成 10 法术伤害。',upgrade:'改为 14'},
  meteor:{name:'陨星',type:'skill',cost:3,target:'enemy',icon:'star',effect:'meteor',text:'造成 24 法术伤害。',upgrade:'改为 32',unlock:16},
  storm:{name:'雷暴',type:'skill',cost:2,target:'all',icon:'spark',effect:'storm',text:'对所有敌人造成 8 法术伤害。',upgrade:'改为 11'},
  poison:{name:'毒雾针',type:'skill',cost:1,target:'enemy',icon:'leaf',effect:'poison',text:'施加 4 中毒。敌方行动前触发，无视防御与格挡，之后减 1。',upgrade:'改为 6'},
  frost:{name:'霜缚',type:'skill',cost:1,target:'enemy',icon:'drop',effect:'frost',text:'造成 4 法术伤害，并施加 2 虚弱；每层削弱一次攻击 2 点。',upgrade:'伤害 7，虚弱 3'},
  insight:{name:'灵感',type:'skill',cost:1,target:'self',icon:'book',effect:'insight',text:'抽 2 张牌。',upgrade:'改为抽 3'},
  recall:{name:'回溯',type:'skill',cost:1,target:'discard',icon:'rotate',effect:'recall',text:'选择弃牌堆中一张其他牌回到手中。',upgrade:'同时抽 1 张牌'},
  bloodpact:{name:'血契',type:'skill',cost:0,target:'self',icon:'drop',effect:'bloodpact',text:'失去 4 生命，恢复 2 蓝。不能致死。消耗。',upgrade:'生命代价改为 2',exhaust:true,unlock:10},
  chain:{name:'连锁闪电',type:'skill',cost:2,target:'enemy',icon:'spark',effect:'chain',text:'目标受到 10 法术伤害，另一名敌人受到 5。',upgrade:'改为 14 与 7',unlock:14},
  leech:{name:'汲取',type:'skill',cost:2,target:'enemy',icon:'heart',effect:'leech',text:'造成 9 法术伤害，恢复 4 生命。消耗。',upgrade:'改为 13 伤害、6 生命',exhaust:true},
  embers:{name:'余烬仪式',type:'skill',cost:1,target:'all',icon:'flame',effect:'embers',text:'所有敌人获得 2 中毒。消耗。',upgrade:'改为 4',exhaust:true,unlock:12},
  slash:{name:'斩击',type:'weapon',cost:1,target:'enemy',icon:'sword',effect:'slash',power:2,text:'发动一次武器攻击：攻击力 +2。',upgrade:'武器威力改为 +5'},
  heavy:{name:'重斩',type:'weapon',cost:2,target:'enemy',icon:'axe',effect:'heavy',power:7,text:'发动一次重击：攻击力 +7。',upgrade:'威力改为 +12'},
  volley:{name:'连弩',type:'weapon',cost:1,target:'enemy',icon:'arrow',effect:'volley',power:0,hits:2,text:'连续攻击 2 次，每次等于攻击力，分别计算防御。',upgrade:'改为连续 3 次'},
  pierce:{name:'穿刺',type:'weapon',cost:1,target:'enemy',icon:'arrow',effect:'pierce',power:1,text:'造成攻击力 +1 的物理伤害，无视防御。',upgrade:'威力改为 +4'},
  sweep:{name:'横扫',type:'weapon',cost:2,target:'all',icon:'sword',effect:'sweep',power:0,text:'对每名敌人发动一次等于攻击力的武器攻击。',upgrade:'每次威力 +3',unlock:14},
  bash:{name:'盾击',type:'weapon',cost:1,target:'enemy',icon:'shield',effect:'bash',text:'造成攻击力 + 当前格挡的物理伤害，保留格挡。',upgrade:'威力额外 +4',unlock:10}
};
export const STARTER_DECK=['slash','slash','slash','guard','guard','guard','fireball','sharpen','weaken','insight'];
export const RELICS = {
 ember:{name:'炽火徽记',icon:'flame',text:'每场战斗首回合攻击力 +2。'},
 pouch:{name:'旅人药囊',icon:'heart',text:'每次战斗胜利后恢复 4 生命。'},
 coin:{name:'旧王钱币',icon:'coin',text:'战斗胜利额外获得 10 金币。'},
 amber:{name:'琥珀骰心',icon:'dice',text:'探索掷骰时，每颗骰子的结果最低为 2。'},
 crown:{name:'棘冠',icon:'thorn',text:'每场战斗开始获得 1 荆棘。'},
 feather:{name:'银羽',icon:'feather',text:'每层探索准备额度从 3 提高至 4。'},
 obsidian:{name:'黑曜石',icon:'gem',text:'每回合第一张武器牌的首段伤害 +2。'},
 branch:{name:'生命枝',icon:'leaf',text:'获得时生命上限 +12，并恢复 12 生命。'}
};
export const ENEMIES = {
 slime:{name:'苔石史莱姆',art:'slime',color:'#8cae83',hp:19,atk:4,def:0,pattern:[{type:'attack'},{type:'guard',value:5},{type:'attack',bonus:2}]},
 bandit:{name:'迷途盗贼',art:'rogue',color:'#c99175',hp:22,atk:5,def:0,pattern:[{type:'attack'},{type:'weak',value:1,skill:true},{type:'attack',bonus:2}]},
 sentinel:{name:'铜壳卫兵',art:'knight',color:'#c0a16b',hp:29,atk:6,def:2,pattern:[{type:'guard',value:7},{type:'attack'},{type:'attack',bonus:2}]},
 wisp:{name:'幽灯',art:'wisp',color:'#84c8c4',hp:17,atk:4,def:0,pattern:[{type:'magic',skill:true},{type:'poison',value:2,skill:true},{type:'attack'}]},
 spider:{name:'织毒蛛',art:'spider',color:'#b29acb',hp:23,atk:5,def:1,pattern:[{type:'poison',value:2,skill:true},{type:'attack'},{type:'guard',value:4}]},
 archer:{name:'契印射手',art:'rogue',color:'#b59a72',hp:24,atk:4,def:0,pattern:[{type:'multi',hits:2,skill:true},{type:'guard',value:4},{type:'attack',bonus:3}]},
 monk:{name:'失声修士',art:'mage',color:'#aaa2c7',hp:26,atk:5,def:1,pattern:[{type:'heal',value:5,skill:true},{type:'magic',skill:true},{type:'weak',value:2,skill:true}]},
 beast:{name:'裂牙兽',art:'beast',color:'#c08476',hp:32,atk:7,def:1,pattern:[{type:'attack'},{type:'guard',value:3},{type:'attack',bonus:4}]},
 gatekeeper:{name:'裂甲守卫',art:'boss',color:'#c9a25c',hp:68,atk:8,def:3,pattern:[{type:'guard',value:10},{type:'multi',hits:2,skill:true},{type:'attack',bonus:4}]},
 oracle:{name:'命运司祭',art:'oracle',color:'#b6a0d1',hp:106,atk:10,def:2,pattern:[{type:'magic',skill:true},{type:'poison',value:3,skill:true},{type:'guard',value:12},{type:'multi',hits:2,skill:true}]}
};
