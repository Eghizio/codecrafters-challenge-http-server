import * as net from "net";

const server = net.createServer((socket) => {
  socket.write(Buffer.from(`HTTP/1.1 200 OK\r\n\r\n`));
  socket.end();
});

console.log("Logs from your program will appear here!");

server.listen(4221, "localhost", () => {
  console.log("Server is running on port 4221");
});
