import { getSessionToken } from '@descope/react-sdk'
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { CATEGORIES } from "../constants/categories";

function authHeaders() {
  return { 'Authorization': `Bearer ${getSessionToken()}` }
}

function getFavorites() {
  try { return JSON.parse(localStorage.getItem("favorites") || "[]"); }
  catch { return []; }
}

function saveFavorites(favs) {
  localStorage.setItem("favorites", JSON.stringify(favs));
}

const DESCRIPTION_LIMIT = 100;

function isNew(listing) {
  const id = Number(listing.id);
  if (isNaN(id) || id < 1000000000000) return false;
  const now = Date.now();
  return (now - id) < 24 * 60 * 60 * 1000;
}

function Description({ text }) {
  const [expanded, setExpanded] = useState(false);
  if (!text || text.length <= DESCRIPTION_LIMIT) return (
    <p style={{ color: 'var(--color-muted)', fontSize: 14, margin: '0 0 12px', lineHeight: 1.5 }}>{text}</p>
  );
  return (
    <p style={{ color: 'var(--color-muted)', fontSize: 14, margin: '0 0 12px', lineHeight: 1.5 }}>
      {expanded ? text : text.slice(0, DESCRIPTION_LIMIT) + "..."}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          marginLeft: 6,
          background: "none",
          border: "none",
          color: "var(--color-blue)",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: "0.9rem",
          padding: 0,
        }}
      >
        {expanded ? "Show less" : "Show more"}
      </button>
    </p>
  );
}

export default function BrowsePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [showTop, setShowTop] = useState(false);
  const [favorites, setFavorites] = useState(getFavorites);


  const fetchListings = (overrides = {}) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    const cat = 'category' in overrides ? overrides.category : category;
    if (cat) params.append("category", cat);
    if (minPrice) params.append("minPrice", minPrice);
    if (maxPrice) params.append("maxPrice", maxPrice);
    if (minRating) params.append("rating", minRating);
    const queryString = params.toString();
    const url = queryString
      ? `http://localhost:3001/api/listings?${queryString}`
      : 'http://localhost:3001/api/listings';
    fetch(url, { headers: authHeaders() })
  .then(res => {
    if (!res.ok) throw new Error("Failed to load listings");
    return res.json();
  })
  .then(data => setListings(data))
  .catch(e => setError(e.message))
  .finally(() => setLoading(false));
};

  function toggleFavorite(listing) {
  const favs = getFavorites();
  const exists = favs.some(f => f.id === listing.id);
  const updated = exists
    ? favs.filter(f => f.id !== listing.id)
    : [...favs, listing];
  saveFavorites(updated);
  setFavorites(updated);
}

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filtered = listings.filter(l => {
    const q = search.toLowerCase();
    return (
      l.name?.toLowerCase().includes(q) ||
      l.description?.toLowerCase().includes(q) ||
      l.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <style>{`
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 6px 2px rgba(229, 200, 74, 0.6); }
          50%       { box-shadow: 0 0 18px 6px rgba(229, 200, 74, 1); }
        }
        .browse-card--new { animation: glow 1.8s ease-in-out infinite; }

        .browse-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        @media (max-width: 900px) {
          .browse-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .browse-card { padding: 0 !important; overflow: hidden; display: flex; flex-direction: column; }
        .browse-card__photo {
          width: 100%;
          aspect-ratio: 16 / 9;
          background-color: var(--color-surface-soft);
          overflow: hidden;
        }
        .browse-card__photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .browse-card__body { padding: 16px 18px 20px; display: flex; flex-direction: column; flex: 1; }
        .browse-card__meta-row { display: flex; gap: 8px; margin-bottom: 10px; align-items: center; flex-wrap: wrap; }
        .browse-card__name {
          font-family: var(--font-serif);
          font-size: 22px;
          font-weight: 400;
          letter-spacing: -0.3px;
          margin: 0 0 6px;
          color: var(--color-heading);
        }
        .browse-card__price-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 0 16px;
          margin-top: auto;
          padding-top: 16px;
          font-size: 15px;
          font-weight: 600;
          color: var(--color-heading);
        }
        .browse-card__duration { color: var(--color-muted); font-size: 14px; font-weight: 400; }
        .browse-card__rating { color: var(--color-muted); font-size: 13px; font-weight: 400; }
        .browse-card__actions { display: flex; gap: 8px; flex-wrap: nowrap; }
        .browse-card__actions .btn-primary,
        .browse-card__actions .btn-secondary { white-space: nowrap; font-size: 13px; padding: 6px 12px; }
        .browse-filter-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
        .browse-filter-secondary {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 32px;
        }
        .browse-filter-secondary .form-input {
          flex: 1;
          min-width: 120px;
          height: 38px;
          width: auto;
        }
        .browse-filter-secondary select.form-input { height: 38px; }
      `}</style>

      <h1 className="section-heading" style={{ marginBottom: 28 }}>Browse Services</h1>

      <input
        type="text"
        className="form-input"
        placeholder="Search by name, category, or description..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 20 }}
      />

      <div className="browse-filter-tabs">
  <button
    className={`tab-pill${category === '' ? ' active' : ''}`}
    onClick={() => { setCategory(''); fetchListings({ category: '' }); }}
  >All</button>
  {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`tab-pill${category === cat ? ' active' : ''}`}
            onClick={() => { setCategory(cat); fetchListings({ category: cat }); }}
          >{cat}</button>
        ))}
      </div>

