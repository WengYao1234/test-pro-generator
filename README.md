# Harness — 通用原型阅读与需求萃取

基于 **Harness 设计模式** 的 Agent Skill（**不绑定特定 Harness**，可在 Qwen Code / Claude Code / Cursor 等环境运行）。输入原型链接/需求文档，输出一份完整的需求分析报告。

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
├── artifacts/                    # 运行时产物（每次运行独立子目录 <时间戳>-<项目名>/，避免覆盖）
├── scripts/
│   ├── validate-artifacts.mjs    # 产物质量门（Node，跨平台，权威）
│   ├── validate-artifacts.ps1    # 产物质量门（PowerShell，Windows 备选）
│   └── playwright-explore-template.js  # 规范版 Playwright 探索脚本（含探索预算）
├── docs/                         # 设计文档（SDD plan/spec）
└── tests/
    ├── run-baseline.ps1          # 基线测试：用样例产物自检质量门
    ├── fixtures/                 # mock 原型 + sample-run 样例产物
    └── scenarios/                # 各 Agent 的基线测试场景
```

## 质量门自检

```bash
# 跨平台（需 Node）
node scripts/validate-artifacts.mjs tests/fixtures/sample-run
# Windows（需 PowerShell）
powershell -ExecutionPolicy Bypass -File tests/run-baseline.ps1
```

校验内容：结构锚点齐全、无未填模板占位符、无补丁标记泄漏。退出码 `0`=通过，`1`=不达标。

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

## 运行治理（Harness 缰绳）

- **探索预算**：Extractor 受页面 ≤15 / 控件采样 ≤20 / 截图 ≤40 上限约束，无新增即早停，防止 token 爆炸。
- **质量门**：每阶段产物按结构化锚点校验（非「文件非空」），不达标重跑 1 次，仍不达标则在报告标注「质量存疑」。
- **确认门**：EXTRACT 后必须暂停等用户确认（唯一人工审批点）。
- **成本降级**：DocReader 用小模型、Extractor 用大模型（环境支持时）。
- **产物隔离**：每次运行独立 `RUN_DIR`，互不覆盖。

## 工具适配（Harness-agnostic）

所有 Agent 用**抽象能力名**（READ / WRITE / FETCH / SEARCH / SHELL / BROWSER / SUBAGENT），运行时由所在 Harness 映射到具体工具——映射表见 `SKILL.md`「工具适配层」。

- **READ/WRITE/FETCH/SEARCH/SHELL**：对应各 Harness 的读写/抓取/搜索/命令工具（如 Qwen 的 `read_file`/`web_fetch`，Claude 的 `Read`/`WebFetch`，Cursor 的 Read/Shell 等）。
- **BROWSER**：有 Playwright MCP 时优先用 MCP；否则经 SHELL 运行 Playwright 脚本。两者产出一致。
- **SUBAGENT**：无子 Agent 机制时，总控自行依次扮演四个角色。

## 工具边界

- **截图只能由 BROWSER（Playwright）产出**；FETCH 仅取文本/HTML，**无截图能力**。
- SHELL 仅用于安装/调用 Playwright 与运行本技能生成的探索脚本，不做删除等危险操作。

## 可执行工具

- `scripts/validate-artifacts.ps1 -RunDir <RUN_DIR>`：校验 `_parsed-content.md`、`_extraction.md`、`_clarifications.md`、`_review.md` 是否存在、非空、包含关键结构标记，并检查常见占位符残留。
- `scripts/playwright-explore-template.js`：无 Playwright MCP 时的探索脚本模板。运行方式：`node scripts/playwright-explore-template.js <PROTO_URL> <RUN_DIR>`，或设置 `PROTO_URL` / `RUN_DIR` 环境变量。
- `tests/run-baseline.ps1`：最小基线验收，使用 `tests/fixtures/sample-run/` 验证产物校验器。

## 依赖

- **任意支持工具调用的 Agent Harness**：Qwen Code、Claude Code、Cursor 等均可（按「工具适配层」映射）。
- **Playwright**：用于 HTML 原型交互探索与截图。有 Playwright MCP 直接用；否则运行时经 SHELL 自动安装。截图输出到 `RUN_DIR/screenshots/`。
