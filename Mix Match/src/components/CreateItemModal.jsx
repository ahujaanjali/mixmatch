import { X } from 'lucide-react';
import { colors } from '../constants/colors';
import { categories } from '../constants/categories';
import SizeSelector from './SizeSelector';

// Categories where "size" doesn't apply at all.
const SIZELESS_CATEGORIES = ['Hat', 'Accessories'];
const COLORLESS_CATEGORIES = ['Hat'];
const COLOR_FIELD_LABEL_OVERRIDES = { Accessories: 'Details (belt, earrings, etc.)' };

// Which size systems apply per category. Shoes are handled separately below
// with their own numeric dropdown rather than the US/Alpha/Denim toggle.
const SIZE_SYSTEMS_BY_CATEGORY = {
  Top: ['US', 'Alpha'],
  Jacket: ['US', 'Alpha'],
  Pants: ['US', 'Alpha', 'Denim'],
};

const SHOE_SIZE_OPTIONS = Array.from({ length: 21 }, (_, i) => (4 + i * 0.5).toString()); // 4–14

const inputStyle = { borderColor: colors.buttons, color: colors.text };
const inputClass = 'w-full px-3 py-2 border rounded text-sm';

function CreateItemModal({ show, onClose, formData, setFormData, onSubmit }) {
  if (!show) return null;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const showSize = !SIZELESS_CATEGORIES.includes(formData.category);
  const showColor = !COLORLESS_CATEGORIES.includes(formData.category);
  const colorLabel = COLOR_FIELD_LABEL_OVERRIDES[formData.category] || 'Color';
  const isShoe = formData.category === 'Shoes';
  const sizeSystems = SIZE_SYSTEMS_BY_CATEGORY[formData.category]; // undefined => plain text fallback (e.g. Jewelry)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="rounded-lg p-6 max-w-md w-full shadow-lg" style={{ backgroundColor: colors.card }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-serif text-2xl font-bold" style={{ color: colors.text }}>
            Post New Item
          </h2>
          <button type="button" onClick={onClose} style={{ color: colors.text }}>
            <X size={24} />
          </button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
          className="space-y-4"
        >
          <div>
            <label className="block mb-1 text-sm font-medium text-left" style={{ color: colors.text }}>
              Item Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={inputClass}
              style={inputStyle}
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-left" style={{ color: colors.text }}>
              Brand
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => handleChange('brand', e.target.value)}
              className={inputClass}
              style={inputStyle}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-left">
            <div>
              <label className="block mb-1 text-sm font-medium" style={{ color: colors.text }}>
                Frequency of Wear
              </label>
              <input
                type="number"
                min="0"
                value={formData.frequency_of_wear}
                onChange={(e) => handleChange('frequency_of_wear', e.target.value)}
                className={inputClass}
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium" style={{ color: colors.text }}>
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => {
                  const newCategory = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    category: newCategory,
                    size: SIZELESS_CATEGORIES.includes(newCategory) ? '' : '',
                    size_system: 'Alpha',
                    color: COLORLESS_CATEGORIES.includes(newCategory) ? '' : prev.color,
                  }));
                }}
                className={inputClass}
                style={inputStyle}
              >
                {categories.filter(cat => cat.value !== "all").map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {showSize && isShoe && (
            <div>
              <label className="block mb-1 text-sm font-medium text-left" style={{ color: colors.text }}>
                Shoe Size
              </label>
              <select
                value={formData.size}
                onChange={(e) => handleChange('size', e.target.value)}
                className={inputClass}
                style={inputStyle}
                required
              >
                <option value="" disabled>—</option>
                {SHOE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {showSize && !isShoe && sizeSystems && (
            <SizeSelector
              label="Size"
              system={formData.size_system || 'Alpha'}
              onSystemChange={(sys) => handleChange('size_system', sys)}
              value={formData.size}
              onValueChange={(val) => handleChange('size', val)}
              allowedSystems={sizeSystems}
            />
          )}

          {showSize && !isShoe && !sizeSystems && (
            <div>
              <label className="block mb-1 text-sm font-medium text-left" style={{ color: colors.text }}>
                Size
              </label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => handleChange('size', e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
          )}

          {showColor && (
            <div>
              <label className="block mb-1 text-sm font-medium text-left" style={{ color: colors.text }}>
                {colorLabel}
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
            </div>
          )}

          <div>
            <label className="block mb-1 text-sm font-medium text-left" style={{ color: colors.text }}>
              Image URL
            </label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => handleChange('image', e.target.value)}
              className={inputClass}
              style={inputStyle}
              placeholder="https://media.istockphoto.com/id/1842732901/vector/loading-icon.jpg?s=612x612&w=0&k=20&c=L_SMRRBQieZHtnrySZmDuy25_rWvEea_UeTnJqD08XE="
            />
            {formData.image && (
              <div className="mt-2">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded border"
                  style={{ borderColor: colors.buttons }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded font-semibold"
              style={{ borderColor: colors.buttons, color: colors.text }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded font-semibold hover:opacity-90 transition"
              style={{ backgroundColor: colors.banner, color: colors.text }}
            >
              Post Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateItemModal;