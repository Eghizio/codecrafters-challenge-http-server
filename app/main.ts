import * as net from "node:net";
import fs from "node:fs/promises";

const parseArgs = () => {
  const args = process.argv.slice(2);
  console.log({ args });
};

const CRLF = `\r\n`;
const LINE_END = CRLF;
const HEADERS_END = CRLF.repeat(2);

const HTTP_STATUS = {
  OK: `HTTP/1.1 200 OK`,
  NOT_FOUND: `HTTP/1.1 404 Not Found`,
} as const;

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
  return parseSerializedData(data.toString());
};

type Incoming = ReturnType<typeof parseData>;
type Status = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];
type Headers = Record<string, string>;

const serializeHeaders = (headers: Headers): string => {
  return Object.entries(headers).reduce((serialized, [header, value]) => {
    return `${serialized}${CRLF}${header}: ${value}`;
  }, "");
};

const buildResponse = (
  status: Status,
  headers?: Headers,
  body?: any
): string => {
  if (!headers && !body) return `${status}${HEADERS_END}`;
  if (!headers) return `${status}${HEADERS_END}${body}`;

  if (body && !headers["Content-Length"]) {
    headers = { ...headers, "Content-Length": body.length };
  }

  const serializedHeaders = serializeHeaders(headers);

  return `${status}${LINE_END}${serializedHeaders}${HEADERS_END}${body}`;
};

const createResponse = async ({
  request: { requestTarget },
  headers,
}: Incoming) => {
  if (requestTarget.startsWith("/echo/")) {
    const body = requestTarget.replace("/echo/", "");

    return buildResponse(
      HTTP_STATUS.OK,
      { "Content-Type": "text/plain" },
      body
    );
  }

  if (requestTarget.startsWith("/files/")) {
    const fileName = requestTarget.replace("/files/", "");

    const filePath = `/tmp/${fileName}`;

    const fileExists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);

    if (!fileExists) {
      return buildResponse(HTTP_STATUS.NOT_FOUND);
    }

    const bytes = (await fs.stat(filePath)).size;
    const contents = await fs.readFile(filePath);

    return buildResponse(
      HTTP_STATUS.OK,
      {
        "Content-Type": "application/octet-stream",
        "Content-Length": bytes.toString(),
      },
      contents
    );
  }

  switch (requestTarget) {
    case "/": {
      return buildResponse(HTTP_STATUS.OK);
    }

    case "/user-agent": {
      const userAgent = headers["User-Agent"];
      return buildResponse(
        HTTP_STATUS.OK,
        { "Content-Type": "text/plain" },
        userAgent
      );
    }

    default: {
      return buildResponse(HTTP_STATUS.NOT_FOUND);
    }
  }
};

parseArgs();

const server = net.createServer((socket) => {
  socket.on("connect", () => {
    socket.write(Buffer.from(buildResponse(HTTP_STATUS.OK)));
  });

  socket.on("data", async (data) => {
    const incoming = parseData(data);
    const response = await createResponse(incoming);

    console.log({ incoming, response });

    socket.write(Buffer.from(response));
    socket.end();
  });
});

console.log("Logs from your program will appear here!");

server.listen(4221, "localhost", () => {
  console.log("Server is running on port 4221");
});
