# Cadence · v0.1.1

[![License: No Resale](https://img.shields.io/badge/License-No%20Resale-blue)](LICENSE)

Cadence — A design system for expressive analytical reports.

Structure with intention. Express with freedom.

示例使用独立构造的虚构冰激淋场景，仅用于演示设计与交互，详见 [Example Data](docs/example-data-policy.md)。

面向 Agent 的 HTML 分析报告设计 Skill：把现有分析结果整理为协调、舒适、精致且可复核的页面。保留通用五层规则与视觉资产，公开示例全部使用重新构造的虚构冰激淋场景；不是自动统计分析系统，也不是任意算法到报告的固定模板。

入口：[SKILL.md](SKILL.md) · [发布审计](release-audit.md) · [来源与成熟度盘点](references/inventory.md)。

Cadence Foundation 涵盖基础设计秩序与构图；Cadence Styles 涵盖主题、字体和表达型风格；Cadence Review 负责视觉验证。Hallmark Theme System 保留为内部视觉主题模块名称，Expressive Style Packs 保留为实验性表达模块。

## 五层架构

| 层 | 职责 | 按需参考 |
|---|---|---|
| 1 · Design DNA | 比例、秩序、密度、留白与平衡 | [design-dna](references/design-dna.md) |
| 2 · Composition Patterns | 按任务组织 Hero、综合面板、发现、证据和方法 | [patterns](references/composition-patterns.md) |
| 3 · Hallmark Visual System | 配色、排印、可选实验风格三轴 | [visual system](references/hallmark-visual-system.md) |
| 4 · Content & Data Presentation | 图表选择、信息预算、渐进披露和统计边界 | [content](references/content-and-data-presentation.md) |
| 5 · Visual Validation | 实际渲染、截图、数据/交互/溢出/降级检查 | [validation](references/visual-validation.md) |

`SKILL.md` 是简短入口，不要求 Agent 一次读取全部参考。资产可直接用于生成报告。已有 Apple HIG Skill 可补充交互与无障碍判断，但不是依赖。

## 安装

将整个目录以 `cadence` 为目录名复制到目标 Agent 支持的 skills 目录，或显式指定目标：

```shell
python scripts/install_skill.py --skills-dir /chosen/skills
```

例如在使用本地 Codex skills 的环境，可选 `$CODEX_HOME/skills`，未设置时通常为用户目录 `.codex/skills`。以实际客户端的 Skill 加载规则为准，安装后重新加载会话/技能列表。安装器拒绝覆盖已存在的同名目录，不修改全局配置。本轮只做隔离目录安装测试，没有自动安装到你的个人 skills 目录。

安装后可显式调用：

```text
使用 $cadence，把这份平均处理效应及置信区间整理成给业务读者看的 HTML 报告。
沿用已认可的构图秩序，选择合适的区间比较图，保留识别假设与因果边界。
```

```text
使用 $cadence，把虚构冰激淋口味和每周销量做成可离线打开的分析报告。
用 Forest Minimal + Humanist，关闭表达型风格；实际截图检查手机布局。
```

## 外观选择

- Base Theme：Apple Classic / Warm Editorial / Forest Minimal / Graphite。
- Typography：Modern Sans / Editorial / Humanist / Technical，或 Auto 使用主题推荐。
- Expressive Style：关闭 / Pixel / Cel Shaded / Sunset Retro / Newspaper Editorial。

默认 Classic + Auto + 风格关闭。三轴独立，手动字体不随主题或风格丢失；Sunset/Newspaper 只在 Auto 下推荐衬线标题，正文保持基础配置。四个 Style Pack 是**实验性**：已有单案例和本版迁移检查，不等于通用成熟或用户已经认可所有组合。

通用控制接口见 [components](references/components.md)。URL 示例 `?theme=forest-minimal&type=humanist&style=cel`。不强制推荐组合，切换表现不得改变统计内容。

## 组件、案例与轻量起步

通用资产在 `assets/`：原 Tokens/Themes/Typography/Style CSS、提取的 `report.css`、少量组件接线及独立三轴控制、原生 SVG 辅助。数值从输入读取，不含 Rank Logit 拟合或通用显著性逻辑。

```shell
python scripts/create_report.py --spec tests/fixtures/causal.json --out /chosen/new-report
python scripts/bundle_html.py /chosen/new-report/index.html --out /chosen/new-report/standalone.html
```

起步器只支持短区间比较、计数条形和短数值趋势；不必使用它，也不限制 Agent 实现其他合适图表。完整多文件目录或经验证的单文件均可离线打开。依赖、字体、打包边界见 [delivery-and-dependencies](references/delivery-and-dependencies.md)。

案例：

- [Golden 冰激淋销量示例](examples/golden-first.html)：虚构销量，单文件、无外部数据。
- [冰激淋试吃方案展示](examples/causal-inference/index.html) / [单文件](examples/causal-inference/standalone.html)：全新手工效应和区间，不是实际因果估计。
- [冰激淋口味排序](examples/rank-logit/index.html) / [基础版本](examples/rank-logit/stable-v3.html)：新种子独立生成并重新拟合的虚构数据；保留模型交互与展示功能。
- [冰激淋销量报告](examples/service-operations/index.html)：口味计数与四周销量，展示同一基底如何选择不同图表；目录名仅作为兼容入口。

## 开发、测试和视觉验收

生成报告默认 Standard，可指定 Quick / Deep；按数据 → 功能 → 视觉执行，默认最多两轮集中视觉修正，质量门槛通过即停止。详见 [执行模式](references/execution-modes.md)、[变更影响矩阵](validation/change-impact-matrix.md) 和 [Completion Gates](validation/completion-gates.md)。模式时间仅为软预算，不保证完成时长。

Python 标准库即可运行交付脚本。浏览器开发测试需要 Node 20+、Playwright/axe；实际测试的版本和浏览器写入验证记录。原生 SVG 不需要图表库；可选 NumPy/SciPy 仅用于重新拟合 Rank 案例。

```shell
npm install
npx playwright install chromium
npm test
```

`npm run test:execution` 运行小型执行机制测试；`npm test` 保留完整仓库维护回归，不是每生成一份报告都要运行的默认命令。v0.1.1 审计与结果见 [执行审计](docs/execution-audit.md) 和 [验证记录](docs/v0.1.1-validation.md)。

也可设置 `BROWSER_EXECUTABLE` 使用已有浏览器；可选 `NODE_PATH` 用于复用已装测试模块，路径由调用者提供，代码不含本机路径。Python 开发依赖在 `requirements-dev.txt`，其中 Pillow 仅用于拼图，PyYAML 用于外部 skill-creator 验证。

三个场景检查相对资产、数值与几何、主题/字体/风格、窄屏、方法展开、模拟字体降级、打印和离线运行；另检查隔离安装发现扫描和单文件打包。测试产物在 `tests/artifacts/`，选定真实截图与结果在 `validation/`。必须实际查看截图；没有浏览器时只可报告静态检查和待验项。

静态发现检查不能证明宿主 Agent 在新会话自动选择本 Skill；脚本驱动测试也不能证明任意分析任务下的自主决策能力。详见 [release-audit](release-audit.md)。

## 持续迭代

新增主题：从现有角色配置起步，保持几何、字体和数据坐标独立；补齐颜色/控件/图表角色，登记控制器枚举与 Auto 映射，做相同内容的对比度、窄屏和切换回归。

新增构图：先说明现有 A–E 为何不够，以真实阅读任务验证重心、首屏与密度；将成功关系写入 Layer 2，保留案例与截图，不直接增加所有报告的默认章节。

修改 Style Pack：保持实验性，测试关闭模式、正文隔离和统计几何；不要用强制主题绑定掩盖弱配对。所有更新应同步 VERSION、CHANGELOG、入口 metadata 和实际验证记录。

## License

**Free to use. Not for resale.**

Cadence is source-available and free for personal and commercial use.

You may use, modify, and share Cadence, including using it to create commercial reports and other deliverables.

Selling Cadence itself, or modified and repackaged versions of Cadence, as a paid software product requires prior written authorization from the copyright holder.

See [LICENSE](LICENSE) for the complete terms.

中文：允许个人与企业免费使用、学习、修改及内部商业使用，也允许为客户制作收费报告；免费分发原版或修改版须保留版权与许可声明。出售 Cadence 本身或其修改、改名、重新打包的收费软件版本，需要版权所有者事先书面授权。生成的报告不自动受软件禁止转售条款约束；第三方材料仍遵循其各自许可。

**Draft status:** Cadence Source-Available License 1.0 is a custom draft pending copyright holder confirmation and completion of the copyright notice; qualified legal review is recommended. 上述为拟采用的授权规则，尚未完成权利人确认或法律审核；不是 OSI 批准的开源许可。边界与第三方检查见 [licensing review](docs/licensing-review.md)。
