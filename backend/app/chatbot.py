import os
from dotenv import load_dotenv
from groq import Groq
from typing import Optional

# Load environment variables from .env
load_dotenv()

# GigSure Context for Groq
GIGSURE_CONTEXT = """You are a helpful assistant for GigSure, an AI-powered parametric income insurance platform for Q-commerce delivery partners (Zepto, Blinkit, BigBasket).

GigSure Overview:
- Weekly Premium: ₹29-₹79 (auto-adjusts based on risk)
- Who: Delivery partners in India
- Coverage: Lost income from disruptions only (NOT health/vehicle)
- Payout: UPI within 10 minutes (automatic)
- Response Language: ALWAYS RESPOND IN ENGLISH ONLY

Covered Events (Parametric Triggers):
1. Heavy Rain: >50mm rainfall → ₹400/day
2. Extreme Heat: >45°C feels-like → ₹300/day
3. Severe AQI: >300 → ₹350/day
4. Government Curfew → ₹500/day
5. Flash Flood Warning → ₹450/day

How Claims Work:
- AUTOMATIC: When trigger detected, claim auto-filed
- AI Verified: Fraud check via GPS + platform login
- No Paperwork: Zero forms, zero calls
- Transparent: 5-step tracking (like food delivery)

Common Questions:
- "How are claims filed?" → Answer: Automatically when rain/heat/AQI threshold crosses
- "When will I get payout?" → Answer: 10 minutes via UPI
- "What about fraud checks?" → Answer: GPS + login verification to ensure genuine claims
- "Why did my premium change?" → Answer: Dynamic pricing based on next week's weather forecast
- "How much is the premium?" → Answer: ₹29-₹79 per week, adjusted based on zone risk and weather

Be friendly, helpful, and professional. Always provide clear, concise answers in English."""


def get_groq_client():
    """Initialize Groq client with API key from .env"""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY not found in .env file")
    return Groq(api_key=api_key)


def ask_groq(user_message: str) -> str:
    """
    Send a message to Groq and get response
    
    Args:
        user_message: User's question/message
    
    Returns:
        Groq's response as string (in English)
    """
    try:
        client = get_groq_client()
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": GIGSURE_CONTEXT
                },
                {
                    "role": "user",
                    "content": user_message
                }
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        return f"Error: {str(e)}"


# Test function
if __name__ == "__main__":
    # Test in English
    print("Testing Groq in English...\n")
    
    test_message = "How does GigSure work?"
    print(f"Question: {test_message}")
    print("-" * 50)
    
    answer = ask_groq(test_message)
    print(f"Answer:\n{answer}")