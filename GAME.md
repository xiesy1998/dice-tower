# 骰契之塔 · Dicebound Tower v2

中文单人网页冒险：点击中央骰子，在方格高塔中收集钥匙、宝箱与药水；接近敌群后进入蓝量驱动的卡牌战斗。

## 游玩

公开部署目标：[骰契之塔](https://xiesy1998.github.io/dice-tower/)。部署以 GitHub Actions 和实际网页响应为准。

本地直接双击根目录 index.html 或 dist/index.html。无需安装 Node、Python 或任何运行依赖。

- 十二层、三类九乘九地图模板；第六与十二层首领。
- 六类共36张卡、8件遗物、一个固定基础属性和稳阵被动的角色。
- 默认中央单骰，点击才掷，点数决定最大移动范围。探索卡能调整总步数或预定下一次2/3颗骰子。
- 先点蓝色格预览路径，再确认移动。进入敌人上下左右一格时停步预览敌群；地图和手牌在手机上可横向滚动。
- 战斗每回合3蓝，抽5牌；选单目标牌后点敌人释放。普攻每轮一次不耗蓝。敌方意图始终公开，多名敌人独立结算。
- 击败楼梯守门人后走到上楼梯登层。钥匙、宝箱、篝火和商店不刷新，可返回旧层。
- 本局金币买牌、遗物、补给、删牌或强化。首次完成一层结算8＋层数金币到营地，用于解锁稀有牌的获取资格。
- 失败清空本局金币、钥匙和药水；解锁、收藏、记录和营地金币保留。新旅程重新建立本局角色、牌组与遗物。
- 自动保存骰点、坐标、随机状态、手牌、敌人、蓝量与商品状态。所有进度只在当前浏览器，不同域名/浏览器的存档独立。

键盘支持Tab/Enter操作按钮，地图方向键选格，1–5选择手牌，Esc取消选牌或关闭弹窗。声音默认关闭，尊重系统减少动态效果设置。

## 开发与检查

开发使用Node 18+，零第三方包依赖：

```
node build.mjs
node --test tests/engine.test.mjs tests/journey.test.mjs
node tests/simulate.mjs 12
node scripts/validate-project.mjs
```

build.mjs 从 template.html、style.css 与四个模块生成根目录和dist中内容相同的独立HTML。部署根目录index.html；.nojekyll使GitHub Pages按静态文件提供。

cards.mjs为卡牌/敌人/遗物数据，engine.mjs为确定性规则与存档校验，app.mjs为HTML界面，art.mjs为原创SVG。tests包含规则回归及完整探索战斗对局，scripts包含网页工作流适配检查。specs/dicebound-tower保存已批准规则、交互、契约和验收记录。

工作流参考为 .workflow/skills/game-ui-workflow/SKILL.md，上游来源与MIT许可保留在.workflow/。正式界面使用真实HTML、CSS和原创SVG，不需要PNG切图或引擎Atlas；未声称运行上游PNG校验器。

## 当前验证边界

自动对局验证规则连通、资源与保存一致性，不能证明真人平衡或游玩时长。参考浏览器验收及真机尚未验证内容见 specs/dicebound-tower/validation.md。无账号、支付、广告、远程统计或运行时外部请求。
