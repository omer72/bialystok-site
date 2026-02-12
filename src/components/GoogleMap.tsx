interface GoogleMapProps {
  lat: number;
  lng: number;
  zoom?: number;
}

export default function GoogleMap({ lat, lng, zoom = 15 }: GoogleMapProps) {
  const src = `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3000!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f${zoom}!5e0!3m2!1sen!2sil!4v1`;

  return (
    <div className="google-map">
      <iframe
        src={src}
        width="100%"
        height="400"
        style={{ border: 0, borderRadius: 'var(--border-radius)' }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Location Map"
      />
    </div>
  );
}
