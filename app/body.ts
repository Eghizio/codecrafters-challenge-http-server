import { Encoder, encodings } from "./Encodings";

export class TheBody {
  constructor(private readonly _body: string | Buffer) {}

  get body() {
    return this._body;
  }

  encode(encoding: string): string | Buffer {
    const encoder: Encoder | undefined = encodings[encoding];
    return encoder ? encoder(this._body) : this._body;
  }

  static parseBody = (bodyLines: string) => bodyLines;
}
