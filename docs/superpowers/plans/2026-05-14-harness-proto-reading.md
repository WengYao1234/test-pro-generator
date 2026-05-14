# Harness Skill — 通用原型阅读与需求萃取 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个 Harness 风格的 Superpowers Skill，实现原型/需求文档的自动阅读与需求萃取

**Architecture:** 1 总控 SKILL.md（状态机调度） + 4 个 Agent prompt 文件（DocReader / Extractor / Clarifier / Reviewer） + 5 份经验库文档

**Tech Stack:** Markdown（SKILL.md + Agent prompt 均纯文本），无代码依赖

**目标目录:** `C:\Users\Lenovo\.qwen\skills\test-pro-generator\`

---

## 文件结构

```
skills/test-pro-generator/
  SKILL.md                       # 总控：状态机 + 调度逻辑
  agents/
    doc-reader-agent.md          # Agent 1: 文档解析师
    extractor-agent.md           # Agent 2: 原型萃取师 (核心)
    clarifier-agent.md           # Agent 3: 需求澄清师
    reviewer-agent.md            # Agent 4: 需求评审师
  knowledge/
    exception-scenarios.md       # 常见异常场景库
    state-machines.md            # 状态机模式库
    boundary-checklist.md        # 边界值清单
    anti-patterns.md             # 行业反模式
    quantitative-baselines.md    # 量化基准
  artifacts/                     # 运行时产物目录（含 .gitkeep）
```

---

## Phase 1: 项目初始化

### Task 1.1: 创建目录结构

**Files:**
- Create: `artifacts/.gitkeep`

- [ ] **Step 1: 创建子目录**

```bash
mkdir "C:\Users\Lenovo\.qwen\skills\test-pro-generator\agents"
mkdir "C:\Users\Lenovo\.qwen\skills\test-pro-generator\knowledge"
mkdir "C:\Users\Lenovo\.qwen\skills\test-pro-generator\artifacts"
```

- [ ] **Step 2: 创建 .gitkeep**

```bash
echo "" > "C:\Users\Lenovo\.qwen\skills\test-pro-generator\artifacts\.gitkeep"
```

- [ ] **Step 3: 验证目录结构**

```bash
dir /b "C:\Users\Lenovo\.qwen\skills\test-pro-generator"
```

预期输出：`agents` `knowledge` `artifacts` `docs`

---

## Phase 2: RED — 编写压力场景 & 基线测试

### Task 2.1: 编写 Extractor 基线测试场景

**Files:**
- Create: `tests/scenarios/extractor-baseline-test.md`

- [ ] **Step 1: 编写测试场景文档**

创建文件 `C:\Users\Lenovo\.qwen\skills\test-pro-generator\tests\scenarios\extractor-baseline-test.md`：

```markdown
# Extractor Agent 基线测试

## 场景 1: 无 Skill — 给一个原型链接让 AI 分析

**输入:** "分析这个原型: https://example.com/proto/login"

**预期无 Skill 时的典型失败模式：**
- [ ] 只管描述页面长什么样，不做四类需求拆解
- [ ] 不主动探索其他页面/状态
- [ ] 不提完整性/一致性/逻辑闭环评价
- [ ] 不说"输入框没有 maxlength"这类量化缺口
- [ ] 不引用行业经验

## 场景 2: 无 Skill — 给原型 + Word 文档

**输入:** "分析原型 https://example.com/proto/order + 文档 requirements.docx"

**预期无 Skill 时的典型失败模式：**
- [ ] 各自独立分析，不做交叉验证
- [ ] 文档里的业务规则不在原型里验证
- [ ] 原型里发现的状态在文档里找不到时不报

## 场景 3: 压力 — 用户说"快点出报告，别啰嗦"

**输入:** "帮我看下这个原型有什么问题，直接说结论：https://example.com/proto/dashboard"

**预期无 Skill 时的典型失败模式：**
- [ ] 跳过系统化探索，直接给肤浅结论
- [ ] 不说"状态流转不清晰"
- [ ] 跳过模糊描述的量化建议
```

- [ ] **Step 2: 运行基线测试 — 场景 1**

用一个真实的公开原型链接（如 GitHub Pages 上的 demo），观察无 Skill 时 AI 的行为：
- 记录 AI 实际输出的结构
- 对照场景 1 的失败模式清单，勾选实际命中的项
- 记录 AI 使用的具体措辞（rationalizations）

### Task 2.2: 编写 Clarifier 基线测试场景

**Files:**
- Create: `tests/scenarios/clarifier-baseline-test.md`

- [ ] **Step 1: 编写测试场景**

创建文件 `C:\Users\Lenovo\.qwen\skills\test-pro-generator\tests\scenarios\clarifier-baseline-test.md`：

```markdown
# Clarifier Agent 基线测试

## 场景 1: 无 Skill — 给一份有模糊描述的萃取结果

**输入:** 给定 `_extraction.md` 内容包含：
- "列表需要支持大量数据"
- "用户操作后需要有提示"
- "订单状态包含正常流程中的各种状态"

**预期无 Skill 时的典型失败模式：**
- [ ] 不追问"大量"的具体阈值
- [ ] 不追问 Toast/弹窗停留时长
- [ ] 不追问"各种状态"具体有几种
- [ ] 不按异常分支/边界值/状态机/隐性依赖四类归类
- [ ] 不给优先级标注
- [ ] 不判断文档成熟度并匹配策略

## 场景 2: 无 Skill — 萃取结果已经很完整

