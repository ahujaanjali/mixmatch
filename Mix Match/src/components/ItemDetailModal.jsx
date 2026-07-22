import { X, Trash2, Plus, Minus } from 'lucide-react';
import { colors } from '../constants/colors';

function ItemDetailModal({ item, onClose, onDelete }) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg" style={{ backgroundColor: colors.card }}>
        <div className="relative">
          <img
            src={item.image}
            alt={item.brand}
            className="w-full h-64 object-cover"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white rounded-full p-2"
            style={{ color: colors.text }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="font-serif text-2xl font-bold" style={{ color: colors.text }}>
                {item.name}
              </h2>
              <div className="flex flex-wrap gap-2 mt-2">
                {item.brand && (
                  <span
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: colors.buttons, color: colors.text }}
                  >
                    {item.brand}
                  </span>
                )}
                {item.category && (
                  <span
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: colors.buttons, color: colors.text }}
                  >
                    {item.category}
                  </span>
                )}
                {item.color && (
                  <span
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: colors.buttons, color: colors.text }}
                  >
                    {item.color}
                  </span>
                )}
              </div>
            </div>
            <div
              className="px-3 py-1.5 rounded-lg text-sm font-semibold text-center"
              style={{ backgroundColor: colors.banner, color: colors.text }}
            >
              Worn {item.frequency_of_wear}x
            </div>
          </div>

          {item.size && (
            <p className="mb-6 text-left text-sm" style={{ color: colors.text, opacity: 0.8 }}>
              Size: {item.size}
            </p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                if (confirm("Are you sure you want to delete this item?")) {
                  onDelete(item.id);
                  onClose();
                }
              }}
              className="px-4 py-3 rounded flex items-center gap-2 font-semibold"
              style={{ backgroundColor: '#FBEAEA', color: '#B3261E' }}
            >
              <Trash2 size={20} />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemDetailModal;