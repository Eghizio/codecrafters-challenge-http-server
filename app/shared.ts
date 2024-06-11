import { TheRequest } from "./request";
import { TheHeaders } from "./headers";
import { TheBody } from "./body";

export const LINE_END = `\r\n`; // CRLF
export const HEADERS_END = `\r\n\r\n`;

const parseLines = (data: string): [string, string[], string] => {
  const [startLineWithHeaderLines, bodyLines] = data.split(HEADERS_END);
  const [startLine, ...headerLines] = startLineWithHeaderLines.split(LINE_END);
  return [startLine, headerLines, bodyLines];
};

export const parseData = (data: Buffer) => {
  const [startLine, headerLines, bodyLines] = parseLines(data.toString());

  return {
    request: TheRequest.parseRequest(startLine),
    headers: TheHeaders.parseHeaders(headerLines),
    body: TheBody.parseBody(bodyLines),
  };
};

export const HTTP_STATUS = {
  OK: `HTTP/1.1 200 OK`,
  NOT_FOUND: `HTTP/1.1 404 Not Found`,
  CREATED: `HTTP/1.1 201 Created`,
} as const;

export const HTTP_METHOD = {
  GET: "GET",
  POST: "POST",
  ANY: "*",
} as const;

export type ValueOf<T> = T[keyof T];

export type Incoming = ReturnType<typeof parseData>;

export type Status = ValueOf<typeof HTTP_STATUS>;
export type Headers = Record<string, string>;
export type Body = string | Buffer;

export type Outgoing = { status: Status; headers?: Headers; body?: Body };

export type Method = ValueOf<typeof HTTP_METHOD>;
