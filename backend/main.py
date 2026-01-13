import base64
import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
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

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def encode_image(image_file):
    return base64.b64encode(image_file.read()).decode('utf-8')

@app.post("/analyze")
async def analyze_chart(
    file: UploadFile = File(...),
    strategy: str = Form(...) 
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    base64_image = encode_image(file.file)
    data_url = f"data:image/jpeg;base64,{base64_image}"

    # The AI Persona + Your Strategy
    system_prompt = f"""
    You are a professional trading mentor.
    Analyze this chart image specifically looking for setups that match MY STRATEGY below.
    
    MY STRATEGY RULES:
    "{strategy}"
    
    If the chart matches my rules:
    1. Identify WHERE the setup is.
    2. Give a specific TRADE PLAN (Entry, Stop Loss, Take Profit).
    3. Explain WHY it is a valid setup.
    
    If it does NOT match, say "No Setup Found" and explain why.
    """

    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": system_prompt},
                        {
                            "type": "image_url", 
                            "image_url": {"url": data_url}
                        }
                    ]
                }
            ],
            # FIX: The new standard model for 2026 Vision tasks
            model="meta-llama/llama-4-scout-17b-16e-instruct", 
            temperature=0.1,
        )
        
        analysis = chat_completion.choices[0].message.content
        return {"analysis": analysis}

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)