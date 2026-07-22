import ItemCard from './ItemCard';
import { colors } from '../constants/colors';

function ItemsGrid({ items, onItemClick, onDeleteItem, onUpdateFrequency }) {
  if (!items || items.length == 0) {
    return (
      <div className="text-center mt-10" style={{ color: colors.text, opacity: 0.6 }}>
        No items found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map(item => (
        <ItemCard
          key={item.id}
          item={item}
          onClick={() => onItemClick(item)}
          onDelete={onDeleteItem}
          onUpdateFrequency={onUpdateFrequency}
        />
      ))}
    </div>
  );
}

export default ItemsGrid;