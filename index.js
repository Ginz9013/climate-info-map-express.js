const express = require("express");
const app = express();

app.use(express.static("public"));

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/public/index.html");
});

const server = app.listen(5055, () => console.log(`Server Running... port: localhost:5055`));