<div className="browse-filter-secondary">
  <input
    type="number"
    className="form-input"
    placeholder="Min Price ($)"
    value={minPrice}
    min="0"
    onKeyDown={e => { if (e.key === '-') e.preventDefault(); }}
    onChange={e => setMinPrice(e.target.value)}
  />
  <input
    type="number"
    className="form-input"
    placeholder="Max Price ($)"
    value={maxPrice}
    min="0"
    onKeyDown={e => { if (e.key === '-') e.preventDefault(); }}
    onChange={e => setMaxPrice(e.target.value)}
  />
  <select
    className="form-input"
    value={minRating}
    onChange={e => setMinRating(e.target.value)}
  >
    <option value="">Any Rating</option>
    <option value="4">4+ Stars</option>
    <option value="3">3+ Stars</option>
    <option value="2">2+ Stars</option>
  </select>
  <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
    <button
      onClick={() => fetchListings()}
      className="btn-primary"
      style={{ height: 38 }}
    >Apply Filters</button>
    <button
      onClick={() => {
        setSearch("");
        setCategory("");
        setMinPrice("");
        setMaxPrice("");
        setMinRating("");
        fetchListings({ category: "" });
      }}
      className="btn-secondary"
      style={{ height: 38 }}
    >Clear Filters</button>
  </div>

</div>

      {loading && <p style={{ color: 'var(--color-muted)' }}>Loading services...</p>}
      {error && <p className="form-error">Error: {error}</p>}

      {!loading && !error && filtered.length === 0 ? (
        <p style={{ color: 'var(--color-muted)' }}>No listings found.</p>
      ) : (
        <div className="browse-grid">
          {filtered.map(listing => (
            <div
              key={listing.id}
              className={`card browse-card${isNew(listing) ? ' browse-card--new' : ''}`}
            >
              <div className="browse-card__photo">
                {listing.photos?.[0] && (
                  <img src={listing.photos[0]} alt={listing.name} />
                )}
              </div>
              <div className="browse-card__body">
                <div className="browse-card__meta-row">
                  <span className="badge-pill">{listing.category}</span>
                  {isNew(listing) && <span className="badge-pill badge-pill--gold">NEW</span>}
                </div>
                <h2 className="browse-card__name">{listing.name}</h2>
                <Description text={listing.description} />
                <div className="browse-card__price-row">
                  <span>${listing.price}</span>
                  <span className="browse-card__duration">{listing.duration} min</span>
                  {listing.rating > 0 && (
                    <span className="browse-card__rating">⭐ {listing.rating.toFixed(1)}</span>
                  )}
                </div>
                <div className="browse-card__actions">
  <Link to={`/listings/${listing.id}`} className="btn-secondary">View Details</Link>
  <Link to={`/bookings/${listing.id}`} className="btn-primary">Book Now</Link>
  <button
    onClick={() => toggleFavorite(listing)}
    style={{
      background: "none",
      border: "none",
      fontSize: "1.3rem",
      cursor: "pointer",
      padding: "0 4px",
    }}
    title={favorites.some(f => f.id === listing.id) ? "Remove from saved" : "Save listing"}
  >
    {favorites.some(f => f.id === listing.id) ? "❤️" : "🤍"}
  </button>
</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            position: "fixed",
            bottom: 32,
            right: 32,
            background: "var(--color-blue)",
            color: "#fff",
            border: "none",
            borderRadius: "50%",
            width: 48,
            height: 48,
            fontSize: "1.3rem",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            zIndex: 99,
          }}
          title="Back to top"
        >↑</button>
      )}
    </div>
  );
}
