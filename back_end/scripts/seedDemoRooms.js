require('dotenv').config();

const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { sequelize, User, Room } = require('../models');

const DEMO_MARKER = '[DEMO_SEED]';
const DEFAULT_LANDLORD_EMAIL = 'demo.landlord@phongtro.local';
const DEFAULT_PASSWORD = '123456';

const roomImages = [
  [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&q=80&w=1200',
  ],
  [
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&q=80&w=1200',
  ],
  [
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&q=80&w=1200',
  ],
  [
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1501183638710-841dd1904471?auto=format&fit=crop&q=80&w=1200',
  ],
];

const districts = [
  { ward: 'Phường Ba Đình', city: 'Thành phố Hà Nội', lat: 21.034, lng: 105.814 },
  { ward: 'Phường Cầu Giấy', city: 'Thành phố Hà Nội', lat: 21.036, lng: 105.790 },
  { ward: 'Phường Đống Đa', city: 'Thành phố Hà Nội', lat: 21.016, lng: 105.824 },
  { ward: 'Phường Hai Bà Trưng', city: 'Thành phố Hà Nội', lat: 21.006, lng: 105.857 },
  { ward: 'Phường Bến Thành', city: 'Thành phố Hồ Chí Minh', lat: 10.773, lng: 106.699 },
  { ward: 'Phường Thủ Đức', city: 'Thành phố Hồ Chí Minh', lat: 10.849, lng: 106.753 },
  { ward: 'Phường An Hải', city: 'Thành phố Đà Nẵng', lat: 16.067, lng: 108.240 },
  { ward: 'Phường Chánh Nghĩa', city: 'Thành phố Hồ Chí Minh', lat: 10.980, lng: 106.655 },
];

const generateRoomCode = (index) => `DM${Date.now().toString(36).slice(-4)}${String(index).padStart(2, '0')}`.toUpperCase();

const buildDemoRoom = (landlordId, index) => {
  const location = districts[index % districts.length];
  const isWholeHouse = index % 9 === 0;
  const basePrice = isWholeHouse ? 7500000 : 2200000 + (index % 8) * 250000;
  const roomNumber = isWholeHouse ? `NC-${index + 1}` : `${101 + index}`;
  const floor = Math.floor(index / 6) + 1;

  return {
    landlordId,
    roomNumber,
    roomCode: generateRoomCode(index),
    houseNumber: `Số ${12 + index}, ngõ ${20 + (index % 12)}`,
    address: `${location.ward}, ${location.city}`,
    latitude: Number((location.lat + (index % 5) * 0.0015).toFixed(6)),
    longitude: Number((location.lng + (index % 7) * 0.0015).toFixed(6)),
    roomType: isWholeHouse ? 'WHOLE_HOUSE' : 'SINGLE',
    price: basePrice,
    electricityPrice: 4000,
    waterPrice: 3000,
    internetPrice: 80000,
    parkingPrice: 100000,
    servicePrice: 50000,
    maxOccupants: isWholeHouse ? 6 : 1 + (index % 3),
    area: isWholeHouse ? 85 + (index % 4) * 10 : 18 + (index % 10),
    numFloors: isWholeHouse ? 3 : null,
    numBedrooms: isWholeHouse ? 3 : null,
    numBathrooms: isWholeHouse ? 2 : null,
    hasElevator: index % 4 === 0,
    hasWashingMachine: index % 2 === 0,
    hasFridge: index % 3 !== 0,
    hasKitchen: isWholeHouse || index % 2 === 1,
    hasHeater: index % 3 === 0,
    images: JSON.stringify(roomImages[index % roomImages.length]),
    description: `${DEMO_MARKER} Phòng demo tầng ${floor}, nội thất cơ bản, khu dân cư an ninh, phù hợp để khách xem thử giao diện.`,
    status: index % 7 === 0 ? 'RENTED' : 'AVAILABLE',
    isHidden: false,
    hiddenReason: 'NONE',
  };
};

const findOrCreateDemoLandlord = async () => {
  const requestedEmail = process.env.DEMO_LANDLORD_EMAIL || DEFAULT_LANDLORD_EMAIL;

  let landlord = await User.findOne({
    where: {
      email: requestedEmail,
      role: 'LANDLORD',
    },
  });

  if (!landlord) {
    landlord = await User.findOne({
      where: {
        role: 'LANDLORD',
      },
      order: [['id', 'ASC']],
    });
  }

  if (!landlord) {
    const password = await bcrypt.hash(process.env.DEMO_LANDLORD_PASSWORD || DEFAULT_PASSWORD, 10);
    landlord = await User.create({
      fullName: 'Chủ nhà demo',
      email: requestedEmail,
      password,
      role: 'LANDLORD',
      phone: '0900000000',
      isActive: true,
    });
  }

  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 1);

  await landlord.update({
    subscriptionPlan: 'DIAMOND',
    subscriptionExpiry: expiry,
    hasBasePlan: true,
    extraRoomLimit: 100,
    isActive: true,
  });

  return landlord;
};

const main = async () => {
  const count = Number(process.env.DEMO_ROOM_COUNT || process.argv[2] || 24);
  const shouldReset = process.env.DEMO_RESET === 'true';

  if (!Number.isInteger(count) || count < 1 || count > 200) {
    throw new Error('DEMO_ROOM_COUNT phải là số nguyên từ 1 đến 200.');
  }

  await sequelize.authenticate();

  const landlord = await findOrCreateDemoLandlord();

  if (shouldReset) {
    await Room.destroy({
      where: {
        landlordId: landlord.id,
        description: { [Op.like]: `%${DEMO_MARKER}%` },
      },
      force: true,
    });
  }

  const rooms = Array.from({ length: count }, (_, index) => buildDemoRoom(landlord.id, index));
  await Room.bulkCreate(rooms);

  console.log(`Đã tạo ${rooms.length} phòng demo cho chủ nhà: ${landlord.email}`);
  console.log('Tài khoản demo nếu script phải tự tạo:');
  console.log(`Email: ${process.env.DEMO_LANDLORD_EMAIL || DEFAULT_LANDLORD_EMAIL}`);
  console.log(`Mật khẩu: ${process.env.DEMO_LANDLORD_PASSWORD || DEFAULT_PASSWORD}`);
};

main()
  .catch((error) => {
    console.error('Lỗi tạo phòng demo:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
