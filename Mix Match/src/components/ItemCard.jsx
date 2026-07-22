import { Trash2, Plus, Minus } from 'lucide-react';
import { colors } from '../constants/colors';

function ItemCard({ item, onClick, onDelete, onUpdateFrequency }) {
  const handleIncrement = (e) => {
    e.stopPropagation();
    onUpdateFrequency(item.id, (item.frequency_of_wear || 0) + 1);
  };

  const handleDecrement = (e) => {
    e.stopPropagation();
    onUpdateFrequency(item.id, Math.max(0, (item.frequency_of_wear || 0) - 1));
  };

  const details = [item.brand, item.category, item.size, item.color].filter(Boolean);

  return (
    <div onClick={onClick} className="cursor-pointer group">
      <div
        className="rounded-lg overflow-hidden border shadow-sm group-hover:shadow-md transition"
        style={{ borderColor: colors.buttons }}
      >
        <img
          src={item.image || "https://media.istockphoto.com/id/1842732901/vector/loading-icon.jpg?s=612x612&w=0&k=20&c=L_SMRRBQieZHtnrySZmDuy25_rWvEea_UeTnJqD08XE="}
          alt={item.brand || "Unknown brand"}
          className="w-full h-64 object-cover"
          onError={(e) => {
            e.currentTarget.src = "https://media.istockphoto.com/id/1842732901/vector/loading-icon.jpg?s=612x612&w=0&k=20&c=L_SMRRBQieZHtnrySZmDuy25_rWvEea_UeTnJqD08XE=";
          }}
        />
      </div>

      <div className="mt-3 text-center">
        <h3 className="text-base font-bold" style={{ color: colors.text }}>
          {item.name}
        </h3>

        {details.length > 0 && (
          <p className="text-xs mt-0.5" style={{ color: colors.text, opacity: 0.6 }}>
            {details.join(' · ')}
          </p>
        )}

        <div className="flex justify-center items-center gap-3 mt-2">
          <div className="flex items-center gap-2 text-xs" style={{ color: colors.text, opacity: 0.85 }}>
            <span>Worn</span>

            {onUpdateFrequency ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDecrement}
                  className="w-5 h-5 flex items-center justify-center rounded-full hover:opacity-70 transition"
                  style={{ backgroundColor: colors.buttons }}
                  title="Decrease"
                >
                  <Minus size={10} />
                </button>
                <span className="w-4 text-center font-semibold">{item.frequency_of_wear}</span>
                <button
                  onClick={handleIncrement}
                  className="w-5 h-5 flex items-center justify-center rounded-full hover:opacity-70 transition"
                  style={{ backgroundColor: colors.buttons }}
                  title="Increase"
                >
                  <Plus size={10} />
                </button>
              </div>
            ) : (
              <span className="font-semibold">{item.frequency_of_wear}</span>
            )}
          </div>

          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
              }}
              className="opacity-0 group-hover:opacity-100 transition p-1"
              style={{ color: '#B3261E' }}
              title="Delete item"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ItemCard;