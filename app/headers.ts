import { LINE_END } from "./shared";

export class TheHeaders {
  private _headers: Record<string, string> = {};

  constructor(headerLines: string[]) {
    this._headers = TheHeaders.parseHeaders(headerLines);
  }

  get headers() {
    return this._headers;
  }

  getHeader(headerName: string): string | undefined {
    return this._headers[headerName];
  }

  toString(): string {
    return TheHeaders.serializeHeaders(this._headers);
  }

  static parseHeaders = (headerLines: string[]): Record<string, string> =>
    headerLines.reduce<Record<string, string>>((headers, rawHeader) => {
      const [header, value] = rawHeader.split(": ");
      headers[header] = value;
      return headers;
    }, {});

  static serializeHeaders = (headers: Record<string, string>): string =>
    Object.entries(headers)
      .reduce(
        (serialized, [header, value]) =>
          `${serialized}${LINE_END}${header}: ${value}`,
        ""
      )
      .trim();
}
