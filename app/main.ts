import * as net from "node:net";
import fs from "node:fs/promises";
import zlib from "node:zlib";

const LINE_END = `\r\n`; // CRLF
const HEADERS_END = `\r\n\r\n`;

const HTTP_STATUS = {
  OK: `HTTP/1.1 200 OK`,
  NOT_FOUND: `HTTP/1.1 404 Not Found`,
  CREATED: `HTTP/1.1 201 Created`,
} as const;

const ACCEPTED_ENCODINGS = ["gzip"];

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
type Body = string | Buffer;

const serializeHeaders = (headers: Headers): string => {
  return Object.entries(headers)
    .reduce((serialized, [header, value]) => {
      return `${serialized}${LINE_END}${header}: ${value}`;
    }, "")
    .trim();
};

const buildResponse = (status: Status, headers?: Headers, body?: Body) => {
  if (!headers && !body) return { response: `${status}${HEADERS_END}` };
  if (!headers) return { response: `${status}${HEADERS_END}`, body };

  const serializedHeaders = serializeHeaders({
    ...(body && { "Content-Length": body.length.toString() }),
    ...headers,
  });

  return {
    response: `${status}${LINE_END}${serializedHeaders}${HEADERS_END}`,
    body,
  };
};

const createResponse = async ({
  request: { httpMethod, requestTarget },
  headers,
  body,
}: Incoming) => {
  if (requestTarget.startsWith("/echo/")) {
    const body = requestTarget.replace("/echo/", "");

    const encoding = headers["Accept-Encoding"]
      ?.split(", ")
      .filter((enc) => ACCEPTED_ENCODINGS.includes(enc))
      .at(0); // take first

    if (encoding === "gzip") {
      const encodedBody = zlib.gzipSync(Buffer.from(body));

      return buildResponse(
        HTTP_STATUS.OK,
        {
          "Content-Type": "text/plain",
          "Content-Encoding": "gzip",
          "Content-Length": encodedBody.length.toString(),
        },
        encodedBody
      );
    }

    return buildResponse(
      HTTP_STATUS.OK,
      {
        "Content-Type": "text/plain",
        ...(encoding && { "Content-Encoding": encoding }),
      },
      body
    );
  }

  if (requestTarget.startsWith("/files/")) {
    const directory = process.argv.slice(2)[1] || "/tmp/";
    const fileName = requestTarget.replace("/files/", "");

    const filePath = `${directory}${fileName}`;

    switch (httpMethod) {
      case "GET": {
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

      case "POST": {
        await fs.writeFile(filePath, body);

        return buildResponse(HTTP_STATUS.CREATED);
      }

      default: {
        return buildResponse(HTTP_STATUS.NOT_FOUND);
      }
    }
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

const server = net.createServer((socket) => {
  socket.on("data", async (data) => {
    const incoming = parseData(data);
    const { response, body } = await createResponse(incoming);

    console.log({ incoming, response, body });

    socket.write(Buffer.from(response));
    if (body) socket.write(Buffer.from(body));
    socket.end();
  });

  socket.on("connect", () => {
    const { response, body } = buildResponse(HTTP_STATUS.OK);
    socket.write(Buffer.from(response));
    if (body) socket.write(Buffer.from(body));
  });
});

console.log("Logs from your program will appear here!");

server.listen(4221, "localhost", () => {
  console.log("Server is running on port 4221");
});
