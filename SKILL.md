---
name: harness-proto-reading
description: Use when the user provides a prototype URL (HTML/web link) or requirement document and wants to extract, analyze, clarify, and review requirements from a QA/tester perspective. Triggers on phrases like 分析原型, 看需求, 评审需求, 萃取需求, 澄清需求, 看原型, or when the user pastes a web link and asks for analysis.
---

# Harness — 通用原型阅读与需求萃取

## 概述

一个 Harness 模式驱动的 Agent Skill（不绑定特定 Harness，见「工具适配层」）。接收原型链接和/或需求文档，
通过 4 个专业化子 Agent 完成：文档解析 → 原型萃取 → 需求澄清 → 需求评审，
最终聚合为一份综合报告。

## 核心口诀

```
看交互找功能，看字段找边界，看状态找流转，看缺口找澄清；
业务目标问背景，用户路径验闭环，模糊描述逼量化，隐性逻辑勤挖掘。
```

## 目录结构

```
skills/test-pro-generator/
  SKILL.md                       # 本文件（总控）
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
  scripts/
    validate-artifacts.mjs       # 产物质量门（Node，跨平台，权威）
    validate-artifacts.ps1       # 产物质量门（PowerShell，Windows 备选）
    playwright-explore-template.js  # 规范版 Playwright 探索脚本（含预算）
  tests/
    run-baseline.ps1             # 基线测试：用样例产物自检质量门
    fixtures/                    # mock 原型 + sample-run 样例产物
    scenarios/                   # 各 Agent 的基线测试场景
  artifacts/                     # 运行时产物目录（每次运行独立 RUN_DIR 子目录）
```

## 状态机

```
START → PARSE → EXTRACT → CLARIFY → REVIEW → AGGREGATE → DONE
  │       │        │
  │       │        └─ 用户确认门（展示萃取摘要，用户确认后继续）
  │       │
  │       └─ 无文档时跳过 PARSE，直接进入 EXTRACT
  │
  └─ 无原型链接但有文档时，EXTRACT 仅基于文档输出
```

## 工具适配层（Harness-agnostic）

本 Skill **不绑定任何特定 Harness**。所有 Agent 一律用下表的**抽象能力名**，运行时由你所在的 Harness 自行映射到具体工具。看到抽象能力名时，调用你手上对应的工具即可。

