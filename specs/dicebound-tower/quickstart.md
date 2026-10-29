# v2 运行与发布说明

双击 index.html 即可游玩。正式部署也是该独立文件；源模板是template.html，修改模块后先运行node build.mjs。

开发检查：

```
node build.mjs
node --test tests/engine.test.mjs tests/journey.test.mjs
node scripts/validate-project.mjs
```

HTTP预览可用：`python -m http.server 5091 --bind 127.0.0.1 --directory dist`，访问 http://127.0.0.1:5091/ 。本地文件、localhost与正式域名具有独立存档。

用户已批准前期策划并委托助手验收视觉；在提出v2改动后又明确要求开始开发并自动提交本游戏。因此按最新规则回填文档并实现，不重复请求策划门禁。保留原暗青、黄铜、羊皮纸和原创SVG视觉契约。

网页以原生HTML/CSS/SVG实现，不制作PNG页面图、雪碧图、Atlas或引擎JSON。校验使用scripts/validate-project.mjs，仅声称网页适配验证。源技能与上游MIT许可保留在.workflow/。

发布目标：xiesy1998/dice-tower/main根目录，保留README。用户本次授权一次远程提交与上传；不创建本地提交、不建立长期自动提交任务、不修改其他项目。发布前完成测试和实际浏览器验收，之后检查Pages构建及真实公开页。

此版存档键为dicebound.game.v2，与旧版三骰规则存档隔离。回合、物品、解锁、钱包和随机状态统一保存；清理浏览器数据会失去本地存档。完整十二层时长和策略深度由真人试玩确定。
