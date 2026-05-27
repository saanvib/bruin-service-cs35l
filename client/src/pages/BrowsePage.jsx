import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function BrowsePage() {
  const [listings, setListings] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3001/api/listings")
      .then((res) => res.json())
      .then((data) => setListings(data));
  }, []);

  return (
    <div>
      <h1>Browse Services</h1>
      {listings.length === 0 ? (
        <p>No listings found.</p>
      ) : (
        listings.map((listing) => (
          <div key={listing.id} style={{ border: "1px solid #ccc", margin: "8px 0", padding: "8px" }}>
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