import { effectiveHeaders, parseJsonBody, sendsBody, type KeyValue, type RequestSpec } from './request';

export const SNIPPET_LANGUAGES = [
    { id: 'curl', label: 'cURL', highlight: 'bash' },
    { id: 'fetch', label: 'fetch', highlight: 'javascript' },
    { id: 'axios', label: 'Axios', highlight: 'javascript' },
    { id: 'dio', label: 'Dart (Dio)', highlight: 'dart' },
    { id: 'dart-http', label: 'Dart (http)', highlight: 'dart' },
    { id: 'python', label: 'Python (requests)', highlight: 'python' },
] as const;

export type SnippetLanguage = (typeof SNIPPET_LANGUAGES)[number]['id'];
export type HighlightLanguage = (typeof SNIPPET_LANGUAGES)[number]['highlight'] | 'json';

interface Body {
    json: boolean;
    value: unknown;
    raw: string;
}

function bodyOf(spec: RequestSpec): Body | undefined {
    if (!sendsBody(spec)) return undefined;
    const raw = spec.body!;
    const parsed = parseJsonBody(raw);
    return parsed.valid ? { json: true, value: parsed.value, raw } : { json: false, value: raw, raw };
}

const isJsonContentType = (header: KeyValue) => header.key.toLowerCase() === 'content-type' && header.value.toLowerCase().includes('application/json');

const indentFollowing = (text: string, spaces: number) => text.replace(/\n/g, `\n${' '.repeat(spaces)}`);

const singleQuoted = (value: string) => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')}'`;

const shellQuoted = (value: string) => `'${value.replace(/'/g, `'\\''`)}'`;

function curl(spec: RequestSpec): string {
    const lines = [spec.method === 'GET' ? `curl ${shellQuoted(spec.url)}` : `curl -X ${spec.method} ${shellQuoted(spec.url)}`];
    for (const header of effectiveHeaders(spec)) lines.push(`  -H ${shellQuoted(`${header.key}: ${header.value}`)}`);
    const body = bodyOf(spec);
    if (body) lines.push(`  -d ${shellQuoted(body.json ? JSON.stringify(body.value, null, 2) : body.raw)}`);
    return lines.join(' \\\n');
}

function jsObject(headers: KeyValue[]): string {
    const entries = headers.map((header) => `  ${singleQuoted(header.key)}: ${singleQuoted(header.value)},`);
    return `{\n${entries.join('\n')}\n}`;
}

const jsValue = (value: unknown) => JSON.stringify(value, null, 2);

function fetchSnippet(spec: RequestSpec): string {
    const headers = effectiveHeaders(spec);
    const body = bodyOf(spec);
    const options: string[] = [];
    if (spec.method !== 'GET') options.push(`method: '${spec.method}',`);
    if (headers.length) options.push(`headers: ${jsObject(headers)},`);
    if (body) options.push(body.json ? `body: JSON.stringify(${jsValue(body.value)}),` : `body: ${singleQuoted(body.raw)},`);

    const call = options.length
        ? `const response = await fetch(${singleQuoted(spec.url)}, {\n${options.map((line) => `  ${indentFollowing(line, 2)}`).join('\n')}\n});`
        : `const response = await fetch(${singleQuoted(spec.url)});`;
    const read =
        spec.method === 'DELETE'
            ? `console.log(response.status); // 204 No Content`
            : `const data = await response.json();\nconsole.log(response.status, data);`;
    return `${call}\n${read}`;
}

function axiosSnippet(spec: RequestSpec): string {
    const headers = effectiveHeaders(spec).filter((header) => !isJsonContentType(header));
    const body = bodyOf(spec);
    const config = [`method: '${spec.method.toLowerCase()}',`, `url: ${singleQuoted(spec.url)},`];
    if (headers.length) config.push(`headers: ${jsObject(headers)},`);
    if (body) config.push(`data: ${body.json ? jsValue(body.value) : singleQuoted(body.raw)},`);
    return [
        `import axios from 'axios';`,
        '',
        'try {',
        `  const response = await axios.request({\n${config.map((line) => `    ${indentFollowing(line, 4)}`).join('\n')}\n  });`,
        '  console.log(response.status, response.data);',
        '} catch (error) {',
        '  // axios rejects for 4xx/5xx responses; the error body is in error.response.',
        '  console.error(error.response?.status, error.response?.data);',
        '}',
    ].join('\n');
}

function dartString(value: string) {
    return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\$/g, '\\$').replace(/\n/g, '\\n').replace(/\r/g, '\\r')}'`;
}

