import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Subset

from dataset import PolyvoreCompatibilityDataset
from model import CompatibilityModel


def collate_outfits(batch):
    # Don't try to stack variable-length outfits into one tensor —
    # just pass the list through as-is.
    return batch


def get_device():
    if torch.backends.mps.is_available():
        return torch.device('mps')
    return torch.device('cpu')


def train_one_epoch(model, dataloader, optimizer, device):
    model.train()
    total_loss = 0.0
    num_batches = 0

    for batch in dataloader:
        optimizer.zero_grad()

        logits = []
        labels = []
        for images, label in batch:
            images = images.to(device)
            logit = model(images)
            logits.append(logit)
            labels.append(label.to(device))

        logits = torch.stack(logits)
        labels = torch.stack(labels)

        loss = nn.functional.binary_cross_entropy_with_logits(logits, labels)
        loss.backward()
        optimizer.step()

        total_loss += loss.item()
        num_batches += 1

    return total_loss / num_batches


if __name__ == '__main__':
    device = get_device()
    print("Using device:", device)

    full_dataset = PolyvoreCompatibilityDataset(
        split_dir='data/disjoint',
        split_name='train',
        parquet_path='data/data/disjoint/train.parquet',
    )

    # Sanity-check on a small subset first, before committing to a full epoch.
    small_dataset = Subset(full_dataset, range(50))

    dataloader = DataLoader(
        small_dataset,
        batch_size=8,
        shuffle=True,
        collate_fn=collate_outfits,
    )

    model = CompatibilityModel().to(device)

    trainable_params = [p for p in model.parameters() if p.requires_grad]
    optimizer = torch.optim.Adam(trainable_params, lr=1e-4)

    for epoch in range(5):
        avg_loss = train_one_epoch(model, dataloader, optimizer, device)
        print(f"Epoch {epoch + 1}: avg loss = {avg_loss:.4f}")