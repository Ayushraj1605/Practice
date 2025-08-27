function createSSMLNode(tag = null, text = null) {
    return {
        tag,
        text,
        attributes: new Map(),
        children: [],
    };
}
function parseSSML(ssml) {
    const stack = [];
    let root = null;
    let currentText = '';
    let i = 0;
    while (i < ssml.length) {
        if (ssml[i] === '<') {
            if (currentText.trim()) {
                stack[stack.length - 1]?.children.push(createSSMLNode(null, currentText.trim()));
                currentText = '';
            }
            i++;
            if (ssml[i] === '/') {
                i++;
                const tagEnd = ssml.indexOf('>', i);
                i = tagEnd + 1;
                if (stack.length > 1) {
                    stack.pop();
                }
            }
            else {
                const tagEnd = ssml.indexOf('>', i);
                const tagContent = ssml.slice(i, tagEnd).trim();
                const [tagName, ...attrPairs] = tagContent.split(/\s+/);
                const node = createSSMLNode(tagName);
                for (const pair of attrPairs) {
                    const [key, value] = pair.split('=');
                    if (value) {
                        node.attributes.set(key, value.replace(/['"]/g, ''));
                    }
                }
                if (!root)
                    root = node;
                if (stack.length > 0) {
                    stack[stack.length - 1].children.push(node);
                }
                if (ssml[tagEnd - 1] !== '/') {
                    stack.push(node);
                }
                i = tagEnd + 1;
            }
        }
        else {
            currentText += ssml[i];
            i++;
        }
    }
    if (currentText.trim() && stack.length > 0) {
        stack[stack.length - 1].children.push(createSSMLNode(null, currentText.trim()));
    }
    return root || createSSMLNode('speak', null);
}
function ssmlNodeToText(node) {
    if (!node)
        return '';
    if (node.text)
        return node.text;
    return node.children.map(child => ssmlNodeToText(child)).join(' ');
}
export { parseSSML, ssmlNodeToText };
