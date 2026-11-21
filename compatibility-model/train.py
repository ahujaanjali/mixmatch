import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Subset

from dataset import PolyvoreCompatibilityDataset
from model import CompatibilityModel
from sklearn.metrics import roc_auc_score
from tqdm import tqdm


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

    for batch in tqdm(dataloader, desc="train"):
        optimizer.zero_grad()

        images = [imgs.to(device) for imgs, _ in batch]
        labels = torch.stack([lbl for _, lbl in batch]).to(device)

        logits = model.forward_batch(images)
        loss = nn.functional.binary_cross_entropy_with_logits(logits, labels)
        loss.backward()
        optimizer.step()

        total_loss += loss.item()

    return total_loss / len(dataloader)

@torch.no_grad()
def evaluate(model, dataloader, device):
    model.eval()
    all_probs, all_labels = [], []

    for batch in dataloader:
        images = [imgs.to(device) for imgs, _ in batch]
        labels = torch.stack([lbl for _, lbl in batch])

        logits = model.forward_batch(images)
        all_probs.extend(torch.sigmoid(logits).cpu().tolist())
        all_labels.extend(labels.tolist())

    return roc_auc_score(all_labels, all_probs)


if __name__ == '__main__':
    device = get_device()
    print("Using device:", device)

    full_dataset = PolyvoreCompatibilityDataset(
        split_dir='data/disjoint',
        split_name='train',
        parquet_path='data/data/disjoint/train.parquet',
    )

    dataloader = DataLoader(
        full_dataset,
        batch_size=8,
        shuffle=True,
        collate_fn=collate_outfits,
    )
    
    val_dataset = PolyvoreCompatibilityDataset(
    split_dir='data/disjoint',
    split_name='valid',
    parquet_path='data/data/disjoint/validation.parquet',
    )
    val_generator = torch.Generator().manual_seed(0)
    val_indices = torch.randperm(len(val_dataset), generator=val_generator)[:2000].tolist()

    val_loader = DataLoader(
        Subset(val_dataset, val_indices),
        batch_size=16,
        shuffle=False,
        collate_fn=collate_outfits,
    )

    model = CompatibilityModel().to(device)

    backbone_params = [p for n, p in model.named_parameters() if p.requires_grad and n.startswith('backbone.layer')]
    head_params = [p for n, p in model.named_parameters() if p.requires_grad and not n.startswith('backbone.layer')]

    optimizer = torch.optim.Adam([
        {'params': backbone_params, 'lr': 1e-4},   # pretrained layer3/4: gentle
        {'params': head_params, 'lr': 1e-3},       # new fc + compat_head: faster
    ])

    best_auc = 0.0
    for epoch in range(5):
        avg_loss = train_one_epoch(model, dataloader, optimizer, device)
        val_auc = evaluate(model, val_loader, device)
        print(f"Epoch {epoch + 1}: loss = {avg_loss:.4f}, val AUC = {val_auc:.4f}")

        if val_auc > best_auc:
            best_auc = val_auc
            torch.save(model.state_dict(), 'best_model.pt')
            print("  -> new best, checkpoint saved")