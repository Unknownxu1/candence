# Cadence Visual Grammar · Layer 3

Visual Grammar 是 Hallmark Visual System 中的表现语法，不增加第六层。组合关系为 Design DNA + Composition + Base Theme + Typography + Visual Grammar。其任务是让组件共享可识别的造型，而不是复制每种风格的完整报告。

## 合约与维度

| 维度 | 可改变的表现 | 不变的语义 |
|---|---|---|
| Shape Language | 轮廓、转角、标记形状、边缘层次 | 组件职责、图形坐标 |
| Typography Expression | 标题局部强调、标签节奏、编号形态 | 中文正文、数值精度与可读性 |
| Surface & Material | 有限色板、低密度材质、表面层级 | 数据与装饰分离 |
| Component Anatomy | 栏内分隔、图标、控件选中态、局部内距 | 宏观阅读顺序与主要区域关系 |
| Data Marks | 同中心的点形、图例、柱边缘、区间笔触 | 轴域、连续性、CI 范围、比较基准 |
| Motifs | 少量有位置职责的几何母题 | 不冒充样本、概率或显著性 |
| Motion | 短促反馈、微小位移 | 键盘操作、焦点和 reduced-motion |
| Spatial Rhythm | 组件内网格、标签/内容的组内间距 | 页面比例、章节层级、阅读路径 |

## 继承与冲突顺序

1. 数据与统计语义、无障碍和 Design DNA 优先。
2. Composition 决定主要区域关系；语法只改局部造型，不改报告章节顺序。
3. Base Theme 提供角色默认值；语法在其作用域覆盖所需角色，不改主题文件或强制绑定主题。
4. Typography Profile 决定字体；显式字体选择优先。语法不得为风格强制替换中文正文或数据字体。
5. 语法 Token → 组件 Variant → 图形适配器。组件不支持某个 Variant 时使用稳定基底，不隐藏内容。

语义组件可用 `data-vg-component="hero|result|chart|metric|table|tabs|details"`，必要变体用 `data-vg-variant`。现有 `.hero-heading`、`.insight-panel` 等类也有映射，不要求重写 HTML。`data-vg-hero="editorial|split"` 只定义局部标题对齐，完整迁移默认保留既有构图。

## 接口

加载基础样式、Base Theme、Typography、Style Pack Tokens 后加载对应语法 CSS。Pixel 兼容现有 `data-style-pack="pixel"`；关闭时为 `none`，不另设第二个风格状态。

可选 [visual-grammar.js](../assets/runtime/visual-grammar.js) 提供 `CadenceGrammar.refresh()`、`CadenceGrammar.setEnabled(boolean)` 与 `CadenceGrammar.disconnect()`。其适配器只呈现已有数据点，不读取数据集字段、不改变计算或曲线路径；适用于声明了 `data-vg-point` 的 circle，以及已有通用 `.selected-dot` circle。其他 mark 保留基底。已有 rect 标记不再叠加。

适配器在 Pixel 下用同中心方形覆盖点，原圆点变透明以保留命中区和事件，关掉风格时还原原属性。覆盖点本身不拦截指针。移除适配器或不加载 JS 时，CSS 语法仍可工作，数据图正常显示。语义与样式只从本 Skill 读取，不依赖任何实验工作区文件。

每个图表只有一个数据渲染拥有者。自定义 renderer 应使用自己的语义标识，而不是同时保留通用 `report.js` 的 `data-chart` 接线，避免主题或尺寸变化时被另一个 renderer 覆写。语法适配器不接管数据渲染。

## 图表保护与验证

连续曲线不能阶梯化、量化或像素栅格吸附。CI 不裁切或缩放，点中心不移动，柱起点/长度与参考线不变。图例应匹配标记；纹理仅用于表面，不能落在数值编码上造成密度误解。缺失值显示为缺失，绘图不跨缺失段连接；这属于图表数据契约，不由造型层补值。

按 [Standard](../references/execution-modes.md) 的 A→B→C 和 [修订门槛](../validation/completion-gates.md) 验证：先组件实验台，再完整报告；先数据与功能，再截图。核对开启/关闭/重复切换后的坐标、路径、数据、键盘与焦点。按任务选桌面和窄屏，不默认所有主题组合；至少对受影响的主题角色做功能与对比度检查。

Pixel 的可执行规则见 [Pixel Grammar](../styles/expressive/pixel/grammar.md)。Cel Shaded、Sunset Retro、Newspaper Editorial 继续 Experimental，不声称已有完整视觉语法。
