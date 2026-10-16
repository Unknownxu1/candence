# Component Contract · 复用与适配

`assets/report.css` 提供报告的基础样式，含部分案例专用选择器；它是可复用样式底盘，不是完整通用组件框架。`assets/components.css` 补充轻量图表与表格接线。

表现语法见 [Visual Grammar](../foundation/visual-grammar.md)。可选 `assets/runtime/visual-grammar.js` 提供与数据渲染分离的标记适配；Pixel v2 仍使用现有风格状态，不要求复制 HTML，也不强制启用适配器。自定义图表不要同时由默认 `data-chart` renderer 接管。

优先复用：`.wrap` 单一阅读轴、`.composition-hero/.hero-heading`、`.insight-panel/.insight-result/.insight-evidence`、`.section-heading`、`.chart-surface`、`.table-scroll`、原生 `details/summary/.disclosure` 与 `.nav/.design-controls`。它们与 Pattern 的关系应保留，具体内容、章节数量和图形可变。

## 三轴控制

```js
HallmarkDesign.getState(); // {theme, type, style}
await HallmarkDesign.setState({theme: 'forest-minimal', style: 'cel'});
document.addEventListener('hallmark:designchange', () => renderYourCharts());
```

控制器在 head 加载，初始化经过枚举验证的 URL 状态，并于 DOM ready 绑定可选 `theme-picker/type-picker/style-picker/reset-design`。切换只发送绘制事件；调用方的月份、筛选、模型状态不得在事件中重置。截图等待 `document.documentElement.dataset.designReady === 'true'` 和 `document.fonts.ready`。

## 小型图表接口

`HallmarkCharts.render(svg, spec)` 提供三种展示辅助，不是完整图表库。趋势的 `x` 必须是有限、严格递增的数值；日历标签需由调用方映射，不能直接传月份字符串。验证与执行辅助工具见 [execution modes](execution-modes.md)。

- interval：`rows[{label,estimate,low,high}]`、显式 `domain`、`unit`、`intervalLabel`，可给 `reference`；不自动计算区间。
- bar：`rows[{label,value}]`、从 0 起的 `domain`、`unit`，保持输入顺序；不自动排序为“最优”。
- trend：严格递增 `rows[{x,value}]`；可给一致的 low/high 与明确区间类型。原样连点，不平滑/拟合/预测。

`id/title/kind/domain/unit/rows` 是必需字段，`precision` 控制显示位数（默认 1）。当前 helper 面向短标签、小量行/时点；长标签、多系列、复杂日期轴、密集数据、地图、热图等应按任务单独实现。不要为适配它而截断标签、删除点或改变统计对象。

原生 SVG 提供 title/desc；生成器同时提供数表，图/表来自同一个 JSON。纹理和形状由风格选择，不能编码额外变量。它们与原 Rank 专用引擎是两条明确的实现路径。

## 可选 JSON 起步器

```shell
python scripts/create_report.py --spec tests/fixtures/causal.json --out /chosen/new-report
```

输出 `index.html + source.json + assets/`；拒绝非空输出目录，防止覆盖。完整输入例子见 `tests/fixtures/causal.json` 与 `service-operations.json`。hero 指向一个已给图表行，不重复存储另一份关键数值；方法和限制由调用者提供。nature 必须声明 simulation/observed/estimated，不能把 unknown 默认成真实。

当前 Hero 摘要需引用一个区间或条形行；只有趋势数据时，应直接组合组件，暂不使用这个起步器。此起步器的 Hero、证据与方法只是可选起步，不能替代 Agent 的任务理解，也不能让所有报告都变成这份结构。框架外的新图表和内容布局直接按五层规则编辑 HTML/SVG。
