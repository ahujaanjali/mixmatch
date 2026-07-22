import { User, LogOut } from 'lucide-react';
import { colors } from '../constants/colors';
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

function Header({ onPostClick}) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange in App.jsx handles redirecting to the login screen
  };

  return (
    <header 
      className="shadow-lg"
      style={{ background: colors.banner }}
    >
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex justify-between items-end mb-2">
          <div>
            <h1 
              className="font-serif text-5xl font-bold"
              style={{ color: colors.text }}
            >
                Mix Match
            </h1>
          </div>
          <div className="flex items-center gap-4">

            <Link
              to="/"
              className="bg-white px-4 py-2 rounded-lg font-semibold"
              style={{ color: colors.banner }}
            >
              Your Closet
            </Link>

            <Link
              to="/saved-outfits"
              className="bg-white px-4 py-2 rounded-lg font-semibold"
              style={{ color: colors.banner }}
            >
              Saved Outfits
            </Link>

            <Link
              to="/profile"
              aria-label="Profile"
              title="Profile"
              className="bg-white p-2.5 rounded-lg flex items-center justify-center"
              style={{ color: colors.banner }}
            >
              <User size={20} />
            </Link>

            <button
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
              className="bg-white p-2.5 rounded-lg flex items-center justify-center"
              style={{ color: colors.banner }}
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;