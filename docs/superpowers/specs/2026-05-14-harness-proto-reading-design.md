# Harness Skill — 通用原型阅读与需求萃取

## 概述

一个综合 Superpowers Skill，用 Harness 设计模式（总控调度 + 4 个专业化 Agent + 产物文件交接 + 状态机驱动）实现原型/需求文档的深度阅读与需求萃取。覆盖 QA 工作流的前三阶段：需求分析 → 需求评审 → 统一文档产出。

## 架构

```
SKILL.md (总控/Orchestrator)
  状态机: PARSE → EXTRACT → CLARIFY → REVIEW → AGGREGATE → DONE
    
  Agent 1: DocReader     → _parsed-content.md
  Agent 2: Extractor     → _extraction.md
  Agent 3: Clarifier     → _clarifications.md
  Agent 4: Reviewer      → _review.md
  总控聚合                → final-report.md
```

## 状态机

```
START → PARSE → EXTRACT → CLARIFY → REVIEW → AGGREGATE → DONE
  │       │        │
  │       │        └─ 用户确认门（展示萃取摘要，用户确认后继续）
  │       │
  │       └─ 无文档时跳过 PARSE，直接进入 EXTRACT
  │
  └─ 无原型链接但有文档时，EXTRACT 仅基于文档内容输出
```

路由逻辑：
- 仅有原型链接 → 跳过 PARSE，直接 EXTRACT
- 仅有文档 → PARSE → EXTRACT（跳过 HTML 抓取，仅分析文档）
- 原型 + 文档 → PARSE → EXTRACT（合并两者信息）

## Agent 详细设计

### Agent 1: DocReader（文档解析师）

**输入**：Word/PDF/Markdown 需求文档（总控传入路径）

**职责**：读取文档并进行初步理解，按内容类型打标

**内容类型标签**：
- `[背景说明]`：项目背景、目标、范围
- `[业务流程]`：业务流程描述、工作流
- `[功能描述]`：功能规格说明、操作步骤
- `[业务规则]`：字段规则、校验约束、计算公式
- `[角色权限]`：角色定义、权限矩阵
- `[非功能需求]`：性能、安全、兼容性要求

**约束**：
- 保留原文结构（章节层级、表格、列表）
- 不做合理性评价
- 不做四类需求拆解
- 不做遗漏识别

**输出**：`artifacts/_parsed-content.md`

---

### Agent 2: Extractor（原型萃取师）

**输入**：HTML 原型链接 + `_parsed-content.md`（如有）+ 行业经验库

**事前准备**：读取行业经验库中与原型领域相关的文档作为判断基准

**行业经验库**：
- 常见异常场景库（网络超时、并发冲突、幂等性、重试机制）
- 状态机模式库（审批流、订单流、用户生命周期）
- 边界值清单（空值、特殊字符、超长文本、XSS/SQL注入）
- 行业反模式（常见反直觉设计、过度设计案例）
- 量化基准（响应时间阈值、列表容量、Toast 停留时长等行业默认值）

**技术栈**（HTML 原型探索）：

| 层级 | 工具/方法 | 用途 |
|------|----------|------|
| 页面抓取 | `web_fetch` | 获取 HTML 源码、静态分析页面结构 |
| 截图采集 | `web_fetch` + screenshot 能力 | 记录每个页面的视觉状态 |
| 浏览器自动化 | Playwright（通过子进程执行脚本） | 点击、填表、导航、观察 DOM 变化 |
| DOM 分析 | `grep_search` + 正则 | 从 HTML 源码中提取 class/id/属性模式 |
| 脚本执行 | `run_shell_command` 执行 Playwright 脚本 | 批量自动化探索原型交互 |

**技术手段**（HTML 原型探索）：

第一轮：静态结构扫描（`web_fetch`）
- 抓取页面 HTML 源码
- 解析导航菜单 → 识别页面层级和模块边界
- 扫描按钮/链接 href → 构建页面跳转图谱
- 抓取 DOM class/id → 推断组件命名和复用关系

第二轮：字段规则提取（`web_fetch` + DOM 解析）
- input type、placeholder、maxlength、pattern 属性
- select option 列表 → 枚举值范围
- disabled/readonly 状态 → 权限和条件约束
- aria-required 等无障碍属性

第三轮：交互探索（Playwright 脚本）
- 填充表单触发校验规则 → 提取必填/格式/长度约束
- 点击标签页/折叠面板 → 发现隐藏状态和条件展示逻辑
- 触发弹窗/抽屉 → 识别模态交互和关闭路径
- 操作后截图 + 观察 DOM 变化 → 推断状态变更规则

