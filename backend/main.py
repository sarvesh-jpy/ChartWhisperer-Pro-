import base64
import os
import requests
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from supabase import create_client, Client
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONFIGURATION ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
TELEGRAM_TOKEN = os.getenv("TELEGRAM_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

# Initialize Clients
groq_client = Groq(api_key=GROQ_API_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL else None

# Data Model for Saving
class JournalEntry(BaseModel):
    pair: str
    bias: str
    entry: int
    stop_loss: int
    take_profit: int
    analysis_text: str

def send_telegram_alert(entry: JournalEntry):
    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
        return
    
    message = (
        f"🚨 <b>TRADING SETUP FOUND!</b> 🚨\n\n"
        f"📉 <b>Pair:</b> {entry.pair}\n"
        f"🐂/🐻 <b>Bias:</b> {entry.bias}\n"
        f"💰 <b>Entry:</b> {entry.entry}\n"
        f"🛑 <b>Stop Loss:</b> {entry.stop_loss}\n"
        f"🎯 <b>Take Profit:</b> {entry.take_profit}\n\n"
        f"<i>Check ChartWhisperer for full analysis.</i>"
    )
    
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    payload = {"chat_id": TELEGRAM_CHAT_ID, "text": message, "parse_mode": "HTML"}
    requests.post(url, json=payload)

def encode_image(image_file):
    return base64.b64encode(image_file.read()).decode('utf-8')

@app.post("/analyze")
async def analyze_chart(
    file: UploadFile = File(...),
    strategy: str = Form(...) 
):
    # ... (Keep your existing analyze logic here) ...
    # Copy/Paste the logic from the previous step inside here
    # Start of previous logic
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    base64_image = encode_image(file.file)
    data_url = f"data:image/jpeg;base64,{base64_image}"

    system_prompt = f"""
    You are a professional trading mentor.
    Analyze this chart image specifically looking for setups that match MY STRATEGY below.
    
    MY STRATEGY RULES:
    "{strategy}"

    Give me a BOS structure trend and matches with my support and resistance 
    If the chart matches my rules, provide the output in this EXACT format (so I can parse it):
    PAIR: [Asset Name]
    BIAS: [Bullish/Bearish]
    ENTRY: [Price]
    SL: [Price]
    TP: [Price]
    ANALYSIS: [Full Explanation]

    If no setup, just say "No Setup Found".
    """

    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": system_prompt},
                        {
                            "type": "image_url", "image_url": {"url": data_url}
                        }
                    ]
                }
            ],
            model="meta-llama/llama-4-scout-17b-16e-instruct", 
            temperature=0.1,
        )
        return {"analysis": chat_completion.choices[0].message.content}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    # End of previous logic

@app.post("/save")
async def save_entry(entry: JournalEntry):
    try:
        # 1. Save to Supabase
        if supabase:
            supabase.table("journal").insert({
                "pair": entry.pair,
                "bias": entry.bias,
                "entry": entry.entry,
                "stop_loss": entry.stop_loss,
                "take_profit": entry.take_profit,
                "analysis_text": entry.analysis_text
            }).execute()
        
        # 2. Send Telegram Alert
        send_telegram_alert(entry)
        
        return {"status": "success", "message": "Journaled and Alerted!"}
    
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)