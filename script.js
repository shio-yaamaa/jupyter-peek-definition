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

// Skips whitespaces
// Returns null if the previous node ends with ';'
// Returns the second last node in the previous line if the given node is
// the first node in the line and the last node in the previous line is '\'
// If the given node is the first node in the line and
// Ignores ',', ':', '[', '(' etc.
/*const getPreviousNode = node => {
	if (node.textContent.includes(';')) {
		return null;
	}

	let previousNode = node.previousSibling;
	if (previousNode && previousNode.textContent.trim().length === 0) { // previousNode is whitespace
		previousNode = previousNode.previousSibling;
	}
	let lastNodeInPreviousLine = null;
	if (!previousNode) {
		const previousLine = node.parentNode.parentNode.previousSibling; // Not the span but the div outside
		if (previousLine && previousLine.children.length > 0 && previousLine.firstChild.children.length > 0) { // Previous line and its children exist
			lastNodeInPreviousLine = previousLine.firstChild.lastChild;
			if (lastNodeInPreviousLine && lastNodeInPreviousLine.textContent.trim().length === 0) { // lastNodeInPreviousLine is whitespace
				lastNodeInPreviousLine = lastNodeInPreviousLine.previousSibling;
			}
		}
	}

	if (previousNode) {
		if (previousNode.textContent.trim().endsWith(';')) {
			return null;
		}
	} else { // previousNode doesn't exist
		if (lastNodeInPreviousLine && lastNodeInPreviousLine.textContent === "\\") {
			return getPreviousNode(lastNodeInPreviousLine);
		}
	}
	return previousNode;
};*/

// 右のをどんどん集めるだけなので\もスキップしない
// TODO: continueToNextLine: continue no matter. When there was "[" and "{"
const getNextNode = (node, ignoreColon) => {
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
		if (nextLine && nextLine.children.length > 0 && nextLine.firstChild.children.length > 0) { // Next line and its children exist
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
		if (node.textContent.match(/[\\([{,]\s*$/)) {
			return firstNodeInNextLine;
		}
		if (!ignoreColon && node.textContent.trim().endsWith(':')) {
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

// Definition or reassignment => true, else => false
const checkIfDefinition = (span, isVariable) => {
	console.log('checkIfDefinition', span, 'isVariable=', isVariable);
	if (isVariable) {
		let encounteredAssignmentEqualSign = false;
		// Do not count parentheses
		let openBracketCount = 0;
		let openBraceCount = 0;
		let nextNode = span;
		while (nextNode = getNextNode(nextNode, openBraceCount <= 0)) {
			if (!nextNode.classList || !nextNode.classList.contains('cm-string')) { // nextNode is plain text or span other than cm-string
				const nodeContainsAssignmentEqualSign = hasAssignmentEqualSign(nextNode);
				const textBeforeAssignmentEqualSign = nodeContainsAssignmentEqualSign
					? nextNode.textContent.slice(0, nextNode.textContent.indexOf('='))
					: nextNode.textContent;
				openBracketCount = openBracketCount
					+ countCharacter(nextNode.textContent, '[') - countCharacter(nextNode.textContent, ']');
				openBraceCount = openBraceCount
					+ countCharacter(nextNode.textContent, '{') - countCharacter(nextNode.textContent, '}');
				if (nodeContainsAssignmentEqualSign) {
					encounteredAssignmentEqualSign = true;
					break;
				}
			}
		}
		return encounteredAssignmentEqualSign && openBracketCount === 0 && openBraceCount === 0;
	} else { // Class, method, or function
		return span.classList.contains('cm-def');
	}
};

const findAncestorWithClassName = (element, className) => {
  while ((element = element.parentElement) && !element.classList.contains(className)) {}
  return element;
};

/*
cells = [
	{
		cell: DOM Element with class 'CodeMirror-code',
		spans: [
			{
				span: DOM Element,
				isDefinition: Boolean
			},
			...
		]
	},
	...
]
*/
const createCells = (spans, isVariable) => {
	const spanObjects = spans.map(span => {
		return {
			span: span,
			isDefinition: checkIfDefinition(span, isVariable)
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

let previousSelectedText;

// TODO: Why does it have to be an ordinary function instead of fat arrow function?
document.addEventListener('selectionchange', function () {
	const selectedText = window.getSelection().toString();
	if (selectedText != previousSelectedText) {
		previousSelectedtext = selectedText;
		const spans = collectSpansWithText(selectedText);
		if (spans.length > 0) {
			const isVariable = spans.every(span => !span.classList.contains('cm-def'));
			const cells = createCells(spans, isVariable);
			console.log(cells);
			showButtons(cells);
		} else {
			hide();
		}
	}
});