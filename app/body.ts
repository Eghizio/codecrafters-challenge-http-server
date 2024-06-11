import { Encoder, encodings } from "./encodings";

export class TheBody {
  private _body: string | Buffer;

  constructor(bodyLines: string) {
    this._body = TheBody.parseBody(bodyLines);
  }

  get body() {
    return this._body;
  }

  encode(encoding: string): string | Buffer {
    const encoder: Encoder | undefined = encodings[encoding];
    this._body = encoder ? encoder(this._body) : this._body;
    return this._body;
  }

  static parseBody = (bodyLines: string) => bodyLines;
}
