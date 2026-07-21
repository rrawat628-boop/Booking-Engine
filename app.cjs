/**
 * cPanel / Phusion Passenger Entry Point
 * 
 * cPanel's Node.js Selector requires a startup file (typically at the root directory).
 * This script boots our production-compiled Node.js + Express backend.
 */

// Import the bundled production server
require('./dist/server.cjs');
