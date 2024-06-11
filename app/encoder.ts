import zlib from "node:zlib";

type EncoderFn = (body: string | Buffer) => string | Buffer;

export class Encoder {
  private static encodings: Record<string, EncoderFn> = {
    gzip: (body: string | Buffer) => zlib.gzipSync(Buffer.from(body)),
  };

  static encode = (encoding: string, body: string | Buffer) =>
    Encoder.isSupportedEncoding(encoding)
      ? this.encodings[encoding](body)
      : body;

  static isSupportedEncoding = (encoding: string) => encoding in this.encodings;
}
