import type { Socket } from "node:net";
import {
  type Outgoing,
  type Status,
  type Headers,
  type Body,
  LINE_END,
  HEADERS_END,
} from "./shared";
import { TheHeaders } from "./headers";

export class Response {
  private readonly status: Status;
  private readonly headers?: Headers;
  private readonly body?: Body;

  constructor({ status, headers, body }: Outgoing) {
    this.status = status;
    this.headers = headers;
    this.body = body;
  }

  send(socket: Socket) {
    const [statusLine, headerLines, body] = this.build();

    socket.write(Buffer.from(statusLine + LINE_END));
    socket.write(Buffer.from(headerLines + HEADERS_END));
    if (body) socket.write(Buffer.from(body));

    socket.end();
  }

  private build(): [string, string, Body] {
    return [
      this.status,
      TheHeaders.serializeHeaders({
        ...(this.body && { "Content-Length": this.body.length.toString() }),
        ...this.headers,
      }),
      this.body ?? "",
    ];
  }
}