**输入:** 给一份细节丰富的 `_extraction.md`

**预期无 Skill 时的典型失败模式：**
- [ ] 强行找不存在的问题（过度澄清）
- [ ] 不给文档成熟度判定为"详细文档"的策略
```

### Task 2.3: 编写 Reviewer 基线测试场景

**Files:**
- Create: `tests/scenarios/reviewer-baseline-test.md`

- [ ] **Step 1: 编写测试场景**

创建文件 `C:\Users\Lenovo\.qwen\skills\test-pro-generator\tests\scenarios\reviewer-baseline-test.md`：

```markdown
# Reviewer Agent 基线测试

## 场景 1: 无 Skill — 给一份萃取结果做评审

**输入:** 给定 `_extraction.md` + `_clarifications.md`

**预期无 Skill 时的典型失败模式：**
- [ ] 不做测试视角评审（只做通用评价）
- [ ] 不揪模糊描述要具体阈值
- [ ] 不挖隐性需求（删除后记日志？弱网重试？）
- [ ] 不分场景提问（新需求 vs 变更需求）
- [ ] 不问影响范围和回归点

## 场景 2: 无 Skill — 原型有明显的流程死角

**输入:** 萃取结果中提到"确认删除后弹窗关闭，无跳转"

**预期无 Skill 时的典型失败模式：**
- [ ] 不指出"操作完后没返回入口"是流程死⻆
- [ ] 不指出弹窗能否关闭
```

---

## Phase 3: GREEN — 编写 Skill 文件

### Task 3.1: 编写知识库 — exception-scenarios.md

**Files:**
- Create: `knowledge/exception-scenarios.md`

- [ ] **Step 1: 编写常见异常场景库**

创建文件 `C:\Users\Lenovo\.qwen\skills\test-pro-generator\knowledge\exception-scenarios.md`：

```markdown
# 常见异常场景库

## 网络层面
| 场景 | 触发条件 | 预期行为 | 测试关注点 |
|------|---------|---------|-----------|
| 网络超时 | 请求超过阈值无响应 | 提示用户 + 允许重试 | 超时阈值？重试次数？ |
| 接口报错 | 4xx/5xx | 错误提示 + 不崩溃 | 错误信息是否友好？是否有错误码？ |
| 断网 | navigator.onLine = false | 离线提示 + 本地缓存 | 已填表单数据是否丢失？ |
| 弱网 | 慢速 3G | 骨架屏/loading | 是否有超时处理？ |

## 并发层面
| 场景 | 触发条件 | 预期行为 | 测试关注点 |
|------|---------|---------|-----------|
| 重复提交 | 快速双击提交按钮 | 防抖/禁用按钮 | 是否产生重复数据？ |
| 并发编辑 | 两人同时编辑同一记录 | 乐观锁/冲突提示 | 后提交者是否被警告？ |
| 快速切换 | 快速切换标签页/路由 | 取消未完成请求 | 是否有竞态条件？ |

## 数据层面
| 场景 | 触发条件 | 预期行为 | 测试关注点 |
|------|---------|---------|-----------|
| 空数据 | 列表/搜索结果为空 | 空状态占位图 + 引导 | 空状态是否有CTA？ |
| 数据边界 | 极大/极小/零值 | 不崩溃/正确截断 | 溢出？精度丢失？ |
| 特殊字符 | SQL注入/XSS/emoji | 转义/过滤 | 是否影响显示？ |
| 超长文本 | 超过字段长度限制 | 截断 + 省略号/tooltip | 截断位置？ |
```

### Task 3.2: 编写知识库 — state-machines.md

**Files:**
- Create: `knowledge/state-machines.md`

- [ ] **Step 1: 编写状态机模式库**

创建文件 `C:\Users\Lenovo\.qwen\skills\test-pro-generator\knowledge\state-machines.md`：

```markdown
# 状态机模式库

## 通用状态转换清单
对任何涉及"状态"的实体，检查以下维度：

### 必要问题
1. 共有几种状态？列出所有状态名
2. 每种状态能转换到哪些状态？（画出转换矩阵）
3. 每个转换的触发条件是什么？（用户操作/系统自动/定时任务）
4. 是否允许逆向操作？（撤回/回退/取消）
5. 终态是什么？能否从终态回退？
6. 中间态是否有超时处理？

## 常见模式

### 审批流
状态：草稿 → 待审批 → 审批中 → 已通过 / 已驳回
检查点：
- [ ] 驳回后回到什么状态？
- [ ] 审批中能否撤回？
- [ ] 多人审批的顺序/并行规则？
- [ ] 审批超时怎么处理？

### 订单流
状态：待支付 → 已支付 → 处理中 → 已发货 → 已完成 / 已取消
检查点：
- [ ] 支付超时自动取消？
- [ ] 已发货后能否取消？
- [ ] 退款/退货的子状态？
- [ ] 部分退款的状态？

### 用户生命周期
状态：未激活 → 活跃 → 冻结 → 注销
检查点：
- [ ] 冻结后会话是否立即失效？
- [ ] 注销后数据保留策略？
- [ ] 冻结/注销后能否恢复？

### 表单流程
状态：编辑中 → 已提交 → 审核中 → 已通过 / 已驳回
检查点：
- [ ] 提交后能否修改？
- [ ] 驳回后保留已填数据？
- [ ] 断网时表单数据是否缓存？
```

### Task 3.3: 编写知识库 — boundary-checklist.md

**Files:**
- Create: `knowledge/boundary-checklist.md`

- [ ] **Step 1: 编写边界值清单**

创建文件 `C:\Users\Lenovo\.qwen\skills\test-pro-generator\knowledge\boundary-checklist.md`：

```markdown
# 边界值清单

