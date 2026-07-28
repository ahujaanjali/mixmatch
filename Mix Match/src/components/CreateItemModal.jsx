import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

import { supabase } from '../supabaseClient';
import { colors } from '../constants/colors';
import { categories } from '../constants/categories';
import SizeSelector from './SizeSelector';

const API_BASE_URL = 'http://127.0.0.1:8000';

const SIZELESS_CATEGORIES = ['Hat', 'Accessories'];
const COLORLESS_CATEGORIES = ['Hat'];

const COLOR_FIELD_LABEL_OVERRIDES = {
  Accessories: 'Details (belt, earrings, etc.)',
};

const SIZE_SYSTEMS_BY_CATEGORY = {
  Top: ['US', 'Alpha'],
  Jacket: ['US', 'Alpha'],
  Pants: ['US', 'Alpha', 'Denim'],
};

const SHOE_SIZE_OPTIONS = Array.from(
  { length: 21 },
  (_, index) => String(4 + index * 0.5)
);

const inputClass = 'w-full px-3 py-2 border rounded text-sm';

const inputStyle = {
  borderColor: colors.buttons,
  color: colors.text,
};

function normalizeCategory(value) {
  if (!value) {
    return '';
  }

  const normalized = value.trim().toLowerCase();

  const aliases = {
    top: 'Top',
    tops: 'Top',
    shirt: 'Top',
    shirts: 'Top',
    't-shirt': 'Top',
    tshirt: 'Top',

    jacket: 'Jacket',
    jackets: 'Jacket',
    outerwear: 'Jacket',

    pants: 'Pants',
    trousers: 'Pants',
    bottoms: 'Pants',

    shoe: 'Shoes',
    shoes: 'Shoes',
    footwear: 'Shoes',

    hat: 'Hat',
    hats: 'Hat',
    headwear: 'Hat',

    accessory: 'Accessories',
    accessories: 'Accessories',

    jewelry: 'Jewelry',
    jewellery: 'Jewelry',
  };

  if (aliases[normalized]) {
    return aliases[normalized];
  }

  const matchingCategory = categories.find((category) => {
    const categoryValue = String(
      category.value || ''
    ).toLowerCase();

    const categoryLabel = String(
      category.label || ''
    ).toLowerCase();

    return (
      categoryValue === normalized ||
      categoryLabel === normalized
    );
  });

  return matchingCategory?.value || value;
}

