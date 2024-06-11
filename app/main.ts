import * as net from "node:net";
import fs from "node:fs/promises";
import {
  LINE_END,
  HEADERS_END,
  HTTP_STATUS,
  type Status,
  type Headers,
  type Body,
  parseData,
} from "./shared";
import { TheHeaders } from "./headers";
import { Encoder } from "./encoder";
import { type ResponseBuilder, Router } from "./router";

const buildResponse = (status: Status, headers?: Headers, body?: Body) => {
  const serializedHeaders = TheHeaders.serializeHeaders({
    ...(body && { "Content-Length": body.length.toString() }),
    ...headers,
  });

  return {
    response: `${status}${LINE_END}${serializedHeaders}${HEADERS_END}`,
    body,
  };
};

const responseBuilder: ResponseBuilder = (outgoing) =>
  buildResponse(
    outgoing?.status ?? HTTP_STATUS.NOT_FOUND,
    outgoing?.headers,
    outgoing?.body
  );

const router = new Router(responseBuilder);

router.get("/echo/:echo", ({ request: { requestTarget }, headers }) => {
  const param = requestTarget.replace("/echo/", ""); // Todo: parse params & queries
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

router.get("/files/:filename", async ({ request: { requestTarget } }) => {
  const directory = process.argv.slice(2)[1] || "/tmp/";
  const fileName = requestTarget.replace("/files/", "");

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

router.post(
  "/files/:filename",
  async ({ request: { requestTarget }, body }) => {
    const directory = process.argv.slice(2)[1] || "/tmp/";
    const fileName = requestTarget.replace("/files/", "");

    const filePath = `${directory}${fileName}`;

    await fs.writeFile(filePath, body);

    return { status: HTTP_STATUS.CREATED };
  }
);

router.any("/user-agent", ({ headers }) => {
  const body = headers["User-Agent"];

  return {
    status: HTTP_STATUS.OK,
    headers: { "Content-Type": "text/plain" },
    body,
  };
});

router.any("/", () => ({ status: HTTP_STATUS.OK }));

// const createResponse = async ({
//   request: { httpMethod, requestTarget },
//   headers,
//   body,
// }: Incoming) => {
//   if (requestTarget.startsWith("/echo/")) {
//     const body = requestTarget.replace("/echo/", "");

//     const encoding = headers["Accept-Encoding"]
//       ?.split(", ")
//       .filter((enc) => Encoder.isSupportedEncoding(enc))
//       .at(0); // take first

//     if (encoding) {
//       const encodedBody = Encoder.encode(encoding, body);

//       return buildResponse(
//         HTTP_STATUS.OK,
//         {
//           "Content-Type": "text/plain",
//           "Content-Encoding": encoding,
//           "Content-Length": encodedBody.length.toString(),
//         },
//         encodedBody
//       );
//     }

//     return buildResponse(
//       HTTP_STATUS.OK,
//       {
//         "Content-Type": "text/plain",
//         ...(encoding && { "Content-Encoding": encoding }),
//       },
//       body
//     );
//   }

//   if (requestTarget.startsWith("/files/")) {
//     const directory = process.argv.slice(2)[1] || "/tmp/";
//     const fileName = requestTarget.replace("/files/", "");

//     const filePath = `${directory}${fileName}`;

//     switch (httpMethod) {
//       case HTTP_METHOD.GET: {
//         const fileExists = await fs
//           .access(filePath)
//           .then(() => true)
//           .catch(() => false);

//         if (!fileExists) {
//           return buildResponse(HTTP_STATUS.NOT_FOUND);
//         }

//         const bytes = (await fs.stat(filePath)).size;
//         const contents = await fs.readFile(filePath);

//         return buildResponse(
//           HTTP_STATUS.OK,
//           {
//             "Content-Type": "application/octet-stream",
//             "Content-Length": bytes.toString(),
//           },
//           contents
//         );
//       }

//       case HTTP_METHOD.POST: {
//         await fs.writeFile(filePath, body);

//         return buildResponse(HTTP_STATUS.CREATED);
//       }

//       default: {
//         return buildResponse(HTTP_STATUS.NOT_FOUND);
//       }
//     }
//   }

//   switch (requestTarget) {
//     case "/": {
//       return buildResponse(HTTP_STATUS.OK);
//     }

//     case "/user-agent": {
//       const userAgent = headers["User-Agent"];

//       return buildResponse(
//         HTTP_STATUS.OK,
//         { "Content-Type": "text/plain" },
//         userAgent
//       );
//     }

//     default: {
//       return buildResponse(HTTP_STATUS.NOT_FOUND);
//     }
//   }
// };

const server = net.createServer((socket) => {
  socket.on("data", async (data) => {
    const incoming = parseData(data);
    const { response, body } = await router.handle(incoming);
    // const { response, body } = await createResponse(incoming);

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
