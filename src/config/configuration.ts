export default () => ({
  port: parseInt(process.env['PORT'] || '3000', 10),
  mongodbUri: process.env['MONGODB_URI'] || 'mongodb://localhost:27017/attendance_management',
  jwt: {
    secret: process.env['JWT_SECRET'] || 'default-jwt-secret-change-in-production',
    expiresIn: process.env['JWT_EXPIRES_IN'] || '7d',
  },
  nodeEnv: process.env['NODE_ENV'] || 'development',
  adminEmail: process.env['ADMIN_EMAIL'] || 'admin@company.com',
  adminPassword: process.env['ADMIN_PASSWORD'] || 'Admin@123',
  officeIpRanges: process.env['OFFICE_IP_RANGES'] 
    ? process.env['OFFICE_IP_RANGES'].split(',').map(ip => ip.trim()).filter(Boolean) 
    : [],
  officeWifiSsid: process.env['OFFICE_WIFI_SSID'] || 'MyOfficeWiFi',
});
