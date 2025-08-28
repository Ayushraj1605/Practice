import { test } from 'node:test';
import assert from 'node:assert';
import { parseSSML } from '../main/com/speechify/Ssml/Ssml.js';
test('should parse tag names', (t) => {
    const tree = parseSSML('');
    assert.strictEqual(tree.tag, 'speak');
    assert.strictEqual(tree.children.length, 0);
    const tree2 = parseSSML('<speak><p></p></speak>');
    assert.strictEqual(tree2.tag, 'speak');
    assert.strictEqual(tree2.children[0].tag, 'p');
    assert.strictEqual(tree2.children[0].children.length, 0);
});
test('should throw on missing speak tag', (t) => {
    assert.throws(() => parseSSML('<p>Hello world</p>'), { message: 'Tags could not be parsed' });
    assert.throws(() => parseSSML('Hello world'), { message: 'Tags could not be parsed' });
});
test('should throw on multiple top level tags or text', (t) => {
    assert.throws(() => parseSSML('<speak><p></p> Hello world'), { message: 'Tags could not be parsed' });
    assert.throws(() => parseSSML('<speak><p></p><p></p></speak>'), { message: 'Tags could not be parsed' });
});
test('should throw on missing or invalid SSML opening and closing tags', (t) => {
    assert.throws(() => parseSSML('<speak> Hello world'), { message: 'Tags could not be parsed' });
    assert.throws(() => parseSSML('Hello world</speak>'), { message: 'Tags could not be parsed' });
    assert.throws(() => parseSSML('<speak Hello world>'), { message: 'Tags could not be parsed' });
    assert.throws(() => parseSSML('<speak> Hello world '), { message: 'Tags could not be parsed' });
});
test('should parse tag attributes', (t) => {
    let tree = parseSSML('<speak foo=""></speak>');
    assert.strictEqual(tree.attributes.get('foo'), '');
    tree = parseSSML('<speak foo="bar"></speak>');
    assert.strictEqual(tree.attributes.get('foo'), 'bar');
    tree = parseSSML('<speak baz:foo="bar"></speak>');
    assert.strictEqual(tree.attributes.get('baz:foo'), 'bar');
    tree = parseSSML('<speak foo = "bar"></speak>');
    assert.strictEqual(tree.attributes.get('foo'), 'bar');
    tree = parseSSML('<speak foo="bar" hello="world"></speak>');
    assert.strictEqual(tree.attributes.get('foo'), 'bar');
    assert.strictEqual(tree.attributes.get('hello'), 'world');
    tree = parseSSML('<speak><p foo="bar">Hello</p></speak>');
    assert.strictEqual(tree.children[0].attributes.get('foo'), 'bar');
    assert.strictEqual(tree.children[0].children[0].text, 'Hello');
});
test('should throw on invalid tag attributes', (t) => {
    assert.throws(() => parseSSML('<speak foo></speak>'), { message: 'Attributes could not be parsed' });
    assert.throws(() => parseSSML('<speak foo=></speak>'), { message: 'Attributes could not be parsed' });
    assert.throws(() => parseSSML('<speak foo="></speak>'), { message: 'Attributes could not be parsed' });
    assert.throws(() => parseSSML('<speak foo=bar></speak>'), { message: 'Attributes could not be parsed' });
    assert.throws(() => parseSSML('<speak =bar></speak>'), { message: 'Attributes could not be parsed' });
});
test('should parse text', (t) => {
    let tree = parseSSML('<speak>Hello world</speak>');
    assert.strictEqual(tree.children[0].text, 'Hello world');
    tree = parseSSML('<speak>Hello<p> world</p> foo</speak>');
    assert.strictEqual(tree.children[0].text, 'Hello');
    assert.strictEqual(tree.children[1].children[0].text, ' world');
    assert.strictEqual(tree.children[2].text, ' foo');
});
test('should unescape XML characters in text', (t) => {
    let tree = parseSSML('<speak>&amp;&lt;&gt;&quot;&apos;</speak>');
    assert.strictEqual(tree.children[0].text, '&<>"\'');
    tree = parseSSML('<speak> &amp; &lt; &gt; &quot; &apos; </speak>');
    assert.strictEqual(tree.children[0].text, '& < > " \' ');
});
