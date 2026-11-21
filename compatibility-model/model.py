import torch
import math
import torch.nn.functional as F
import torch.nn as nn
from torchvision.models import resnet18, ResNet18_Weights


class CompatibilityModel(nn.Module):
    def __init__(self, embedding_dim=64):
        super().__init__()

        backbone = resnet18(weights=ResNet18_Weights.DEFAULT)

        # Freeze the early layers — general-purpose visual features that
        # don't need to change. Leave layer3, layer4, and the new head
        # trainable, so the network can specialize toward compatibility
        # without needing to relearn low-level vision from scratch.
        for name, param in backbone.named_parameters():
            if name.startswith('layer3') or name.startswith('layer4') or name.startswith('fc'):
                param.requires_grad = True
            else:
                param.requires_grad = False

        # Replace the original 1000-class ImageNet classifier with a
        # projection down to our embedding space.
        in_features = backbone.fc.in_features
        backbone.fc = nn.Linear(in_features, embedding_dim)

        self.backbone = backbone

        # Learns how to convert a raw average pairwise distance into a
        # logit (pre-sigmoid score), rather than hardcoding a fixed scale.
        self.log_scale = nn.Parameter(torch.tensor(math.log(5.0)))
        self.shift = nn.Parameter(torch.tensor(1.0))

    def train(self, mode=True):
        super().train(mode)
        # Keep BatchNorm on its ImageNet running stats so small per-outfit
        # batches don't corrupt them. BN gamma/beta in layer3/4 still train.
        for m in self.backbone.modules():
            if isinstance(m, nn.BatchNorm2d):
                m.eval()
        return self

    def embed(self, images):
        # images: [num_items, 3, 224, 224] -> [num_items, embedding_dim]
        return self.backbone(images)

    def forward_batch(self, outfits):           # list of [n_i, 3, 224, 224]
        lengths = [o.shape[0] for o in outfits]
        embeddings = self.embed(torch.cat(outfits))   # one backbone pass
        return torch.stack([self._score(e) for e in torch.split(embeddings, lengths)])

    def _score(self, emb):
        n = emb.shape[0]
        if n < 2:
            raise ValueError("Outfit needs at least 2 items")
        emb = F.normalize(emb, dim=1)            # unit length -> distances in [0, 2]
        i, j = torch.triu_indices(n, n, offset=1, device=emb.device)
        avg = torch.cdist(emb, emb)[i, j].mean()
        return -self.log_scale.exp() * (avg - self.shift)