from dataset import PolyvoreCompatibilityDataset

dataset = PolyvoreCompatibilityDataset(
    split_dir='data/disjoint',
    split_name='train',
    parquet_path='data/data/disjoint/train.parquet',
)

print("Dataset size:", len(dataset))

images, label = dataset[0]
print("Images shape:", images.shape)
print("Label:", label.item())