第四轮：状态发现（Playwright 脚本 + 截图对比）
- CSS 类名切换 → 推断状态（loading/disabled/active/error）
- 条件渲染区域 → 空状态/错误态/权限态
- 截图对比 → 识别不同状态下的视觉差异

第五轮：路径追踪（Playwright 脚本）
- 记录完整操作路径：点击 → 跳转 → 反馈
- 识别入口/出口节点（能进来但回不去的路径）
- 构建页面流转有向图

**输出维度 1：分析与评价**
- 完整性：主流程、分支流程、异常状态、空状态
- 一致性：交互逻辑、字段规则、文案风格跨页面统一性
- 合理性：结合行业经验判断设计是否反直觉/过度设计/逻辑冗余
- 量化性：找出模糊描述并建议具体阈值
- 逻辑闭环：状态流转（状态种类、转换条件、回退规则）

**输出维度 2：软件需求定义**
- 业务需求：背景 → 总体框架 → 核心目标
- 用户需求：操作路径 → 用户任务流 → 用例脚本
- 功能需求：输入约束、按钮交互、计算规则、页面跳转、接口触发、状态变更
- 非功能需求：性能、兼容性、安全性、约束

**约束**：
- 不做澄清建议（Clarifier 的事）
- 不做评审打分（Reviewer 的事）
- 所有判断标注经验来源

**输出**：`artifacts/_extraction.md`

---

### Agent 3: Clarifier（需求澄清师）

**输入**：`_extraction.md`

**职责**：产出可直接发给产品/开发的澄清清单

**工作流程**：

第一步：判定文档成熟度并匹配策略
- 无需求/一句话需求 → 主动梳理概要 → 群同步确认 → 明确预期值
- 有需求但粗糙 → 标红不明处 → 针对性问清 → 标注确认结论
- 有详细文档 → 梳理 → 不明确处找确认

第二步：按四类结构化归类
- 异常分支：源 + 问题 + 影响范围 + 建议澄清方式
- 边界值规则：源 + 问题 + 影响范围 + 建议澄清方式
- 状态机细节：源 + 问题 + 影响范围 + 建议澄清方式
- 隐性依赖：源 + 问题 + 影响范围 + 建议澄清方式

第三步：标注优先级
- 🔴 阻塞用例设计（必须先澄清才能写用例）
- 🟡 影响用例覆盖度（不澄清会影响异常/边界用例）
- 🟢 优化建议（不阻塞，但澄清后可提升质量）

**输出**：`artifacts/_clarifications.md`

---

### Agent 4: Reviewer（需求评审师）

**输入**：`_extraction.md` + `_clarifications.md`

**职责**：从测试人员视角进行需求评审

**三大抓手**：
- 流程合理性：指出断点、逻辑冲突、UX 死角
- 量化性：揪出模糊描述，要求具体阈值
- 隐性需求：基于显性描述推导未写明的必要逻辑

**分场景提问策略**：
- 新需求：多问为什么 → 背景 → 框架 → 当前困难 → 现方案
- 变更需求：重点问影响范围 → 旧功能影响 → 回归点 → 是否全量确认

**输出**：`artifacts/_review.md`

---

### 总控：聚合

总控读取四份产物文件，按以下结构聚合最终报告：

```
# 最终报告
## 1. 项目概述（来自 _parsed-content.md 的 [背景说明]）
## 2. 需求萃取（来自 _extraction.md 维度 2）
## 3. 分析与评价（来自 _extraction.md 维度 1）
## 4. 澄清清单（来自 _clarifications.md）
## 5. 评审意见（来自 _review.md）
```

**输出**：`artifacts/final-report.md`

---

## 目录结构

```
skills/harness/
  SKILL.md                  # 总控：状态机 + 调度逻辑
  agents/
    doc-reader-agent.md      # Agent 1 prompt
    extractor-agent.md       # Agent 2 prompt
    clarifier-agent.md       # Agent 3 prompt
    reviewer-agent.md        # Agent 4 prompt
  knowledge/
    exception-scenarios.md   # 常见异常场景库
    state-machines.md        # 状态机模式库
    boundary-checklist.md    # 边界值清单
    anti-patterns.md         # 行业反模式
    quantitative-baselines.md # 量化基准
  artifacts/                 # 运行时产物目录（空）
```

## 用户交互点

1. 输入：用户提供原型链接和/或文档路径
2. 确认门：Extractor 完成后，展示萃取摘要供用户确认
3. 最终输出：`final-report.md`

## 非目标

- 不涉及测试用例编写
- 不涉及测试计划制定
- 不涉及缺陷跟踪
- 不包含实现代码
