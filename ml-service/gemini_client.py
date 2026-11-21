import ipaddress
import logging
import socket
from urllib.parse import urlparse

import httpx

from dotenv import load_dotenv
from google import genai
from google.genai import types

from schemas import ClothingItemAnalysis
from pydantic import ValidationError


load_dotenv()
client = genai.Client()
logger = logging.getLogger("mixmatch.gemini")


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

ALLOWED_SCHEMES = {"http", "https"}
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB
DOWNLOAD_TIMEOUT = httpx.Timeout(5.0, read=10.0)

def _is_safe_host(hostname: str) -> bool:
    try:
        infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        return False

    resolved_ips = [ipaddress.ip_address(info[4][0]) for info in infos]

    real_ips = [ip for ip in resolved_ips if not ip.is_unspecified]

    if not real_ips:
        return False

    for ip in real_ips:
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
            return False

    return True

def download_image_bytes(image_url: str) -> tuple[bytes, str]:
    """
    Downloads an image from a URL server-side, with SSRF protections.
    Returns (image_bytes, content_type).
    """
    parsed = urlparse(image_url)

    if parsed.scheme not in ALLOWED_SCHEMES:
        raise ValueError("Only http/https URLs are supported.")

    if not parsed.hostname:
        raise ValueError("The URL is missing a valid host.")

    if not _is_safe_host(parsed.hostname):
        raise ValueError("This URL cannot be accessed.")

    try:
        with httpx.Client(timeout=DOWNLOAD_TIMEOUT, follow_redirects=False) as http_client:
            response = http_client.get(image_url)
            response.raise_for_status()
    except httpx.HTTPStatusError as error:
        raise ValueError(
            f"Could not download image (HTTP {error.response.status_code})."
        ) from error
    except httpx.RequestError as error:
        raise ValueError(f"Could not download image: {error}") from error

    content_type = response.headers.get("content-type", "").split(";")[0].strip().lower()
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError(f"Unsupported image type: {content_type or 'unknown'}")

    if len(response.content) > MAX_IMAGE_BYTES:
        raise ValueError("Image is too large (max 10 MB).")

    return response.content, content_type

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

def _parse_analysis(response) -> ClothingItemAnalysis:
    try:
        analysis = response.parsed
    except ValidationError as error:
        logger.warning(
            "gemini_validation_error raw_text=%r errors=%s",
            getattr(response, "text", None),
            error.errors(),
        )
        raise ValueError(
            "Could not confidently determine all clothing details from this "
            "image (category, subcategory, color, or pattern). Try a "
            "clearer, well-lit photo of the item."
        ) from error

    if analysis is None:
        logger.warning(
            "gemini_none_parsed raw_text=%r",
            getattr(response, "text", None),
        )
        raise ValueError(
            "Gemini could not analyze this image. Try a clearer photo of the item."
        )

    return analysis

def _generate_from_parts(parts: list) -> ClothingItemAnalysis:
    response = client.models.generate_content(
        model="gemini-flash-latest",
        contents=[*parts, ANALYSIS_PROMPT],
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ClothingItemAnalysis,
            temperature=0.1,
        ),
    )
    return format_analysis(_parse_analysis(response))

def analyze_clothing_image(
    file_path: str,
) -> ClothingItemAnalysis:
    uploaded_file = client.files.upload(file=file_path)
    return _generate_from_parts([uploaded_file])


def analyze_clothing_image_url(
    image_url: str,
) -> ClothingItemAnalysis:
    image_bytes, content_type = download_image_bytes(image_url)

    image_part = types.Part.from_bytes(
        data=image_bytes,
        mime_type=content_type,
    )

    return _generate_from_parts([image_part])
