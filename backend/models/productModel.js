const products = [
  { name: 'Regular Milagrosa', type: 'Regular', price: 42, weight: 'per kg', photo: 'photo-1586201375761-83865001e31c' },
  { name: 'Well Milled Rice', type: 'Well Milled', price: 46, weight: 'per kg', photo: 'photo-1592997571659-0b21ff64313b' },
  { name: 'Premium Rice', type: 'Premium', price: 52, weight: 'per kg', photo: 'photo-1536304993881-ff6e9eefa2a6' },
  { name: 'Sinandomeng', type: 'Regular', price: 44, weight: 'per kg', photo: 'photo-1574323347407-f5e1ad6d020b' },
  { name: 'Jasmine Rice', type: 'Premium', price: 48, weight: 'per kg', photo: 'photo-1516684732162-798a0062be99' },
  { name: 'Brown Rice', type: 'Well Milled', price: 56, weight: 'per kg', photo: 'photo-1586201375761-83865001e31c' },
  { name: 'Dinorado Rice', type: 'Premium', price: 50, weight: 'per kg', photo: 'photo-1592997571659-0b21ff64313b' },
  { name: 'Long Grain Rice', type: 'Regular', price: 40, weight: 'per kg', photo: 'photo-1536304993881-ff6e9eefa2a6' }
];

function getAll() {
  return products;
}

module.exports = { getAll };
