from huggingface_hub import snapshot_download

local_dir = snapshot_download(
    repo_id="mvasil/polyvore-outfits",
    repo_type="dataset",
    local_dir="data",
)

print(f"Downloaded to: {local_dir}")