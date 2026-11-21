import pandas as pd
from PIL import Image
import io

df = pd.read_parquet('data/data/disjoint/train.parquet')
id_to_image_row = df.set_index('item_id')

test_ids = ['132621870', '153967122']

for item_id in test_ids:
    row = id_to_image_row.loc[item_id]
    image_bytes = row['image']['bytes']
    img = Image.open(io.BytesIO(image_bytes))
    print(item_id, img.size, img.mode)