from dotenv import load_dotenv
from google import genai
from google.genai import types

from schemas import ClothingItemAnalysis


load_dotenv()
client = genai.Client()


ANALYSIS_PROMPT = """
Analyze the main clothing item in the image.

Return:

- name: a short, useful product name, such as
  "Gray Polo T-Shirt", "Black Leather Jacket", or "Blue Denim Jeans"
- category
- subcategory
- primary visible color
- pattern
- brand, only when a logo or brand name is visibly identifiable
- size, only when the size is explicitly visible

Color rules:

- Judge the actual visible fabric color, not the brand's usual colors.
- Do not guess navy merely because the garment has shadows.
- Use "Navy" only when the garment is visibly dark blue.
- A pale neutral garment with black-and-white fibers should be "Gray".
- Heather gray should be returned as "Gray".
- White backgrounds, shadows, logos, and trim must not determine the
  garment's primary color.
- When uncertain between gray and navy, choose gray unless the fabric
  clearly has a strong blue tone.

Name rules:

- Keep the name concise.
- Include the color and garment type.
- Include the brand only when it is confidently visible.
- Do not invent a brand or size.

Choose category and pattern only from the allowed schema values.
Return null for brand or size when they cannot be determined.
"""


def format_analysis(
    analysis: ClothingItemAnalysis,
) -> ClothingItemAnalysis:
    if analysis.name:
        analysis.name = analysis.name.strip()

    if analysis.color:
        analysis.color = analysis.color.strip().title()

    if analysis.brand:
        analysis.brand = analysis.brand.strip()

    if analysis.size:
        analysis.size = analysis.size.strip().upper()

    return analysis


def analyze_clothing_image(
    file_path: str,
) -> ClothingItemAnalysis:
    uploaded_file = client.files.upload(file=file_path)

    response = client.models.generate_content(
        model="gemini-flash-latest",
        contents=[
            uploaded_file,
            ANALYSIS_PROMPT,
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ClothingItemAnalysis,
            temperature=0.1,
        ),
    )

    return format_analysis(response.parsed)


def analyze_clothing_image_url(
    image_url: str,
) -> ClothingItemAnalysis:
    response = client.models.generate_content(
        model="gemini-flash-latest",
        contents=[
            image_url,
            ANALYSIS_PROMPT,
        ],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ClothingItemAnalysis,
            temperature=0.1,
        ),
    )

    return format_analysis(response.parsed)