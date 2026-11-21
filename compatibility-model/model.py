import torch
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
        self.compat_head = nn.Linear(1, 1)

    def embed(self, images):
        # images: [num_items, 3, 224, 224] -> [num_items, embedding_dim]
        return self.backbone(images)

    def forward(self, images):
        embeddings = self.embed(images)

        # All pairwise distances between items in this outfit.
        distances = torch.cdist(embeddings, embeddings)  # [n, n]

        n = embeddings.shape[0]
        # We only want each pair counted once (i < j), and never an
        # item compared against itself (distance would be 0).
        i, j = torch.triu_indices(n, n, offset=1)
        pairwise_distances = distances[i, j]

        avg_distance = pairwise_distances.mean().view(1, 1)
        logit = self.compat_head(avg_distance).view(())

        return logit