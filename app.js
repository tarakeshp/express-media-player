const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const app = new express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

let songs_list = [];
fs.readdirSync(path.resolve(__dirname, "songs")).forEach((file) => {
  songs_list.push({
    id: file,
    name: file.toLowerCase().replace(/ /g, "-").split(".")[0],
  });
});

console.log(songs_list);

app.get("/", function (req, res) {
  res.render("index", { songs: songs_list });
});

app.get("/play/:id", function (req, res) {
  const file_path = path.join(__dirname, "songs", req.params.id);
  const stat = fs.statSync(file_path);
  const range = req.headers.range;
  console.log("Playing audio file: %s and size in bytes: %s", req.params.id, stat.size);
  let readStream;
  if (range !== undefined) {
    var parts = range.replace(/bytes=/, "").split("-");

    var partial_start = parts[0];
    var partial_end = parts[1];

    if ((isNaN(partial_start) && partial_start.length > 1) || (isNaN(partial_end) && partial_end.length > 1)) {
      return res.sendStatus(500); //ERR_INCOMPLETE_CHUNKED_ENCODING
    }

    var start = parseInt(partial_start, 10);
    var end = partial_end ? parseInt(partial_end, 10) : stat.size - 1;
    var content_length = end - start + 1;

    res.status(206).header({
      "Content-Type": "audio/mpeg",
      "Content-Length": content_length,
      "Content-Range": "bytes " + start + "-" + end + "/" + stat.size,
    });

    readStream = fs.createReadStream(file_path, { start: start, end: end });
  } else {
    res.header({
      "Content-Type": "audio/mpeg",
      "Content-Length": stat.size,
    });
    readStream = fs.createReadStream(file_path);
  }
  readStream.pipe(res);
});

const server = http.createServer(app);
server.listen(3001, function () {
  console.log("Server stated listening on http://localhost:3001");
});
