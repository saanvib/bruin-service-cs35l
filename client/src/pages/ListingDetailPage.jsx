import { useEffect, useState } from "react";
import PhotoGallery from "../components/PhotoGallery";

export default function ListingDetailPage() {
  const [listing, setListing] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3001/api/listings/1")
      .then((res) => res.json())
      .then((data) => setListing(data));
  }, []);

  if (!listing) return <p>Loading...</p>;

  return (
    <div>
      <h1>{listing.name}</h1>
      <p><strong>Category:</strong> {listing.category}</p>
      <p><strong>Location:</strong> {listing.location}</p>
      <p>{listing.description}</p>

      <PhotoGallery photos={listing.photos || []} />

      <h2>Services</h2>
      {listing.services && listing.services.length > 0 ? (
        listing.services.map((service, index) => (
          <div key={index} style={{ border: "1px solid #ccc", margin: "8px 0", padding: "8px" }}>
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
          <div key={index} style={{ border: "1px solid #ccc", margin: "8px 0", padding: "8px" }}>
            <strong>{review.author}</strong> — {review.rating}/5
            <p>{review.text}</p>
          </div>
        ))
      )}
    </div>
  );
}