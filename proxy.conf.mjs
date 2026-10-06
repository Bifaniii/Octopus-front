import dotenv from 'dotenv';
dotenv.config();

export default function setupProxy() {
  return {
    "/api/medicacoes": {
      "target": "http://localhost:443",
      "secure": false,
      "changeOrigin": true,
      "logLevel": "debug"
    },
    "/api/baias": {
      "target": "http://localhost:8081",
      "secure": false,
      "changeOrigin": true,
      "logLevel": "debug"
    },
    "/api": {
      "target": "http://localhost:8080",
      "secure": false,
      "changeOrigin": true,
      "logLevel": "debug"
    }
  };
}
