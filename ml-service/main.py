import os
import tempfile

from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Response
from fastapi.middleware.cors import CORSMiddleware
from google.genai.errors import ClientError
from schemas import ImageUrlRequest, CategoryType
from segmentation import crop_clothing_item
from gemini_client import (
    analyze_clothing_image,
    analyze_clothing_image_url,
    download_image_bytes,
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
        "http://localhost:5175"
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
        return analyze_clothing_image(temp_path)
    except ClientError as error:
        status_code = getattr(error, "code", None) or 502
        if status_code == 429:
            raise HTTPException(status_code=429, detail="Gemini API quota exceeded. Please wait and try again.") from error
        raise HTTPException(status_code=502, detail=f"Gemini API request failed: {error}") from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {error}") from error
    finally:
        os.remove(temp_path)

@app.post("/analyze-url")
async def analyze_image_url(request: ImageUrlRequest):
    try:
        return analyze_clothing_image_url(request.image_url)

    except ClientError as error:
        status_code = getattr(error, "code", None) or 502

        if status_code == 429:
            raise HTTPException(
                status_code=429,
                detail="Gemini API quota exceeded. Please wait and try again."
            ) from error

        raise HTTPException(
            status_code=502,
            detail=f"Gemini API request failed: {error}"
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Image analysis failed: {error}"
        ) from error
        
@app.post("/crop")
async def crop_image(
    image: UploadFile = File(...),
    category: CategoryType = Form(...),
):
    contents = await image.read()

    try:
        cropped_bytes = crop_clothing_item(contents, category)
        return Response(content=cropped_bytes, media_type="image/png")
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Cropping failed: {error}") from error
    
@app.post("/crop-url")
async def crop_image_url(request: ImageUrlRequest, category: CategoryType):
    try:
        image_bytes, _content_type = download_image_bytes(request.image_url)
        cropped_bytes = crop_clothing_item(image_bytes, category)
        return Response(content=cropped_bytes, media_type="image/png")
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Cropping failed: {error}") from error