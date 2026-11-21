import json

# Step 1: build a lookup from set_id -> ordered list of item_ids,
# using the outfit definitions in train.json.
with open('data/disjoint/train.json') as f:
    outfits = json.load(f)

set_id_to_items = {}
for outfit in outfits:
    # index is 1-based in this dataset (we saw 'index': 1, 2, 3...)
    ordered_items = sorted(outfit['items'], key=lambda item: item['index'])
    set_id_to_items[outfit['set_id']] = [item['item_id'] for item in ordered_items]

# Step 2: read one real line from compatibility_train.txt and resolve it.
with open('data/disjoint/compatibility_train.txt') as f:
    first_line = f.readline().strip()

parts = first_line.split()
label = int(parts[0])
tokens = parts[1:]  # e.g. '199244701_1', '199244701_2', ...

resolved_item_ids = []
for token in tokens:
    set_id, index_str = token.rsplit('_', 1)
    index = int(index_str)
    items_in_outfit = set_id_to_items[set_id]
    # index is 1-based, list is 0-based
    resolved_item_ids.append(items_in_outfit[index - 1])

print("Label:", label)
print("Tokens:", tokens)
print("Resolved item_ids:", resolved_item_ids) 