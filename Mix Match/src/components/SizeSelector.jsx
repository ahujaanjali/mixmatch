import { useRef, useEffect } from 'react';
import { colors } from '../constants/colors';

const US_SIZES = ['00', '0', '2', '4', '6', '8', '10', '12', '14', '16', '18', '20'];
const ALPHA_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const DENIM_SIZES = Array.from({ length: 17 }, (_, i) => (24 + i).toString()); // 24–40

const SYSTEMS = [
  { key: 'US', label: 'US' },
  { key: 'Alpha', label: 'Alpha' },
  { key: 'Denim', label: 'Denim' },
];

// `resetKey`: when this value changes (e.g. the item's category), the
// remembered per-system values are wiped. Pass nothing / a constant if you
// never want it to reset (e.g. on the Profile page).
export default function SizeSelector({ label, system, onSystemChange, value, onValueChange, allowedSystems, resetKey }) {
  const activeSystems = allowedSystems
    ? SYSTEMS.filter((s) => allowedSystems.includes(s.key))
    : SYSTEMS;

  const options = system === 'US' ? US_SIZES : system === 'Denim' ? DENIM_SIZES : ALPHA_SIZES;

  // Remembers what was typed/selected under each system, so toggling back
  // restores it instead of showing blank.
  const cacheRef = useRef({});
  const lastResetKeyRef = useRef(resetKey);

  useEffect(() => {
    if (lastResetKeyRef.current !== resetKey) {
      cacheRef.current = {};
      lastResetKeyRef.current = resetKey;
    }
  }, [resetKey]);

  const handleSystemClick = (key) => {
    if (key === system) return;
    // stash whatever is currently entered under the system we're leaving
    cacheRef.current[system] = value;
    onSystemChange(key);
    // restore whatever was previously entered under the system we're entering
    onValueChange(cacheRef.current[key] ?? '');
  };

  return (
    <div>
      <label className="block mb-1 text-sm font-medium" style={{ color: colors.text }}>
        {label}
      </label>

      <div className="flex gap-1 mb-2">
        {activeSystems.map((s) => {
          const active = system === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => handleSystemClick(s.key)}
              className="px-2 py-1 text-xs rounded-md font-semibold transition"
              style={{
                backgroundColor: active ? colors.banner : colors.buttons,
                color: colors.text,
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <select
        required
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="w-full px-2 py-2 border rounded text-sm"
        style={{ borderColor: colors.buttons, color: colors.text }}
      >
        <option value="" disabled>—</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}