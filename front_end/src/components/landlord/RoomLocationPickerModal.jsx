import React, { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';

const DEFAULT_CENTER = [21.028511, 105.804817];

const parseCoordinate = (value) => {
  if (value === undefined || value === null || value === '') return null;

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const locationMarkerIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      width: 42px;
      height: 42px;
      border-radius: 999px 999px 999px 0;
      transform: rotate(-45deg);
      background: #0052cc;
      border: 3px solid #fff;
      box-shadow: 0 12px 24px rgba(0,0,0,0.28);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <span style="
        transform: rotate(45deg);
        color: #fff;
        font-family: 'Material Symbols Outlined';
        font-size: 24px;
        line-height: 1;
      ">home_pin</span>
    </div>
  `,
  iconSize: [42, 42],
  iconAnchor: [21, 42],
});

const formatCoordinate = (value) => Number(value).toFixed(6);

const MapResizeHandler = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    const timeout = setTimeout(() => {
      map.invalidateSize();
      map.setView(position, map.getZoom(), { animate: false });
    }, 80);

    return () => clearTimeout(timeout);
  }, [map, position]);

  return null;
};

const MapClickHandler = ({ onPick }) => {
  useMapEvents({
    click: (event) => {
      onPick([event.latlng.lat, event.latlng.lng]);
    },
  });

  return null;
};

const RoomLocationPickerModal = ({
  show,
  onClose,
  latitude,
  longitude,
  onConfirm,
  address,
}) => {
  const initialPosition = useMemo(() => {
    const lat = parseCoordinate(latitude);
    const lng = parseCoordinate(longitude);
    return lat !== null && lng !== null ? [lat, lng] : DEFAULT_CENTER;
  }, [latitude, longitude]);

  const [markerPosition, setMarkerPosition] = useState(initialPosition);

  useEffect(() => {
    if (show) {
      setMarkerPosition(initialPosition);
    }
  }, [initialPosition, show]);

  if (!show) return null;

  const handleConfirm = () => {
    onConfirm({
      latitude: formatCoordinate(markerPosition[0]),
      longitude: formatCoordinate(markerPosition[1]),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-outline-variant/30">
        <div className="px-6 py-5 border-b border-outline-variant/20 flex items-start justify-between gap-4">
          <div>
            <h3 className="m-0 text-xl font-black text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">map</span>
              Chọn vị trí phòng
            </h3>
            <p className="m-0 mt-1 text-sm font-medium text-on-surface-variant">
              Bấm vào bản đồ hoặc kéo ghim tới đúng vị trí phòng.
            </p>
            {address && (
              <p className="m-0 mt-2 text-xs font-bold text-primary line-clamp-1">
                {address}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-error/10 hover:text-error flex items-center justify-center transition-all shrink-0"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="h-[55vh] min-h-[360px] rounded-2xl overflow-hidden border border-outline-variant/30">
            <MapContainer
              center={markerPosition}
              zoom={15}
              scrollWheelZoom
              className="w-full h-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapResizeHandler position={markerPosition} />
              <MapClickHandler onPick={setMarkerPosition} />
              <Marker
                position={markerPosition}
                icon={locationMarkerIcon}
                draggable
                eventHandlers={{
                  dragend: (event) => {
                    const nextPosition = event.target.getLatLng();
                    setMarkerPosition([nextPosition.lat, nextPosition.lng]);
                  },
                }}
              />
            </MapContainer>
          </div>

          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
              <div className="bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/30">
                <p className="m-0 text-[10px] uppercase tracking-widest font-black text-on-surface-variant opacity-60">Vĩ độ</p>
                <p className="m-0 text-base font-black text-on-surface">{formatCoordinate(markerPosition[0])}</p>
              </div>
              <div className="bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/30">
                <p className="m-0 text-[10px] uppercase tracking-widest font-black text-on-surface-variant opacity-60">Kinh độ</p>
                <p className="m-0 text-base font-black text-on-surface">{formatCoordinate(markerPosition[1])}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-2xl bg-surface-container-high text-on-surface-variant font-black hover:bg-surface-container-highest transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-6 py-3 rounded-2xl bg-primary text-on-primary font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
              >
                Xác nhận vị trí
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomLocationPickerModal;
