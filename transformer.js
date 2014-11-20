

var transform = function (ast, conversion) {
    function parseNode(node) {
        if (node.index) node.index = parseNode(node.index);
        if (node.name === "var") {
            return conversion.var(node.value, parseNode);
        }
        if (node.name === "const") {
            return conversion.const(node.value.names, node.value.values);
        }
        if (node.name === "procedure") {
            return conversion.procedure(node.value.name, node.value.arguments, node.value.declarations, node.value.statements, parseNode);
        }
        if (node.name === "assignment") {
            return conversion.assignment(node.value.name, parseNode(node.value.value), parseNode);
        }
        if (node.name === "if" || node.name === "while") {
            return conversion[node.name](node.value.condition, node.value.statements, parseNode);
        }
        if (node.name === "call") {
            return conversion.call(node.value.name, node.value.arguments.map(parseNode));
        }
        if (node.name === "empty") {
            return conversion.empty();
        }
        if (node.name === "statementList") {
            return conversion.statementList(node.value.map(parseNode));
        }
        if (node.name === "term") {
            return conversion.term(node.value.operation, node.value.arguments.map(parseNode));
        }
        if (node.name === "condition") {
            return conversion.condition(node.value.operation, parseNode(node.value.left), parseNode(node.value.right));
        }
        if (node.name === "identifier" || node.name === "number") {
            return conversion[node.name](node);
        }
        throw new Error("Unrecognized node.");
    }

    var output = [];
    for (var i = 0; i < ast.length; i++) {
        output.push(parseNode(ast[i]));
    }
    return conversion.joinProgram(output);
};

var PL_0 = (function () {
    function statementList(statements, parseNode) {
        return o.statementList(statements.map(parseNode));
    }

    function nameWithIndex(name) {
        if(name.index) console.log(name.index);
        return name.value + (name.index ? "{" + name.index + "}" : "");
    }

    function parseIndex(parseNode) {
        return function (name) {
            if (name.index) name.index = parseNode(name.index);
            return name;
        }
    }

    var o = {
        "var": function (names, parseNode) {
            return "var " + names.map(parseIndex(parseNode)).map(nameWithIndex).join(", ");
        },
        "const": function (names, values) {
            var bindings = [];
            for (var i = 0; i < names.length; i++) {
                bindings.push(names[i] + " = " + values[i]);
            }
            return "const " + bindings.join(", ");
        },
        procedure: function (name, arguments, declarations, statements, parseNode) {
            var decs = declarations.length ? ";\n" + declarations.map(parseNode).join(";\n") : "";
            var args = arguments.length ? "(" + arguments.join(", ") + ")" : "";
            return "procedure " + name + args + decs + ";" + statementList(statements, parseNode);
        },
        assignment: function (name, value, parseNode) {
            if (name.index) name.index = parseNode(name.index);
            return nameWithIndex(name) + " := " + value;
        },
        "if": function (condition, statements, parseNode) {
            return "if " + parseNode(condition) + " then " + statementList(statements, parseNode);
        },
        "while": function (condition, statements, parseNode) {
            return "while " + parseNode(condition) + " do " + statementList(statements, parseNode);
        },
        call: function (name, arguments) {
            return "call " + name + (arguments.length ? "(" + arguments.join(", ") + ")" : "");
        },
        empty: function () { return ""; },
        statementList: function (statements) {
            if (statements.length === 1) return "\n"  + statements[0];
            return "\nbegin\n" + statements.join(";\n") + "\nend";
        },
        term: function (operation, args) {
            var operations = {
                "+": function (args) {
                    if (args.length === 0) return "0";
                    return "(" + args.join(" + ") + ")";
                },
                "-": function (args) {
                    if (args.length === 0) throw new Error("At least one operand expected for - operator.");
                    if (args.length === 1) return "(-" + args[0] + ")";
                    return "(" + args.join(" - ") + ")";
                },
                "*": function (args) {
                    if (args.length === 0) return "1";
                    return "(" + args.join(" * ") + ")";
                },
                "/": function (args) {
                    if (args.length === 0) throw new Error("At least one operand expected for / operator.");
                    if (args.length === 1) return "(1 / " + args[0] + ")";
                    return "(" + args.join(" / ") + ")";
                }
            };
            return operations[operation](args);
        },
        condition: function (operation, left, right) {
            var operators = {
                "!=": "#",
                "<=": "[",
                ">=": "]"
            };
            if (operators[operation]) operation = operators[operation];
            return left + " " + operation + " " + right;
        },
        identifier: function (name) {
            return nameWithIndex(name);
        },
        number: function (node) {
            return (node.value | 0) + "";
        },
        joinProgram: function (parts) {
            return parts.join(";\n") + "."
        }
    };
    return o;
})();