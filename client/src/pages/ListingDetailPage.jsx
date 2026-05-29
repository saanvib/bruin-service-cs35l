import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PhotoGallery from "../components/PhotoGallery";

export default function ListingDetailPage() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:3001/api/listings/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Listing not found");
        return res.json();
      })
      .then((data) => setListing(data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "#c0392b" }}>⚠ {error} — please try refreshing the page.</p>;

  return (
    <div>
      <h1>{listing.name}</h1>
      <Link to={`/bookings/${id}`}>Book</Link>
      <p><strong>Category:</strong> {listing.category}</p>
      <p><strong>Location:</strong> {listing.location}</p>
      <p>{listing.description}</p>

      <PhotoGallery photos={listing.photos || []} />

      <h2>Services</h2>
      {listing.services && listing.services.length > 0 ? (
        listing.services.map((service, index) => (
          <div key={index} style={{ border: "1.5px solid #e5c84a", margin: "8px 0", padding: "12px 16px", borderRadius: 10, background: "#fff" }}>
            <strong>{service.name}</strong> — ${service.price}
          </div>
        ))
      ) : (
        <p>No services listed.</p>
      )}

      <h2>Reviews</h2>
      {listing.reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        listing.reviews.map((review, index) => (
          <div key={index} style={{ border: "1.5px solid #e5c84a", margin: "8px 0", padding: "12px 16px", borderRadius: 10, background: "#fff" }}>
            <strong>{review.author}</strong> — {review.rating}/5
            <p>{review.text}</p>
          </div>
        ))
      )}
    </div>
  );
}