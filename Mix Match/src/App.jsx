import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import { supabase } from './supabaseClient';
import AuthForm from './components/AuthForm';
import OnboardingForm from './components/OnboardingForm';

import MainPage from './pages/MainPage';
import SavedOutfitPage from './pages/SavedOutfitPage';
import ProfilePage from './pages/ProfilePage';

function AppInner() {
  const [items, setItems] = useState([]);
  const [outfits, setOutfits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    try {
      const { data: itemsData, error: itemsError } = await supabase
        .from('item')
        .select('id, name, brand, category, color, size, frequency_of_wear, image, created_at')
        .order('frequency_of_wear', { ascending: false });
      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      const { data: outfitsData, error: outfitsError } = await supabase
        .from('outfits')
        .select('outfit_id, outfit_type, items, created_at')
        .order('created_at', { ascending: false });
      if (outfitsError) throw outfitsError;

      const itemMap = Object.fromEntries((itemsData || []).map(i => [Number(i.id), i]));
      const newOutfit = (outfitsData || []).map(o => {
        const ids = o.items ?? [];
        return {
          id: o.outfit_id,
          name: o.outfit_type || `Outfit #${o.outfit_id}`,
          pieces: (ids || []).map(id => itemMap[Number(id)]?.image).filter(Boolean),
          created_at: o.created_at,
        };
      });

      setOutfits(newOutfit);
    } catch (err) {
      console.error('Error fetching data:', err);
      alert(`Error fetching data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateItem = async (id) => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('item')
      .insert([{
        name: id.name,
        brand: id.brand,
        category: id.category,
        size: id.size,
        size_system: id.size_system,
        color: id.color,
        image: id.image,
        frequency_of_wear: Number(id.frequency_of_wear),
        user_id: user.id
      }])
      .select();
    if (error) { alert(error.message); return; }
    if (data?.[0]) setItems(prev => [data[0], ...prev]);
  };

  const handleDeleteItem = async (id) => {
    const { error } = await supabase.from('item').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdateFrequency = async (id, newFrequency) => {
    // optimistic UI update
    setItems(prev =>
      prev.map(i => (i.id === id ? { ...i, frequency_of_wear: newFrequency } : i))
    );

    const { error } = await supabase
      .from('item')
      .update({ frequency_of_wear: newFrequency })
      .eq('id', id);

    if (error) {
      alert(error.message);
      // revert on failure
      fetchAllData();
    }
  };

  const handleCreateOutfit = async ({ name, selectedItemIds }) => {
    const { data: { user } } = await supabase.auth.getUser();

    const newOutfit = {
      outfit_type: name?.trim(),
      items: selectedItemIds ?? [],
      user_id: user.id,
    };

    const { data, error } = await supabase
      .from('outfits')
      .insert([newOutfit])
      .select('outfit_id, outfit_type, items, created_at');

    if (error) {
      console.error('Error creating outfit:', error);
      alert(`Error creating outfit: ${error.message}`);
      return;
    }

    const created = data?.[0];
    if (!created) return;

    const itemMap = Object.fromEntries(items.map(i => [Number(i.id), i]));
    const ids = created.items ?? [];
    const pieces = (ids || []).map(id => itemMap[Number(id)]?.image).filter(Boolean);

    const formattedOutfit = {
      id: created.outfit_id,
      name: created.outfit_type || `Outfit #${created.outfit_id}`,
      pieces,
      created_at: created.created_at,
    };

    setOutfits(prev => [formattedOutfit, ...prev]);
  };

  const handleDeleteOutfit = async (id) => {
    const { error } = await supabase.from('outfits').delete().eq('outfit_id', id);
    if (error) { alert(error.message); return; }
    setOutfits(prev => prev.filter(o => o.id !== id));
  };

  return (
    <>
      {loading ? (
        <div className="p-6">Loading...</div>
      ) : (
        <Routes>
          <Route
            path="/"
            element={
              <MainPage
                items={items}
                onCreateItem={handleCreateItem}
                onDeleteItem={handleDeleteItem}
                onUpdateFrequency={handleUpdateFrequency}
              />
            }
          />
          <Route
            path="/saved-outfits"
            element={
              <SavedOutfitPage
                items={items}
                outfits={outfits}
                onCreateOutfit={handleCreateOutfit}
                onDeleteOutfit={handleDeleteOutfit}
              />
            }
          />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      )}
    </>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    supabase
      .from('profiles')
      .select('id, first_name, size_top, size_bottom, size_shoe')
      .eq('id', session.user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching profile:', error);
        }
        setProfile(data || null);
        setProfileLoading(false);
      });
  }, [session]);

  if (authLoading || (session && profileLoading)) return null; // or a spinner

  if (!session) {
    return <AuthForm onAuthSuccess={setSession} />;
  }

  const needsOnboarding = !profile || !profile.first_name;

  if (needsOnboarding) {
    return (
      <OnboardingForm
        userId={session.user.id}
        onComplete={(updatedProfile) => setProfile(updatedProfile)}
      />
    );
  }

  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}

export default App;