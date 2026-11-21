import React, { useState } from 'react';
import { Plus } from 'lucide-react';                  
import { colors } from '../constants/colors';
import ItemsGrid from '../components/ItemsGrid';
import CreateItemModal from '../components/CreateItemModal';
import Header from '../components/Header';

// Keep these in sync with CreateItemModal.jsx.
// These must match the lowercase strings in constants/categories.js
// (and the backend's CategoryType enum) — not a separate naming scheme.
const SIZELESS_CATEGORIES = ['headwear', 'accessories'];
const COLORLESS_CATEGORIES = ['headwear'];

function MainPage({ items, onCreateItem, onDeleteItem, onUpdateFrequency }) {
  console.log(items);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "",
    size: "",
    size_system: "Alpha",
    color: "",
    image: "",
    frequency_of_wear: 0
  });


  const handleCreateItem = () => {
    const sizeRequired = !SIZELESS_CATEGORIES.includes(formData.category);
    const colorRequired = !COLORLESS_CATEGORIES.includes(formData.category);

    if (!formData.name || !formData.brand || !formData.category
      || (sizeRequired && !formData.size)
      || (colorRequired && !formData.color)
      || !formData.image || !formData.frequency_of_wear) {
      alert("Please fill in all boxes");
      return;
    }
    
    onCreateItem(formData);
    setFormData({
      name: "",
      brand: "",
      category: "",
      size: "",
      size_system: "Alpha",
      color: "",
      image: "",
      frequency_of_wear: 0
    });
    setShowCreateModal(false);
  };

  const handleDeleteItem = (id) => {
    if (confirm("Are you sure you want to delete this item?")) {
      onDeleteItem(id);
      setSelectedItem(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <Header
        onPostClick={() => setShowCreateModal(true)}
      />

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-serif text-2xl font-bold" style={{ color: colors.text }}>
            Your Closet
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
            style={{ color: colors.banner }}
          >
            <Plus size={20} />
            Add Item
          </button>
        </div>
        <ItemsGrid
          items={items}
          onItemClick={setSelectedItem}
          onDeleteItem={handleDeleteItem}
          onUpdateFrequency={onUpdateFrequency}
        />
        
      </main>
      <CreateItemModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleCreateItem}
      />
      
    </div>
  );
}

export default MainPage;