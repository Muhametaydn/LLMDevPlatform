from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="LLM Dev Platform - AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class CodeRequest(BaseModel):
    code: str
    language: str


class LLMResponse(BaseModel):
    success: bool
    result: str = None
    error: str = None


def get_unit_test_prompt(code: str, language: str) -> str:
    frameworks = {
        "python": "pytest",
        "csharp": "xUnit",
        "java": "JUnit 5"
    }
    framework = frameworks.get(language, "uygun framework")
    lang_upper = language.upper()
    
    prompt = f"""Sen deneyimli bir test muhendisisin. Asagidaki {lang_upper} kodu icin {framework} kullanarak birim testleri yaz.

Kod:
{code}

Kurallar:
- Her fonksiyon icin en az 2 test yaz
- Edge caseleri test et
- Turkce yorum satirlari ekle
- Sadece test kodunu ver, aciklama ekleme"""
    
    return prompt


def get_code_explanation_prompt(code: str, language: str) -> str:
    lang_upper = language.upper()
    
    prompt = f"""Sen deneyimli bir yazilim egitimcisisin. Asagidaki {lang_upper} kodunu Turkce olarak detayli acikla.

Kod:
{code}

Sunlari acikla:
1. Kodun genel amaci
2. Her fonksiyonun ne yaptigi
3. Onemli degiskenler
4. Akis mantigi"""
    
    return prompt


def get_ui_test_prompt(code: str, language: str) -> str:
    lang_upper = language.upper()
    
    prompt = f"""Sen deneyimli bir QA muhendisisin. Asagidaki {lang_upper} kodu icin UI test senaryolari oner.

Kod:
{code}

Her senaryo icin:
- Test adi
- On kosullar
- Test adimlari
- Beklenen sonuc

Turkce yaz."""
    
    return prompt


def call_openai(prompt: str) -> str:
    response = client.chat.completions.create(
        model="gpt-4.1-nano",
        messages=[
            {"role": "system", "content": "Sen yardimci bir yazilim asistanisin."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=2000,
        temperature=0.3
    )
    return response.choices[0].message.content


@app.get("/")
async def root():
    return {"status": "running", "service": "LLM Dev Platform"}


@app.get("/health")
async def health():
    return {"status": "healthy", "openai_configured": bool(os.getenv("OPENAI_API_KEY"))}


@app.post("/generate/unit-test", response_model=LLMResponse)
async def generate_unit_test(request: CodeRequest):
    try:
        prompt = get_unit_test_prompt(request.code, request.language)
        result = call_openai(prompt)
        return LLMResponse(success=True, result=result)
    except Exception as e:
        return LLMResponse(success=False, error=str(e))


@app.post("/generate/code-explanation", response_model=LLMResponse)
async def generate_code_explanation(request: CodeRequest):
    try:
        prompt = get_code_explanation_prompt(request.code, request.language)
        result = call_openai(prompt)
        return LLMResponse(success=True, result=result)
    except Exception as e:
        return LLMResponse(success=False, error=str(e))


@app.post("/generate/ui-test", response_model=LLMResponse)
async def generate_ui_test(request: CodeRequest):
    try:
        prompt = get_ui_test_prompt(request.code, request.language)
        result = call_openai(prompt)
        return LLMResponse(success=True, result=result)
    except Exception as e:
        return LLMResponse(success=False, error=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)