const countCharacter = (string, character) => {
	let count = 0;
	let slicedString = string;
	while (slicedString.indexOf(character) !== -1) {
		slicedString = slicedString.slice(slicedString.indexOf(character) + 1);
		count++;
	}
	return count;
};

const collectSpansWithText = text => {
	const classNames = ['cm-def', 'cm-variable', 'cm-property'];
	const spans = [];
	for (const className of classNames) {
		spans.push(
			...Array.from(document.getElementsByClassName(className))
				.filter(span => span.textContent === text)
		);
	}
	return spans;
};

const getNextNode = (node, continueToNextLine) => {
	if (node.textContent.includes(';')) {
		return null;
	}

	let nextNode = node.nextSibling;
	if (nextNode && nextNode.textContent.trim().length === 0) { // nextNode is whitespace
		nextNode = nextNode.nextSibling;
	}
	let firstNodeInNextLine = null;
	if (!nextNode) {
		const nextLine = node.parentNode.parentNode.nextSibling; // Not the span but the div outside
		if (nextLine && nextLine.children.length > 0 && nextLine.firstChild.childNodes.length > 0) { // Next line and its children exist
			firstNodeInNextLine = nextLine.firstChild.firstChild;
			if (firstNodeInNextLine && firstNodeInNextLine.textContent.trim().length === 0) { // firstNodeInNextLine is whitespace
				firstNodeInNextLine = firstNodeInNextLine.nextSibling;
			}
		}
	}

	if (nextNode) {
		if (nextNode.textContent.trim().startsWith(';')) {
			return null;
		}
	} else { // nextNode doesn't exist
		if (node.textContent.trim().endsWith("\\") || continueToNextLine) {
			return firstNodeInNextLine;
		}
	}
	return nextNode;
};

// Assumes that equal signs appear only in a sequence
const hasAssignmentEqualSign = span => {
	if (span.textContent.includes('=')) {
		if (span.textContent.includes('==')) {
			return false;
		}
		if (span.textContent.startsWith('=')
			&& span.previousSibling && span.previousSibling.classList
			&& span.previousSibling.classList.contains('cm-operator')) { // >=, <=, !=
			return false;
		}
		return true; // '+=', '-=' etc. are all assignment equal signs
	} else {
		return false;
	}
};

const findAncestorWithClassName = (element, className) => {
  while ((element = element.parentElement) && !element.classList.contains(className)) {}
  return element;
};

const createCells = spans => {
	const spanObjects = spans.map(span => {
		return {
			span: span,
		};
	});
	const cells = [];
	for (spanObject of spanObjects) {
		const parentCell = findAncestorWithClassName(spanObject.span, 'CodeMirror-code');
		if (cells.length > 0 && cells[cells.length - 1].cell === parentCell) {
			cells[cells.length - 1].spans.push(spanObject);
		} else {
			cells.push({
				cell: parentCell,
				spans: [spanObject]
			});
		}
	}
	return cells;
};

// Definition or reassignment => true, else => false
const checkIfDefinition = (cells, isVariable) => {
	if (isVariable) {
		for (const cellObject of cells) {
			// Assign line property (an array of nodes) for each span
			let previousNode = null; // For reassignment of currentNode
			let currentNode = cellObject.cell.children[0].children[0].childNodes[0];
			let spanInCellIndex = 0;
			while (spanInCellIndex < cellObject.spans.length) { // Loop through lines as long as there are more spans left
				const nodesInLine = [];
				let openParenthesisCount = 0;
				let openBracketCount = 0;
				let openBraceCount = 0;
				while (currentNode) { // Loop through the nodes in the line
					nodesInLine.push(currentNode);
					if (spanInCellIndex < cellObject.spans.length && currentNode === cellObject.spans[spanInCellIndex].span) {
						cellObject.spans[spanInCellIndex].line = nodesInLine;
						spanInCellIndex++;
					}
					// Count the number of parentheses to decide whether to go to the next line
					if (!currentNode.classList || !currentNode.classList.contains('cm-string')) { // currentNode is plain text or span other than cm-string
						openParenthesisCount = openParenthesisCount
							+ countCharacter(currentNode.textContent, '(') - countCharacter(currentNode.textContent, ')');
						openBracketCount = openBracketCount
							+ countCharacter(currentNode.textContent, '[') - countCharacter(currentNode.textContent, ']');
						openBraceCount = openBraceCount
							+ countCharacter(currentNode.textContent, '{') - countCharacter(currentNode.textContent, '}');
					}
					// Reassign previousNode and currentNode
					previousNode = currentNode;
					currentNode = getNextNode(
						currentNode,
						openParenthesisCount > 0 ||openBracketCount > 0 || openBraceCount > 0
					);
				}
				currentNode = getNextNode(previousNode, true); // Go to the next line in the next loop
			}
			
			// Assign ifDefinition property for each span based on the line
			for (const spanObject of cellObject.spans) {
				// Get the index of the span and the equal sign in the line
				const spanIndex = spanObject.line.reduce((accumulator, currentNode) => {
					return currentNode === spanObject.span ? currentNode : accumulator;
				});
				const equalSignSpanIndex = spanObject.line.reduce((accumulator, currentNode) => {
					return hasAssignmentEqualSign(currentNode) ? currentNode : accumulator;
				}, null);

				// If there is no equal sign or an equal sign appears before the span
				if (!Boolean(equalSignSpanIndex) || equalSignSpanIndex < spanIndex) {
					spanObject.isDefinition = false;
					continue;
				}

				// If there is an equal sign after the span
				let openBracketCount = 0;
				let openBraceCount = 0;
				for (const nodeInLine of spanObject.line) {
					if (nodeInLine === spanObject) {
						break;
					}
					if (!nodeInLine.classList || !nodeInLine.classList.contains('cm-string')) { // nodeInLine is plain text or span other than cm-string
						openBracketCount = openBracketCount
							+ countCharacter(nodeInLine.textContent, '[') - countCharacter(nodeInLine.textContent, ']');
						openBraceCount = openBraceCount
							+ countCharacter(nodeInLine.textContent, '{') - countCharacter(nodeInLine.textContent, '}');
					}
				}
				spanObject.isDefinition = openBracketCount === 0 && openBraceCount === 0;
			}
		}
	} else {
		for (const cellObject of cells) {
			for (const spanObject of cellObject.spans) {
				spanObject.isDefinition = spanObject.span.classList.contains('cm-def');
			}
		}
	}
	return cells;
};

let previousSelectedText;

// TODO: Why does this have to be an ordinary function instead of a fat arrow function?
document.addEventListener('selectionchange', function () {
	const selectedText = window.getSelection().toString();
	if (selectedText != previousSelectedText) {
		previousSelectedtext = selectedText;
		const spans = collectSpansWithText(selectedText);
		if (spans.length > 0) {
			const isVariable = spans.every(span => !span.classList.contains('cm-def'));
			const cells = checkIfDefinition(createCells(spans), isVariable);
			console.log('cells', cells);
			showButtons(cells);
		} else {
			hide();
		}
	}
});

/*
cells = [
	{
		cell: DOM Element with class 'CodeMirror-code',
		spans: [
			{
				span: DOM Element,
				(line: Array of nodes,) only when isVariable is true
				isDefinition: Boolean
			},
			...
		]
	},
	...
]
*/