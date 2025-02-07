import dotenv from "dotenv/config";
import { app } from "./app.js";

const PORT = process.env.PORT;

app.listen(PORT || 3000, () => {
  console.log(`Listening on ${PORT}`);
});
