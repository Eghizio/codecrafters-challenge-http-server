export class TheRequest {
  readonly httpMethod: string;
  readonly httpVersion: string;
  readonly requestTarget: string;

  constructor(startLine: string) {
    const { httpMethod, httpVersion, requestTarget } =
      TheRequest.parseRequest(startLine);

    this.httpMethod = httpMethod;
    this.httpVersion = httpVersion;
    this.requestTarget = requestTarget;
  }

  static parseRequest = (startLine: string) => {
    const [httpMethod, requestTarget, httpVersion] = startLine.split(" ");
    return { httpMethod, requestTarget, httpVersion };
  };
}
