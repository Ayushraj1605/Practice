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
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
}
function parseSSML(ssml) {
    if (ssml.trim() === '') {
        return createSSMLNode('speak');
    }
    // Basic validation - must be wrapped in speak tags
    if (!ssml.trim().startsWith('<speak') || !ssml.trim().endsWith('</speak>')) {
        throw new Error('Tags could not be parsed');
    }
    // Check for multiple top-level elements by looking for content after </speak>
    const speakCloseIndex = ssml.lastIndexOf('</speak>');
    const afterSpeak = ssml.substring(speakCloseIndex + 8).trim();
    if (afterSpeak.length > 0) {
        throw new Error('Tags could not be parsed');
    }
    return parseElement(ssml.trim());
}
function parseElement(input) {
    if (!input.startsWith('<') || !input.endsWith('>')) {
        throw new Error('Tags could not be parsed');
    }
    // Find the first closing bracket to extract the opening tag
    const firstCloseIndex = input.indexOf('>');
    if (firstCloseIndex === -1) {
        throw new Error('Tags could not be parsed');
    }
    // Extract the opening tag content
    let tagContent = input.substring(1, firstCloseIndex).trim();
    // Check if it's a self-closing tag
    const isSelfClosing = tagContent.endsWith('/');
    if (isSelfClosing) {
        tagContent = tagContent.substring(0, tagContent.length - 1).trim();
    }
    // Parse tag name and attributes
    const spaceIndex = tagContent.indexOf(' ');
    const tagName = spaceIndex === -1 ? tagContent : tagContent.substring(0, spaceIndex);
    const attributeString = spaceIndex === -1 ? '' : tagContent.substring(spaceIndex + 1).trim();
    if (!tagName) {
        throw new Error('Tags could not be parsed');
    }
    const node = createSSMLNode(tagName);
    // Parse attributes if they exist
    if (attributeString) {
        parseAttributes(attributeString, node.attributes);
    }
    // If self-closing, return the node
    if (isSelfClosing) {
        return node;
    }
    // Find the matching closing tag
    const expectedClosingTag = `</${tagName}>`;
    const closingTagIndex = input.lastIndexOf(expectedClosingTag);
    if (closingTagIndex === -1) {
        throw new Error('Tags could not be parsed');
    }
    // Extract the content between opening and closing tags
    const content = input.substring(firstCloseIndex + 1, closingTagIndex);
    if (content.length === 0) {
        return node;
    }
    // Parse the content
    parseContent(content, node);
    return node;
}
function parseContent(content, parentNode) {
    let i = 0;
    let currentText = '';
    while (i < content.length) {
        if (content[i] === '<') {
            // Handle accumulated text
            if (currentText.length > 0) {
                const textNode = createSSMLNode(null, unescapeXML(currentText));
                parentNode.children.push(textNode);
                currentText = '';
            }
            // Find the matching closing bracket
            let depth = 1;
            let j = i + 1;
            let tagStart = i;
            while (j < content.length && depth > 0) {
                if (content[j] === '<') {
                    depth++;
                }
                else if (content[j] === '>') {
                    depth--;
                }
                j++;
            }
            if (depth !== 0) {
                throw new Error('Tags could not be parsed');
            }
            // Check if this is a self-closing tag or find its closing tag
            const tagContent = content.substring(tagStart + 1, j - 1);
            const isSelfClosing = tagContent.endsWith('/');
            if (isSelfClosing) {
                // Self-closing tag
                const elementContent = content.substring(tagStart, j);
                const childNode = parseElement(elementContent);
                parentNode.children.push(childNode);
                i = j;
            }
            else {
                // Find the matching closing tag
                const spaceIndex = tagContent.indexOf(' ');
                const tagName = spaceIndex === -1 ? tagContent : tagContent.substring(0, spaceIndex);
                const closingTag = `</${tagName}>`;
                let closingIndex = -1;
                let searchDepth = 0;
                let searchStart = j;
                while (searchStart < content.length) {
                    const nextOpen = content.indexOf(`<${tagName}`, searchStart);
                    const nextClose = content.indexOf(closingTag, searchStart);
                    if (nextClose === -1) {
                        throw new Error('Tags could not be parsed');
                    }
                    if (nextOpen !== -1 && nextOpen < nextClose) {
                        searchDepth++;
                        searchStart = nextOpen + tagName.length + 1;
                    }
                    else {
                        if (searchDepth === 0) {
                            closingIndex = nextClose;
                            break;
                        }
                        else {
                            searchDepth--;
                            searchStart = nextClose + closingTag.length;
                        }
                    }
                }
                if (closingIndex === -1) {
                    throw new Error('Tags could not be parsed');
                }
                const elementContent = content.substring(tagStart, closingIndex + closingTag.length);
                const childNode = parseElement(elementContent);
                parentNode.children.push(childNode);
                i = closingIndex + closingTag.length;
            }
        }
        else {
            currentText += content[i];
            i++;
        }
    }
    // Handle any remaining text
    if (currentText.length > 0) {
        const textNode = createSSMLNode(null, unescapeXML(currentText));
        parentNode.children.push(textNode);
    }
}
function parseAttributes(attrString, attributes) {
    let i = 0;
    while (i < attrString.length) {
        // Skip whitespace
        while (i < attrString.length && /\s/.test(attrString[i])) {
            i++;
        }
        if (i >= attrString.length)
            break;
        // Find attribute name
        const nameStart = i;
        while (i < attrString.length && /\w/.test(attrString[i])) {
            i++;
        }
        if (i === nameStart) {
            throw new Error('Attributes could not be parsed');
        }
        const name = attrString.substring(nameStart, i);
        // Skip whitespace
        while (i < attrString.length && /\s/.test(attrString[i])) {
            i++;
        }
        // Expect '='
        if (i >= attrString.length || attrString[i] !== '=') {
            throw new Error('Attributes could not be parsed');
        }
        i++; // Skip '='
        // Skip whitespace
        while (i < attrString.length && /\s/.test(attrString[i])) {
            i++;
        }
        // Expect quote
        if (i >= attrString.length || (attrString[i] !== '"' && attrString[i] !== "'")) {
            throw new Error('Attributes could not be parsed');
        }
        const quote = attrString[i];
        i++; // Skip opening quote
        // Find closing quote
        const valueStart = i;
        while (i < attrString.length && attrString[i] !== quote) {
            i++;
        }
        if (i >= attrString.length) {
            throw new Error('Attributes could not be parsed');
        }
        const value = attrString.substring(valueStart, i);
        i++; // Skip closing quote
        attributes.set(name, value);
    }
}
function ssmlNodeToText(node) {
    if (!node)
        return '';
    if (node.text !== null) {
        return node.text;
    }
    return node.children.map(child => ssmlNodeToText(child)).join('');
}
export { parseSSML, ssmlNodeToText };