| 抽象能力 | 用途 | Qwen Code | Claude Code | Cursor | 通用回退 |
|---------|------|-----------|-------------|--------|---------|
| **READ** 读文件 | 读取本地文件 | `read_file` | `Read` | Read | 任意读文件工具 |
| **WRITE** 写文件 | 写/改本地文件 | `write_file` / `replace` | `Write` / `Edit` | Write / StrReplace | 任意写文件工具 |
| **FETCH** 网页抓取 | 取网页**文本/HTML**（无截图） | `web_fetch` | `WebFetch` | WebFetch | 任意 HTTP 抓取工具 |
| **SEARCH** 全文搜索 | 正则/全文检索 | `grep_search` | `Grep` | Grep | ripgrep / grep |
| **SHELL** 命令执行 | 跑命令（含安装/运行脚本） | `run_shell_command` | `Bash` | Shell | 任意终端工具 |
| **BROWSER** 浏览器自动化 | 导航/点击/填表/**截图** | Playwright(经 SHELL 跑脚本) | Playwright MCP **优先**，否则经 SHELL | Playwright MCP 优先，否则经 SHELL | Playwright |
| **SUBAGENT** 子 Agent 分派 | 派发专业化子任务 | Superpowers `@generalist` | `Task` / subagent | Task | 任意子 Agent 机制；**若无**则总控按顺序自行扮演各角色 |

**BROWSER 适配细则**：
- 若运行环境提供 **Playwright MCP**（如 Cursor / Claude Code 接入了 `playwright` server）→ **优先用 MCP 工具**做导航、快照、截图，无需手写脚本。
- 否则 → 经 **SHELL** 安装并运行本 Skill 生成的 Playwright 脚本（Qwen Code 路径）。优先复用 `scripts/playwright-explore-template.js`，按本次 `PROTO_URL` 与 `RUN_DIR` 调整。
- 两条路径产出一致：交互观察 + 截图存入 `RUN_DIR/screenshots/`。

**SUBAGENT 适配细则**：若 Harness 不支持真正的子 Agent，总控**自己依次扮演** DocReader→Extractor→Clarifier→Reviewer 四个角色（每个角色严格按对应 `agents/*.md` 的职责与约束执行），产物与质量门规则不变。

> 下文出现 `READ/WRITE/FETCH/SEARCH/SHELL/BROWSER/SUBAGENT` 等大写词时，按本表映射到你的具体工具。

---

## 调度总则

### 运行目录隔离（START 阶段先建立）

固定文件名会让多次运行互相覆盖。**每次运行开始时，先确定一个独立运行目录** `RUN_DIR`：

```
RUN_DIR = <产物根>/<YYYYMMDD-HHmm>-<项目名slug>/
```

- **产物根（base）**：默认 = **用户当前工作/项目目录**下的 `artifacts/`，**不是 skill 安装目录**。
  - 即：用户在某个真实项目里跑本 skill 时，产物写到「**那个项目**的 `artifacts/<run>/`」，与被分析的需求/原型同处一地，便于归档与衔接。
  - 仅当用户没有明确项目目录（纯链接、无本地工程）时，才回退到 skill 自带的 `artifacts/`。
- **`<YYYYMMDD-HHmm>` 中的 `HHmm` 必填**：同一天可能多次运行，缺了分钟数会目录撞车互相覆盖。例：`20260603-1425-ngsoc`。
- **项目名 slug**：取自文档标题或原型 URL 域名/路径；无法判定时用 `untitled`。可加固定前缀（如 `test-pro-`）但**不得省略 `HHmm`**。
- 之后所有产物都写入 `RUN_DIR`：`RUN_DIR/_parsed-content.md`、`RUN_DIR/_extraction.md`、`RUN_DIR/_clarifications.md`、`RUN_DIR/_review.md`、`RUN_DIR/final-report.md`、`RUN_DIR/screenshots/`。
- 分派子 Agent 时，**传入具体的 `RUN_DIR` 绝对/相对路径**，不再使用裸 `artifacts/_xxx.md`。
- 下文模板中的 `RUN_DIR/` 即代表本次运行目录。

### 路由逻辑

1. 用户提供文档文件 → 进入 **PARSE**（调度 Agent 1）
2. 用户提供原型链接 → 进入 **EXTRACT**（调度 Agent 2）
3. 两者都有 → PARSE → EXTRACT
4. 什么都没有 → 询问用户提供原型链接或文档

### 增量模式（既有测试资产）— 可选输入

若运行目录所在项目**已有测试资产**（如 `_analysis.md`、既有测试点清单 `TPxx`、既有用例/需求汇总），则进入**增量模式**：

- START 阶段顺带探测：在用户提供的项目目录及其 `artifacts/` 下，用 **SEARCH/READ** 找既有 `_analysis.md`、测试点编号（`TP\d+`）、`*需求汇总*` 等资产；找到则记下其路径，作为与 `_parsed-content.md` **同级的可选输入**传给后续各 Agent。
- 传给 **Extractor / Clarifier / Reviewer** 时附加一行：`既有测试资产：<路径列表>（如存在）`。各 Agent 的目标从「全量产出」转为「**对照既有资产产出增量**」：已覆盖的不重复罗列，重点输出新增/强化的测试点（沿用既有 `TPxx` 编号续编），并在产物中标注「相对 <既有资产> 的增量」。
- 无既有资产时跳过本模式，按全量产出。

> 增量模式让 skill 能融入**已在推进的项目**而非每次从零开始；这也是 `final-report` 末尾「与现有规划目录的衔接」节的来源（见 AGGREGATE 模板）。

### 调度方式

每个阶段使用 **SUBAGENT**（子 Agent，见「工具适配层」）执行；若环境无子 Agent，则总控自行扮演该角色：

1. 读取对应的 Agent prompt 文件完整内容
2. 将 prompt 内容 + 具体任务参数（文件路径 / URL）作为完整提示词分派给子 Agent
3. 等待子 Agent 完成并写回产物文件
4. **过产物质量门**（见下文，不是只检查「文件非空」）
5. 进入下一阶段

### 产物质量门

「文件已生成且非空」**不等于**「内容合格」。每个阶段产物必须通过对应的结构化校验才能进入下一阶段；不达标按「循环治理」规则最多重跑 1 次。

| 阶段 | 产物 | 必过校验项（缺一不可） |
|------|------|----------------------|
| PARSE | `_parsed-content.md` | ① 至少含 1 个 `[标签]` 章节；② 未输出空标签段；③ 含「来源文件」 |
| EXTRACT | `_extraction.md` | ① 含「维度 1：分析与评价」且 1.1–1.5 五小节齐全；② 含「维度 2：软件需求定义」且 2.1–2.4 齐全；③ 含「页面流转图」；④ 含「原型探索摘要」且各计数非占位符 `[N]`；⑤ 对照表中至少出现一次经验库来源标注（如「对照 anti-patterns.md」）；⑥ **截图底线**：`screenshots/` 至少 1 张主要页面基准截图，**或**摘要里明确写出 `snapshot-only` 原因 / 「环境无 BROWSER」（见 `extractor-agent.md`「探索模式」） |
| CLARIFY | `_clarifications.md` | ① 含「文档成熟度」判定；② 🔴🟡🟢 三级均出现；③ 每条澄清项「建议澄清方式」为完整问句而非占位符 |
| REVIEW | `_review.md` | ① 含「需求类型」判定；② 三大抓手（流程/量化/隐性）章节齐全；③ 含「发言稿速查」 |

**校验方法（优先自动化）**：每阶段产物落盘后，**优先调用校验脚本**，这是质量门的**权威判定**（脚本规则与上表一致，上表是人类可读镜像）：

```bash
# 跨平台首选（需 Node）
node scripts/validate-artifacts.mjs RUN_DIR
```

```powershell
# Windows 备选（需 PowerShell）
powershell -ExecutionPolicy Bypass -File scripts/validate-artifacts.ps1 -RunDir RUN_DIR
```

脚本会检查：必过结构锚点、未填模板占位符（如 `[N]`/`[位置]`/`[具体问题]`，但**不**误判合法的 TODO/省略号/页面流转 `[登录页]`）、以及补丁标记泄漏（`*** Add File:` 等）。退出码 `0` = 通过，`1` = 不达标。

> **脚本不覆盖的项需总控人工核对**：EXTRACT 第 ⑥ 项「截图底线」（`screenshots/` 是否有基准截图或已写明 snapshot-only 原因）脚本不查，由总控在确认门前用 **READ**/**SEARCH** 核对一次。

