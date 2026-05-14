---
name: harness-proto-reading
description: Use when the user provides a prototype URL (HTML/web link) or requirement document and wants to extract, analyze, clarify, and review requirements from a QA/tester perspective. Triggers on phrases like 分析原型, 看需求, 评审需求, 萃取需求, 澄清需求, 看原型, or when the user pastes a web link and asks for analysis.
---

# Harness — 通用原型阅读与需求萃取

## 概述

一个 Harness 模式驱动的 Superpowers Skill。接收原型链接和/或需求文档，
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
  artifacts/                     # 运行时产物目录
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

## 调度总则

### 路由逻辑

1. 用户提供文档文件 → 进入 **PARSE**（调度 Agent 1）
2. 用户提供原型链接 → 进入 **EXTRACT**（调度 Agent 2）
3. 两者都有 → PARSE → EXTRACT
4. 什么都没有 → 询问用户提供原型链接或文档

### 调度方式

每个阶段使用子 Agent（`@generalist`）执行：

1. 读取对应的 Agent prompt 文件完整内容
2. 将 prompt 内容 + 具体任务参数（文件路径 / URL）作为完整提示词分派给子 Agent
3. 等待子 Agent 完成并写回产物文件
4. 检查产物文件是否已生成且非空
5. 进入下一阶段

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
请读取以下文档并输出解析结果到 artifacts/_parsed-content.md：

文档路径：[用户提供的绝对路径]

技能文件位置：agents/doc-reader-agent.md
经验库目录：knowledge/
```

**检查：** 确认 `artifacts/_parsed-content.md` 已生成且文件大小 > 0

**如果无文档：** 跳过此阶段，直接进入 EXTRACT

---

### 阶段 2：EXTRACT（必执行）

**前置条件：** 用户提供了 HTML 原型链接

**子 Agent 任务：**
读取 `agents/extractor-agent.md` 的完整内容，追加以下任务：

```
请分析以下原型并输出到 artifacts/_extraction.md：

原型链接：[用户提供的链接]
文档解析结果：artifacts/_parsed-content.md（如不存在则忽略）
经验库目录：knowledge/

技能文件位置：agents/extractor-agent.md
```

**检查：** 确认 `artifacts/_extraction.md` 已生成且文件大小 > 0

**确认门：** 从 `_extraction.md` 中提取摘要信息，按上方模板展示给用户，等待确认

---

### 阶段 3：CLARIFY

**前置条件：** 用户已确认继续

**子 Agent 任务：**
读取 `agents/clarifier-agent.md` 的完整内容，追加以下任务：

```
请基于以下萃取报告生成澄清清单，输出到 artifacts/_clarifications.md：

萃取报告：artifacts/_extraction.md

技能文件位置：agents/clarifier-agent.md
```

**检查：** 确认 `artifacts/_clarifications.md` 已生成且文件大小 > 0

---

### 阶段 4：REVIEW

**前置条件：** CLARIFY 完成

**子 Agent 任务：**
读取 `agents/reviewer-agent.md` 的完整内容，追加以下任务：

```
请基于以下报告生成评审意见，输出到 artifacts/_review.md：

萃取报告：artifacts/_extraction.md
澄清清单：artifacts/_clarifications.md

技能文件位置：agents/reviewer-agent.md
```

**检查：** 确认 `artifacts/_review.md` 已生成且文件大小 > 0

---

### 阶段 5：AGGREGATE

读取四份产物文件，聚合为最终报告。

**输出：** `artifacts/final-report.md`

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
```

---

## 禁止行为

- **跳过确认门**直接进入 CLARIFY（EXTRACT 完成后必须等待用户确认）
  - 即使用户说「快点」「直接给我最终报告」也必须停下展示摘要
  - 确认门不是「减速带」，是用户最后纠正萃取方向的机会
  - 违反此规则视为严重越权
- 子 Agent 越界做其他 Agent 的职责（如 Extractor 写澄清建议）
- 在有文档的情况下跳过 PARSE 直接进入 EXTRACT
- 输出产物到 artifacts/ 以外的目录
- 在用户未提供任何输入时自行编造原型内容
