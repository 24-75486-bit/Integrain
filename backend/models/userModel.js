const demoUsers = {
  'admin@junbebot.com': { role: 'admin' },
  'staff@junbebot.com': { role: 'staff' }
};

function findByEmail(email) {
  return demoUsers[email.toLowerCase()] || null;
}

module.exports = { findByEmail };
