import app from "./app.js";
import { ConnectDB } from "./database/dbconfig.js";

const PORT = process.env.PORT || 5000;

ConnectDB();

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
