# Execution Modes · v0.1.1

默认 Standard，用户可覆盖。软时间预算仅用于计划和复盘；没有可靠计时不宣称精确限时，超时本身不等于失败或通过。优先限制读取范围、验证批次和修正轮次。

| 模式 | 默认范围 | 软预算 |
|---|---|---|
| Quick | 已有数据、简单报告或局部修改；必要 A、一次 B、一个相关视口/区域截图与看图；不做全套视觉回归 | 5–10 分钟 |
| Standard | 完整报告；A→B→C，桌面和窄屏覆盖首屏/关键图表/主表格及必要交互，只检查实际启用的主题/风格 | 15–30 分钟 |
| Deep | 重要发布或系统兼容变更；明确追加主题、设备、打印、无障碍或更多数据校验；不是默认“运行仓库一切” | 45–60 分钟或用户约定 |

开始时记录模式、数据核验入口、必要功能、目标视口和产物路径。一个初始验收批次后最多两轮集中视觉修正（Deep 也默认遵守，用户可明确增加）；每轮将缺陷、影响范围和复验项一并记录。工具故障的修理单独记录，也应有边界，不可无限重试。未知改动按较保守的范围处理。

新报告读 Layer 4、2、1 和需要的 Layer 3；仅修 CSS 时不重读所有统计/构图规范。不要读取全部主题 CSS、字体或实验包来决定默认外观。正文/数据/统计解释变化可能影响 A，不能仅凭“改文案”跳过。明确的数据口径、值与结论追溯要求不因模式变小而取消。

验证与停止分别见 [Layer 5](visual-validation.md)、[影响矩阵](../validation/change-impact-matrix.md)、[质量门槛](../validation/completion-gates.md)。审计依据见 [execution audit](../docs/execution-audit.md)，实际结果见 [v0.1.1 validation](../docs/v0.1.1-validation.md)。

## 可选轻量执行工具

依赖已有 Playwright / Node，不新增编排依赖。报告不依赖这些工具运行。

- [browser-review.cjs](../scripts/browser-review.cjs)：有界等待字体/图表稳定、可见数据标记检查、显式 popover 状态、元素截图，避免自算越界裁剪。其禁动画和平滑滚动仅作用于测试页，不改源 HTML；动画体验需另测。
- [review-report.cjs](../scripts/review-report.cjs)：`review(options)` 按 A→B→C 执行并返回状态、跳过原因、截图及四个门槛；`completeReview(result, decision, options)` 在实际看图后核对当前文件与截图哈希再确认。不是通用统计估计器、自动审美裁判或独立 Agent 行为约束器。
- [execution.cjs](../tests/execution.cjs)：可运行的小夹具，包括局部 CSS、受控图表异常、完整新报告和终止机制。用法：`npm run test:execution`。只在被忽略的 `tests/artifacts/` 生成虚构测试材料。

`review` 必须提供：`page`、`output`、`dataInputs`、`watchFiles`、`checkData`、`charts`。路径由调用者解析为绝对路径，仓库不写死本机路径。`watchFiles` 应包含报告的全部 CSS、JS 和传递依赖；`dataInputs` 应包含原数据、计算脚本、口径/断言及其依赖。`checkData` 必须真实执行任务相关核验，成功返回 `{passed:true, checks:[具体检查名称]}`；一般 JSON 格式正确不等于指标正确。`checkFunctional(page, helpers)` 实现读数/绑定、关键交互和导出等任务相关断言。SVG 图表需声明真实数据 mark 选择器，不能只匹配轴、图例或装饰；Canvas/WebGL 要写任务适配检查，本工具不自动覆盖。

```javascript
const {review, completeReview}=require('/path/to/cadence/scripts/review-report.cjs');
const options={
  page: htmlPath, output: evidenceDirectory,
  dataInputs: [sourcePath, calculationScript], watchFiles: allReportAssets,
  checkData: verifyThisReportsMetrics,
  checkFunctional: verifyThisReportsReadoutsAndControls,
  charts: [{selector:'#main-chart', marks:'.data-point', minMarks:4}],
  ready: ()=>document.documentElement.dataset.reportReady==='true'
  // mode 默认 standard；局部修改显式 change 和 visualTargets。
};
const result=await review(options);
// 保存 result；实际打开它的截图，记录缺陷后再调用，不可伪造看图。
const final=completeReview(result, {
  reviewedFiles: result.screenshots.map(s=>s.file),
  note: '实际检查的内容与观察', defects: []
}, options);
// final.stop 为 true 后即交付，不再自动跑下一轮。
```

示例变量由调用者准备；这是库 API，不是可直接粘贴运行的 CLI。可用 [测试夹具](../tests/execution.cjs) 中的 `reportOptions()` 作可执行接口示例，不能把其冰激淋校验逻辑用于其他分析任务。

### 缓存与修订约定

`previous` 接受上次结果（可由调用者保存为 JSON）。CSS 颜色/布局、主题或交互变更只有在 A 已通过且数据指纹一致时才复用 A。指纹包括声明的数据依赖、去除 inline style 的页面、直接引用 JS、检查函数和 `dataCheckId`；原始数据、计算、静态文案或图表 JS 变化默认重跑相关 A。源码与绑定不明、远程 JS 或未声明依赖时应补齐依赖或重新核验，不推定缓存可信。工具不重跑数据生成器；生成与验证分开。

有变化且范围是局部时提供 `visualTargets:[{name,width,height,selector}]`；缺省范围未知不静默扩大或跳过。`change` 枚举见矩阵中的 API 名。新报告 Standard 缺省桌面和手机全页各一张；Quick 缺省一个桌面首屏，复杂局部任务应明确更有用的目标。Deep 用 `deepTargets` 显式追加，主题状态需通过任务适配调用或另一次有理由的检查指定。

修正调用带 `previous`、`correction:true`、`defects:[具体缺陷]`，最多两轮；耗尽返回 blocked，不自动扩展。已全部通过且同一验证配置与依赖未变化时，直接返回 stopped，不再开浏览器。工具无法防止调用者丢弃 previous 或 Agent 自行改写目标；需要 Agent 遵守工作流，仍待后续跨模型实测。

UTF-8：优先补丁；Python 用 `encoding='utf-8'`，Node 用 `'utf8'`；PowerShell 读写需明确 UTF-8，检查替换字符、乱码和差异。不要把 `PYTHONUTF8` 当作已经修复了文件字节。截图前等待实际渲染、字体和状态稳定；失败不做无界重试，记录具体工具错误与未完成验收。
