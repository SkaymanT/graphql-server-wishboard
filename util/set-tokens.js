const { sign } = require('jsonwebtoken');

const { SECRET_KEY_ACCESS, SECRET_KEY_REFRESH } = require('../config');

module.exports.setTokens = (user) => {
  const sevenDays = 60 * 60 * 24 * 7;
  const fifteenMins = 60 * 15;

  // const sevenDays = 10;
  // const fifteenMins = 5;
  const accessUser = {
    id: user.id,
    email: user.email,
    username: user.username,
  };
  const accessToken = sign({ user: accessUser }, SECRET_KEY_ACCESS, {
    expiresIn: `${fifteenMins}s`,
  });
  const refreshUser = {
    id: user.id,
    email: user.email,
    username: user.username,
    count: user.tokenCount,
  };
  const refreshToken = sign({ user: refreshUser }, SECRET_KEY_REFRESH, {
    expiresIn: `${sevenDays}s`,
  });

  return { accessToken, refreshToken };
};

module.exports.tokenCookies = ({ accessToken, refreshToken }) => {
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  };
  return {
    access: ['access', accessToken, cookieOptions],
    refresh: ['refresh', refreshToken, cookieOptions],
  };
};
