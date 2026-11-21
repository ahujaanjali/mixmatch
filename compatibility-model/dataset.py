import json

import pandas as pd
import torch
from PIL import Image
import io
from torch.utils.data import Dataset
from torchvision import transforms


IMAGE_TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    # Standard ImageNet normalization — required since we're using an
    # ImageNet-pretrained ResNet, which expects inputs scaled this way.
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    ),
])


class PolyvoreCompatibilityDataset(Dataset):
    def __init__(self, split_dir, split_name, parquet_path):
        # Load outfit definitions: set_id -> ordered list of item_ids.
        with open(f'{split_dir}/{split_name}.json') as f:
            outfits = json.load(f)

        self.set_id_to_items = {}
        for outfit in outfits:
            ordered_items = sorted(outfit['items'], key=lambda item: item['index'])
            self.set_id_to_items[outfit['set_id']] = [
                item['item_id'] for item in ordered_items
            ]

        # Load the compatibility examples themselves (label + item references).
        with open(f'{split_dir}/compatibility_{split_name}.txt') as f:
            lines = [line.strip() for line in f if line.strip()]
        self.examples = [line.split() for line in lines]

        # Load images once into memory, indexed by item_id for fast lookup.
        df = pd.read_parquet(parquet_path)
        self.id_to_image_row = df.set_index('item_id')

    def __len__(self):
        return len(self.examples)

    def _load_image(self, item_id):
        image_bytes = self.id_to_image_row.loc[item_id]['image']['bytes']
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        return IMAGE_TRANSFORM(image)

    def __getitem__(self, idx):
        parts = self.examples[idx]
        label = int(parts[0])
        tokens = parts[1:]

        item_ids = []
        for token in tokens:
            set_id, index_str = token.rsplit('_', 1)
            index = int(index_str)
            item_ids.append(self.set_id_to_items[set_id][index - 1])

        images = torch.stack([self._load_image(item_id) for item_id in item_ids])
        # images shape: [num_items_in_outfit, 3, 224, 224]

        return images, torch.tensor(label, dtype=torch.float32)