function CreateItemModal({
  show,
  onClose,
  formData,
  setFormData,
  onSubmit,
}) {
  const [imageMethod, setImageMethod] = useState('url');
  const [imagePreview, setImagePreview] = useState('');
  const [imageLoading, setImageLoading] = useState(false);
  const [urlAnalysisLoading, setUrlAnalysisLoading] =
    useState(false);
  const [imageError, setImageError] = useState('');

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  useEffect(() => {
    if (!show) {
      setImageError('');
      setImageLoading(false);
      setUrlAnalysisLoading(false);
      setImagePreview('');
    }
  }, [show]);

  if (!show) {
    return null;
  }

  const handleChange = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const applyAnalysisToForm = (
    analysis,
    permanentImageUrl = null
  ) => {
    setFormData((previous) => {
      const detectedCategory = normalizeCategory(
        analysis.category
      );

      const nextCategory =
        detectedCategory || previous.category;

      const supportsSize =
        !SIZELESS_CATEGORIES.includes(nextCategory);

      const supportsColor =
        !COLORLESS_CATEGORIES.includes(nextCategory);

      return {
        ...previous,

        ...(permanentImageUrl
          ? { image: permanentImageUrl }
          : {}),

        // Supabase column is called "name".
        name:
          analysis.name?.trim() ||
          previous.name,

        category: nextCategory,

        brand:
          analysis.brand?.trim() ||
          previous.brand,

        color: supportsColor
          ? analysis.color?.trim() ||
            previous.color
          : '',

        size: supportsSize
          ? analysis.size?.trim() ||
            previous.size
          : '',
      };
    });
  };

  const handleImageUpload = async (file) => {
    if (!file) {
      return;
    }

    setImageLoading(true);
    setImageError('');

    if (imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }

    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);

    try {
      const requestBody = new FormData();
      requestBody.append('image', file);

      const analysisResponse = await fetch(
        `${API_BASE_URL}/analyze`,
        {
          method: 'POST',
          body: requestBody,
        }
      );

      const analysisText =
        await analysisResponse.text();

      if (!analysisResponse.ok) {
        throw new Error(
          analysisText ||
            `Image analysis failed (${analysisResponse.status}).`
        );
      }

      const analysis = JSON.parse(analysisText);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error(
          'You must be logged in to upload an image.'
        );
      }

      const extension =
        file.name.split('.').pop()?.toLowerCase() ||
        'jpg';

      const filePath =
        `${user.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } =
        await supabase.storage
          .from('item-images')
          .upload(filePath, file, {
            contentType: file.type,
            upsert: false,
          });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } =
        supabase.storage
          .from('item-images')
          .getPublicUrl(filePath);

      const publicUrl = publicUrlData?.publicUrl;

      if (!publicUrl) {
        throw new Error(
          'Supabase did not return an image URL.'
        );
      }

      applyAnalysisToForm(analysis, publicUrl);
      setImagePreview(publicUrl);
    } catch (error) {
      console.error(
        'Uploaded image processing failed:',
        error
      );

      setImageError(
        error.message ||
          'Could not process the uploaded image.'
      );
    } finally {
      setImageLoading(false);
    }
  };

  const handleAnalyzeUrl = async () => {
    const imageUrl = formData.image?.trim();

    if (!imageUrl) {
      setImageError('Enter an image URL first.');
      return;
    }

    try {
      new URL(imageUrl);
    } catch {
      setImageError('Enter a valid image URL.');
      return;
    }

    setUrlAnalysisLoading(true);
    setImageError('');
    setImagePreview(imageUrl);

    try {
      const response = await fetch(
        `${API_BASE_URL}/analyze-url`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_url: imageUrl,
          }),
        }
      );

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(
          responseText ||
            `URL analysis failed (${response.status}).`
        );
      }

      const analysis = JSON.parse(responseText);

      // Keeps formData.image as the pasted URL and
      // fills name, category, brand, color, and size.
      applyAnalysisToForm(analysis);
    } catch (error) {
      console.error(
        'URL image analysis failed:',
        error
      );

      setImageError(
        error.message ||
          'Could not analyze the image URL.'
      );
    } finally {
      setUrlAnalysisLoading(false);
    }
  };

  const showSize =
    !SIZELESS_CATEGORIES.includes(
      formData.category
    );

  const showColor =
    !COLORLESS_CATEGORIES.includes(
      formData.category
    );

  const colorLabel =
    COLOR_FIELD_LABEL_OVERRIDES[
      formData.category
    ] || 'Color';

  const isShoe =
    formData.category === 'Shoes';

  const sizeSystems =
    SIZE_SYSTEMS_BY_CATEGORY[
      formData.category
    ];

  const isProcessing =
    imageLoading || urlAnalysisLoading;

  const previewSource =
    imagePreview ||
    (imageMethod === 'url'
      ? formData.image
      : '');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div
        className="rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-lg"
        style={{
          backgroundColor: colors.card,
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2
            className="font-serif text-2xl font-bold"
            style={{ color: colors.text }}
          >
            Post New Item
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            style={{ color: colors.text }}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
          className="space-y-4"
        >
          <div>
            <label
              className="block mb-1 text-sm font-medium text-left"
              style={{ color: colors.text }}
            >
              Item Name
            </label>

            <input
              type="text"
              value={formData.name || ''}
              onChange={(event) =>
                handleChange(
                  'name',
                  event.target.value
                )
              }
              className={inputClass}
              style={inputStyle}
              placeholder="Automatically filled after analysis"
              required
            />
          </div>

          <div>
            <label
              className="block mb-1 text-sm font-medium text-left"
              style={{ color: colors.text }}
            >
              Brand
            </label>

            <input
              type="text"
              value={formData.brand || ''}
              onChange={(event) =>
                handleChange(
                  'brand',
                  event.target.value
                )
              }
              className={inputClass}
              style={inputStyle}
              placeholder="Automatically filled when detected"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-left">
            <div>
              <label
                className="block mb-1 text-sm font-medium"
                style={{ color: colors.text }}
              >
                Frequency of Wear
              </label>

              <input
                type="number"
                min="0"
                value={
                  formData.frequency_of_wear ?? 0
                }
                onChange={(event) =>
                  handleChange(
                    'frequency_of_wear',
                    event.target.value
                  )
                }
                className={inputClass}
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label
                className="block mb-1 text-sm font-medium"
                style={{ color: colors.text }}
              >
                Category
              </label>

              <select
                value={formData.category || ''}
                onChange={(event) => {
                  const nextCategory =
                    event.target.value;

                  setFormData((previous) => ({
                    ...previous,
                    category: nextCategory,
                    size: '',
                    size_system: 'Alpha',
                    color:
                      COLORLESS_CATEGORIES.includes(
                        nextCategory
                      )
                        ? ''
                        : previous.color,
                  }));
                }}
                className={inputClass}
                style={inputStyle}
              >
                {categories
                  .filter(
                    (category) =>
                      category.value !== 'all'
                  )
                  .map((category) => (
                    <option
                      key={category.value}
                      value={category.value}
                    >
                      {category.label}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {showSize && isShoe && (
            <div>
              <label
                className="block mb-1 text-sm font-medium text-left"
                style={{ color: colors.text }}
              >
                Shoe Size
              </label>

              <select
                value={formData.size || ''}
                onChange={(event) =>
                  handleChange(
                    'size',
                    event.target.value
                  )
                }
                className={inputClass}
                style={inputStyle}
              >
                <option value="">—</option>

                {SHOE_SIZE_OPTIONS.map(
                  (size) => (
                    <option
                      key={size}
                      value={size}
                    >
                      {size}
                    </option>
                  )
                )}
              </select>
            </div>
          )}

          {showSize &&
            !isShoe &&
            sizeSystems && (
              <SizeSelector
                label="Size"
                system={
                  formData.size_system ||
                  'Alpha'
                }
                onSystemChange={(system) =>
                  handleChange(
                    'size_system',
                    system
                  )
                }
                value={formData.size || ''}
                onValueChange={(value) =>
                  handleChange('size', value)
                }
                allowedSystems={sizeSystems}
              />
            )}

          {showSize &&
            !isShoe &&
            !sizeSystems && (
              <div>
                <label
                  className="block mb-1 text-sm font-medium text-left"
                  style={{ color: colors.text }}
                >
                  Size
                </label>

                <input
                  type="text"
                  value={formData.size || ''}
                  onChange={(event) =>
                    handleChange(
                      'size',
                      event.target.value
                    )
                  }
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            )}

          {showColor && (
            <div>
              <label
                className="block mb-1 text-sm font-medium text-left"
                style={{ color: colors.text }}
              >
                {colorLabel}
              </label>

              <input
                type="text"
                value={formData.color || ''}
                onChange={(event) =>
                  handleChange(
                    'color',
                    event.target.value
                  )
                }
                className={inputClass}
                style={inputStyle}
                placeholder="Automatically filled after analysis"
              />
            </div>
          )}

          <div>
            <label
              className="block mb-1 text-sm font-medium text-left"
              style={{ color: colors.text }}
            >
              Image
            </label>

            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => {
                  setImageMethod('url');
                  setImageError('');
                  setImagePreview(
                    formData.image || ''
                  );
                }}
                className="flex-1 px-3 py-2 border rounded text-sm"
                style={{
                  borderColor: colors.buttons,
                  backgroundColor:
                    imageMethod === 'url'
                      ? colors.buttons
                      : 'transparent',
                  color: colors.text,
                }}
              >
                Enter URL
              </button>

              <button
                type="button"
                onClick={() => {
                  setImageMethod('upload');
                  setImageError('');
                  setImagePreview('');
                  handleChange('image', '');
                }}
                className="flex-1 px-3 py-2 border rounded text-sm"
                style={{
                  borderColor: colors.buttons,
                  backgroundColor:
                    imageMethod === 'upload'
                      ? colors.buttons
                      : 'transparent',
                  color: colors.text,
                }}
              >
                Upload Image
              </button>
            </div>

            {imageMethod === 'url' ? (
              <div className="space-y-2">
                <input
                  type="url"
                  value={formData.image || ''}
                  onChange={(event) => {
                    const value =
                      event.target.value;

                    handleChange(
                      'image',
                      value
                    );

                    setImagePreview(value);
                    setImageError('');
                  }}
                  className={inputClass}
                  style={inputStyle}
                  placeholder="https://example.com/item.jpg"
                />

                <button
                  type="button"
                  onClick={handleAnalyzeUrl}
                  disabled={
                    urlAnalysisLoading ||
                    !formData.image?.trim()
                  }
                  className="w-full px-4 py-2 rounded font-semibold hover:opacity-90 transition disabled:opacity-50"
                  style={{
                    backgroundColor:
                      colors.buttons,
                    color: colors.text,
                  }}
                >
                  {urlAnalysisLoading
                    ? 'Analyzing URL...'
                    : 'Analyze URL'}
                </button>
              </div>
            ) : (
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={imageLoading}
                onChange={(event) => {
                  const file =
                    event.target.files?.[0];

                  if (file) {
                    handleImageUpload(file);
                  }
                }}
                className={inputClass}
                style={inputStyle}
              />
            )}

            {imageLoading && (
              <p
                className="mt-2 text-sm"
                style={{
                  color: colors.text,
                  opacity: 0.75,
                }}
              >
                Uploading and analyzing image...
              </p>
            )}

            {imageError && (
              <p
                className="mt-2 px-3 py-2 rounded text-sm"
                style={{
                  backgroundColor: '#FBEAEA',
                  color: '#B3261E',
                }}
              >
                {imageError}
              </p>
            )}

            {previewSource && (
              <div className="mt-3">
                <img
                  src={previewSource}
                  alt="Item preview"
                  className="w-full h-40 object-cover rounded border"
                  style={{
                    borderColor: colors.buttons,
                  }}
                  onError={(event) => {
                    event.currentTarget.style.display =
                      'none';
                  }}
                  onLoad={(event) => {
                    event.currentTarget.style.display =
                      'block';
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 border rounded font-semibold disabled:opacity-50"
              style={{
                borderColor: colors.buttons,
                color: colors.text,
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 px-4 py-2 rounded font-semibold hover:opacity-90 transition disabled:opacity-50"
              style={{
                backgroundColor: colors.banner,
                color: colors.text,
              }}
            >
              {isProcessing
                ? 'Processing...'
                : 'Post Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateItemModal;