import * as net from "net";

const CRLF = `\r\n`;
const LINE_END = CRLF;
const HEADERS_END = CRLF.repeat(2);

const HTTP_STATUS = {
  OK: `HTTP/1.1 200 OK`,
  NOT_FOUND: `HTTP/1.1 404 Not Found`,
};

const parseRequest = (rawRequest: string) => {
  const [httpMethod, requestTarget, httpVersion] = rawRequest.split(" ");
  return { httpMethod, requestTarget, httpVersion };
};

const parseHeaders = (rawHeaders: string[]) =>
  rawHeaders.reduce<Record<string, string>>((headers, rawHeader) => {
    const [header, value] = rawHeader.split(": ");
    headers[header] = value;
    return headers;
  }, {});

const parseBody = (body: string) => body;

const parseSerializedData = (serialized: string) => {
  const [requestWithHeaders, rawBody] = serialized.split(HEADERS_END);
  const [rawRequest, ...rawHeaders] = requestWithHeaders.split(LINE_END);

  return {
    request: parseRequest(rawRequest),
    headers: parseHeaders(rawHeaders),
    body: parseBody(rawBody),
  };
};

const parseData = (data: Buffer) => {
  //   return parseSerializedData(data.toString());
  const serialized = data.toString();
  const { request, headers, body } = parseSerializedData(serialized);

  console.log(serialized, { request, headers, body });

  return { request, headers, body };
};

const buildResponse = (status: string, headers: string, body: any): string => {
  return `${status}${LINE_END}${headers}${HEADERS_END}${body}`;
};

const createResponse = (requestTarget: string) => {
  if (requestTarget.startsWith("/echo/")) {
    const body = requestTarget.replace("/echo/", "");
    const contentLength = body.length;

    return buildResponse(
      HTTP_STATUS.OK,
      `Content-Type: text/plain\r\nContent-Length: ${contentLength}`,
      body
    );
  }

  switch (requestTarget) {
    case "/":
      return buildResponse(HTTP_STATUS.OK, "", "");
    default:
      return buildResponse(HTTP_STATUS.NOT_FOUND, "", "");
  }
};

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const {
      request: { requestTarget },
    } = parseData(data);

    const response = createResponse(requestTarget);
    console.log({ response });

    socket.write(Buffer.from(response));
    socket.end();
  });
});

console.log("Logs from your program will appear here!");

server.listen(4221, "localhost", () => {
  console.log("Server is running on port 4221");
});
