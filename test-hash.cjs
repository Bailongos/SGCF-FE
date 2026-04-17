const bcrypt = require('bcryptjs');

const hash = '$2b$10$2qpnswc97tbwpHRTTTkSZr.NPP./14J1N.nvmgppHOHwX9GKLTkOP9i';
const passwords = ['admin', 'admin123', 'admin1234', 'password', '123456', '12345678'];

passwords.forEach(p => {
  if (bcrypt.compareSync(p, hash)) {
    console.log("Match found:", p);
  }
});
