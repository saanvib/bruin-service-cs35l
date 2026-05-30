import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PhotoGallery from "../components/PhotoGallery";

export default function ListingDetailPage() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

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

  function fetchReviews() {
    setReviewsLoading(true);
    fetch(`http://localhost:3001/api/listings/${id}/reviews`)
      .then((res) => res.json())
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }

  useEffect(() => { fetchReviews(); }, [id]);

  async function handleReviewSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      const res = await fetch(`http://localhost:3001/api/listings/${id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: Number(rating), comment }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit review");
      }
      setComment("");
      setRating(5);
      setSubmitSuccess(true);
      fetchReviews();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "#c0392b" }}>⚠ {error} — please try refreshing the page.</p>;

  return (
    <div>
      <h1>{listing.name}</h1>
      {avgRating && (
        <p style={{ fontSize: "1.2rem", fontWeight: 600, color: "#2774AE" }}>
          ⭐ {avgRating} / 5 ({reviews.length} review{reviews.length !== 1 ? "s" : ""})
        </p>
      )}
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
      {avgRating && (
        <p style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
          Average Rating: {avgRating} / 5 ⭐
        </p>
      )}
      {reviewsLoading ? (
        <p>Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p>No reviews yet — be the first to leave one!</p>
      ) : (
        reviews.map((review) => (
          <div key={review.id} style={{ border: "1.5px solid #e5c84a", margin: "8px 0", padding: "12px 16px", borderRadius: 10, background: "#fff" }}>
            <strong>{"⭐".repeat(review.rating)}</strong> {review.rating}/5
            {review.comment && <p style={{ margin: "0.5rem 0 0" }}>{review.comment}</p>}
          </div>
        ))
      )}

      <h3 style={{ marginTop: "1.5rem" }}>Leave a Review</h3>
      <form onSubmit={handleReviewSubmit} style={{ maxWidth: 400 }}>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ display: "block", fontWeight: 500, marginBottom: "0.25rem" }}>Rating</label>
          <select value={rating} onChange={e => setRating(e.target.value)} style={{ padding: "0.4rem", borderRadius: 6, border: "1px solid #d1d5db", width: "100%" }}>
            {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} ⭐</option>)}
          </select>
        </div>
        <div style={{ marginBottom: "0.75rem" }}>
          <label style={{ display: "block", fontWeight: 500, marginBottom: "0.25rem" }}>Comment (optional)</label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            placeholder="Share your experience..."
            style={{ width: "100%", padding: "0.5rem", borderRadius: 6, border: "1px solid #d1d5db", boxSizing: "border-box", fontFamily: "inherit" }}
          />
        </div>
        {submitError && <p style={{ color: "#c0392b" }}>{submitError}</p>}
        {submitSuccess && <p style={{ color: "#16a34a" }}>Review submitted!</p>}
        <button type="submit" disabled={submitting} style={{ background: "#2774AE", color: "#fff", border: "none", borderRadius: 8, padding: "0.5rem 1.1rem", fontWeight: 600, cursor: "pointer" }}>
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
}
