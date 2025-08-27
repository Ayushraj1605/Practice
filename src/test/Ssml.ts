import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { SSMLNode } from '../main/com/speechify/Ssml/Ssml';

describe('Ssml', () => {
  let parseSSML: (ssml: string) => SSMLNode;
  let ssmlNodeToText: (node: SSMLNode | null) => string;

  before(async () => {
    const module = await import('../main/com/speechify/Ssml/Ssml');
    parseSSML = module.parseSSML;
    ssmlNodeToText = module.ssmlNodeToText;
  });

  test('should parse basic SSML and convert to text', (t) => {
    const ssml = '<speak><p id="1">Hello <s>world</s></p></speak>';
    const tree = parseSSML(ssml);
    assert.strictEqual(tree.tag, 'speak');
    assert.strictEqual(tree.children.length, 1);
    assert.strictEqual(tree.children[0].tag, 'p');
    assert.strictEqual(tree.children[0].attributes.get('id'), '1');
    assert.strictEqual(tree.children[0].children[0].text, 'Hello');
    assert.strictEqual(tree.children[0].children[1].tag, 's');
    assert.strictEqual(tree.children[0].children[1].children[0].text, 'world');
    assert.strictEqual(ssmlNodeToText(tree), 'Hello world');
  });

  test('should handle empty SSML', (t) => {
    const ssml = '';
    const tree = parseSSML(ssml);
    assert.strictEqual(tree.tag, 'speak');
    assert.strictEqual(tree.children.length, 0);
    assert.strictEqual(ssmlNodeToText(tree), '');
  });

  test('should handle nested tags', (t) => {
    const ssml = '<speak><p><s>Hello</s> <s>world</s></p></speak>';
    const tree = parseSSML(ssml);
    assert.strictEqual(tree.children[0].children.length, 2);
    assert.strictEqual(tree.children[0].children[0].tag, 's');
    assert.strictEqual(tree.children[0].children[0].children[0].text, 'Hello');
    assert.strictEqual(tree.children[0].children[1].children[0].text, 'world');
    assert.strictEqual(ssmlNodeToText(tree), 'Hello world');
  });
});