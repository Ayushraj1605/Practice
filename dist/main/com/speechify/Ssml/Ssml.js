function createSSMLNode(tag = null, text = null) {
    return {
        tag,
        text,
        attributes: new Map(),
        children: [],
    };
}
function unescapeXML(text) {
    return text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, '\'');
}
function parseSSML(ssml) {
    const stack = [];
    let root = null;
    let currentText = '';
    let i = 0;
    while (i < ssml.length) {
        if (ssml[i] === '<') {
            if (currentText.trim()) {
                stack[stack.length - 1]?.children.push(createSSMLNode(null, unescapeXML(currentText.trim())));
                currentText = '';
            }
            i++;
            if (ssml[i] === '/') {
                i++;
                const tagEnd = ssml.indexOf('>', i);
                if (tagEnd === -1)
                    throw new Error('Tags could not be parsed');
                i = tagEnd + 1;
                if (stack.length > 1)
                    stack.pop();
            }
            else {
                const tagEnd = ssml.indexOf('>', i);
                if (tagEnd === -1)
                    throw new Error('Tags could not be parsed');
                const tagContent = ssml.slice(i, tagEnd).trim();
                const [tagName, ...attrPairs] = tagContent.split(/\s+/);
                if (!tagName)
                    throw new Error('Tags could not be parsed');
                const node = createSSMLNode(tagName);
                for (const pair of attrPairs) {
                    const [key, value] = pair.split('=');
                    if (!key || !value)
                        throw new Error('Attributes could not be parsed');
                    node.attributes.set(key, value.replace(/['"]/g, ''));
                }
                if (!root)
                    root = node;
                if (stack.length > 0)
                    stack[stack.length - 1].children.push(node);
                if (ssml[tagEnd - 1] !== '/')
                    stack.push(node);
                i = tagEnd + 1;
            }
        }
        else {
            currentText += ssml[i];
            i++;
        }
    }
    if (currentText.trim()) {
        stack[stack.length - 1]?.children.push(createSSMLNode(null, unescapeXML(currentText.trim())));
    }
    if (stack.length > 0)
        throw new Error('Tags could not be parsed'); // Ensure all tags closed
    if (!root || root.tag !== 'speak')
        throw new Error('Tags could not be parsed');
    return root;
}
function ssmlNodeToText(node) {
    if (!node)
        return '';
    if (node.text)
        return node.text;
    return node.children.map(child => ssmlNodeToText(child)).join(' ');
}
export { parseSSML, ssmlNodeToText };
