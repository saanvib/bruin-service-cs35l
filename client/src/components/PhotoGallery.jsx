const PLACEHOLDER = "https://placehold.co/600x400?text=No+Photos+Yet";

export default function PhotoGallery({ photos }) {
  if (!photos || photos.length === 0) {
    return (
      <div>
        <img src={PLACEHOLDER} alt="No photos available" style={{ width: "100%", borderRadius: "8px" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
      {photos.map((url, i) => (
        <img
          key={i}
          src={url}
          alt={`Photo ${i + 1}`}
          style={{ height: "200px", borderRadius: "8px", cursor: "pointer", flexShrink: 0 }}
          onClick={() => window.open(url, "_blank")}
        />
      ))}
    </div>
  );
}
