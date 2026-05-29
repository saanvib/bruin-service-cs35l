import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function BrowsePage() {
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState("");
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3001/api/listings")
      .then((res) => res.json())
      .then((data) => setListings(data));
  }, []);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filtered = listings.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.name?.toLowerCase().includes(q) ||
      l.description?.toLowerCase().includes(q) ||
      l.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <h1>Browse Services</h1>

      <input
        type="text"
        placeholder="Search by name, category, or description..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 14px",
          fontSize: "1rem",
          borderRadius: 8,
          border: "1.5px solid #e5c84a",
          marginBottom: 16,
          boxSizing: "border-box",
        }}
      />

      {filtered.length === 0 ? (
        <p>No listings found.</p>
      ) : (
        filtered.map((listing) => (
          <div key={listing.id} style={{ border: "1.5px solid #e5c84a", margin: "8px 0", padding: "12px 16px", borderRadius: 10, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <h2>{listing.name}</h2>
            <p>{listing.description}</p>
            <p>${listing.price} — {listing.duration} min</p>
            <Link to={`/listings/${listing.id}`}>View Details</Link>
            <Link to={`/bookings/${listing.id}`} style={{ marginLeft: "8px" }}>Book</Link>
          </div>
        ))
      )}

      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            position: "fixed",
            bottom: 32,
            right: 32,
            background: "#2774AE",
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
        >
          ↑
        </button>
      )}
    </div>
  );
}