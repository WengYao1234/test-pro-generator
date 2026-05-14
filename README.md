# Harness — 通用原型阅读与需求萃取

基于 **Harness 设计模式** 的 Superpowers Skill。输入原型链接/需求文档，输出一份完整的需求分析报告。

## 一句话

> 给链接 → 全自动出报告：交互萃取、需求澄清、边界评审，QA 视角一站式完成。

## 解决了什么问题

传统需求分析中，QA 需要手工翻阅原型、对照文档、逐条梳理边界和异常场景，耗时且容易遗漏。Harness 将这个过程自动化：
- **原型自动遍历**：解析导航、填写表单、触发状态变更，完整提取交互逻辑
- **行业经验驱动**：内置异常场景库、状态机模式库、边界值清单、反模式库、量化基准
- **双维度输出**：同时产出「分析与评价」和「软件需求定义」
- **直接可用的澄清清单**：按优先级分级，可直接发给产品/开发确认

## 4-Agent 架构

```
SKILL.md (总控/Orchestrator)
├─ Agent 1: 文档解析师 (DocReader)    → _parsed-content.md
├─ Agent 2: 原型萃取师 (Extractor)    → _extraction.md
├─ Agent 3: 需求澄清师 (Clarifier)    → _clarifications.md
├─ Agent 4: 需求评审师 (Reviewer)     → _review.md
└─ 总控聚合                          → final-report.md
```

## 状态机

```
START → PARSE → EXTRACT → CLARIFY → REVIEW → AGGREGATE → DONE
```

| 输入组合 | 路由 |
|---------|------|
| 仅原型链接 | 跳过 PARSE，直接 EXTRACT |
| 仅文档 | PARSE → EXTRACT（无 HTML 抓取） |
| 原型 + 文档 | PARSE → EXTRACT（双源合并） |

## 核心口诀

```
看交互找功能，看字段找边界，看状态找流转，看缺口找澄清；
业务目标问背景，用户路径验闭环，模糊描述逼量化，隐性逻辑勤挖掘。
```

## 目录结构

```
test-pro-generator/
├── README.md                     # 本文件
├── SKILL.md                      # 总控（Orchestrator）
├── agents/
│   ├── doc-reader-agent.md       # Agent 1: 文档解析师
│   ├── extractor-agent.md        # Agent 2: 原型萃取师（核心）
│   ├── clarifier-agent.md        # Agent 3: 需求澄清师
│   └── reviewer-agent.md         # Agent 4: 需求评审师
├── knowledge/                    # 行业经验库
│   ├── exception-scenarios.md    # 常见异常场景库
│   ├── state-machines.md         # 状态机模式库
│   ├── boundary-checklist.md     # 边界值清单
│   ├── anti-patterns.md          # 行业反模式
│   └── quantitative-baselines.md # 量化基准
├── artifacts/                    # 运行时产物
├── docs/                         # 文档
└── tests/                        # 测试
```

## 触发词

说以下任意短语即可激活：

> 分析原型 · 看需求 · 评审需求 · 萃取需求 · 澄清需求 · 看原型

或直接粘贴一个网页链接请求分析。

## 在 QA 流程中的位置

```
需求分析 → 需求评审 → 统一文档产出 → [测试计划 → 用例编写 → ...]
  ↑          ↑           ↑
  └─ Harness 覆盖 ───────┘
```

Harness 覆盖 QA 流程的前 3 个阶段，后续阶段（测试计划、用例编写、冒烟测试等）不在本 Skill 范围内。

## 依赖

- **Qwen Code**（Superpowers 扩展已安装）
- **Playwright**（用于 HTML 原型交互探索，运行时自动安装到 artifacts 目录）
