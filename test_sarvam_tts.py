import os
import base64
from pathlib import Path
from dotenv import load_dotenv

# 1. Load environment variables from .env
env_file = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_file)

api_key = os.environ.get("SARVAM_API_KEY")
if not api_key:
    raise RuntimeError("SARVAM_API_KEY environment variable is not set. Check your .env file.")

# 2. Initialize Sarvam AI SDK without hardcoding or printing the secret key
from sarvamai import SarvamAI

client = SarvamAI(api_subscription_key=api_key)

# 3. Text to synthesize for Tara Soundbox / Teammate announcement
text_to_synthesize = "नमस्ते! तारा एआई में आपका स्वागत है। आपका पेटीएम साउंडबॉक्स सफलतापूर्वक कनेक्ट हो गया है।"
language_code = "hi-IN"
model_name = "bulbul:v3"

print("=" * 60)
print("🚀 Initiating first Sarvam AI API call...")
print(f"• Model: {model_name}")
print(f"• Language: {language_code}")
print(f"• Text: {text_to_synthesize}")
print("=" * 60)

# 4. Make Text-to-Speech API call
response = client.text_to_speech.convert(
    text=text_to_synthesize,
    language_code=language_code,
    model=model_name,
    output_audio_codec="wav"
)

# 5. Extract and save audio file
if not response.audios or len(response.audios) == 0:
    print("❌ No audio received from Sarvam API.")
    exit(1)

audio_base64 = response.audios[0]
audio_bytes = base64.b64decode(audio_base64)

output_filename = "tara_sarvam_welcome.wav"
output_path = Path(__file__).parent / output_filename
with open(output_path, "wb") as f:
    f.write(audio_bytes)

print("\n🎉 Call Succeeded!")
print(f"• Output File: {output_path.resolve()}")
print(f"• Audio Size: {len(audio_bytes)} bytes")
print(f"• Content Format: WAV (Linear PCM / {language_code})")
print("=" * 60)
