export const LINE_END = `\r\n`; // CRLF
export const HEADERS_END = `\r\n\r\n`;

export const parseLines = (data: string): [string, string[], string] => {
  const [startLineWithHeaderLines, bodyLines] = data.split(HEADERS_END);
  const [startLine, ...headerLines] = startLineWithHeaderLines.split(LINE_END);
  return [startLine, headerLines, bodyLines];
};
