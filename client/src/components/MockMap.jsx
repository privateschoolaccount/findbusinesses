import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const STATUS_COLORS = {
  no_website: '#e53935',
  pending: '#fb8c00',
  has_website: '#43a047',
};

function createMarkerIcon(status) {
  const color = STATUS_COLORS[status] || '#757575';
  return L.divIcon({
    className: '',
    html: `<div style="
      width:12px;height:12px;border-radius:50%;
      background:${color};border:2px solid #fff;
      box-shadow:0 1px 3px rgba(0,0,0,0.25);
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    tooltipAnchor: [0, -14],
  });
}

function FitBounds({ businesses }) {
  const map = useMap();
  useEffect(() => {
    if (businesses.length > 0) {
      const bounds = L.latLngBounds(businesses.map(b => [b.lat, b.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [businesses, map]);
  return null;
}

function MockMap({ businesses = [], area = 'Map' }) {
  const valid = businesses.filter(b => b.lat != null && b.lng != null);

  return (
    <div className="mock-map">
      <div className="mock-map__header">
        <span className="body-sm" style={{ color: 'var(--on-surface-variant)', fontWeight: 500 }}>{area}</span>
        <span className="body-sm" style={{ color: 'var(--on-surface-variant)' }}>
          {businesses.filter(b => b.websiteStatus === 'no_website').length} without website
        </span>
      </div>
      {valid.length > 0 ? (
        <MapContainer
          center={[37.8, -122.4]}
          zoom={12}
          style={{ width: '100%', height: 380 }}
          zoomControl={false}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <FitBounds businesses={valid} />
          {valid.map(b => (
            <Marker key={b.id} position={[b.lat, b.lng]} icon={createMarkerIcon(b.websiteStatus)}>
              <Tooltip direction="top" offset={[0, -14]}>
                {b.name}
              </Tooltip>
              <Popup>
                <strong>{b.name}</strong>
                <br />
                <span style={{ color: '#666' }}>{b.type}</span>
                {b.placeId && (
                  <>
                    <br />
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${b.placeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 12, color: '#1a73e8' }}
                    >
                      Open in Google Maps
                    </a>
                  </>
                )}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      ) : (
        <div className="mock-map__canvas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p className="body-md" style={{ color: 'var(--on-surface-variant)' }}>No location data available</p>
        </div>
      )}
    </div>
  );
}

export default MockMap;
