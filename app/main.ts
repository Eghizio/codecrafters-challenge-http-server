import * as net from "node:net";
import fs from "node:fs/promises";
import {
  LINE_END,
  HEADERS_END,
  HTTP_STATUS,
  parseData,
  type Outgoing,
} from "./shared";
import { TheHeaders } from "./headers";
import { Encoder } from "./encoder";
import { Router } from "./router";

// Todo: Change this method, accept outgoing and socket, write partially response.
const buildResponse = ({ status, headers, body }: Outgoing) => {
  const serializedHeaders = TheHeaders.serializeHeaders({
    ...(body && { "Content-Length": body.length.toString() }),
    ...headers,
  });

  return {
    response: `${status}${LINE_END}${serializedHeaders}${HEADERS_END}`,
    body,
  };
};

const router = new Router();

router.get("/echo/:echo", ({ request, headers }) => {
  const param = request.params["echo"];

  const encoding = headers["Accept-Encoding"]
    ?.split(", ")
    .filter(Encoder.isSupportedEncoding)
    .at(0);

  const body = encoding ? Encoder.encode(encoding, param) : param;

  return {
    status: HTTP_STATUS.OK,
    headers: {
      "Content-Type": "text/plain",
      "Content-Length": body.length.toString(),
      ...(encoding && { "Content-Encoding": encoding }),
    },
    body,
  };
});

router.get("/files/:filename", async ({ request }) => {
  const directory = process.argv.slice(2)[1] || "/tmp/";
  const fileName = request.params["filename"];
  const filePath = `${directory}${fileName}`;

  const fileExists = await fs
    .access(filePath)
    .then(() => true)
    .catch(() => false);

  if (!fileExists) {
    return { status: HTTP_STATUS.NOT_FOUND };
  }

  const bytes = (await fs.stat(filePath)).size;
  const contents = await fs.readFile(filePath);

  return {
    status: HTTP_STATUS.OK,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": bytes.toString(),
    },
    body: contents,
  };
});

router.post("/files/:filename", async ({ request, body }) => {
  const directory = process.argv.slice(2)[1] || "/tmp/";
  const fileName = request.params["filename"];
  const filePath = `${directory}${fileName}`;

  await fs.writeFile(filePath, body);

  return { status: HTTP_STATUS.CREATED };
});

router.any("/user-agent", ({ headers }) => {
  const body = headers["User-Agent"];

  return {
    status: HTTP_STATUS.OK,
    headers: { "Content-Type": "text/plain" },
    body,
  };
});

router.any("/", () => ({ status: HTTP_STATUS.OK }));

const server = net.createServer((socket) => {
  socket.on("data", async (data) => {
    const incoming = parseData(data);
    const outgoing = await router.handle(incoming);
    const { response, body } = buildResponse(outgoing);

    console.log({ incoming }, { outgoing }, { response, body });

    socket.write(Buffer.from(response));
    if (body) socket.write(Buffer.from(body));
    socket.end();
  });

  socket.on("connect", () => {
    const { response, body } = buildResponse({ status: HTTP_STATUS.OK });
    socket.write(Buffer.from(response));
    if (body) socket.write(Buffer.from(body));
  });
});

console.log("Logs from your program will appear here!");

server.listen(4221, "localhost", () => {
  console.log("Server is running on port 4221");
});
