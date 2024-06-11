import {
  HTTP_METHOD,
  HTTP_STATUS,
  type Incoming,
  type Method,
  type Outgoing,
} from "./shared";

type Handler = (incoming: Incoming) => Outgoing | Promise<Outgoing>;

type Route = {
  method: Method;
  path: string;
  handler: Handler;
};

type ResponseBuilder = (outgoing?: Outgoing) => Outgoing;

export class Router {
  private _routes: Route[] = [];
  private responseBuilder: ResponseBuilder = (outgoing) => ({
    ...outgoing,
    status: outgoing?.status ?? HTTP_STATUS.NOT_FOUND,
  });

  constructor(responseBuilder?: ResponseBuilder) {
    this.responseBuilder = responseBuilder ?? this.responseBuilder;
  }

  async handle(incoming: Incoming) {
    return this.responseBuilder(await this.resolveRoute(incoming));
  }

  any(path: string, handler: Handler) {
    this.registerRoute({ method: HTTP_METHOD.ANY, path, handler });
  }

  get(path: string, handler: Handler) {
    this.registerRoute({ method: HTTP_METHOD.GET, path, handler });
  }

  post(path: string, handler: Handler) {
    this.registerRoute({ method: HTTP_METHOD.POST, path, handler });
  }

  private registerRoute(route: Route) {
    this._routes.push(route);
  }

  private async resolveRoute(
    incoming: Incoming
  ): Promise<Outgoing | undefined> {
    const { requestTarget, httpMethod } = incoming.request;

    const route = this._routes.find(
      ({ path, method }) =>
        this.isMatchingPath(path, requestTarget) &&
        this.isMatchingMethod(method, httpMethod)
    );

    if (!route) return;
    return route.handler(incoming);
  }

  private isMatchingPath(path: string, requestTarget: string): boolean {
    if (path.includes(":")) {
      const first = path.split(":").at(0);
      return first ? requestTarget.startsWith(first) : false;
    }

    return path === requestTarget;
  }

  private isMatchingMethod(method: Method, httpMethod: string): boolean {
    return method === HTTP_METHOD.ANY || method === httpMethod;
  }
}
