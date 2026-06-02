import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getSessionToken } from "@descope/react-sdk";
import PhotoGallery from "../components/PhotoGallery";

function authHeaders() {
  return { Authorization: `Bearer ${getSessionToken()}` };
}

export default function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messaging, setMessaging] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:3001/api/listings/${id}`, { headers: authHeaders() })
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
    fetch(`http://localhost:3001/api/listings/${id}/reviews`, { headers: authHeaders() })
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
        headers: { ...authHeaders(), "Content-Type": "application/json" },
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

  // Creates (or finds) a conversation with this provider, then navigates to /chat
  async function handleMessageProvider() {
    if (!listing) return
    setMessaging(true)
    try {
      const res = await fetch('http://localhost:3001/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getSessionToken()}`,
        },
        body: JSON.stringify({
          providerId: listing.provider_id,
          listingId: id,
          listingName: listing.name,
        }),
      })
      if (!res.ok) throw new Error('Could not start conversation')
      const conversation = await res.json()
      // Navigate to chat page and pre-select this conversation
      navigate('/chat', { state: { conversationId: conversation.id } })
    } catch (e) {
      console.error(e)
      alert('Could not start conversation. Please try again.')
    } finally {
      setMessaging(false)
    }
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (loading) return <p style={{ color: 'var(--color-muted)' }}>Loading...</p>;
  if (error) return <p className="form-error">⚠ {error} — please try refreshing the page.</p>;

  return (
    <div>
      <style>{`
        .listing-header { margin-bottom: 32px; }
        .listing-header__badges { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; align-items: center; }
        .listing-header__location { color: var(--color-muted); font-size: 14px; margin: 4px 0 10px; }
        .listing-header__desc { color: var(--color-ink); line-height: 1.65; margin: 0 0 24px; max-width: 640px; }
        .listing-header__book-row { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
        .listing-header__price { font-size: 18px; font-weight: 600; color: var(--color-heading); }
        .listing-gallery { border-radius: var(--radius-lg); overflow: hidden; margin: 32px 0; }
        .listing-services { display: flex; flex-direction: column; gap: 10px; margin-bottom: 40px; }
        .listing-service-card { display: flex !important; justify-content: space-between; align-items: center; padding: 16px 20px !important; }
        .listing-service-price { font-weight: 600; color: var(--color-blue); }
        .listing-reviews { display: flex; flex-direction: column; gap: 12px; margin-bottom: 40px; }
        .review-card { display: flex !important; gap: 16px; align-items: flex-start; padding: 16px 20px !important; }
        .review-card__avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: var(--color-blue); color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-weight: 600; font-size: 15px; flex-shrink: 0;
        }
        .review-card__stars { color: var(--color-gold); letter-spacing: 2px; font-size: 16px; margin-bottom: 4px; }
        .review-card__comment { margin: 6px 0 0; color: var(--color-muted); font-size: 14px; line-height: 1.5; }
      `}</style>

      {/* Header */}
      <div className="listing-header">
        <div className="listing-header__badges">
          <span className="badge-pill">{listing.category}</span>
          {avgRating && (
            <span className="badge-pill badge-pill--blue">
              ⭐ {avgRating} / 5 &nbsp;({reviews.length} review{reviews.length !== 1 ? "s" : ""})
            </span>
          )}
        </div>
        <h1 className="section-heading">{listing.name}</h1>
        <p className="listing-header__location">📍 {listing.location}</p>
        <p className="listing-header__desc">{listing.description}</p>
        <div className="listing-header__book-row">
          <span className="listing-header__price">${listing.price} · {listing.duration} min</span>
          <Link to={`/bookings/${id}`} className="btn-primary">Book Now</Link>
          <button
            className="btn-secondary"
            onClick={handleMessageProvider}
            disabled={messaging}
          >
            {messaging ? 'Opening...' : '💬 Message Provider'}
          </button>
        </div>
      </div>

      {/* Services */}
      <h2 className="page-title" style={{ marginBottom: 16, marginTop: 8 }}>Services</h2>
      {listing.services && listing.services.length > 0 ? (
        <div className="listing-services">
          {listing.services.map((service, index) => (
            <div key={index} className="card listing-service-card">
              <strong>{service.name}</strong>
              <span className="listing-service-price">${service.price}</span>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--color-muted)', marginBottom: 40 }}>No services listed.</p>
      )}

      {/* Photo gallery */}
      <div className="listing-gallery">
        <PhotoGallery photos={listing.photos || []} />
      </div>

      {/* Reviews */}
      <h2 className="page-title" style={{ marginBottom: 16 }}>Reviews</h2>
      {reviewsLoading ? (
        <p style={{ color: 'var(--color-muted)' }}>Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p style={{ color: 'var(--color-muted)', marginBottom: 40 }}>No reviews yet — be the first to leave one!</p>
      ) : (
        <div className="listing-reviews">
          {reviews.map(review => (
            <div key={review.id} className="card review-card">
              <div className="review-card__avatar">U</div>
              <div>
                <div className="review-card__stars">
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </div>
                {review.comment && <p className="review-card__comment">{review.comment}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review form */}
      <h2 className="page-title" style={{ marginBottom: 20 }}>Leave a Review</h2>
      <form onSubmit={handleReviewSubmit} style={{ maxWidth: 400 }}>
        <label className="form-label">Rating
          <select
            value={rating}
            onChange={e => setRating(e.target.value)}
            className="form-input"
            style={{ height: 'auto', padding: '10px 14px' }}
          >
            {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} ⭐</option>)}
          </select>
        </label>
        <label className="form-label">Comment (optional)
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            placeholder="Share your experience..."
            className="form-textarea"
          />
        </label>
        {submitError && <p className="form-error">{submitError}</p>}
        {submitSuccess && <p className="form-success">Review submitted!</p>}
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
}