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
      <p>{listing.description}</p>
      <PhotoGallery photos={[]} />

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