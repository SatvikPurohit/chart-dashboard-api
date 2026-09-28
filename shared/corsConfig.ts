import cors from "cors";

const allowedOrigins = [
  "http://localhost:5173", // Local development (e.g., standard Vite/React UI port)
  "http://localhost:3000", // Local ingestion service testing
  "http://localhost:3002", // Local dashboard api testing
  "https://dpc690ulfwxnu.cloudfront.net", // Quick Fix: Make sure to use our exact unique string, not just 'cloudfront.net'
];

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked by CORS Security: Access denied for ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 200,
};
