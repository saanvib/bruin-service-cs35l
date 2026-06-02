import { useState } from "react";
import { Link } from "react-router-dom";

function getFavorites() {
  try { return JSON.parse(localStorage.getItem("favorites") || "[]"); }
  catch { return []; }
}

function saveFavorites(favs) {
  localStorage.setItem("favorites", JSON.stringify(favs));
}

export default function SavedListingsPage() {
  const [favorites, setFavorites] = useState(getFavorites);

  function remove(id) {
    const updated = favorites.filter((f) => f.id !== id);
    setFavorites(updated);
    saveFavorites(updated);
  }

  return (
    <div>
      <h1>Saved Listings</h1>
      {favorites.length === 0 ? (
        <p>You haven't saved any listings yet. <Link to="/browse">Browse listings</Link></p>
      ) : (
        favorites.map((listing) => (
          <div key={listing.id} style={{ border: "1.5px solid #e5c84a", margin: "8px 0", padding: "12px 16px", borderRadius: 10, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", position: "relative" }}>
            <button
              onClick={() => remove(listing.id)}
              style={{ position: "absolute", top: 10, right: 12, background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer" }}
              title="Remove from saved"
            >❤️</button>
            <h2>{listing.name}</h2>
            <p>{listing.description}</p>
            <p>${listing.price} — {listing.duration} min</p>
            <Link to={`/listings/${listing.id}`}>View Details</Link>
            <Link to={`/bookings/${listing.id}`} style={{ marginLeft: "8px" }}>Book</Link>
          </div>
        ))
      )}
    </div>
  );
}