**若脚本均不可用**：用 **READ**/**SEARCH** 按上表逐项人工核对锚点章节存在、且模板占位符未原样残留。

**不达标处理**：把缺失项作为补充指令追加给同一子 Agent 重跑一次；仍不达标则继续流程，但在 `final-report.md` 顶部标注「⚠️ [阶段] 产物质量存疑：[缺失项]」。

### 成本控制（模型降级）

不同阶段任务复杂度差异很大，**不应一律用大模型**。若运行环境支持为子 Agent 指定模型，按下表降级：

| 阶段 | 任务性质 | 建议模型档位 |
|------|---------|------------|
| PARSE（DocReader） | 纯打标/抽取，确定性强 | **小模型**（快、省） |
| EXTRACT（Extractor） | 多轮探索 + 推理判断，最重 | **大模型** |
| CLARIFY（Clarifier） | 结构化归类 + 措辞 | 中/小模型 |
| REVIEW（Reviewer） | 综合推理 + 隐性需求挖掘 | 中/大模型 |

- 若环境不支持按 Agent 选模型，则至少**控制 EXTRACT 的探索预算**（见 `extractor-agent.md`）来约束成本，这是本 Skill 最大的 token 消耗源。
- 截图是显著成本项：遵守「截图 ≤ 40 张、同状态只截一次」。

### 循环治理（调度层兜底）

- **每个阶段单 Agent 最多重跑 1 次**：若产物未通过质量门（见下文「产物质量门」），重跑一次；仍不达标则带着已有产物继续并在最终报告标注「该阶段质量存疑」，**不得无限重试**。
- **EXTRACT 探索预算由子 Agent 自带**（见 `extractor-agent.md`「探索预算」）；调度层不再额外催促「更全面」，避免诱发无界探索。
- **确认门 = interrupt_before**：EXTRACT 后的暂停是唯一的人工审批点，是循环治理的关键控制阀。

### 用户确认门

在 EXTRACT 完成后，**必须暂停**并向用户展示萃取摘要：

```
萃取完成。关键发现：

**页面结构：** [N] 个页面，[N] 个弹窗
**字段规则：** [N] 个字段，其中 [N] 个必填
**状态发现：** [N] 个实体涉及状态流转
**缺失项：** [N] 个空状态未覆盖，[N] 个异常分支缺失
**模糊描述：** [N] 处需要量化
**反模式：** [N] 个设计问题

是否继续进入澄清和评审阶段？
```

用户确认后继续。用户拒绝则结束。

---

## 完整执行流程

### 阶段 1：PARSE（仅当用户提供文档时）

**前置条件：** 用户提供了 Word/PDF/Markdown 文档路径

**子 Agent 任务：**
读取 `agents/doc-reader-agent.md` 的完整内容，追加以下任务：

```
请读取以下文档并输出解析结果到 RUN_DIR/_parsed-content.md：

文档路径：[用户提供的绝对路径]
产物输出目录（RUN_DIR）：[本次运行目录]

技能文件位置：agents/doc-reader-agent.md
经验库目录：knowledge/
```

**检查：** 过 PARSE 质量门（见「产物质量门」），不达标按循环治理重跑 1 次

**如果无文档：** 跳过此阶段，直接进入 EXTRACT

---

### 阶段 2：EXTRACT（必执行）

**前置条件：** 用户提供了 HTML 原型链接

**子 Agent 任务：**
读取 `agents/extractor-agent.md` 的完整内容，追加以下任务：

```
请分析以下原型并输出到 RUN_DIR/_extraction.md：

原型链接：[用户提供的链接]
文档解析结果：RUN_DIR/_parsed-content.md（如不存在则忽略）
既有测试资产：[路径列表，如存在；增量模式用于对照，已覆盖的不重复罗列]
截图输出目录：RUN_DIR/screenshots/
产物输出目录（RUN_DIR）：[本次运行目录]
经验库目录：knowledge/

技能文件位置：agents/extractor-agent.md
```

**检查：** 过 EXTRACT 质量门（见「产物质量门」），不达标按循环治理重跑 1 次

**确认门：** 从 `_extraction.md` 中提取摘要信息，按上方模板展示给用户，等待确认

---

### 阶段 3：CLARIFY

**前置条件：** 用户已确认继续

**子 Agent 任务：**
读取 `agents/clarifier-agent.md` 的完整内容，追加以下任务：

```
请基于以下萃取报告生成澄清清单，输出到 RUN_DIR/_clarifications.md：

萃取报告：RUN_DIR/_extraction.md
既有测试资产：[路径列表，如存在；增量模式用于对照]
产物输出目录（RUN_DIR）：[本次运行目录]

技能文件位置：agents/clarifier-agent.md
```

**检查：** 过 CLARIFY 质量门（见「产物质量门」），不达标按循环治理重跑 1 次

---

### 阶段 4：REVIEW

**前置条件：** CLARIFY 完成

**子 Agent 任务：**
读取 `agents/reviewer-agent.md` 的完整内容，追加以下任务：

```
请基于以下报告生成评审意见，输出到 RUN_DIR/_review.md：

萃取报告：RUN_DIR/_extraction.md
澄清清单：RUN_DIR/_clarifications.md
既有测试资产：[路径列表，如存在；增量模式用于对照]
产物输出目录（RUN_DIR）：[本次运行目录]

技能文件位置：agents/reviewer-agent.md
```

**检查：** 过 REVIEW 质量门（见「产物质量门」），不达标按循环治理重跑 1 次

---

### 阶段 5：AGGREGATE

读取四份产物文件，聚合为最终报告。

**输出：** `RUN_DIR/final-report.md`

```markdown
# [项目名] 需求分析报告

> 生成时间：[当前时间]
> 原型链接：[URL]
> 文档来源：[文件名 或 「无」]

---

## 1. 项目概述

[来自 `_parsed-content.md` 的「背景说明」章节，如无则从 `_extraction.md` 的业务需求推导]

---

## 2. 需求萃取

### 2.1 业务需求
### 2.2 用户需求
### 2.3 功能需求
### 2.4 非功能需求

[来自 `_extraction.md` 维度 2]

---

## 3. 分析与评价

### 3.1 完整性
### 3.2 一致性
### 3.3 合理性
### 3.4 量化性
### 3.5 逻辑闭环

[来自 `_extraction.md` 维度 1]

---

## 4. 澄清清单

[来自 `_clarifications.md`]

---

## 5. 评审意见

[来自 `_review.md`]

---

## 6. 与现有规划目录的衔接（仅增量模式：检测到既有测试资产时输出）

[当 START 阶段命中「增量模式」时追加本节，把本次产物挂回既有项目目录，避免双轨脱节]

| 现有文件 | 本次补充 |
|---------|---------|
| [既有需求汇总/分析文件] | [本次合并/更新了什么] |
| [既有 _analysis.md / 测试点清单] | [新增/强化的 TPxx 增量] |
| `RUN_DIR/` | 本次 skill 完整产物 |

> 无既有测试资产（非增量模式）时省略本节。
```

---

## 禁止行为

- **跳过确认门**直接进入 CLARIFY（EXTRACT 完成后必须等待用户确认）
  - 即使用户说「快点」「直接给我最终报告」也必须停下展示摘要
  - 确认门不是「减速带」，是用户最后纠正萃取方向的机会
  - 违反此规则视为严重越权
- 子 Agent 越界做其他 Agent 的职责（如 Extractor 写澄清建议）
- 在有文档的情况下跳过 PARSE 直接进入 EXTRACT
- 输出产物到本次 `RUN_DIR` 以外的目录（产物一律落在「运行目录隔离」确定的 `RUN_DIR/` 内；`RUN_DIR` 的 base 见「运行目录隔离」，真实项目里就是该项目的 `artifacts/`）
- 在用户未提供任何输入时自行编造原型内容
