# Delivery & Dependencies

## 运行与开发依赖

生成的报告在现代浏览器直接打开，不需要服务器、Python、Node、CDN 或网络。原生 HTML/CSS/SVG/JS；依赖 CSS custom properties、color-mix、ResizeObserver、原生 popover 等现代能力。当前实际视觉验证以 Chrome 为限；未承诺旧浏览器兼容。popover 不可用时，应为设置区提供普通 details 或固定面板降级，不能称已实测支持。

- `scripts/create_report.py`、`bundle_html.py`、`install_skill.py`：Python 3.9+ 标准库；实现使用 `Path.is_relative_to`。不需要 NumPy 或 SciPy。
- 仓库静态测试：Python 标准库；官方 skill-creator quick_validate 另需要 PyYAML，见开发依赖说明。
- 浏览器测试：Node 与 `package.json` 声明的 Playwright、axe；需已有浏览器或安装 Playwright 浏览器。测试中的 Pillow 拼图为可选 Python 开发依赖。
- v0.1.1 的可选执行辅助工具使用同一 Node/Playwright；不增加报告运行依赖。模式、调用方式和适用范围见 [execution modes](execution-modes.md)。文本读写显式 UTF-8，优先补丁；测试环境变量由调用者指定，不依赖本机绝对路径。
- 轻量执行工具沿用 Node 20+；现有完整回归锁定的 axe Playwright 包另要求 Node 22.12+。本轮实际使用 Node 24，不把较低版本视为已测环境。
- Rank 案例重新拟合：其 `data/simulate_and_fit.py` 另需 NumPy 和 SciPy。这是案例可选复现依赖，不属于 HTML 运行或通用 Skill 依赖。
- 图表库：通用 helper 使用原生 SVG；没有强制图表库。复杂任务可自行声明并验收库依赖，不能悄悄加载 CDN。

## 字体与许可

`assets/foundation/hallmark/fonts/` 含 Noto Sans SC / Noto Serif SC 的原有派生子集，改名 Hallmark Sans SC / Serif SC，SIL OFL 1.1；两份全文许可与来源/哈希清单随包保留。字体 CSS 内嵌 data URI，保证 file:// 离线使用；额外 WOFF2 用于复用。

子集只覆盖原报告约 627 字形，不是完整中文字库。新场景可能混用系统降级字形；应截图检查，必要时使用系统 Modern Sans 或基于许可字库重新按语料生成。当前仓库不提供完整自动字体子集管线。

仅在设备已安装时调用 Apple/Windows 字体族；未分发 Apple 专有字体。不把命名中的 Apple Classic 理解为 Apple 官方背书。仓库拟采用的再分发条款见 [LICENSE](../LICENSE)，为待权利人确认及建议法律审核的自定义草案；字体 OFL 独立有效，边界与来源风险见 [licensing review](../docs/licensing-review.md)。

## 多文件与单文件

多文件报告应一起携带 HTML、相对 `assets/`、数据/复现入口。以 `create_report.py` 输出为例，整个目录可移动，无工作区绝对路径。

```shell
python scripts/bundle_html.py /chosen/report/index.html --out /chosen/report/standalone.html
```

单文件工具内嵌本地 CSS/JS，保留原有 data URI 字体，并把随包 OFL 许可全文放入不可执行的 JSON 节点，保证单文件单独复制时许可不丢失。拒绝远程资源、未处理的 CSS imports 和普通相对字体/图片 URL；适用于本起步器。需要图片时先转 data URI 或保留多文件模式。它不是任意网站打包器。输出后必须重新浏览器验证；不要只因为链接已替换就声称离线通过。

报告的静态外部文献链接可以保留，由用户点击后访问；它们不是运行依赖。字体许可说明和必要数据来源不应在打包中丢失。

## 安装

将整个 `cadence` 目录放入用户选定的 skills 目录，或使用 `scripts/install_skill.py --skills-dir ...`。安装器显式要求目标目录、拒绝覆盖同名 Skill，忽略 Git、node_modules、临时产物；不更改全局配置，不触发发布。测试只安装到隔离临时目录。

安装后在支持本地 Skill 的 Agent 中重新加载技能列表，再调用 `$cadence`。本轮的发现测试是隔离目录扫描与入口解析，不等于对当前宿主新会话自动触发的端到端验证。
