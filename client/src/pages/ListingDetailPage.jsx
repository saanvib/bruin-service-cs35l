import PhotoGallery from "../components/PhotoGallery";

export default function ListingDetailPage() {
  const listing = {
    photos: [],
  };

  return (
    <div>
      <h1>Listing Detail</h1>
      <PhotoGallery photos={listing.photos} />
    </div>
  );
}
