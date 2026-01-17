# 📉 ChatWhisperer-Pro: AI Chart Analyst & Signal Bot

![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![Telegram](https://img.shields.io/badge/Telegram-Bot%20API-blue)
![AI Vision](https://img.shields.io/badge/AI-Computer%20Vision-violet)
![Trading](https://img.shields.io/badge/Asset-Forex%20%7C%20Crypto-green)

**ChatWhisperer-Pro** is an automated technical analysis engine that converts static chart screenshots into actionable trading signals. 

Users upload chart images (from TradingView/MT5), and the AI applies custom strategy logic to identify **Buy/Sell setups, Entry Prices, Stop Losses, and Targets**. These signals are instantly formatted and broadcast to a designated **Telegram Channel** via bot integration.

---

## 🚀 Key Features

- **👁️ Visual Pattern Recognition:** Uses Multimodal AI (Vision LLMs) to analyze chart screenshots for price action patterns (Support/Resistance, Trendlines, Candle formations).
- **🧠 "My-Strategy" Engine:** Applies your specific custom trading rules to the visual data to validate setups (e.g., "Only buy if price > EMA 200").
- **📲 Instant Telegram Signals:**
  - Automatically formats the analysis into a clean trade card.
  - Sends alerts to your private group or channel via the Telegram Bot API.
- **🎯 Precision Targets:** Automatically calculates Risk:Reward ratios to suggest logical Stop Loss (SL) and Take Profit (TP) levels.
- **📂 Bulk Analysis:** Upload multiple charts at once; the bot queues them and sends signals sequentially.

---

## 🛠️ Workflow

```mermaid
graph LR
    A[User Uploads Chart] -->|Image| B(AI Vision Engine)
    B -->|Extract Price Action| C{Strategy Logic}
    C -->|Setup Found?| D[Calculate Entry/SL/TP]
    D -->|Format Message| E[Telegram Bot]
    E -->|Push Notification| F((Telegram Channel))
