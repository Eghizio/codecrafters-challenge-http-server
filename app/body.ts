import { Encoder } from "./encoder";

export class TheBody {
  private _body: string | Buffer;

  constructor(bodyLines: string) {
    this._body = TheBody.parseBody(bodyLines);
  }

  get body() {
    return this._body;
  }

  encode(encoding: string): string | Buffer {
    this._body = Encoder.encode(encoding, this._body);
    return this._body;
  }

  static parseBody = (bodyLines: string) => bodyLines;
}
