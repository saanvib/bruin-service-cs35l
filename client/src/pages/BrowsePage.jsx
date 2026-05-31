// import { useEffect, useState } from "react";
// import { Link } from "react-router-dom";

// const DESCRIPTION_LIMIT = 100;

// function isNew(listing) {
//   const id = Number(listing.id);
//   if (isNaN(id) || id < 1000000000000) return false;
//   const now = Date.now();
//   return (now - id) < 24 * 60 * 60 * 1000;
// }

// function Description({ text }) {
//   const [expanded, setExpanded] = useState(false);
//   if (!text || text.length <= DESCRIPTION_LIMIT) return <p>{text}</p>;
//   return (
//     <p>
//       {expanded ? text : text.slice(0, DESCRIPTION_LIMIT) + "..."}
//       <button
//         onClick={() => setExpanded(!expanded)}
//         style={{
//           marginLeft: 6,
//           background: "none",
//           border: "none",
//           color: "#2774AE",
//           cursor: "pointer",
//           fontWeight: 600,
//           fontSize: "0.9rem",
//           padding: 0,
//         }}
//       >
//         {expanded ? "Show less" : "Show more"}
//       </button>
//     </p>
//   );
// }

// export default function BrowsePage() {
//   const [listings, setListings] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [search, setSearch] = useState("");
//   const [showTop, setShowTop] = useState(false);

//   useEffect(() => {
//     fetch("http://localhost:3001/api/listings")
//       .then((res) => {
//         if (!res.ok) throw new Error("Failed to load listings");
//         return res.json();
//       })
//       .then((data) => setListings(data))
//       .catch((e) => setError(e.message))
//       .finally(() => setLoading(false));
//   }, []);

//   useEffect(() => {
//     const onScroll = () => setShowTop(window.scrollY > 300);
//     window.addEventListener("scroll", onScroll);
//     return () => window.removeEventListener("scroll", onScroll);
//   }, []);

//   useEffect(() => {
//     const onScroll = () => setShowTop(window.scrollY > 300);
//     window.addEventListener("scroll", onScroll);
//     return () => window.removeEventListener("scroll", onScroll);
//   }, []);

//   const filtered = listings.filter((l) => {
//     const q = search.toLowerCase();
//     return (
//       l.name?.toLowerCase().includes(q) ||
//       l.description?.toLowerCase().includes(q) ||
//       l.category?.toLowerCase().includes(q)
//     );
//   });

//   return (
//     <div>
//       <style>{`
//         @keyframes glow {
//           0%, 100% { box-shadow: 0 0 6px 2px rgba(229, 200, 74, 0.6); }
//           50% { box-shadow: 0 0 18px 6px rgba(229, 200, 74, 1); }
//         }
//         .new-listing {
//           animation: glow 1.8s ease-in-out infinite;
//           border: 2px solid #e5c84a !important;
//         }
//       `}</style>

//       <h1>Browse Services</h1>

//       <input
//         type="text"
//         placeholder="Search by name, category, or description..."
//         value={search}
//         onChange={(e) => setSearch(e.target.value)}
//         style={{
//           width: "100%",
//           padding: "10px 14px",
//           fontSize: "1rem",
//           borderRadius: 8,
//           border: "1.5px solid #e5c84a",
//           marginBottom: 16,
//           boxSizing: "border-box",
//         }}
//       />

//       {filtered.length === 0 ? (
//         <p>No listings found.</p>
//       ) : (
//         filtered.map((listing) => (
//           <div
//             key={listing.id}
//             className={isNew(listing) ? "new-listing" : ""}
//             style={{
//               border: "1.5px solid #e5c84a",
//               margin: "8px 0",
//               padding: "12px 16px",
//               borderRadius: 10,
//               background: "#fff",
//               boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
//               position: "relative",
//             }}
//           >
//             {isNew(listing) && (
//               <span style={{
//                 position: "absolute",
//                 top: 10,
//                 right: 12,
//                 background: "#e5c84a",
//                 color: "#1a1a1a",
//                 fontSize: "0.7rem",
//                 fontWeight: 700,
//                 padding: "2px 8px",
//                 borderRadius: 99,
//               }}>NEW</span>
//             )}
//             <h2>{listing.name}</h2>
//             <Description text={listing.description} />
//             <p>${listing.price} — {listing.duration} min</p>
//             <Link to={`/listings/${listing.id}`}>View Details</Link>
//             <Link to={`/bookings/${listing.id}`} style={{ marginLeft: "8px" }}>Book</Link>
//           </div>
//         ))
//       )}

//       {showTop && (
//         <button
//           onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
//           style={{
//             position: "fixed",
//             bottom: 32,
//             right: 32,
//             background: "#2774AE",
//             color: "#fff",
//             border: "none",
//             borderRadius: "50%",
//             width: 48,
//             height: 48,
//             fontSize: "1.3rem",
//             cursor: "pointer",
//             boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
//             zIndex: 99,
//           }}
//           title="Back to top"
//         >
//           ↑
//         </button>
//       )}
//     </div>
//   );
// }



