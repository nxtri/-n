import React, { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import { useNavigate, useParams } from 'react-router-dom';
import roomApi from '../api/roomApi';

const roomMarkerIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      width: 46px;
      height: 46px;
      border-radius: 999px 999px 999px 0;
      transform: rotate(-45deg);
      background: #0052cc;
      border: 3px solid #fff;
      box-shadow: 0 14px 28px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <span style="
        transform: rotate(45deg);
        color: #fff;
        font-family: 'Material Symbols Outlined';
        font-size: 26px;
        line-height: 1;
      ">home_pin</span>
    </div>
  `,
  iconSize: [46, 46],
  iconAnchor: [23, 46],
});

const parseCoordinate = (value) => {
  if (value === undefined || value === null || value === '') return null;

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const RoomLocation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        const response = await roomApi.getRoomById(id);
        setRoom(response.room);
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể tải vị trí phòng.');
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [id]);

  const fullAddress = useMemo(() => {
    if (!room) return '';
    return [room.houseNumber, room.address].filter(Boolean).join(', ');
  }, [room]);

  const position = useMemo(() => {
    const lat = parseCoordinate(room?.latitude);
    const lng = parseCoordinate(room?.longitude);
    return lat !== null && lng !== null ? [lat, lng] : null;
  }, [room]);

  const roomTitle = room
    ? `${room.roomType === 'WHOLE_HOUSE' ? 'Nhà nguyên căn' : 'Phòng trọ'} ${room.roomNumber}`
    : 'Vị trí phòng';

  return (
    <div className="min-h-screen bg-surface-container-lowest text-on-surface font-['Inter']">
      <header className="h-20 px-4 md:px-8 flex items-center justify-between border-b border-outline-variant/30 bg-white sticky top-0 z-50 shadow-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-surface-container-low text-on-surface-variant font-black hover:bg-surface-container-high transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          Quay lại
        </button>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="text-primary font-black text-xl md:text-2xl tracking-tight flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[28px] fill-1">real_estate_agent</span>
          <span className="hidden sm:inline">PHONGTROSIEUCAP</span>
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {loading ? (
          <div className="py-24 text-center font-black text-primary">Đang tải vị trí phòng...</div>
        ) : error ? (
          <div className="bg-white rounded-3xl border border-error/20 p-10 text-center shadow-sm">
            <span className="material-symbols-outlined text-6xl text-error mb-4">error</span>
            <p className="text-lg font-black text-on-surface">{error}</p>
          </div>
        ) : (
          <>
            <section className="bg-white rounded-3xl border border-outline-variant/30 p-6 md:p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                <div>
                  <p className="m-0 text-[11px] font-black uppercase tracking-widest text-primary">Vị trí phòng</p>
                  <h1 className="m-0 mt-2 text-2xl md:text-4xl font-black tracking-tight text-on-surface">{roomTitle}</h1>
                  <p className="m-0 mt-3 text-on-surface-variant font-bold flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary shrink-0">location_on</span>
                    <span>{fullAddress || 'Chưa có địa chỉ'}</span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(`/room/${room.id}`)}
                    className="px-5 py-3 rounded-2xl bg-surface-container-low text-primary font-black hover:bg-primary hover:text-on-primary transition-all"
                  >
                    Xem chi tiết
                  </button>
                  {position && (
                    <a
                      href={`https://www.google.com/maps?q=${position[0]},${position[1]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-3 rounded-2xl bg-primary text-on-primary font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[20px]">near_me</span>
                      Mở Google Maps
                    </a>
                  )}
                </div>
              </div>
            </section>

            {position ? (
              <section className="h-[68vh] min-h-[460px] rounded-3xl overflow-hidden border border-outline-variant/30 shadow-xl bg-white">
                <MapContainer center={position} zoom={16} scrollWheelZoom className="w-full h-full">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={position} icon={roomMarkerIcon} />
                </MapContainer>
              </section>
            ) : (
              <section className="bg-white rounded-3xl border border-outline-variant/30 p-12 text-center shadow-sm">
                <span className="material-symbols-outlined text-6xl text-outline mb-4">wrong_location</span>
                <h2 className="m-0 text-2xl font-black text-on-surface">Phòng này chưa có vị trí bản đồ</h2>
                <p className="m-0 mt-3 text-on-surface-variant font-medium">
                  Chủ nhà có thể vào sửa phòng và chọn vị trí trên bản đồ để bổ sung tọa độ.
                </p>
                {fullAddress && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex mt-6 px-5 py-3 rounded-2xl bg-primary text-on-primary font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                  >
                    Tìm địa chỉ trên Google Maps
                  </a>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default RoomLocation;
