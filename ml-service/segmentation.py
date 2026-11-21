import io

import numpy as np
import torch
from PIL import Image
from scipy import ndimage
from transformers import AutoModelForSemanticSegmentation, SegformerImageProcessor

from schemas import CategoryType


MODEL_NAME = "mattmdjaga/segformer_b2_clothes"

_processor = SegformerImageProcessor.from_pretrained(MODEL_NAME)
_model = AutoModelForSemanticSegmentation.from_pretrained(MODEL_NAME)
_model.eval()

_label2id = {label: idx for idx, label in _model.config.id2label.items()}

CATEGORY_TO_LABELS = {
    CategoryType.HEADWEAR: ["Hat"],
    CategoryType.TOP: ["Upper-clothes"],
    CategoryType.OUTERWEAR: ["Upper-clothes"],
    CategoryType.BOTTOM: ["Pants", "Skirt"],
    CategoryType.SHOES: ["Left-shoe", "Right-shoe"],
    CategoryType.ACCESSORY: ["Bag", "Belt", "Scarf", "Sunglasses"],
    CategoryType.JEWELRY: [],
}

# Minimum model confidence (0-1) required for a pixel to count as part of
# the garment. Pixels where the model is unsure (e.g. borderline between
# "Upper-clothes" and skin) get excluded rather than kept just because
# "Upper-clothes" narrowly won. Raise this to trim more aggressively,
# lower it if real garment pixels are getting excluded.
_CONFIDENCE_THRESHOLD = 0.9

_CLEANUP_ITERATIONS = 10


def _clean_mask(mask: np.ndarray) -> np.ndarray:
    eroded = ndimage.binary_erosion(mask, iterations=_CLEANUP_ITERATIONS)
    opened = ndimage.binary_dilation(eroded, iterations=_CLEANUP_ITERATIONS)

    if not opened.any():
        opened = mask

    labeled_array, num_features = ndimage.label(opened)
    if num_features <= 1:
        return opened

    sizes = ndimage.sum(opened, labeled_array, range(1, num_features + 1))
    largest_label = int(np.argmax(sizes)) + 1
    return labeled_array == largest_label


def crop_clothing_item(image_bytes: bytes, category: CategoryType) -> bytes:
    target_labels = CATEGORY_TO_LABELS.get(category, [])

    if not target_labels:
        raise ValueError(
            f"Automatic cropping isn't supported yet for category '{category.value}'."
        )

    target_ids = {
        _label2id[label] for label in target_labels if label in _label2id
    }

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    inputs = _processor(images=image, return_tensors="pt")

    with torch.no_grad():
        outputs = _model(**inputs)

    logits = outputs.logits
    upsampled = torch.nn.functional.interpolate(
        logits,
        size=image.size[::-1],
        mode="bilinear",
        align_corners=False,
    )

    # Softmax turns raw scores into per-pixel probabilities across all
    # classes (summing to 1), so we can reason about "how confident" the
    # model actually was, not just which class edged out the others.
    probs = torch.nn.functional.softmax(upsampled, dim=1)[0]  # (num_classes, H, W)

    predicted = probs.argmax(dim=0)
    confidence = probs.max(dim=0).values

    raw_mask = torch.zeros_like(predicted, dtype=torch.bool)
    for label_id in target_ids:
        raw_mask |= predicted == label_id

    confident_mask = raw_mask & (confidence >= _CONFIDENCE_THRESHOLD)

    if not confident_mask.any():
        raise ValueError(
            f"Could not find a '{category.value}' item in this image."
        )

    cleaned_mask_np = _clean_mask(confident_mask.numpy())
    mask = torch.from_numpy(cleaned_mask_np)

    if not mask.any():
        raise ValueError(
            f"Could not find a '{category.value}' item in this image."
        )

    rows = torch.any(mask, dim=1)
    cols = torch.any(mask, dim=0)
    top, bottom = torch.where(rows)[0][[0, -1]]
    left, right = torch.where(cols)[0][[0, -1]]

    cropped_image = image.crop((left.item(), top.item(), right.item() + 1, bottom.item() + 1))
    cropped_mask = mask[top:bottom + 1, left:right + 1]

    rgba = cropped_image.convert("RGBA")
    alpha = (cropped_mask.numpy() * 255).astype("uint8")
    alpha_image = Image.fromarray(alpha, mode="L")
    rgba.putalpha(alpha_image)

    output_buffer = io.BytesIO()
    rgba.save(output_buffer, format="PNG")
    return output_buffer.getvalue()