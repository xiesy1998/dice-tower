# v2 设计决策与参考

用户方向：探索视角参考火焰纹章，独立卡牌战斗参考杀戮尖塔，钥匙/宝物/路线取舍参考魔塔。原创角色、牌名、文案和SVG；不复制参考游戏的画面或素材。

参考资料：
- Nintendo《Fire Emblem: Three Houses 101》：https://www.nintendo.com/au/news-and-articles/fire-emblem-three-houses-101/ ，用于移动范围、路径、敌人威胁的信息表达。
- Mega Crit官方Steam介绍：https://store.steampowered.com/app/646570/Slay_the_Spire/ ，用于卡组配合与构筑目标；具体规则采用本项目原创设计。
- game-ui-workflow：https://github.com/guiguiyan930-source/game-ui-design-workflow ，技能参考与MIT许可保存在.workflow/。

实际选择：探索与战斗分别计回合，下一次多骰不被战斗消耗；前两类牌独立于战斗牌堆，避免无用手牌。有限准备额度和巡逻避免无限等待刷备战。固定模板保证钥匙与楼梯可达，保留同层清理记录防止反复刷资源。

视觉：沿用用户此前委托验收的暗青石塔、黄铜主操作、羊皮纸卡牌。文字由真实HTML排版，使用系统字体；地图、角色、图标均为原生SVG/CSS。动画不影响规则结果，默认静音并支持减少动态效果。

证据边界：自动策略可通关只能证明规则连通和存在可行路线。真实难度、时长、卡组偏好及手机触控仍需真人试玩。
