var tokenize = function (text) {
    function create(name, value, start, length) {
        var token = {
            name: name,
            value: value || name,
            start: start,
            length: length
        };
        if (name === "identifier" && typeof token.value === "string") token.value = token.value.toLowerCase();
        return token;
    }

    function isWhitespace(ch) {
        return ch.charCodeAt(0) <= 32;
    }

    function matchToken(text, start) {
        var tokens = [
            create("("),
            create(")"),
            create("{"),
            create("}"),
            create("op", "const"),
            create("op", "var"),
            create("op", "procedure"),
            create("op", "if"),
            create("op", "while"),
            create("op", "call"),
            create("identifier", /[A-Za-z]+/),
            create("number", /-?[0-9]+/),
            create("op", ":="),
            create("op", "<="),
            create("op", ">="),
            create("op", "+"),
            create("op", "-"),
            create("op", "*"),
            create("op", "/"),
            create("op", "="),
            create("op", "!="),
            create("op", "<"),
            create("op", ">")
        ];
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            var value = typeof token.value === "string" ?
                token.value :
                (text.slice(start).match(token.value) || [])[0];
            if (value && text.substr(start, value.length) === value)
                return create(token.name, value, start, value.length);
        }
        for (var end = start + 1; end < text.length; end++) {
            if (isWhitespace(text[end])) break;
        }
        return create("error", text.slice(start, end), start, end - start);
    }

    var tokens = [];
    for (var i = 0; i < text.length; i++) {
        if (isWhitespace(text[i])) continue;
        var token = matchToken(text, i);
        tokens.push(token);
        i += token.length - 1;
    }
    var balance = 0;
    for (var i = 0; i < tokens.length; i++) {
        if (tokens[i].name === "(") balance++;
        if (tokens[i].name === ")") balance--;
    }
    if (balance > 0) throw new Error("Not enough closing parentheses.");
    if (balance < 0) throw new Error("Too many closing parentheses.");
    return tokens;
}