const path = require('path');
const { pathToFileURL } = require('url');

(async () => {
  try {
    const configPath = path.join(__dirname, '..', 'src', 'config', 'index.js');
    const configFileUrl = pathToFileURL(configPath).href; // file://... URL for import()
    const mod = await import(configFileUrl);
    // config is the default export of your ESM module
    const config = mod.default || mod;
    console.log('Server port:', config.server.port);
    console.log('Mongo URI set:', !!config.db.mongoUri);
    console.log('JWT access expiry:', config.jwt.accessExpiry);
  } catch (err) {
    console.error('Error loading config module:', err);
    process.exit(1);
  }
})();
