import os
import tempfile

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google.genai.errors import ClientError
from schemas import ImageUrlRequest
from gemini_client import (
    analyze_clothing_image,
    analyze_clothing_image_url,
)

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze")
async def analyze_image(image: UploadFile = File(...)):
    contents = await image.read()

    _, extension = os.path.splitext(image.filename or "")

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=extension,
    ) as temp_file:
        temp_file.write(contents)
        temp_path = temp_file.name

    try:
        analysis = analyze_clothing_image(temp_path)
        return analysis
    finally:
        os.remove(temp_path)

@app.post("/analyze-url")
async def analyze_image_url(request: ImageUrlRequest):
    try:
        return analyze_clothing_image_url(request.image_url)

    except ClientError as e:
        raise HTTPException(
            status_code=429,
            detail="Gemini API quota exceeded. Please try again shortly."
        )