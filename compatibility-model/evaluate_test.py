import torch
from torch.utils.data import DataLoader

from dataset import PolyvoreCompatibilityDataset
from model import CompatibilityModel
from train import collate_outfits, evaluate, get_device

device = get_device()

test_dataset = PolyvoreCompatibilityDataset(
    split_dir='data/disjoint',
    split_name='test',
    parquet_path='data/data/disjoint/test.parquet',
)
test_loader = DataLoader(test_dataset, batch_size=16, shuffle=False, collate_fn=collate_outfits)

model = CompatibilityModel().to(device)
model.load_state_dict(torch.load('best_model.pt', map_location=device))

auc = evaluate(model, test_loader, device)
print(f"Test AUC: {auc:.4f} on {len(test_dataset)} outfits")