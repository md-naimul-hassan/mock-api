import { describe, expect, it } from 'vitest';
import { generateAllSnippets, generateSnippet, SNIPPET_LANGUAGES, toDartLiteral, toPythonLiteral } from './codegen';
import type { RequestSpec } from './request';

const get: RequestSpec = { method: 'GET', url: 'http://api.test/api/v1/users?limit=2', headers: [] };
const post: RequestSpec = {
    method: 'POST',
    url: 'http://api.test/api/v1/users',
    headers: [{ key: 'X-Trace', value: "it's" }],
    body: JSON.stringify({ name: 'Alex $Morgan', active: true, tags: ['a'], manager: null }),
};
const del: RequestSpec = { method: 'DELETE', url: 'http://api.test/api/v1/todos/1', headers: [] };

const AsyncFunction = Object.getPrototypeOf(async () => undefined).constructor as new (code: string) => unknown;

describe('generateSnippet', () => {
    it('produces a snippet for every language and method', () => {
        for (const spec of [get, post, del]) {
            for (const snippet of generateAllSnippets(spec)) {
                expect(snippet.code.length, `${snippet.id} ${spec.method}`).toBeGreaterThan(20);
                expect(snippet.code).toContain(spec.url);
            }
        }
        expect(generateAllSnippets(get).map((snippet) => snippet.id)).toEqual(SNIPPET_LANGUAGES.map((language) => language.id));
    });

    it('builds cURL commands with safe shell quoting', () => {
        expect(generateSnippet('curl', get)).toBe("curl 'http://api.test/api/v1/users?limit=2'");
        const code = generateSnippet('curl', post);
        expect(code).toContain("curl -X POST 'http://api.test/api/v1/users'");
        expect(code).toContain(`-H 'X-Trace: it'\\''s'`);
        expect(code).toContain("-H 'Content-Type: application/json'");
        expect(code).toContain('"name": "Alex $Morgan"');
    });

    it('builds syntactically valid fetch and Axios code', () => {
        const fetchCode = generateSnippet('fetch', post);
        expect(fetchCode).toContain("method: 'POST'");
        expect(fetchCode).toContain('body: JSON.stringify({');
        expect(() => new AsyncFunction(fetchCode)).not.toThrow();
        expect(() => new AsyncFunction(generateSnippet('fetch', get))).not.toThrow();

        const deleteCode = generateSnippet('fetch', del);
        expect(deleteCode).not.toContain('response.json()');
        expect(() => new AsyncFunction(deleteCode)).not.toThrow();

        const axiosCode = generateSnippet('axios', post);
        expect(axiosCode).toContain("method: 'post'");
        expect(axiosCode).toContain('data: {');
        expect(axiosCode).not.toContain('Content-Type');
        expect(() => new AsyncFunction(axiosCode.replace(/^import .*$/m, ''))).not.toThrow();
    });

    it('builds Dart code for Dio and package:http', () => {
        const dio = generateSnippet('dio', post);
        expect(dio).toContain("import 'package:dio/dio.dart';");
        expect(dio).toContain("Options(method: 'POST', headers: {");
        expect(dio).toContain("'name': 'Alex \\$Morgan'");
        expect(dio).toContain('on DioException catch (e)');

        const http = generateSnippet('dart-http', post);
        expect(http).toContain("import 'dart:convert';");
        expect(http).toContain('await http.post(');
        expect(http).toContain('body: jsonEncode({');
        expect(generateSnippet('dart-http', get)).not.toContain('dart:convert');
    });

    it('builds Python requests code', () => {
        const code = generateSnippet('python', post);
        expect(code).toContain('requests.post(');
        expect(code).toContain('json={');
        expect(code).toContain('"active": True');
        expect(code).toContain('"manager": None');
        expect(code).toContain('timeout=10');
        expect(code).not.toContain('Content-Type');
        expect(generateSnippet('python', del)).not.toContain('response.json()');
    });

    it('sends invalid JSON bodies verbatim', () => {
        const broken: RequestSpec = { method: 'POST', url: 'http://api.test/api/v1/test/echo', headers: [], body: '{"broken": ' };
        expect(generateSnippet('python', broken)).toContain('data="{\\"broken\\": "');
        expect(generateSnippet('fetch', broken)).toContain(`body: '{"broken": '`);
        expect(generateSnippet('curl', broken)).toContain(`-d '{"broken": '`);
    });

    it('ignores the body for GET requests and blank header names', () => {
        const spec: RequestSpec = { method: 'GET', url: 'http://api.test/x', headers: [{ key: ' ', value: 'ignored' }], body: '{"a":1}' };
        expect(generateSnippet('curl', spec)).toBe("curl 'http://api.test/x'");
    });
});

describe('literal converters', () => {
    it('converts JSON to Dart literals', () => {
        expect(toDartLiteral({})).toBe('<String, dynamic>{}');
        expect(toDartLiteral([1, 'a', null])).toBe("[\n  1,\n  'a',\n  null,\n]");
    });

    it('converts JSON to Python literals', () => {
        expect(toPythonLiteral({ ok: false, items: [] })).toBe('{\n    "ok": False,\n    "items": [],\n}');
    });
});
