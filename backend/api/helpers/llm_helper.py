import requests
import os
from typing import Optional
from trilux.config import Config as config
from google import genai

def call_gemini_api(prompt: str) -> dict:
    """
    Call the Gemini API with a text prompt.
    
    Args:
        prompt: The text prompt to send to Gemini
    
    Returns:
        The API response as a dictionary
    """
    api_key = config.GEMINI_API_KEY
    
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set in environment")
    
    url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent"
    
    headers = {
        "x-goog-api-key": api_key,
        "Content-Type": "application/json"
    }
    
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt
                    }
                ]
            }
        ]
    }
    
    response = requests.post(url, json=payload, headers=headers)
    parsed = response.json()
    return parsed["candidates"][0]["content"]["parts"][0]["text"]


def call_gemini_sdk(prompt: str, temperature: float = 0.0) -> str:
    client = genai.Client(api_key=config.GEMINI_API_KEY)
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config={"temperature": temperature},
    )
    return response.text

def call_llm(prompt, model=None, temperature=0.0):
    # Deterministic by default (temperature=0): a security scanner must produce
    # reproducible findings so scans can be diffed, gated in CI, and trended.
    if not model:# "lily":
        payload = {
                "model": config.LLM_MODEL_NAME,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": temperature,
                "max_tokens": -1,
                "stream": False
            }

        llm_response = requests.post(
                config.LLM_API_URL,
                headers={"Content-Type": "application/json"},
                json=payload,
                verify=False
            )

        if llm_response.status_code == 200:
            content = llm_response.json().get("choices", [{}])[0].get("message", {}).get("content", "")
            return content
        else:
            raise Exception(f"LLM API call failed with status code {llm_response.status_code}")
    else:
        return call_gemini_sdk(prompt, temperature=temperature)