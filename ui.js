const definitionButton = document.createElement('div');
definitionButton.textContent = 'Def';
definitionButton.style.display = 'none';
definitionButton.style.position = 'fixed';
definitionButton.style.right = '0';
definitionButton.style.bottom = '0';
definitionButton.style.padding = '0.5rem';
definitionButton.style.backgroundColor = 'orange';
definitionButton.style.borderRadius = '0.2rem';

const referenceButton = document.createElement('div');
referenceButton.textContent = 'Ref';
referenceButton.style.display = 'none';
referenceButton.style.position = 'fixed';
referenceButton.style.right = '30px';
referenceButton.style.bottom = '0';
referenceButton.style.padding = '0.5rem';
referenceButton.style.backgroundColor = 'teal';
referenceButton.style.borderRadius = '0.2rem';

const cellWindow = document.createElement('div');
cellWindow.style.display = 'none';
cellWindow.style.position = 'fixed';
cellWindow.style.right = '0';
cellWindow.style.bottom = '50px';
cellWindow.style.width = '20vw';
cellWindow.style.height = '40vh';
cellWindow.style.padding = '1rem';

document.body.appendChild(definitionButton);
document.body.appendChild(referenceButton);
document.body.appendChild(cellWindow);

let currentCells;

const showButtons = cells => {
	definitionButton.style.display = 'block';
	referenceButton.style.display = 'block';
	currentCells = cells;
};

const hide = () => {
	definitionButton.style.display = 'none';
	referenceButton.style.display = 'none';
};

definitionButton.addEventListener('mousedown', () => {
	const definitionCells = currentCells.filter(cell => cell.spans.some(span => span.isDefinition));
	cellWindow.style.display = 'block';
	if (definitionCells.length > 0) {
		cellWindow.innerHTML = definitionCells[0].cell.innerHTML
	} else {
		cellWindow.innerHTML = '<p>No Definitions</p>';
	}
});

referenceButton.addEventListener('mousedown', () => {
	const referenceCells = currentCells.filter(cell => cell.spans.some(span => !span.isDefinition));
	cellWindow.style.display = 'block';
	if (referenceCells.length > 0) {
		cellWindow.innerHTML = referenceCells[0].cell.innerHTML
	} else {
		cellWindow.innerHTML = '<p>No References</p>';
	}
});