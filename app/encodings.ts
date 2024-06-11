import zlib from "node:zlib";

export type Encoder = (body: string | Buffer) => string | Buffer;

export const encodings: Record<string, Encoder> = {
  gzip: (body: string | Buffer) => zlib.gzipSync(Buffer.from(body)),
};
