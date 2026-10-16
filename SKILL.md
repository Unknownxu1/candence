---
name: cadence
description: Design and generate visually harmonious, expressive HTML reports with adaptive composition, data visualization, typography, themes, and visual validation.
metadata:
  version: "0.1.1"
---

# Cadence

把分析结果转化为协调、舒适、可复核的 HTML 报告。复用成熟的构图关系，按研究问题选择图表；不要把某个案例的章节、算法或模拟数字当通用模板。

## 输入与输出

输入：用户的问题、读者、现有结果/数据、估计与单位、必要限制，以及可选的配色/字体/风格偏好。先检查实际文件；区分实测、估计、模拟和计划。缺少决定结论的数据时，可以先完成结构并标明缺口，不编造数值或置信区间。

输出：可直接打开的 HTML（单文件或含本地 assets 的完整目录），数据/方法入口、实际截图与简短验收记录。原有报告编辑默认新建版本，保留原文件，除非用户要求覆盖。仓库内相对路径相对本 Skill 目录；产物写入用户工作目录，不写进已安装 Skill。无需 Apple HIG Skill 或外部服务。

## 工作流程与五层调用

先选执行模式，默认 **Standard**；用户可指定 **Quick / Standard / Deep**。新报告按下列流程，局部改动只加载受影响层。模式范围、软预算和可复用工具见 [执行模式](references/execution-modes.md)，不把时间目标当完成保证。

1. **理解任务与数据 → 选择呈现方式。** 读取 [Layer 4](references/content-and-data-presentation.md)。列出估计对象、比较基准、来源、不确定性与 P0–P3 信息预算。根据连续变化、类别比较、精确查数等阅读任务选图，不按算法名选图。
2. **选择构图。** 需要组织页面时读 [Layer 2](references/composition-patterns.md)，选择适用的 Hero、综合结果面板、发现、证据或技术明细；不要求全部出现，也不要求六章节。先复用已认可关系，再适配内容。
3. **应用视觉秩序。** 读 [Layer 1](references/design-dna.md)，检查阅读轴、标题/数字比例、组间节奏、图文对齐与整体平衡。1080px、两行标题等案例数值是起点，不是裁剪内容的硬容器。
4. **应用视觉系统。** 当需要配置或切换外观时读 [Layer 3](references/hallmark-visual-system.md)。无用户偏好时采用 Apple Classic + Modern Sans/Auto + Style 关闭。主题和排印可独立选择；只在用户要求或当前展示确有需要时启用实验性 Style Pack，并读 [表达层](references/expressive-style-packs.md)。
5. **生成 HTML。** 复用 `assets/`，保持数据与表现分离。需要组件或辅助脚本时读 [组件接口](references/components.md)；需要离线/单文件、字体或依赖处理时读 [交付与依赖](references/delivery-and-dependencies.md)。`scripts/create_report.py` 是区间/计数/短趋势的小型可选起步器，不限制其他图表，也不负责拟合。
6. **分阶段验收 → 集中修正 → 交付。** 按 [Layer 5](references/visual-validation.md) 执行 A 数据可靠性 → B 功能冒烟 → C 真实截图与看图；B 有阻断项时不进入截图批次。按 [变更影响矩阵](validation/change-impact-matrix.md) 复用未受影响的有效检查，不默认回归未启用主题/风格或所有设备。

一次初始视觉验收后，默认最多两轮集中视觉修正；每轮先列具体缺陷。四项 [Completion Gates](validation/completion-gates.md) 全通过即停止，不继续打磨非关键边距或装饰。预算用尽且仍有阻断项时，保留产物、如实报告并请求用户决定是否扩展；不得标记通过。无实际截图或尚未看图，不能声称视觉验收完成。

对简单修改仅加载相关层，不无条件通读全部仓库。来源成熟度或样例比较有需要时才读 [能力盘点](references/inventory.md) 或 `examples/`。所有公开示例必须使用独立合成或明确获准公开的数据；不得复制工作项目、历史截图、业务术语或原始数据。源码资源不是需要全部读入上下文的指令。

## 不变量

- 首屏应有值得关注的问题、答案和必要证据；不要塞日期、批次、内部编号、重复英文或低价值小字。
- 卡片承担一个完整比较任务，不把每段话包装成卡片；不要为了填空增加内容或放大组件。
- 估计量、单位、基准、置信区间类型、数据支持范围、关键识别条件和合理的因果边界必须明确可见或有清晰入口。关键限制不能全部折叠。
- 区间必须来自数据源/适当推断。不能用两组边际区间的重叠代替差异检验；不把排名尺度当购买概率，或把横截面关联写成个体时间轨迹。
- 外观切换不修改数值、轴域、CI 路径、模型状态或分析结论。手动字体不被强制覆盖。实验性风格不能冒充统计编码。
- 正文、数表、坐标保持可读；不分发 Apple 或其他无授权字体。已有 OFL 子集只覆盖原案例语料，新语料必须检查降级。

## 失败与降级

- 浏览器不可用：交付可检查的 HTML 和静态核对结果，明确“未完成浏览器视觉验收”，保留具体待验项，不虚构截图。
- 字体缺失：用资产既有系统降级链；必要时回到 Modern Sans，重新截图。不要把缺字替换为图片。
- Style Pack 干扰阅读：关闭表达层，保留 Base Theme；不要靠删统计信息挽救风格。
- 信息/数据不适配起步器：按参考规则编写原生 HTML/SVG 或明确声明的新库；不要强塞 Rank Logit 图形，或建立超出任务的复杂框架。
- 隔离安装和自动测试只验证结构/资产/行为，不等于真实新会话自动选中 Skill，或读者审美认可。只报告实际做过的验证。

完成用户授权范围后停止。安装到用户 skills 目录、修改现有 Skill、远程仓库创建或发布均按用户实际授权执行；本 Skill 不赋予额外发布权限。
