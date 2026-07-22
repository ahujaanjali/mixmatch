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
    // NOTE: we no longer call onValueChange here. Doing so immediately after
    // onSystemChange caused a stale-closure bug: the parent's onValueChange
    // handler still closed over the OLD `system` value (React hadn't
    // re-rendered yet), so the restored value got written into the wrong
    // system's slot. Instead, we restore in the effect below, which runs
    // after the parent has actually re-rendered with the new `system`.
  };

  // Restore the cached value for a system once we've actually switched to it
  // (i.e. after the parent's `system` prop has updated), so the parent's
  // onValueChange closure sees the correct, up-to-date system.
  useEffect(() => {
    const cached = cacheRef.current[system];
    if (cached !== undefined && cached !== value) {
      onValueChange(cached);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [system]);

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