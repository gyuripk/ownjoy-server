import "dotenv/config";
// require("dotenv").config(); // 무조건 이 코드가 1등으로 실행되도록 맨 위에 작성
import express, { Request, Response } from "express";
import cors from "cors";
import safetyRouter from "./routes/safety";
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/safety", safetyRouter);

// define data type of marker
interface Marker {
  id: number;
  name: string;
  lat: number;
  lng: number;
}

// Test API
app.get("/api/test-markers", (req: Request, res: Response) => {
  const testMarkers: Marker[] = [
    { id: 1, name: "비상벨 테스트", lat: 37.4979, lng: 127.0276 },
    { id: 2, name: "CCTV 테스트", lat: 37.5006, lng: 127.0364 },
  ];

  res.json(testMarkers);
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(
    `[TypeScript] Backend server is running on http://localhost:${PORT}.`,
  );
});
