import { MapContainer, TileLayer } from 'react-leaflet';

const KARACHI = [24.8607, 67.0104];

export default function MapView({ center = KARACHI, zoom = 12, children, style = {} }) {
  return (
    <MapContainer center={center} zoom={zoom}
      style={{ width: '100%', height: '100%', background: '#EEF1F9', ...style }}
      zoomControl={true}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='© <a href="https://openstreetmap.org">OpenStreetMap</a>'
        maxZoom={19}
      />
      {children}
    </MapContainer>
  );
}