export function toDartLiteral(value: unknown, indent = 0): string {
    const pad = ' '.repeat(indent + 2);
    const close = ' '.repeat(indent);
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string') return dartString(value);
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        return `[\n${value.map((item) => `${pad}${toDartLiteral(item, indent + 2)},`).join('\n')}\n${close}]`;
    }
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return '<String, dynamic>{}';
    return `{\n${entries.map(([key, item]) => `${pad}${dartString(key)}: ${toDartLiteral(item, indent + 2)},`).join('\n')}\n${close}}`;
}

const dartHeaders = (headers: KeyValue[], indent: number) => toDartLiteral(Object.fromEntries(headers.map((header) => [header.key, header.value])), indent);

function dioSnippet(spec: RequestSpec): string {
    const headers = effectiveHeaders(spec);
    const body = bodyOf(spec);
    const args = [dartString(spec.url) + ','];
    if (body) args.push(`data: ${body.json ? toDartLiteral(body.value, 6) : dartString(body.raw)},`);
    const options = [`method: '${spec.method}'`];
    const sentHeaders = body?.json ? headers.filter((header) => !isJsonContentType(header)) : headers;
    if (sentHeaders.length) options.push(`headers: ${dartHeaders(sentHeaders, 6)}`);
    args.push(`options: Options(${options.join(', ')}),`);
    return [
        `import 'package:dio/dio.dart';`,
        '',
        'Future<void> main() async {',
        '  final dio = Dio();',
        '  try {',
        `    final response = await dio.request(\n${args.map((line) => `      ${line}`).join('\n')}\n    );`,
        `    print('\${response.statusCode} \${response.data}');`,
        '  } on DioException catch (e) {',
        '    // Dio throws for 4xx/5xx responses; the error body is in e.response.',
        `    print('\${e.response?.statusCode} \${e.response?.data}');`,
        '  }',
        '}',
    ].join('\n');
}

function dartHttpSnippet(spec: RequestSpec): string {
    const headers = effectiveHeaders(spec);
    const body = bodyOf(spec);
    const args = [`Uri.parse(${dartString(spec.url)}),`];
    if (headers.length) args.push(`headers: ${dartHeaders(headers, 4)},`);
    if (body) args.push(`body: ${body.json ? `jsonEncode(${toDartLiteral(body.value, 4)})` : dartString(body.raw)},`);
    const imports = body?.json ? [`import 'dart:convert';`, `import 'package:http/http.dart' as http;`] : [`import 'package:http/http.dart' as http;`];
    return [
        ...imports,
        '',
        'Future<void> main() async {',
        `  final response = await http.${spec.method.toLowerCase()}(\n${args.map((line) => `    ${line}`).join('\n')}\n  );`,
        `  print('\${response.statusCode} \${response.body}');`,
        '}',
    ].join('\n');
}

export function toPythonLiteral(value: unknown, indent = 0): string {
    const pad = ' '.repeat(indent + 4);
    const close = ' '.repeat(indent);
    if (value === null || value === undefined) return 'None';
    if (value === true) return 'True';
    if (value === false) return 'False';
    if (typeof value === 'string') return JSON.stringify(value);
    if (typeof value === 'number') return String(value);
    if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        return `[\n${value.map((item) => `${pad}${toPythonLiteral(item, indent + 4)},`).join('\n')}\n${close}]`;
    }
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    return `{\n${entries.map(([key, item]) => `${pad}${JSON.stringify(key)}: ${toPythonLiteral(item, indent + 4)},`).join('\n')}\n${close}}`;
}

function pythonSnippet(spec: RequestSpec): string {
    const body = bodyOf(spec);
    const headers = effectiveHeaders(spec).filter((header) => !(body?.json && isJsonContentType(header)));
    const args = [`${JSON.stringify(spec.url)},`];
    if (headers.length) args.push(`headers=${toPythonLiteral(Object.fromEntries(headers.map((header) => [header.key, header.value])), 4)},`);
    if (body) args.push(body.json ? `json=${toPythonLiteral(body.value, 4)},` : `data=${JSON.stringify(body.raw)},`);
    args.push('timeout=10,');
    const read = spec.method === 'DELETE' ? ['print(response.status_code)  # 204 No Content'] : ['print(response.status_code)', 'print(response.json())'];
    return ['import requests', '', `response = requests.${spec.method.toLowerCase()}(`, ...args.map((line) => `    ${line}`), ')', ...read].join('\n');
}

const generators: Record<SnippetLanguage, (spec: RequestSpec) => string> = {
    curl,
    fetch: fetchSnippet,
    axios: axiosSnippet,
    dio: dioSnippet,
    'dart-http': dartHttpSnippet,
    python: pythonSnippet,
};

export function generateSnippet(language: SnippetLanguage, spec: RequestSpec): string {
    return generators[language](spec);
}

export function generateAllSnippets(spec: RequestSpec) {
    return SNIPPET_LANGUAGES.map((language) => ({ ...language, code: generateSnippet(language.id, spec) }));
}
