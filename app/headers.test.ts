import assert from "node:assert";
import test, { describe, mock } from "node:test";
import { TheHeaders } from "./headers";

describe("should ", () => {
  test("parse header lines into headers record", () => {
    // Given
    const headerLines = [
      "Content-Type: text/plain",
      "Content-Encoding: gzip",
      "Content-Length: 42",
    ];

    // When
    const headers = TheHeaders.parseHeaders(headerLines);

    // Then
    assert.strictEqual(headers["Content-Type"], "text/plain");
    assert.strictEqual(headers["Content-Length"], "42");
    assert.strictEqual(headers["Content-Encoding"], "gzip");
  });

  test("serialize headers into header lines", () => {
    // Given
    const headers = {
      "Content-Type": "text/plain",
      "Content-Encoding": "gzip",
      "Content-Length": "42",
    };

    // When
    const serializedHeaders = TheHeaders.serializeHeaders(headers);

    // Then
    assert.strictEqual(
      serializedHeaders,
      "Content-Type: text/plain\r\nContent-Encoding: gzip\r\nContent-Length: 42"
    );
  });

  test("construct headers object and get headers record", () => {
    // Given
    const headerLines = [
      "Content-Type: text/plain",
      "Content-Encoding: gzip",
      "Content-Length: 42",
    ];

    // And
    const parserMock = mock.method(TheHeaders, "parseHeaders");

    // When
    const headers = new TheHeaders(headerLines).headers;

    // Then
    assert.strictEqual(parserMock.mock.calls.length, 1);

    assert.strictEqual(headers["Content-Type"], "text/plain");
    assert.strictEqual(headers["Content-Length"], "42");
    assert.strictEqual(headers["Content-Encoding"], "gzip");
  });

  test("serialize headers to string", () => {
    // Given
    const headerLines = [
      "Content-Type: text/plain",
      "Content-Encoding: gzip",
      "Content-Length: 42",
    ];

    // And
    const parserMock = mock.method(TheHeaders, "parseHeaders");
    const serializerMock = mock.method(TheHeaders, "serializeHeaders");

    // When
    const serializedHeaders = new TheHeaders(headerLines).toString();

    // Then
    assert.strictEqual(parserMock.mock.calls.length, 1);
    assert.strictEqual(serializerMock.mock.calls.length, 1);

    assert.strictEqual(
      serializedHeaders,
      "Content-Type: text/plain\r\nContent-Encoding: gzip\r\nContent-Length: 42"
    );
  });
});
