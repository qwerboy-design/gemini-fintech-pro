---
description: Python 開發、腳本與 RAG 系統設計
alwaysApply: true
globs: **/*.py
---

# Python Development Rules

## 概述
此規則適用於所有 Python 開發、腳本編寫與 RAG（Retrieval-Augmented Generation）系統設計相關的工作。

## 規範項目

- **Docstrings**: 使用 Google Style Docstrings。
- **Libraries**: 優先使用您熟悉的庫 (e.g., `pandas` for data, `langchain`/`openai` for LLM)。
- **Configuration**: 不要將 API Key 硬編碼，強制使用環境變數 (`.env`)。
- **Type Hints**: 所有函數必須使用 Type Hints（`typing` 模組）。
- **Error Handling**: 使用明確的 `try-except` 區塊，避免裸 `except:`。

## RAG 特定規範

- **Chunk Size**: 文件分割時，建議 chunk size 為 512-1024 tokens。
- **Embedding Model**: 根據資料特性選擇適合的 embedding 模型。
- **Context Window**: 注意 LLM 的 context window 限制，適當管理對話歷史。

## 安全考量

- **API Keys**: 絕不提交 API Key 至版本控制系統。
- **敏感資料**: 處理金融資料時，需遵守資料隱私法規（GDPR/個資法）。
