# Layer 3 · Hallmark Visual System

默认 Apple Classic + Auto（Modern Sans）+ 表达层关闭。四个 Base Theme 与四个 Typography Profile 可独立选择，主题映射只负责 Auto 推荐。

| Base Theme | 角色气质 | Auto 基础排印 |
|---|---|---|
| Apple Classic | 中性灰白、蓝色重点 | Modern Sans |
| Warm Editorial | 暖纸白、陶土 | Editorial |
| Forest Minimal | 自然白、森林绿 | Humanist |
| Graphite | 冷灰、蓝灰 | Technical |

Modern Sans 使用系统无衬线；Editorial 标题用内嵌衬线、正文继续无衬线；Humanist 使用人文 Latin 与 Noto 派生中文；Technical 仅数值采用等宽，正文不等宽。字体许可与覆盖见[依赖说明](delivery-and-dependencies.md)。

加载顺序：`foundation/design-tokens.css` → `themes/*.css` → `report.css` → 字体面与 typography profiles → `hallmark/presets/*.css` → 图表/装饰/功能层 → `components.css` → 可选表达层 Token 与四包。

`--surface-* / --text-* / --accent-* / --border-*` 管 UI；`--chart-focus/context/reference/grid/label/surface` 管数据角色；`--font-display/heading/reading/numerals/caption` 管排印。不要把颜色塞进字体配置，不以 hue 旋转代替角色色，不用红绿默认表示业务好坏。

通用控制器 `assets/runtime/design-controls.js` 只维护三轴与 `hallmark:designchange` 事件；分析状态由调用者负责。它不依赖 Rank Logit 的 `renderTrend`、`DATA` 或月份状态。Rank 案例适配器在 `examples/rank-logit/case/`，仅为该案例使用。

Expressive Style Pack 为实验性附加层：Pixel / Cel Shaded / Sunset Retro / Newspaper Editorial。按需读[表达层规则](expressive-style-packs.md)。它们不默认激活，也不强制绑定基础主题。

新增主题时复制一份角色配置，保持几何和统计接口；补齐文本、控件、图表与焦点态，登记控制器枚举和 Auto 映射，在同内容上做对比度、窄屏及切换回归。新增字体先声明许可、降级链和覆盖，不扩张为完整字体管理框架。
