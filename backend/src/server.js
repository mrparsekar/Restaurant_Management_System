const app = require("./app");
const env = require("./config/env");
const { connectMongo } = require("./config/database");

connectMongo();

app.listen(env.port, () => {
  console.log(`Server running on http://localhost:${env.port}`);
});
