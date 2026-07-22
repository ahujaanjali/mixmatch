import { Trash2, Plus, Minus } from 'lucide-react';
import { colors } from '../constants/colors';

function ItemCard({ item, onClick, onDelete, onUpdateFrequency}) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
    >
      <img
        src={item.image || "https://media.istockphoto.com/id/1842732901/vector/loading-icon.jpg?s=612x612&w=0&k=20&c=L_SMRRBQieZHtnrySZmDuy25_rWvEea_UeTnJqD08XE="}
        alt={item.brand || "Unknown brand"}
        className="w-full h-48 object-cover rounded mb-3"
        onError={(e) => {
          e.currentTarget.src = "https://media.istockphoto.com/id/1842732901/vector/loading-icon.jpg?s=612x612&w=0&k=20&c=L_SMRRBQieZHtnrySZmDuy25_rWvEea_UeTnJqD08XE=";
        }}
      />
      
      <h3 className="text-lg font-bold" style={{ color: colors.text }}>
        {item.name}
      </h3>
      
      
      <div className="flex gap-3">
        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
          {item.brand}
        </span>
        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
          {item.size}
        </span>
        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
          {item.category}
        </span>
        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
          {item.color}
        </span>
      </div>
      <div className="flex justify-between items-center mt-3 text-sm">
        <p className="text-sm text-left" style={{ color: colors.text }}>
          Frequency of Wear: {item.frequency_of_wear}
        </p>
          {onUpdateFrequency && (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateFrequency(item.id, Math.max(0, (item.frequency_of_wear || 0) - 1));
                }}
                className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
                title="Decrease"
              >
                <Minus size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateFrequency(item.id, (item.frequency_of_wear || 0) + 1);
                }}
                className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
                title="Increase"
              >
                <Plus size={12} />
              </button>
            </div>
          )}
        </div>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="text-red-500 hover:text-red-700 p-1"
            title="Delete item"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
  );
}

export default ItemCard;