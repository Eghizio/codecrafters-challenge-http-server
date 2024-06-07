import * as net from "net";

const HTTP_STATUS = {
  OK: `HTTP/1.1 200 OK\r\n\r\n`,
  NOT_FOUND: `HTTP/1.1 404 Not Found\r\n\r\n`,
};

const parseRequestData = (data: Buffer) => {
  const requestLine = data.toString().split("\r\n")[0];

  const [httpMethod, requestTarget, httpVersion] = requestLine.split(" ");
  console.log({ httpMethod, requestTarget, httpVersion });

  return { httpMethod, requestTarget, httpVersion };
};

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const { requestTarget } = parseRequestData(data);

    const response =
      requestTarget === "/" ? HTTP_STATUS.OK : HTTP_STATUS.NOT_FOUND;

    socket.write(Buffer.from(response));
    socket.end();
  });
});

console.log("Logs from your program will appear here!");

server.listen(4221, "localhost", () => {
  console.log("Server is running on port 4221");
});
