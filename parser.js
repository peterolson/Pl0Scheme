var parse = function (tokens) {
    var ast = [];
    var index = 0;

    function error(content, message) {
        throw { content: content, message: message };
    }

    function hasNext() {
        return index < tokens.length;
    }

    function next(value) {
        if (index >= tokens.length) error({}, "Expression did not end at end of the input.");
        if (!value) return index++;
        if (tokens[index].value === value) {
            index++;
        } else error(tokens[index], "Expected " + value);
    }

    function current() {
        if (index >= tokens.length) error({}, "Unexpected end of input");
        return tokens[index];
    }

    function matchesType(types) {
        return ~types.indexOf(current().name);
    }

    function assertType(types) {
        if (!matchesType(types)) error(tokens[index], "Expected " + types.join(" or "));
    }

    function create(name, value, expr) {
        return { name: name, value: value, start: expr.start, length: expr.length };
    }

    function isOp(token, val) {
        if (!token) return false;
        return token.name === "op" && token.value === val;
    }

    function isIdentifier(token) {
        return token.name === "identifier";
    }

    function isNumber(token) {
        return token.name === "number";
    }

    function isExpression(token) {
        return token.name === "expression";
    }

    var termOperators = ["+", "-", "*", "/"];

    function isTermOperator(token) {
        return token.name === "op" && ~termOperators.indexOf(token.value);
    }

    var conditionalOperators = ["=", ">=", "<=", "!=", "<", ">"];

    function isConditionalOperator(token) {
        return token.name === "op" && ~conditionalOperators.indexOf(token.value);
    }

    function expression() {
        var arguments = [];
        var start = current().start;
        next("(");
        while (current().name !== ")") {
            if (matchesType(["op", "identifier", "number"])) {
                arguments.push(current());
                next();
            }
            else if (matchesType(["("])) arguments.push(expression());
            else if (matchesType(["{"])) {
                if (arguments[arguments.length - 1].name !== "identifier") {
                    error("Indexes can only appear directly after identifiers.");
                }
                current().name = current().value = "(";
                var i;
                for (i = index; i < tokens.length; i++) {
                    if (tokens[i].name === "}") break;
                }
                if (tokens[i].name !== "}") error("Could not find matching '}'.");
                tokens[i].name = tokens[i].value = ")";
                tokens[index - 1].index = expression();
            }
            else error(current(), "Not a valid expression part.");
        }
        var end = current().start + 1;
        next(")");
        return {
            name: "expression",
            arguments: arguments,
            start: start,
            length: end - start
        };
    }

    function program() {
        var ast = [];
        while (hasNext()) ast.push(block(expression()));
        return ast;
    }

    function block(expr) {
        var args = expr.arguments;
        if (isOp(args[0], "const")) {
            var names = [], values = [];
            for (var i = 1; i < args.length; i += 2) {
                var name = args[i], value = args[i + 1];
                if (!isIdentifier(name)) error(name, "Constant name must be an identifier.");
                if (!isNumber(value)) error(value, "Constant value must be a number.");
                names.push(name.value);
                values.push(value.value);
            }
            return create("const", { names: names, values: values }, expr);
        }
        if (isOp(args[0], "var")) {
            var names = [];
            for (var i = 1; i < args.length; i++) {
                if (!isIdentifier(args[i])) error(args[i], "Variable name must be an identifier.");
                if (args[i].index) args[i].index = term(args[i].index);
                names.push(args[i]);
            }
            return create("var", names, expr);
        }
        if (isOp(args[0], "procedure")) {
            var name = args[1], arguments = [];
            if (isExpression(name)) {
                var names = name.arguments;
                name = names[0];
                arguments = names.slice(1).map(function (name) {
                    if (!isIdentifier(name)) error(name, "Procedure parameter must be an identifier.");
                    return name.value;
                });
            }
            if(!isIdentifier(name)) error(name, "Procedure name must be an identifier.");
            var declarations = [], statements = [];
            for (var i = 2; i < args.length; i++) {
                var arg = args[i];
                if (!isExpression(arg)) error(arg, "Procedure declarations and statements must be in parentheses.");
                var argCar = arg.arguments[0];
                if (isOp(argCar, "const") || isOp(argCar, "var") || isOp(argCar, "procedure"))
                    declarations.push(block(arg));
                else
                    statements.push(statement(arg));
            }
            return create("procedure", { name: name.value, arguments: arguments, declarations: declarations, statements: statements }, expr);
        }
        return statement(expr);
    }

    function statement(expr) {
        if (expr.name !== "expression") error(expr, "Statements must be surrounded by parentheses.");
        var args = expr.arguments;
        if (isOp(args[0], ":=")) {
            if (args.length !== 3) error(expr, "Variables must be assigned to exactly one value.");
            if (!isIdentifier(args[1])) error(args[1], "Variable name must be an identifier.");
            if (args[1].index) args[1].index = term(args[1].index);
            return create("assignment", { name: args[1], value: term(args[2]) }, expr);
        }
        if (isOp(args[0], "if")) {
            if (args.length < 3) error(expr, "If statements must have one condition and one set of statements.");
            return create("if", { condition: condition(args[1]), statements: args.slice(2).map(statement) }, expr);
        }
        if (isOp(args[0], "while")) {
            if (args.length < 3) error(expr, "While statements must have one condition and one set of statements.");
            return create("while", { condition: condition(args[1]), statements: args.slice(2).map(statement) }, expr);
        }
        if (args.length === 0) {
            return create("empty", undefined, expr);
        }
        if (isIdentifier(args[0])) {
            return create("call", { name: args[0].value, arguments: args.slice(1).map(term) }, expr);
        }
        var statements = [];
        for (var i = 0; i < args.length; i++) {
            statements.push(statement(args[i]));
        }
        return create("statementList", statements, expr);
    }

    function term(expr) {
        if (expr.index) expr.index = term(expr.index);
        if (expr.name === "identifier" || expr.name === "number") return expr;
        if (expr.name !== "expression") error(expr, "Terms must be an operator followed by two operands.");
        var args = expr.arguments;
        if (args.length === 0) error(expr, "Terms must be an operator followed by two operands.");
        if (args.length === 1) return term(args[0]);
        if(!isTermOperator(args[0])) error(args[0], "A term operator must be one of " + termOperators.join(", ") + ".");
        var arguments = args.slice(1).map(term);
        return create("term", { operation: args[0].value, arguments: arguments }, expr);
    }

    function condition(expr) {
        if (expr.name !== "expression") error(expr, "Conditions must be in parentheses.");
        var args = expr.arguments;
        if (args.length !== 3) error(expr, "Conditions must be a comparison operator followed by two operands.");
        if (!isConditionalOperator(args[0])) error(args[0], "A conditional operator must be one of " + conditionalOperators.join(", ") + ".");
        return create("condition", { operation: args[0].value, left: term(args[1]), right: term(args[2]) }, expr);
    }

    return program();
}