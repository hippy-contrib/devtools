/* eslint-disable */
const path = require('path');
/* eslint-disable */
const fs = require('fs');

module.exports = {
  '!(public)/**/*.{js,ts,jsx,vue}': ['npx eslint --fix', 'git add']
};
