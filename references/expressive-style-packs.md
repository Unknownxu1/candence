# Expressive Style Packs

Style Pack 是独立于 Base Theme 和 Typography 的表现层。Pixel v2 实现 [Visual Grammar](../foundation/visual-grammar.md) 的形状、组件、标记、材质和反馈合约；其规则见 [Pixel Grammar](../styles/expressive/pixel/grammar.md)。其他三包继续 Experimental。组件与案例验证不等于用户已认可或全部图表/浏览器均成熟。

| 包 | 超过颜色/字体的差异 | 推荐场景 | 风险/不适合 |
|---|---|---|---|
| Pixel v2 | 有限色板、阶梯表面、标题局部结构、品牌网格、方形数据点、实体柱、开放规则线、短促控件反馈 | 分析叙事、技术分享、作品集 | 需按图形和设备适配；不适合极低视觉干预的正式审查材料 |
| Cel Shaded | 清晰墨线、容器硬影、平涂 CI、带轮廓点与柱 | 讲解型研究、跨团队信息图 | 轮廓容易抢眼；不适合极密诊断图 |
| Sunset Retro | 低饱和渐层、水平分隔、柔和边缘、同心所选点 | 研究作品集、叙事分析 | 氛围减弱中性；不适合严格单色低油墨用途 |
| Newspaper Editorial | 通栏双线、栏间关系、精细表头、排线 CI/柱 | 研究专栏、阅读型长报告 | 手动无衬线标题会弱化身份；不适合高频工作台 |

推荐 Classic + Pixel、Forest + Cel、Graphite + Sunset、Warm + Newspaper，但不强制。Auto 下 Sunset/Newspaper 推荐衬线标题；正文必须保持基础配置。显式字体不被强制覆盖。

保护：不改变路径、尺度、CI、数值、方法入口；不将 Pixel 曲线阶梯化，不为数据添加硬影/光晕，不把纹理当样本密度或概率编码。装饰留在容器边缘。图例若有纹理示意，必须与图的表达相符。形状变化不编码显著性。

Pixel CSS 使用语义组件与通用组件类，可选 `visual-grammar.js` 只适配已有数据点，不包含排序模型字段。现有 `HallmarkCharts` 仍仅提供单序列区间、条形和短趋势辅助；多系列与缺失段由任务图表 renderer 负责，语法只负责表现。其他三包仍含部分案例选择器，不能宣称自动适配一切图形。复杂报告控制器保留为案例，不作为语法依赖。

关闭风格应恢复 Base；无法保持可读或统计语义时关闭该包，不删除内容。新增风格的语法成熟度应单独验证，不能因 Pixel 完成就升级其余三个包。
