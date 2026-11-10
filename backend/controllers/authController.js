const User = require('../models/userModel');

function login(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = User.findByEmail(email);

  if (!password || !user) {
    return res.status(401).json({ message: 'Account not found. Use the demo email shown on the left.' });
  }

  return res.json({ role: user.role });
}

module.exports = { login };