import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const DESCRIPTION_LIMIT = 100;

function isNew(listing) {
  const id = Number(listing.id);
  if (isNaN(id) || id < 1000000000000) return false;
  const now = Date.now();
  return (now - id) < 24 * 60 * 60 * 1000;
}

function Description({ text }) {
  const [expanded, setExpanded] = useState(false);
  if (!text || text.length <= DESCRIPTION_LIMIT) return <p>{text}</p>;
  return (
    <p>
      {expanded ? text : text.slice(0, DESCRIPTION_LIMIT) + "..."}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          marginLeft: 6,
          background: "none",
          border: "none",
          color: "#2774AE",
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

  // // Trigger backend fetch whenever a filter changes
  // useEffect(() => {
  //   setLoading(true);

  //   // URLSearchParams is the cleanest way to build query strings 
  //   const params = new URLSearchParams();
  //   if (category) params.append("category", category);
  //   if (minPrice) params.append("minPrice", minPrice);
  //   if (maxPrice) params.append("maxPrice", maxPrice);
  //   if (minRating) params.append("rating", minRating);

  //   fetch(`http://localhost:3001/api/listings?${params.toString()}`)
  //     .then((res) => {
  //       if (!res.ok) throw new Error("Failed to load listings");
  //       return res.json();
  //     })
  //     .then((data) => setListings(data))
  //     .catch((e) => setError(e.message))
  //     .finally(() => setLoading(false));
  // }, [category, minPrice, maxPrice, minRating]);


  const fetchListings = () => {
    setLoading(true);
    setError(null); 

    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (minPrice) params.append("minPrice", minPrice);
    if (maxPrice) params.append("maxPrice", maxPrice);
    if (minRating) params.append("rating", minRating);

    const queryString = params.toString();
    const url = queryString 
      ? `http://localhost:3001/api/listings?${queryString}` 
      : 'http://localhost:3001/api/listings';

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load listings");
        return res.json();
      })
      .then((data) => setListings(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchListings();
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
      <style>{`
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 6px 2px rgba(229, 200, 74, 0.6); }
          50% { box-shadow: 0 0 18px 6px rgba(229, 200, 74, 1); }
        }
        .new-listing {
          animation: glow 1.8s ease-in-out infinite;
          border: 2px solid #e5c84a !important;
        }
        .filter-input {
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid #ccc;
          font-size: 0.9rem;
          flex: 1;
          min-width: 120px;
        }
      `}</style>

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
          marginBottom: 12,
          boxSizing: "border-box",
        }}
      />

      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <select 
          className="filter-input" 
          value={category} 
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="nails">Nails</option>
          <option value="hair">Haircare</option>
          <option value="lashes">Lashes</option>
          <option value="hair removal">Hair Removal</option>
        </select>

        <input 
          type="number" 
          placeholder="Min Price ($)" 
          className="filter-input"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
        />
        
        <input 
          type="number" 
          placeholder="Max Price ($)" 
          className="filter-input"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />

        <select 
          className="filter-input" 
          value={minRating} 
          onChange={(e) => setMinRating(e.target.value)}
        >
          <option value="">Any Rating</option>
          <option value="4">4+ Stars</option>
          <option value="3">3+ Stars</option>
          <option value="2">2+ Stars</option>
        </select>

        <button
        onClick={fetchListings}
        className="filter-input"
        style={{ background: "#2774AE", color: "white", cursor: "pointer", fontWeight: "bold", border: "none" }}
        >
          Apply Filters
        </button>
      </div>

      {loading && <p>Loading services...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {!loading && !error && filtered.length === 0 ? (
        <p>No listings found.</p>
      ) : (
        filtered.map((listing) => (
          <div
            key={listing.id}
            className={isNew(listing) ? "new-listing" : ""}
            style={{
              border: "1.5px solid #e5c84a",
              margin: "8px 0",
              padding: "12px 16px",
              borderRadius: 10,
              background: "#fff",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
              position: "relative",
            }}
          >
            {isNew(listing) && (
              <span style={{
                position: "absolute",
                top: 10,
                right: 12,
                background: "#e5c84a",
                color: "#1a1a1a",
                fontSize: "0.7rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 99,
              }}>NEW</span>
            )}
            <h2>{listing.name}</h2>
            <Description text={listing.description} />
            <p>
              <strong>${listing.price}</strong> — {listing.duration} min
              {listing.rating > 0 && <span style={{marginLeft: "12px"}}>⭐ {listing.rating.toFixed(1)} ({listing.review_count} reviews)</span>}
            </p>
            <Link to={`/listings/${listing.id}`}>View Details</Link>
            <Link to={`/bookings/${listing.id}`} style={{ marginLeft: "16px" }}>Book</Link>
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