import { test } from 'node:test';
import assert from 'node:assert';
import { parseSSML, ssmlNodeToText } from '../main/com/speechify/Ssml/Ssml.js';
test('should parse tag names', () => {
    let tree = parseSSML('<speak></speak>');
    assert.strictEqual(tree.tag, 'speak', 'Root tag should be speak');
    assert.strictEqual(tree.children.length, 0, 'Empty speak tag should have no children');
    tree = parseSSML('<speak><p></p></speak>');
    assert.strictEqual(tree.tag, 'speak', 'Root tag should be speak');
    assert.strictEqual(tree.children[0].tag, 'p', 'Child tag should be p');
    assert.strictEqual(tree.children[0].children.length, 0, 'p tag should have no children');
});
test.describe('should throw on missing speak tag', () => {
    const inputs = [
        'Hello world',
        '<p>Hello world</p>',
        '<p><speak>Hello world</speak></p>',
        'Hello <speak>world</speak>',
    ];
    for (const [index, ssml] of inputs.entries()) {
        test(`case ${index + 1}: ${ssml}`, () => {
            assert.throws(() => parseSSML(ssml), { message: 'Tags could not be parsed' }, `Should throw for ${ssml}`);
        });
    }
});
test.describe('should throw on multiple top-level tags or text', () => {
    const inputs = [
        '<speak>Hello world</speak><foo></foo>',
        '<speak>Hello world</speak>foo',
        '<foo></foo><speak>Hello world</speak>',
        'foo<speak>Hello world</speak>',
    ];
    for (const [index, ssml] of inputs.entries()) {
        test(`case ${index + 1}: ${ssml}`, () => {
            assert.throws(() => parseSSML(ssml), { message: 'Tags could not be parsed' }, `Should throw for ${ssml}`);
        });
    }
});
test.describe('should throw on missing or invalid SSML opening and closing tags', () => {
    const inputs = [
        '<speak>Hello world',
        'Hello world</speak>',
        '<speak><p>Hello world</speak>',
        '<speak>Hello world</p></speak>',
        '<speak><p>Hello <s>world</s></speak>',
        '<speak><p>Hello <s>world</p></speak>',
        '<speak><p>Hello <s>world</p></p></speak>',
        '<speak><p>Hello world</s></speak>',
        '<speak><p>Hello world</p></p></speak>',
        '<speak>Hello < world</speak>',
    ];
    for (const [index, ssml] of inputs.entries()) {
        test(`case ${index + 1}: ${ssml}`, () => {
            assert.throws(() => parseSSML(ssml), { message: 'Tags could not be parsed' }, `Should throw for ${ssml}`);
        });
    }
});
test('should parse tag attributes', () => {
    let tree = parseSSML('<speak foo=""></speak>');
    assert.strictEqual(tree.attributes.get('foo'), '', 'Should parse empty attribute');
    tree = parseSSML('<speak foo="bar"></speak>');
    assert.strictEqual(tree.attributes.get('foo'), 'bar', 'Should parse attribute with value');
    tree = parseSSML('<speak baz:foo="bar"></speak>');
    assert.strictEqual(tree.attributes.get('baz:foo'), 'bar', 'Should parse namespaced attribute');
    tree = parseSSML('<speak foo = "bar"></speak>');
    assert.strictEqual(tree.attributes.get('foo'), 'bar', 'Should parse attribute with spaces');
    tree = parseSSML('<speak foo="bar" hello="world"></speak>');
    assert.strictEqual(tree.attributes.get('foo'), 'bar', 'Should parse multiple attributes');
    assert.strictEqual(tree.attributes.get('hello'), 'world', 'Should parse multiple attributes');
    tree = parseSSML('<speak><p foo="bar">Hello</p></speak>');
    assert.strictEqual(tree.children[0].attributes.get('foo'), 'bar', 'Should parse child tag attribute');
    assert.strictEqual(tree.children[0].children[0].text, 'Hello', 'Should parse child text');
});
test.describe('should throw on invalid tag attributes', () => {
    const inputs = [
        '<speak foo></speak>',
        '<speak foo="bar></speak>',
        '<speak foo=bar></speak>',
        '<speak foo=bar"></speak>',
        '<speak ="bar"></speak>',
    ];
    for (const [index, ssml] of inputs.entries()) {
        test(`case ${index + 1}: ${ssml}`, () => {
            assert.throws(() => parseSSML(ssml), { message: 'Attributes could not be parsed' }, `Should throw for ${ssml}`);
        });
    }
});
test('should parse text', () => {
    let tree = parseSSML('<speak>Hello world</speak>');
    assert.strictEqual(tree.children[0].text, 'Hello world', 'Should parse text node');
    tree = parseSSML('<speak>Hello<p> world</p> foo</speak>');
    assert.strictEqual(tree.children[0].text, 'Hello', 'Should parse text before tag');
    assert.strictEqual(tree.children[1].children[0].text, ' world', 'Should parse text in nested tag');
    assert.strictEqual(tree.children[2].text, ' foo', 'Should parse text after tag');
});
test('should unescape XML characters in text', () => {
    let tree = parseSSML('<speak>TS &lt; JS</speak>');
    assert.strictEqual(tree.children[0].text, 'TS < JS', 'Should unescape <');
    tree = parseSSML('<speak>TS &amp;&lt; JS</speak>');
    assert.strictEqual(tree.children[0].text, 'TS &< JS', 'Should unescape & and <');
    tree = parseSSML('<speak><p>TS&lt;</p> JS</speak>');
    assert.strictEqual(tree.children[0].children[0].text, 'TS<', 'Should unescape in nested tag');
    assert.strictEqual(tree.children[1].text, ' JS', 'Should parse text after tag');
});
test('should convert SSML nodes to text', () => {
    let tree = parseSSML('<speak><baz></baz></speak>');
    assert.strictEqual(ssmlNodeToText(tree), '', 'Empty tag should return empty text');
    tree = parseSSML('<speak><baz foo="bar"></baz></speak>');
    assert.strictEqual(ssmlNodeToText(tree), '', 'Tag with attribute should return empty text');
    tree = parseSSML('<speak><baz>Hello world</baz></speak>');
    assert.strictEqual(ssmlNodeToText(tree), 'Hello world', 'Tag with text should return text');
    tree = parseSSML('<speak><baz foo="bar">Hello world</baz></speak>');
    assert.strictEqual(ssmlNodeToText(tree), 'Hello world', 'Tag with text and attribute should return text');
    tree = parseSSML('<speak><baz foo="bar">baz<p>Hello world</p>baz</baz></speak>');
    assert.strictEqual(ssmlNodeToText(tree), 'bazHello worldbaz', 'Nested tag should concatenate text');
});
