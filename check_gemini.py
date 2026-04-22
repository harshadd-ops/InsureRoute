"""Diagnostic — finds models that explicitly support generateContent."""
import os, requests
from dotenv import load_dotenv

load_dotenv('.env', override=True)
api_key = os.environ.get('GEMINI_API_KEY', '').strip()
print(f"Key: ...{api_key[-8:]}\n")

BASE = "https://generativelanguage.googleapis.com/v1beta"

# Get all models with their supported methods
r = requests.get(f"{BASE}/models", params={"key": api_key}, timeout=15)
models = r.json().get("models", [])

print("=== Models supporting generateContent ===")
generate_models = []
for m in models:
    methods = m.get("supportedGenerationMethods", [])
    if "generateContent" in methods:
        name = m["name"].replace("models/", "")
        generate_models.append(name)
        print(f"  {name}")

print(f"\n=== Testing {len(generate_models)} eligible models ===")
for model_name in generate_models:
    url = f"{BASE}/models/{model_name}:generateContent"
    payload = {"contents": [{"parts": [{"text": "Say: OK"}]}]}
    r = requests.post(url, params={"key": api_key}, json=payload, timeout=20)
    if r.ok:
        text = r.json()["candidates"][0]["content"]["parts"][0]["text"]
        print(f"  SUCCESS → {model_name}: {text.strip()[:60]}")
        break
    else:
        print(f"  FAILED  → {model_name}: {r.status_code} {r.json().get('error',{}).get('message','')[:80]}")
