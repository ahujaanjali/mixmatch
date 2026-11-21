import torch

from dataset import PolyvoreCompatibilityDataset
from model import CompatibilityModel

dataset = PolyvoreCompatibilityDataset(
    split_dir='data/disjoint',
    split_name='train',
    parquet_path='data/data/disjoint/train.parquet',
)

images, label = dataset[0]

model = CompatibilityModel()
model.eval()

with torch.no_grad():
    logit = model(images)

probability = torch.sigmoid(logit)

print("Logit:", logit.item())
print("Predicted probability:", probability.item())
print("True label:", label.item())