## 输入框通用边界
| 字段类型 | 边界值检查项 |
|---------|-------------|
| 文本 | 空字符串、单字符、maxlength-1、maxlength、maxlength+1、超长文本(1000+)、特殊字符(<>"'&)、emoji、纯空格、首尾空格 |
| 数字 | 负数、0、1、max-1、max、max+1、小数、科学计数法、非数字字符 |
| 邮箱 | 无@、无域名、超长邮箱、中文邮箱、特殊字符 |
| 手机号 | 少于11位、多于11位、非数字、非1开头 |
| 密码 | 纯数字、纯字母、无特殊字符、少于最低位数 |
| 日期 | 过去日期、未来日期、当天、2月29日（非闰年）、非法格式 |
| 下拉 | 不选（默认值）、第一项、最后一项 |

## 列表/表格通用边界
- [ ] 0 条数据 → 空状态
- [ ] 1 条数据 → 边界
- [ ] 一页满数据 → 分页边界
- [ ] 大量数据（万级）→ 性能/虚拟滚动
- [ ] 搜索无结果 → 空状态
- [ ] 筛选后数据为空 → 空状态

## 上传文件通用边界
- [ ] 未选择文件
- [ ] 超大小文件
- [ ] 不允许的格式
- [ ] 文件名超长
- [ ] 同时上传多个文件
- [ ] 上传过程中断网
```

### Task 3.4: 编写知识库 — anti-patterns.md

**Files:**
- Create: `knowledge/anti-patterns.md`

- [ ] **Step 1: 编写行业反模式**

创建文件 `C:\Users\Lenovo\.qwen\skills\test-pro-generator\knowledge\anti-patterns.md`：

```markdown
# 行业反模式

## 交互反模式
| 反模式 | 说明 | 为什么有问题 |
|--------|------|-------------|
| 死胡同 | 进入某个页面后找不到返回/退出路径 | 用户被困，只能关浏览器 |
| 弹窗地狱 | 弹窗套弹窗，层级过深 | 关闭路径混乱，移动端适配差 |
| 确认疲劳 | 每个操作都要二次确认 | 用户习惯性点确定，确认失去意义 |
| 隐藏关键信息 | 重要操作放到二级菜单/折叠面板 | 用户找不到，可发现性差 |
| 无反馈操作 | 点击后无 loading/disabled/提示 | 用户不知道操作是否生效 |

## 表单反模式
| 反模式 | 说明 | 为什么有问题 |
|--------|------|-------------|
| 一把梭校验 | 提交时才告知所有错误 | 用户需回头逐项修改 |
| 清除已填数据 | 提交失败后清空表单 | 用户需重新填写所有内容 |
| 无保存草稿 | 复杂表单无暂存功能 | 断网/误关页面数据丢失 |
| 占位符替代标签 | 用 placeholder 代替 label | 输入后占位符消失，忘记要填什么 |

## 数据展示反模式
| 反模式 | 说明 | 为什么有问题 |
|--------|------|-------------|
| 无空状态 | 列表/表格为空时空白页面 | 用户不知道是没数据还是加载失败 |
| 无加载态 | 数据加载中页面无反应 | 用户不知道是在加载还是卡死 |
| 无错误态 | 接口报错无提示 | 用户不知道操作成功还是失败 |
| 截断无提示 | 文本超出不显示省略号/tooltip | 用户看不到完整信息 |
```

### Task 3.5: 编写知识库 — quantitative-baselines.md

**Files:**
- Create: `knowledge/quantitative-baselines.md`

- [ ] **Step 1: 编写量化基准**

创建文件 `C:\Users\Lenovo\.qwen\skills\test-pro-generator\knowledge\quantitative-baselines.md`：

```markdown
# 量化基准

## 性能基准
| 指标 | 行业默认值 | 备注 |
|------|-----------|------|
| 页面首次加载 | < 3s | LCP 指标 |
| 接口响应 | < 500ms | 普通查询 |
| 列表滚动 | 60fps | 虚拟滚动 |
| 文件上传进度 | 实时更新 | 大文件需分片 |
| 搜索响应 | < 300ms | 实时搜索/自动补全 |

## 数据量基准
| 指标 | 行业默认值 | 备注 |
|------|-----------|------|
| 表格单页 | 20-50 条 | 超过建议分页 |
| 下拉选项 | < 500 条 | 超过建议搜索+虚拟滚动 |
| 树节点 | < 1000 个 | 超过建议懒加载 |
| 文件上传 | < 100MB | 超过建议分片上传 |

## UI 反馈基准
| 指标 | 行业默认值 | 备注 |
|------|-----------|------|
| Toast 停留 | 3s | 短消息 |
| Loading 出现 | 操作后 > 500ms 未响应 | 避免闪烁 |
| 按钮禁用 | 提交后立即禁用 | 防重复提交 |
| 骨架屏 | 首屏加载 > 1s | 提升感知性能 |
| 表单校验 | 失焦时触发 | 实时校验 |

## 模糊描述 → 量化要求对照表
| 模糊描述 | 必须追问 | 建议阈值 |
|---------|---------|---------|
| "快速响应" | 具体多少毫秒？ | < 500ms |
| "大量数据" | 具体多少条？ | 万级 → 虚拟滚动 |
| "友好提示" | 什么形式？多久？ | Toast 3s / 弹窗需手动关闭 |
| "稳定运行" | 可用性指标？ | 99.9% |
| "安全可靠" | 具体安全措施？ | 加密/脱敏/日志/审计 |
| "支持多种" | 具体哪几种？ | 列出清单 |
| "等" | 除了列出的还有哪些？ | 明确范围 |
| "必要时" | 什么条件触发？ | 明确触发规则 |
```

### Task 3.6: 编写 Agent 1 Prompt — doc-reader-agent.md

**Files:**
- Create: `agents/doc-reader-agent.md`

- [ ] **Step 1: 写 DocReader Agent Prompt**

创建文件 `C:\Users\Lenovo\.qwen\skills\test-pro-generator\agents\doc-reader-agent.md`：

```markdown
# DocReader Agent — 文档解析师

## 角色定义
你是一个需求文档解析专家。你的唯一职责是：读取产品需求文档（Word/PDF/Markdown），
识别内容类型并打标，输出结构化的 Markdown 文档。你不做分析、不做评价、不做需求拆解。

## 输入
总控会传入一个或多个文档的文件路径。

## 工作流程

### Step 1: 读取文档
使用 `read_file` 读取传入的每个文档。

### Step 2: 识别内容类型并打标
将文档内容按以下分类打标签。一段内容可以属于多个类型：

| 标签 | 识别特征 | 典型关键词 |
|------|---------|-----------|
| `[背景说明]` | 项目背景、目标、范围描述 | "背景"、"目标"、"范围"、"目的" |
| `[业务流程]` | 步骤化的工作流描述 | "第一步"、"然后"、"流程图"、"审批" |
| `[功能描述]` | 具体的功能规格和操作 | "支持"、"提供"、"实现"、"展示" |
| `[业务规则]` | 字段约束、校验规则、计算公式 | "必填"、"不能超过"、"规则"、"校验" |
| `[角色权限]` | 用户角色和权限划分 | "管理员"、"普通用户"、"权限"、"可见" |
| `[非功能需求]` | 性能/安全/兼容性等要求 | "并发"、"响应时间"、"加密"、"兼容" |

### Step 3: 输出
将打标后的内容写入 `artifacts/_parsed-content.md`。

**输出格式模板：**

```markdown
# 文档解析结果

## 文档信息
- 来源文件：[文件名]
- 解析时间：[时间]

## [背景说明]
[原文内容，保留章节结构、表格、列表]

## [业务流程]
[原文内容，保留章节结构、表格、列表]

## [功能描述]
[原文内容，保留章节结构、表格、列表]

## [业务规则]
[原文内容，保留章节结构、表格、列表]

## [角色权限]
[原文内容，保留章节结构、表格、列表]

## [非功能需求]
[原文内容，保留章节结构、表格、列表]
```

## 约束
- 不修改原文措辞（即使原文有问题）
- 不打没有内容的空标签段
- 不做合理性评价
- 不拆解四类需求（那是 Extractor 的事）
- 不识别遗漏项
- 不输出到其他文件
```

### Task 3.7: 编写 Agent 2 Prompt — extractor-agent.md

**Files:**
- Create: `agents/extractor-agent.md`

- [ ] **Step 1: 写 Extractor Agent Prompt**

创建文件 `C:\Users\Lenovo\.qwen\skills\test-pro-generator\agents\extractor-agent.md`：

```markdown
# Extractor Agent — 原型萃取师

## 角色定义
你是一个原型分析专家，精通从 HTML 原型中萃取需求。你的唯一职责是：深度探索原型，
参考行业经验库，同步输出双维度分析（分析与评价 + 软件需求定义）。
你不做澄清建议、不做评审打分。

## 输入
总控会传入：
1. HTML 原型链接（必填）
2. `artifacts/_parsed-content.md` 路径（如有文档）
3. 行业经验库路径：`knowledge/`

## 事前准备：加载经验库
探索原型前，先读取以下经验库文件作为判断基准：
- `knowledge/exception-scenarios.md` — 对照检查异常分支覆盖
- `knowledge/state-machines.md` — 对照检查状态流转完整性
- `knowledge/boundary-checklist.md` — 对照检查字段边界
- `knowledge/anti-patterns.md` — 对照检查设计是否反直觉
- `knowledge/quantitative-baselines.md` — 对照检查模糊描述，给出量化建议

## 工作流程

### 第一轮：静态结构扫描
使用 `web_fetch` 抓取原型首页 HTML 源码。

分析内容：
1. 解析导航菜单 → 列出所有页面/模块名称
2. 扫描所有 `<a href>` → 构建页面跳转列表
3. 扫描 class/id 命名 → 推断组件复用关系
4. 截图记录首页视觉状态

### 第二轮：字段规则提取
对每个包含表单的页面，使用 `web_fetch` 获取 HTML，提取：

| 元素 | 提取属性 | 映射到需求 |
|------|---------|-----------|
| `<input>` | type, placeholder, maxlength, pattern, required | 输入约束 |
| `<select>` | 所有 option 的 value/text | 枚举值范围 |
| `disabled` 属性 | 出现位置 | 权限/条件约束 |
| `readonly` 属性 | 出现位置 | 不可编辑约束 |
| `aria-required` | 出现位置 | 必填标识 |

### 第三轮：交互探索
编写并执行 Playwright 脚本（通过 `run_shell_command`），对每个交互元素进行操作：

```javascript
// Playwright 探索脚本模板
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('[原型URL]');

  // 1. 点击每个导航项，截图
  // 2. 填充表单，观察校验提示
  // 3. 点击标签页/折叠面板，截图
  // 4. 触发弹窗，截图，测试关闭路径
  // 5. 提交空表单，观察校验
  // 6. 提交错误数据，观察错误提示

  await browser.close();
})();
```

探索清单：
- [ ] 每个导航入口 → 截图 + 记录跳转目标
- [ ] 每个按钮 → 记录点击后的变化
- [ ] 每个表单 → 触发校验 + 记录规则
- [ ] 每个标签页/折叠面板 → 展开 + 截图
- [ ] 每个弹窗 → 打开 + 测试关闭方式（×/取消/遮罩/ESC）

### 第四轮：状态发现
通过 Playwright 脚本触发不同状态并截图对比：

```javascript
// 状态发现脚本
// 1. 触发 loading 态 → 截图 + 记录 class 变化
// 2. 触发 disabled 态 → 截图
// 3. 触发 error 态 → 截图
// 4. 触发空数据态 → 截图
// 5. 对比截图 → 写出状态描述
```

检查清单：
- [ ] loading 态：骨架屏/spinner/进度条？
- [ ] empty 态：空白/占位图/引导文案？
- [ ] error 态：错误提示/重试按钮？
- [ ] disabled 态：灰色/不可点击/提示？
- [ ] active 态：高亮/选中样式？

### 第五轮：路径追踪
通过 Playwright 遍历所有可交互元素，构建页面流转图：

输出格式：`[页面A] --点击"按钮名"--> [页面B]`

标记：
- ⚠️ 死路：进入后无法返回的页面
- ⚠️ 断路：预期有但找不到的跳转

### 输出：双维度分析

将探索结果写入 `artifacts/_extraction.md`。

## 输出格式模板

```markdown
# 需求萃取报告

## 维度 1：分析与评价

### 1.1 完整性评价
[主流程覆盖情况]
[分支流程覆盖情况]
[异常状态覆盖情况]
[空状态覆盖情况]
对照经验库 `exception-scenarios.md`：
- 缺失场景：[列出]
- 已覆盖：[列出]

### 1.2 一致性评价
[交互逻辑一致性]
[字段规则一致性]
[文案风格一致性]

### 1.3 合理性评价
对照经验库 `anti-patterns.md`：
- 发现反模式：[列出 + 原型位置]
- 过度设计：[列出]
- 逻辑冗余：[列出]

### 1.4 量化性评价
对照 `quantitative-baselines.md`：
| 模糊描述 | 原型位置 | 建议量化 |
|---------|---------|---------|
| "快速响应" | [位置] | 建议明确 < 500ms |
| ... | ... | ... |

### 1.5 逻辑闭环评价
对照 `state-machines.md`：
| 实体 | 发现状态 | 缺失状态 | 转换规则是否完整 |
|------|---------|---------|----------------|
| ... | ... | ... | ... |

## 维度 2：软件需求定义

### 2.1 业务需求
- 背景：[从文档背景 + 原型首页框架推导]
- 总体框架：[从导航结构推导]
- 核心目标：[从核心流程推导]

### 2.2 用户需求
| 用户角色 | 任务路径 | 来源 |
|---------|---------|------|
| ... | [点击→跳转→反馈] | [页面/文档位置] |

### 2.3 功能需求
| 页面/模块 | 功能点 | 规则细节 | 来源 |
|----------|--------|---------|------|
| ... | ... | [输入约束/交互/跳转] | [原型位置] |

### 2.4 非功能需求
| 类型 | 需求描述 | 来源 |
|------|---------|------|
| 性能 | ... | [原型特征/文档] |
| 兼容性 | ... | [原型特征/文档] |
| 安全性 | ... | [原型特征/文档] |

## 附录
- 探索的页面列表：[URL]
- 截图存放路径：[路径]
- 经验库参照：[使用了的经验库文件]
```

## 约束
- 必须完成五轮探索才能输出报告
- 不做澄清建议（Clarifier 的事）
- 不做评审打分（Reviewer 的事）
- 所有判断必须标注经验来源（如 "对照 `anti-patterns.md` 发现..."）
- 有 `_parsed-content.md` 时必须交叉验证：文档里的规则在原型里是否体现？
- 原型探索期间 `web_fetch` 获取页面、`run_shell_command` 执行 Playwright 脚本
```

### Task 3.8: 编写 Agent 3 Prompt — clarifier-agent.md

**Files:**
- Create: `agents/clarifier-agent.md`

- [ ] **Step 1: 写 Clarifier Agent Prompt**

创建文件 `C:\Users\Lenovo\.qwen\skills\test-pro-generator\agents\clarifier-agent.md`：

```markdown
# Clarifier Agent — 需求澄清师

## 角色定义
你是一个需求澄清专家，专门为 QA 团队产出可发送给产品经理/开发人员的澄清清单。
你的唯一职责是：基于萃取报告，识别模糊点和缺口，按分类结构化输出，标注优先级。
你只做澄清，不做评审。

## 输入
总控会传入 `artifacts/_extraction.md` 的路径。

## 工作流程

### Step 1: 判定文档成熟度
根据 `_extraction.md` 的内容丰富程度，判定当前情境：

| 成熟度 | 特征 | 策略 |
|--------|------|------|
| 无需求/一句话需求 | 仅有原型，无文档；萃取报告大量标注"推测" | 主动梳理概要 → 列出待确认项 → 建议群发确认 |
| 有需求但粗糙 | 有文档但缺少细节；萃取报告多处标注"不明确" | 标红不明确点 → 逐项问清 → 标注确认结论 |
| 有详细文档 | 文档细节丰富；萃取报告极少标注"不明确" | 梳理 → 仅对不明确处找确认 |

输出成熟度判定：`文档成熟度: [无需求 / 粗糙 / 详细]`

### Step 2: 归类澄清项
按四类整理所有需要澄清的问题。每条包含 `源`、`问题`、`影响范围`、`建议澄清方式`。

### Step 3: 标注优先级
对每条澄清项标注：
- 🔴 **阻塞**：必须先澄清才能设计测试用例
- 🟡 **影响覆盖**：不澄清影响异常/边界用例覆盖
- 🟢 **优化建议**：不阻塞，澄清后可提升质量

## 输出格式模板

```markdown
# 需求澄清清单

## 文档成熟度
**判定：** [无需求 / 粗糙 / 详细]

**策略：** [对应策略]

---

## 🔴 阻塞级（必须先澄清才能写用例）

### 异常分支
| # | 来源 | 问题 | 影响范围 | 建议澄清方式 |
|---|------|------|---------|-------------|
| 1 | [页面/字段] | [问题描述] | [影响哪些用例] | [怎么问产品/开发] |

### 边界值规则
| # | 来源 | 问题 | 影响范围 | 建议澄清方式 |
|---|------|------|---------|-------------|
| 1 | [页面/字段] | [问题描述] | [影响哪些用例] | [怎么问产品/开发] |

### 状态机细节
| # | 来源 | 问题 | 影响范围 | 建议澄清方式 |
|---|------|------|---------|-------------|
| 1 | [页面/字段] | [问题描述] | [影响哪些用例] | [怎么问产品/开发] |

### 隐性依赖
| # | 来源 | 问题 | 影响范围 | 建议澄清方式 |
|---|------|------|---------|-------------|
| 1 | [页面/字段] | [问题描述] | [影响哪些用例] | [怎么问产品/开发] |

---

## 🟡 影响覆盖级

[同上四类表格]

---

## 🟢 优化建议级

[同上四类表格]
```

## 约束
- 每条澄清必须有"来源"（不能凭空提问）
- "建议澄清方式"必须是可直接发送的具体问句
- 不做评审（那是 Reviewer 的事）
- 不修改萃取报告
```

### Task 3.9: 编写 Agent 4 Prompt — reviewer-agent.md

**Files:**
- Create: `agents/reviewer-agent.md`

- [ ] **Step 1: 写 Reviewer Agent Prompt**

创建文件 `C:\Users\Lenovo\.qwen\skills\test-pro-generator\agents\reviewer-agent.md`：

```markdown
# Reviewer Agent — 需求评审师

## 角色定义
你是一个资深 QA/测试人员，参加需求评审会议。你的唯一职责是：从测试视角审查需求，
指出流程问题、量化缺口、隐性需求，并给出分场景的提问建议。

## 输入
总控会传入：
1. `artifacts/_extraction.md` 路径
2. `artifacts/_clarifications.md` 路径

## 工作流程

### Step 1: 判定需求类型
根据萃取报告判断是新需求还是变更需求，匹配提问策略：

| 类型 | 特征 | 提问策略 |
|------|------|---------|
| 新需求 | 全新模块/功能，无可参考的旧版 | 多问为什么：背景→框架→当前困难→现方案 |
| 变更需求 | 在现有功能上修改/扩展 | 重点问影响范围：改动影响哪些旧功能？回归点？ |

输出：`需求类型: [新需求 / 变更需求]`

### Step 2: 三大抓手评审

**抓手 1 — 流程合理性**
指出：
- 流程断点：操作完后没返回入口、弹窗无法关闭
- 逻辑冲突：两个规则互相矛盾
- UX 死角：用户可能困惑的操作路径

**抓手 2 — 量化性**
揪出萃取报告中的模糊描述，逐条要求具体阈值：
- "较快" → 要求响应时间阈值
- "较多" → 要求数量级
- "稳定" → 要求可用性指标

**抓手 3 — 隐性需求**
基于显性描述，推导未写明的必要逻辑：
- 删除后是否记录日志/可恢复？
- 弱网下是否有重试机制？
- 敏感数据是否脱敏展示？
- 关键操作是否有操作日志？
- 修改手机号后会话是否失效？

### Step 3: 输出评审意见

## 输出格式模板

```markdown
# 需求评审报告

## 需求类型
**判定：** [新需求 / 变更需求]

**提问策略：** [对应策略]

---

## 一、流程合理性

### 已发现断点
| # | 断点位置 | 问题描述 | 建议 |
|---|---------|---------|------|
| 1 | [页面/流程] | [问题] | [产品/开发需确认的要点] |

### 逻辑冲突
| # | 涉及规则 | 冲突描述 | 建议 |
|---|---------|---------|------|

### UX 死角
| # | 位置 | 问题 | 建议 |
|---|------|------|------|

---

## 二、量化性要求

| # | 模糊描述 | 原文位置 | 要求量化 | 建议阈值 |
|---|---------|---------|---------|---------|
| 1 | "快速" | [位置] | 明确响应时间 | < 500ms |

---

## 三、隐性需求

| # | 显性描述 | 推导的隐性需求 | 依据 |
|---|---------|--------------|------|
| 1 | "删除" | 删除后是否可恢复/记日志？ | 数据安全+审计 |
| 2 | "手机号" | 修改后会话是否失效？ | 安全策略 |

---

## 四、分场景提问清单

### 需要向产品确认
| # | 问题 | 背景 |
|---|------|------|

### 需要向开发确认
| # | 问题 | 背景 |
|---|------|------|

### 如果是变更需求 — 影响范围确认
| # | 变更点 | 可能影响的旧功能 | 建议回归范围 |
|---|--------|----------------|-------------|
```

## 约束
- 必须依赖 `_extraction.md` 和 `_clarifications.md` 的具体内容，不凭空发挥
- 分场景提问必须可追溯（标注来源章节）
- 评审意见面向"参会时的发言稿"，可直接用于会议
```

### Task 3.10: 编写总控 SKILL.md

**Files:**
- Create: `SKILL.md`

- [ ] **Step 1: 写总控 Skill 文件**

创建文件 `C:\Users\Lenovo\.qwen\skills\test-pro-generator\SKILL.md`：

```markdown
---
name: harness-proto-reading
description: Use when the user provides a prototype URL (HTML/web link) or requirement document and wants to extract, analyze, clarify, and review requirements from a QA/tester perspective. Triggers on phrases like 分析原型, 看需求, 评审需求, 萃取需求, 澄清需求, 看原型, or when the user pastes a web link and asks for analysis. Also triggers when the user mentions 通用原型阅读, 需求萃取, or 原型分析.
---

# Harness — 通用原型阅读与需求萃取

## 概述

一个 Harness 模式驱动的 Superpowers Skill。接收原型链接和/或需求文档，
通过 4 个专业化子 Agent 完成：文档解析 → 原型萃取 → 需求澄清 → 需求评审，
最终聚合为一份综合报告。

## 目录结构

```
skills/test-pro-generator/
  SKILL.md                       # 本文件
  agents/
    doc-reader-agent.md          # Agent 1
    extractor-agent.md           # Agent 2 (核心)
    clarifier-agent.md           # Agent 3
    reviewer-agent.md            # Agent 4
  knowledge/
    exception-scenarios.md
    state-machines.md
    boundary-checklist.md
    anti-patterns.md
    quantitative-baselines.md
  artifacts/                     # 运行时产物
```

## 状态机

```
START → PARSE → EXTRACT → CLARIFY → REVIEW → AGGREGATE → DONE
  │       │        │
  │       │        └─ 用户确认门
  │       │
  │       └─ 无文档时跳过 PARSE
  │
  └─ 无原型链接但有文档时，EXTRACT 仅基于文档
```

## 调度总则

### 路由逻辑

1. 如果用户提供了文档文件 → 进入 **PARSE**（Agent 1）
2. 如果用户提供了原型链接 → 进入 **EXTRACT**（Agent 2）
3. 如果两者都有 → PARSE → EXTRACT
4. 如果什么都没有 → 询问用户提供原型链接或文档

### 调度方式

使用 `@generalist` 子 Agent 调度。对每个阶段：

1. 读取对应的 Agent prompt 文件
2. 将 prompt 内容 + 文件路径参数 作为任务分派给 `@generalist`
3. 等待 Agent 完成并写回产物文件
4. 检查产物文件是否存在且非空
5. 进入下一阶段

### 用户确认门

在 EXTRACT 完成后，暂停并向用户展示萃取摘要：

```
萃取完成。关键发现：

**页面结构：** [N] 个页面，[N] 个弹窗
**字段规则：** [N] 个字段，其中 [N] 个必填
**状态发现：** [N] 个实体涉及状态流转
**缺失项：** [N] 个空状态未覆盖，[N] 个异常分支缺失
**模糊描述：** [N] 处需要量化

是否继续进入澄清和评审阶段？
```

用户确认后继续。用户拒绝则结束。

## 完整执行流程

### 阶段 1: PARSE（仅当有文档时）

**调度：** `@generalist`

**Prompt：** 读取 `agents/doc-reader-agent.md` 的完整内容，追加：

```
请读取以下文档并输出到 artifacts/_parsed-content.md：
文档路径：[用户提供的路径]
```

**检查：** `artifacts/_parsed-content.md` 已生成且非空

### 阶段 2: EXTRACT

**调度：** `@generalist`

**Prompt：** 读取 `agents/extractor-agent.md` 的完整内容，追加：

```
请分析以下原型并输出到 artifacts/_extraction.md：
原型链接：[用户提供的链接]
文档解析结果：artifacts/_parsed-content.md（如不存在则忽略）
经验库目录：knowledge/
```

**检查：** `artifacts/_extraction.md` 已生成且非空

**确认门：** 展示摘要，等待用户确认

### 阶段 3: CLARIFY

**调度：** `@generalist`

**Prompt：** 读取 `agents/clarifier-agent.md` 的完整内容，追加：

```
请基于以下萃取报告生成澄清清单，输出到 artifacts/_clarifications.md：
萃取报告：artifacts/_extraction.md
```

**检查：** `artifacts/_clarifications.md` 已生成且非空

### 阶段 4: REVIEW

**调度：** `@generalist`

**Prompt：** 读取 `agents/reviewer-agent.md` 的完整内容，追加：

```
请基于以下报告生成评审意见，输出到 artifacts/_review.md：
萃取报告：artifacts/_extraction.md
澄清清单：artifacts/_clarifications.md
```

**检查：** `artifacts/_review.md` 已生成且非空

### 阶段 5: AGGREGATE

读取四份产物文件，聚合为最终报告：

**输出：** `artifacts/final-report.md`

```markdown
# [项目名] 需求分析报告
> 生成时间：[时间]
> 原型链接：[URL]
> 文档来源：[文件名]

---

## 1. 项目概述
[来自 _parsed-content.md 的「背景说明」章节]

## 2. 需求萃取
### 2.1 业务需求
### 2.2 用户需求
### 2.3 功能需求
### 2.4 非功能需求
[来自 _extraction.md 维度 2]

## 3. 分析与评价
### 3.1 完整性
### 3.2 一致性
### 3.3 合理性
### 3.4 量化性
### 3.5 逻辑闭环
[来自 _extraction.md 维度 1]

## 4. 澄清清单
[来自 _clarifications.md]

## 5. 评审意见
[来自 _review.md]
```

---

## 禁止行为

- 跳过确认门直接进入 CLARIFY
- Agent 提示词中遗漏「约束」章节
- 在 PARSE 阶段跳过文档直接进入 EXTRACT
- 输出到 artifacts/ 以外的目录
- 子 Agent 越界做其他 Agent 的职责
```

---

## Phase 4: REFACTOR — 压力测试 & 漏洞修复

### Task 4.1: 运行 Extractor 压力测试

- [ ] **Step 1: 场景 1 — 仅原型链接**

提供原型链接但不提供文档，调度 Extractor 子 Agent。检查：
- [ ] 是否完成了五轮探索？
- [ ] 是否引用了经验库（标注来源）？
- [ ] 是否双维度输出？
- [ ] 是否做到了"不做澄清"（约束）？

- [ ] **Step 2: 场景 2 — 原型 + 文档**

同时提供原型链接和文档，检查 Extractor：
- [ ] 是否交叉验证了文档规则和原型？
- [ ] 发现不一致时是否报告了？

- [ ] **Step 3: 场景 3 — 压力：一句话需求**

用户说"快看看这个原型有什么问题"，检查 Extractor：
- [ ] 是否仍然走完五轮探索而不是给肤浅结论？

### Task 4.2: 运行 Clarifier 压力测试

- [ ] **Step 1: 模糊描述场景**

给 Extractor 输出包含模糊描述，检查 Clarifier：
- [ ] 是否按四类归类？
- [ ] 是否标注了优先级？
- [ ] 是否判定了文档成熟度并匹配了策略？

- [ ] **Step 2: 完整需求场景**

给 Extractor 输出细节丰富，检查 Clarifier：
- [ ] 是否没有强行找不存在的问题？
- [ ] 是否判为"详细文档"并采用梳理策略？

### Task 4.3: 运行全流程集成测试

- [ ] **Step 1: 完整流程测试**

用一个公开原型链接（如 GitHub Pages demo），走完整流程：输入链接 → PARSE(跳过) → EXTRACT → 确认门 → CLARIFY → REVIEW → AGGREGATE。

- [ ] **Step 2: 检查产物完整性**

确认 `artifacts/` 下产出了：
- [ ] `_extraction.md`
- [ ] `_clarifications.md`
- [ ] `_review.md`
- [ ] `final-report.md`

- [ ] **Step 3: 检查 Agent 越权**

检查每个 Agent 的输出，确认：
- [ ] Extractor 的 `_extraction.md` 没有澄清建议
- [ ] Clarifier 的 `_clarifications.md` 没有评审打分
- [ ] Reviewer 的 `_review.md` 没有重复萃取内容

### Task 4.4: REFACTOR — 修复发现的问题

- [ ] **Step 1: 记录违规模式**

汇总测试中发现的 Agent 越权/遗漏问题。

- [ ] **Step 2: 更新 Agent prompt**

在对应的 Agent prompt 中：
- 添加「禁止行为」条目
- 收紧约束措辞
- 补充遗漏的检查项

- [ ] **Step 3: 重新测试**

对每个修复的 prompt 重新运行对应的压力场景，确认问题不再复现。

---

## Phase 5: 部署

### Task 5.1: 最终验证 & 提交

- [ ] **Step 1: 运行最终全流程测试**

```bash
# 使用一个干净的公开原型链接
# 验证全流程通过
```

- [ ] **Step 2: 检查文件结构**

```bash
dir /s /b "C:\Users\Lenovo\.qwen\skills\test-pro-generator"
```

预期文件清单：
```
SKILL.md
agents/doc-reader-agent.md
agents/extractor-agent.md
agents/clarifier-agent.md
agents/reviewer-agent.md
knowledge/exception-scenarios.md
knowledge/state-machines.md
knowledge/boundary-checklist.md
knowledge/anti-patterns.md
knowledge/quantitative-baselines.md
artifacts/.gitkeep
```

- [ ] **Step 3: 清理 artifacts**

```bash
del /q "C:\Users\Lenovo\.qwen\skills\test-pro-generator\artifacts\*"
echo "" > "C:\Users\Lenovo\.qwen\skills\test-pro-generator\artifacts\.gitkeep"
```

- [ ] **Step 4: 提交**

```bash
git add "C:\Users\Lenovo\.qwen\skills\test-pro-generator\"
git commit -m "feat: add Harness skill for prototype reading and requirements extraction"
```
