// Icons
const JUMP_TO_CELL_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>';
const CLOSE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/><path d="M0 0h24v24H0z" fill="none"/></svg>';

// Create and add DOM elements

const definitionButton = document.createElement('div');
definitionButton.classList.add('jupyter-peek-definition-button', 'jupyter-peek-definition-definition-button');
definitionButton.textContent = 'Def';
document.body.appendChild(definitionButton);

const referenceButton = document.createElement('div');
referenceButton.classList.add('jupyter-peek-definition-button', 'jupyter-peek-definition-reference-button');
referenceButton.textContent = 'Ref';
document.body.appendChild(referenceButton);

const mainWindow = document.createElement('div');
mainWindow.classList.add('jupyter-peek-definition-main-window');
document.body.appendChild(mainWindow);

const menuBar = document.createElement('div');
menuBar.classList.add('jupyter-peek-definition-menu-bar');
mainWindow.appendChild(menuBar);

const jumpToCellButton = document.createElement('svg');
jumpToCellButton.classList.add('jupyter-peek-definition-jump-to-cell-button');
//jumpToCellButton.textContent = 'Jump';
menuBar.appendChild(jumpToCellButton);
jumpToCellButton.outerHTML = JUMP_TO_CELL_ICON;

const closeButton = document.createElement('svg');
closeButton.classList.add('jupyter-peek-definition-close-button');
//closeButton.textContent = 'x';
menuBar.appendChild(closeButton);
closeButton.outerHTML = CLOSE_ICON;

const cellContainer = document.createElement('div');
cellContainer.classList.add('jupyter-peek-definition-cell-container');
mainWindow.appendChild(cellContainer);

const pageButtonContainer = document.createElement('div');
pageButtonContainer.classList.add('jupyter-peek-definition-page-button-container');
mainWindow.appendChild(pageButtonContainer);

// Main

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

const createPageButtons = cells => {
	// Empty pageButtonContainer
	while (pageButtonContainer.firstChild) {
		pageButtonContainer.removeChild(pageButtonContainer.firstChild);
	}

	// Create pageButtons
	for (const cell of cells) {
		const pageButton = document.createElement('div');
		pageButton.classList.add('jupyter-peek-definition-page-button');
		pageButtonContainer.appendChild(pageButton);
		pageButton.addEventListener('mousedown', () => {
			console.log('page button clicked');
		});
	}
};

definitionButton.addEventListener('mousedown', () => {
	const definitionCells = currentCells.filter(cell => cell.spans.some(span => span.isDefinition));
	mainWindow.style.display = 'grid';

	// jumpToCellButton

	// cellContainer
	if (definitionCells.length > 0) {
		//cellWindow.innerHTML = definitionCells[0].cell.innerHTML;
		const cellToDisplay = definitionCells[0].cell.cloneNode(true);
		cellToDisplay.classList.add('input_area', 'CodeMirror', 'cm-s-ipython', 'CodeMirror-lines');
		cellToDisplay.style.width = '100%';
		cellToDisplay.style.maxHeight = '40vh';
		cellToDisplay.style.overflow = 'scroll';
		cellContainer.innerHTML = cellToDisplay.outerHTML;
	} else {
		cellContainer.innerHTML = '<p>No Definitions</p>';
	}

	// pageButtonContainer
	createPageButtons(definitionCells);
});

referenceButton.addEventListener('mousedown', () => {
	const referenceCells = currentCells.filter(cell => cell.spans.some(span => !span.isDefinition));
	cellWindow.style.display = 'grid';
	if (referenceCells.length > 0) {
		//cellWindow.innerHTML = referenceCells[0].cell.innerHTML;
		cellWindow.innerHTML = findAncestorWithClassName(referenceCells[0].cell, 'code_cell').innerHTML;
	} else {
		cellWindow.innerHTML = '<p>No References</p>';
	}
});