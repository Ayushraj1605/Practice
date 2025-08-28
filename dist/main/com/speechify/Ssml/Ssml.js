function createSSMLNode(tag = null, text = null) {
    return {
        tag,
        text,
        attributes: new Map(),
        children: [],
    };
}
function unescapeXML(text) {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
}
// SSML parser using a stack-based approach
function parseSSML(ssml) {
    const trimmed = ssml.trim();
    if (trimmed === '') {
        return createSSMLNode('speak');
    }
    if (!trimmed.startsWith('<speak') || !trimmed.endsWith('</speak>')) {
        throw new Error('Tags could not be parsed');
    }
    const speakCloseIndex = trimmed.lastIndexOf('</speak>');
    const afterSpeak = trimmed.substring(speakCloseIndex + 8).trim();
    if (afterSpeak.length > 0) {
        throw new Error('Tags could not be parsed');
    }
    // Remove outer <speak> tags for parsing children
    const speakOpenEnd = trimmed.indexOf('>');
    if (speakOpenEnd === -1)
        throw new Error('Tags could not be parsed');
    const speakAttrs = trimmed.substring(6, speakOpenEnd).trim();
    const speakNode = createSSMLNode('speak');
    if (speakAttrs)
        parseAttributes(speakAttrs, speakNode.attributes);
    const innerContent = trimmed.substring(speakOpenEnd + 1, speakCloseIndex);
    parseContentStack(innerContent, speakNode);
    return speakNode;
}
// Stack-based content parser for nested tags
function parseContentStack(content, parentNode) {
    let i = 0;
    let textBuffer = '';
    while (i < content.length) {
        if (content[i] === '<') {
            // Flush text buffer
            if (textBuffer.length > 0) {
                parentNode.children.push(createSSMLNode(null, unescapeXML(textBuffer)));
                textBuffer = '';
            }
            // Find tag name
            const tagStart = i;
            const closeBracket = content.indexOf('>', tagStart);
            if (closeBracket === -1)
                throw new Error('Tags could not be parsed');
            let tagContent = content.substring(tagStart + 1, closeBracket).trim();
            const isSelfClosing = tagContent.endsWith('/');
            if (isSelfClosing)
                tagContent = tagContent.slice(0, -1).trim();
            const spaceIdx = tagContent.indexOf(' ');
            const tagName = spaceIdx === -1 ? tagContent : tagContent.substring(0, spaceIdx);
            if (!tagName)
                throw new Error('Tags could not be parsed');
            if (isSelfClosing) {
                // Self-closing tag
                const node = createSSMLNode(tagName);
                if (spaceIdx !== -1)
                    parseAttributes(tagContent.substring(spaceIdx + 1), node.attributes);
                parentNode.children.push(node);
                i = closeBracket + 1;
                continue;
            }
            // Find matching closing tag, accounting for nesting
            const openTag = `<${tagName}`;
            const closeTag = `</${tagName}>`;
            let depth = 1;
            let searchIdx = closeBracket + 1;
            let nextOpen, nextClose;
            while (depth > 0) {
                nextOpen = content.indexOf(openTag, searchIdx);
                nextClose = content.indexOf(closeTag, searchIdx);
                if (nextClose === -1)
                    throw new Error('Tags could not be parsed');
                if (nextOpen !== -1 && nextOpen < nextClose) {
                    depth++;
                    searchIdx = nextOpen + openTag.length;
                }
                else {
                    depth--;
                    searchIdx = nextClose + closeTag.length;
                }
            }
            const elementStr = content.substring(tagStart, searchIdx);
            const node = parseElementStack(elementStr);
            parentNode.children.push(node);
            i = searchIdx;
        }
        else {
            textBuffer += content[i];
            i++;
        }
    }
    if (textBuffer.length > 0) {
        parentNode.children.push(createSSMLNode(null, unescapeXML(textBuffer)));
    }
}
// Parses a single element string (including children)
function parseElementStack(input) {
    if (!input.startsWith('<') || !input.endsWith('>'))
        throw new Error('Tags could not be parsed');
    const firstClose = input.indexOf('>');
    if (firstClose === -1)
        throw new Error('Tags could not be parsed');
    let tagContent = input.substring(1, firstClose).trim();
    const isSelfClosing = tagContent.endsWith('/');
    if (isSelfClosing)
        tagContent = tagContent.slice(0, -1).trim();
    const spaceIdx = tagContent.indexOf(' ');
    const tagName = spaceIdx === -1 ? tagContent : tagContent.substring(0, spaceIdx);
    if (!tagName)
        throw new Error('Tags could not be parsed');
    const node = createSSMLNode(tagName);
    if (spaceIdx !== -1)
        parseAttributes(tagContent.substring(spaceIdx + 1), node.attributes);
    if (isSelfClosing)
        return node;
    const closeTag = `</${tagName}>`;
    const closeIdx = input.lastIndexOf(closeTag);
    if (closeIdx === -1)
        throw new Error('Tags could not be parsed');
    const inner = input.substring(firstClose + 1, closeIdx);
    if (inner.length > 0)
        parseContentStack(inner, node);
    return node;
}
function parseAttributes(attrString, attributes) {
    let i = 0;
    while (i < attrString.length) {
        while (i < attrString.length && /\s/.test(attrString[i]))
            i++;
        if (i >= attrString.length)
            break;
        const nameStart = i;
        while (i < attrString.length && /[\w:-]/.test(attrString[i]))
            i++;
        if (i === nameStart)
            throw new Error('Attributes could not be parsed');
        const name = attrString.substring(nameStart, i);
        while (i < attrString.length && /\s/.test(attrString[i]))
            i++;
        if (i >= attrString.length || attrString[i] !== '=')
            throw new Error('Attributes could not be parsed');
        i++;
        while (i < attrString.length && /\s/.test(attrString[i]))
            i++;
        if (i >= attrString.length || (attrString[i] !== '"' && attrString[i] !== "'"))
            throw new Error('Attributes could not be parsed');
        const quote = attrString[i];
        i++;
        const valueStart = i;
        while (i < attrString.length && attrString[i] !== quote)
            i++;
        if (i >= attrString.length)
            throw new Error('Attributes could not be parsed');
        const value = attrString.substring(valueStart, i);
        i++;
        attributes.set(name, value);
    }
}
function ssmlNodeToText(node) {
    if (!node)
        return '';
    if (node.text !== null)
        return node.text;
    return node.children.map(ssmlNodeToText).join('');
}
export { parseSSML, ssmlNodeToText };
