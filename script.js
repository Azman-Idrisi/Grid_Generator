document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements
    const gridContainer = document.getElementById('grid-container');
    const gridAreasContainer = document.getElementById('grid-areas-container');
    const columnsInput = document.getElementById('columns');
    const rowsInput = document.getElementById('rows');
    const columnGapInput = document.getElementById('column-gap');
    const rowGapInput = document.getElementById('row-gap');
    const generateCodeBtn = document.getElementById('generate-code-btn');
    const resetGridBtn = document.getElementById('reset-grid-btn');
    const clearAreasBtn = document.getElementById('clear-areas-btn');
    
    // Modal elements
    const cssModal = document.getElementById('css-modal');
    const modalCssOutput = document.getElementById('modal-css-output');
    const modalCopyButton = document.getElementById('modal-copy-css');
    const modalCloseButton = document.getElementById('modal-close');
    const closeModalX = document.querySelector('.close-modal');
    const modalShowHtmlButton = document.getElementById('modal-show-html');
    
    // Track if we're showing HTML or CSS
    let showingHtml = false;
    let generatedCssCode = '';
    let generatedHtmlCode = '';
    
    // Grid state
    const gridState = {
        cols: 5,
        rows: 5,
        colValues: Array(5).fill('1fr'),
        rowValues: Array(5).fill('1fr'),
        columnGap: 0,
        rowGap: 0,
        areas: [],
        isSelecting: false,
        startCell: null,
        currentArea: null,
        areaColors: [
            '#08ffbd33', // Default color with transparency
            '#ff5f5f33', // Red with transparency
            '#ffb74d33', // Orange with transparency
            '#ffeb3b33', // Yellow with transparency
            '#4caf5033', // Green with transparency
            '#2196f333', // Blue with transparency
            '#9c27b033'  // Purple with transparency
        ],
        borderColors: [
            '#08ffbd', // Default color
            '#ff5f5f', // Red
            '#ffb74d', // Orange
            '#ffeb3b', // Yellow
            '#4caf50', // Green
            '#2196f3', // Blue
            '#9c27b0'  // Purple
            
        ]
    };

    // Generate grid cells
    function generateGridCells() {
        gridContainer.innerHTML = '';
        gridContainer.style.display = 'grid';
        gridContainer.style.gridTemplateColumns = `repeat(${gridState.cols}, 1fr)`;
        gridContainer.style.gridTemplateRows = `repeat(${gridState.rows}, 1fr)`;
        gridContainer.style.columnGap = `${gridState.columnGap}px`;
        gridContainer.style.rowGap = `${gridState.rowGap}px`;
        
        for (let row = 0; row < gridState.rows; row++) {
            for (let col = 0; col < gridState.cols; col++) {
                const cell = document.createElement('div');
                cell.dataset.row = row;
                cell.dataset.col = col;
                gridContainer.appendChild(cell);
            }
        }

        // Add event listeners for selection
        attachSelectionEvents();
    }
    
    // Attach selection event listeners
    function attachSelectionEvents() {
        // Remove any existing listeners first to prevent duplicates
        document.removeEventListener('mouseup', endSelection);
        document.removeEventListener('mousemove', handleMouseMove);
        
        // Add mousedown event to grid cells
        const cells = gridContainer.querySelectorAll('div');
        cells.forEach(cell => {
            cell.removeEventListener('mousedown', startSelection);
            cell.removeEventListener('mouseover', updateSelection);
            
            cell.addEventListener('mousedown', startSelection);
            cell.addEventListener('mouseover', updateSelection);
        });
        
        // Add document-level event listeners
        document.addEventListener('mouseup', endSelection);
        document.addEventListener('mousemove', handleMouseMove);
    }
    
    // Handle mouse move outside the grid
    function handleMouseMove(e) {
        if (!gridState.isSelecting) return;
        
        // Check if we're over a grid cell
        const target = document.elementFromPoint(e.clientX, e.clientY);
        if (target && target.dataset && target.dataset.row !== undefined && target.dataset.col !== undefined) {
            const currentCell = {
                row: parseInt(target.dataset.row),
                col: parseInt(target.dataset.col)
            };
            updateSelectionVisual(gridState.startCell, currentCell);
        }
    }

    // Initialize grid
    function initGrid() {
        // Set CSS variables for grid dimensions
        document.documentElement.style.setProperty('--grid-columns', gridState.cols);
        document.documentElement.style.setProperty('--grid-rows', gridState.rows);
        
        // Update grid template columns and rows
        gridContainer.style.gridTemplateColumns = gridState.colValues.join(' ');
        gridContainer.style.gridTemplateRows = gridState.rowValues.join(' ');
        
        // Update grid gap
        gridContainer.style.columnGap = gridState.columnGap + 'px';
        gridContainer.style.rowGap = gridState.rowGap + 'px';
        
        generateGridCells();
        updateGridInputs();
    }

    // Selection functions
    function startSelection(e) {
        if (!gridState.isSelecting) {
            gridState.isSelecting = true;
            gridState.startCell = {
                row: parseInt(e.target.dataset.row),
                col: parseInt(e.target.dataset.col)
            };
            
            gridState.currentArea = document.createElement('div');
            
            // Select a random color for the new area
            const colorIndex = gridState.areas.length % gridState.areaColors.length;
            const bgColor = gridState.areaColors[colorIndex];
            const borderColor = gridState.borderColors[colorIndex];
            
            gridState.currentArea.style.position = 'absolute';
            gridState.currentArea.style.border = `2px solid ${borderColor}`;
            gridState.currentArea.style.backgroundColor = bgColor;
            gridState.currentArea.style.borderColor = borderColor;
            gridState.currentArea.style.zIndex = '10';
            
            gridAreasContainer.appendChild(gridState.currentArea);
            
            updateSelectionVisual(gridState.startCell, gridState.startCell);
            
            // Prevent text selection during drag
            e.preventDefault();
        }
    }

    function updateSelection(e) {
        if (gridState.isSelecting && e.target.dataset.row !== undefined && e.target.dataset.col !== undefined) {
            const currentCell = {
                row: parseInt(e.target.dataset.row),
                col: parseInt(e.target.dataset.col)
            };
            updateSelectionVisual(gridState.startCell, currentCell);
            
            // Prevent text selection during drag
            e.preventDefault();
        }
    }

    function updateSelectionVisual(startCell, endCell) {
        if (!gridState.currentArea) return;
        
        const gridRect = gridContainer.getBoundingClientRect();
        
        // Get the actual computed grid template columns and rows
        const computedStyle = window.getComputedStyle(gridContainer);
        const gridTemplateColumns = computedStyle.gridTemplateColumns;
        const gridTemplateRows = computedStyle.gridTemplateRows;
        
        // Parse the computed column and row sizes
        const colSizes = gridTemplateColumns.split(' ').map(size => parseFloat(size));
        const rowSizes = gridTemplateRows.split(' ').map(size => parseFloat(size));
        
        const startRow = Math.min(startCell.row, endCell.row);
        const endRow = Math.max(startCell.row, endCell.row);
        const startCol = Math.min(startCell.col, endCell.col);
        const endCol = Math.max(startCell.col, endCell.col);
        
        // Calculate position based on actual column/row sizes
        let leftPos = 0;
        for (let i = 0; i < startCol; i++) {
            leftPos += colSizes[i] || 0;
            if (i < startCol) leftPos += gridState.columnGap;
        }
        
        let topPos = 0;
        for (let i = 0; i < startRow; i++) {
            topPos += rowSizes[i] || 0;
            if (i < startRow) topPos += gridState.rowGap;
        }
        
        // Calculate width and height
        let width = 0;
        for (let i = startCol; i <= endCol; i++) {
            width += colSizes[i] || 0;
        }
        width += (endCol - startCol) * gridState.columnGap;
        
        let height = 0;
        for (let i = startRow; i <= endRow; i++) {
            height += rowSizes[i] || 0;
        }
        height += (endRow - startRow) * gridState.rowGap;
        
        gridState.currentArea.style.left = leftPos + 'px';
        gridState.currentArea.style.top = topPos + 'px';
        gridState.currentArea.style.width = width + 'px';
        gridState.currentArea.style.height = height + 'px';
    }

    function endSelection(e) {
        if (gridState.isSelecting) {
            gridState.isSelecting = false;
            
            if (!gridState.currentArea) return;
            
            const area = gridState.currentArea;
            const style = window.getComputedStyle(area);
            
            // Calculate grid lines based on position
            const gridRect = gridContainer.getBoundingClientRect();
            
            // Get the actual computed grid template columns and rows
            const computedStyle = window.getComputedStyle(gridContainer);
            const gridTemplateColumns = computedStyle.gridTemplateColumns;
            const gridTemplateRows = computedStyle.gridTemplateRows;
            
            // Parse the computed column and row sizes
            const colSizes = gridTemplateColumns.split(' ').map(size => parseFloat(size));
            const rowSizes = gridTemplateRows.split(' ').map(size => parseFloat(size));
            
            const left = parseInt(style.left);
            const top = parseInt(style.top);
            const width = parseInt(style.width);
            const height = parseInt(style.height);
            
            // Find the starting column
            let startCol = 0;
            let accumulatedWidth = 0;
            for (let i = 0; i < colSizes.length; i++) {
                if (accumulatedWidth + (colSizes[i] / 2) > left) break;
                accumulatedWidth += colSizes[i] + gridState.columnGap;
                startCol++;
            }
            
            // Find the starting row
            let startRow = 0;
            let accumulatedHeight = 0;
            for (let i = 0; i < rowSizes.length; i++) {
                if (accumulatedHeight + (rowSizes[i] / 2) > top) break;
                accumulatedHeight += rowSizes[i] + gridState.rowGap;
                startRow++;
            }
            
            // Find the ending column
            let endCol = startCol;
            accumulatedWidth = left;
            for (let i = startCol; i < colSizes.length; i++) {
                if (accumulatedWidth + colSizes[i] >= left + width) break;
                accumulatedWidth += colSizes[i] + gridState.columnGap;
                endCol++;
            }
            
            // Find the ending row
            let endRow = startRow;
            accumulatedHeight = top;
            for (let i = startRow; i < rowSizes.length; i++) {
                if (accumulatedHeight + rowSizes[i] >= top + height) break;
                accumulatedHeight += rowSizes[i] + gridState.rowGap;
                endRow++;
            }
            
            // Add UI elements
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '×';
            closeBtn.style.position = 'absolute';
            closeBtn.style.top = '0';
            closeBtn.style.right = '0';
            closeBtn.style.backgroundColor = '#ef4444'; // Red color
            closeBtn.style.color = 'white';
            closeBtn.style.width = '20px';
            closeBtn.style.height = '20px';
            closeBtn.style.display = 'flex';
            closeBtn.style.alignItems = 'center';
            closeBtn.style.justifyContent = 'center';
            closeBtn.style.borderRadius = '50%';
            closeBtn.style.transform = 'translate(50%, -50%)';
            closeBtn.style.pointerEvents = 'auto';
            closeBtn.style.cursor = 'pointer';
            
            const nameLabel = document.createElement('div');
            const areaName = gridState.areas.length === 0 ? 'div1' : `div${gridState.areas.length + 1}`;
            nameLabel.textContent = '.' + areaName;
            nameLabel.style.position = 'absolute';
            nameLabel.style.top = '0';
            nameLabel.style.left = '0';
            nameLabel.style.backgroundColor = '#1F2332';
            nameLabel.style.padding = '0 4px';
            nameLabel.style.fontSize = '12px';
            nameLabel.style.pointerEvents = 'auto';
            nameLabel.style.color = style.borderColor;
            
            area.appendChild(closeBtn);
            area.appendChild(nameLabel);
            area.style.pointerEvents = 'auto';
            
            // Save area data with color information
            const colorIndex = gridState.areas.length % gridState.areaColors.length;
            const areaData = {
                name: areaName,
                startCol: startCol + 1, 
                startRow: startRow + 1, 
                endCol: endCol + 1, 
                endRow: endRow + 1,
                element: area,
                bgColor: gridState.areaColors[colorIndex],
                borderColor: gridState.borderColors[colorIndex]
            };
            
            gridState.areas.push(areaData);
            gridState.currentArea = null;
            
            closeBtn.addEventListener('click', () => removeArea(areaData));
            
            // Make area draggable
            makeAreaDraggable(area, areaData);
        }
    }

    // Make an area element draggable
    function makeAreaDraggable(element, areaData) {
        let isDragging = false;
        let startX, startY, startLeft, startTop;
        
        const onMouseDown = function(e) {
            // Don't start drag if clicking on the close button
            if (e.target.tagName === 'BUTTON') return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(element.style.left) || 0;
            startTop = parseInt(element.style.top) || 0;
            
            e.preventDefault(); // Prevent text selection
            e.stopPropagation(); // Stop event from bubbling to grid cells
        };
        
        const onMouseMove = function(e) {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const newLeft = startLeft + deltaX;
            const newTop = startTop + deltaY;
            
            // Get grid container dimensions
            const gridRect = gridContainer.getBoundingClientRect();
            const areaRect = element.getBoundingClientRect();
            const areaWidth = areaRect.width;
            const areaHeight = areaRect.height;
            
            // Constrain to grid boundaries
            const constrainedLeft = Math.max(0, Math.min(newLeft, gridRect.width - areaWidth));
            const constrainedTop = Math.max(0, Math.min(newTop, gridRect.height - areaHeight));
            
            element.style.left = constrainedLeft + 'px';
            element.style.top = constrainedTop + 'px';
            
            e.preventDefault();
            e.stopPropagation();
        };
        
        const onMouseUp = function() {
            if (!isDragging) return;
            isDragging = false;
            
            // Update area data with new position
            const gridRect = gridContainer.getBoundingClientRect();
            
            // Get the actual computed grid template columns and rows
            const computedStyle = window.getComputedStyle(gridContainer);
            const gridTemplateColumns = computedStyle.gridTemplateColumns;
            const gridTemplateRows = computedStyle.gridTemplateRows;
            
            // Parse the computed column and row sizes
            const colSizes = gridTemplateColumns.split(' ').map(size => parseFloat(size));
            const rowSizes = gridTemplateRows.split(' ').map(size => parseFloat(size));
            
            const left = parseInt(element.style.left);
            const top = parseInt(element.style.top);
            const width = parseInt(element.style.width);
            const height = parseInt(element.style.height);
            
            // Find the starting column
            let startCol = 0;
            let accumulatedWidth = 0;
            for (let i = 0; i < colSizes.length; i++) {
                if (accumulatedWidth + (colSizes[i] / 2) > left) break;
                accumulatedWidth += colSizes[i] + gridState.columnGap;
                startCol++;
            }
            
            // Find the starting row
            let startRow = 0;
            let accumulatedHeight = 0;
            for (let i = 0; i < rowSizes.length; i++) {
                if (accumulatedHeight + (rowSizes[i] / 2) > top) break;
                accumulatedHeight += rowSizes[i] + gridState.rowGap;
                startRow++;
            }
            
            // Calculate snapped position
            let snappedLeft = 0;
            for (let i = 0; i < startCol; i++) {
                snappedLeft += colSizes[i] + gridState.columnGap;
            }
            
            let snappedTop = 0;
            for (let i = 0; i < startRow; i++) {
                snappedTop += rowSizes[i] + gridState.rowGap;
            }
            
            element.style.left = snappedLeft + 'px';
            element.style.top = snappedTop + 'px';
            
            // Find the ending column based on width
            let endCol = startCol;
            accumulatedWidth = 0;
            for (let i = startCol; i < colSizes.length; i++) {
                accumulatedWidth += colSizes[i];
                if (accumulatedWidth >= width) {
                    endCol = i;
                    break;
                }
                if (i < colSizes.length - 1) {
                    accumulatedWidth += gridState.columnGap;
                }
            }
            
            // Find the ending row based on height
            let endRow = startRow;
            accumulatedHeight = 0;
            for (let i = startRow; i < rowSizes.length; i++) {
                accumulatedHeight += rowSizes[i];
                if (accumulatedHeight >= height) {
                    endRow = i;
                    break;
                }
                if (i < rowSizes.length - 1) {
                    accumulatedHeight += gridState.rowGap;
                }
            }
            
            // Update area data
            areaData.startCol = startCol + 1;
            areaData.startRow = startRow + 1;
            areaData.endCol = endCol + 1;
            areaData.endRow = endRow + 1;
        };
        
        // Add event listeners to the element
        element.addEventListener('mousedown', onMouseDown);
        
        // Store these references on the element to remove them later if needed
        element._dragHandlers = {
            move: onMouseMove,
            up: onMouseUp
        };
        
        // Add document level event listeners
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    // Area management
    function removeArea(area) {
        // Clean up event listeners before removing
        if (area.element && area.element._dragHandlers) {
            document.removeEventListener('mousemove', area.element._dragHandlers.move);
            document.removeEventListener('mouseup', area.element._dragHandlers.up);
        }
        
        area.element.remove();
        const index = gridState.areas.indexOf(area);
        if (index > -1) gridState.areas.splice(index, 1);
    }

    function clearAllAreas() {
        // Clean up event listeners before removing areas
        gridState.areas.forEach(area => {
            if (area.element && area.element._dragHandlers) {
                document.removeEventListener('mousemove', area.element._dragHandlers.move);
                document.removeEventListener('mouseup', area.element._dragHandlers.up);
            }
        });
        
        gridAreasContainer.innerHTML = '';
        gridState.areas = [];
    }

    // Generate CSS output
    function generateCSSOutput() {
        let css = `.parent {
  display: grid;
  grid-template-columns: ${gridState.colValues.join(' ')};
  grid-template-rows: ${gridState.rowValues.join(' ')};`;

        // Add gap if specified
        if (gridState.columnGap > 0 || gridState.rowGap > 0) {
            if (gridState.columnGap === gridState.rowGap) {
                css += `\n  gap: ${gridState.columnGap}px;`;
            } else {
                css += `\n  column-gap: ${gridState.columnGap}px;
  row-gap: ${gridState.rowGap}px;`;
            }
        }
        
        css += '\n}';
        
        // Add area styles based on the actual selected grid areas
        if (gridState.areas.length > 0) {
            gridState.areas.forEach((area, index) => {
                css += `\n.div${index + 1} { grid-area: ${area.startRow} / ${area.startCol} / ${area.endRow} / ${area.endCol}; }`;
            });
        }
        
        return css;
    }

    // Apply syntax highlighting to CSS code
    function applySyntaxHighlighting(cssCode) {
        // Replace CSS with syntax highlighted HTML
        let highlightedCode = cssCode
            // Highlight class selectors
            .replace(/\.parent\b/g, '<span class="parent">.parent</span>')
            .replace(/\.div(\d+)\b/g, '<span class="div$1">.div$1</span>')
            // Highlight properties
            .replace(/(display|grid-template-columns|grid-template-rows|column-gap|row-gap|gap|grid-area):/g, '<span class="property">$1:</span>')
            // Highlight values
            .replace(/: ([^;]+);/g, ': <span class="value">$1</span>;')
            // Highlight braces
            .replace(/[{}]/g, '<span class="brace">$&</span>')
            // Highlight comments
            .replace(/(<!--.*?-->)/g, '<span class="comment">$1</span>');
            
        return highlightedCode;
    }

    // Generate HTML code
    function generateHtmlOutput() {
        let htmlCode;
        
        if (gridState.areas.length > 0) {
            // Dynamic HTML based on user-selected areas
            htmlCode = `<div class="parent">
  ${gridState.areas.map((area, index) => `<div class="div${index + 1}"></div>`).join('\n  ')}
</div>`;
        } else {
            // Empty parent container if no areas are selected
            htmlCode = `<div class="parent">
</div>`;
        }
        
        return htmlCode;
    }

    // Handle grid dimension changes
    function handleGridDimensionChange(input, isColumns) {
        const value = parseInt(input.value) || 5;
        const maxValue = 12;
        const minValue = 1;
        
        // Clamp value between min and max
        const clampedValue = Math.min(Math.max(value, minValue), maxValue);
        input.value = clampedValue;
        
        if (isColumns) {
            gridState.cols = clampedValue;
            gridState.colValues = gridState.colValues.slice(0, clampedValue);
            while (gridState.colValues.length < clampedValue) {
                gridState.colValues.push('1fr');
            }
            // Set CSS variable for columns
            document.documentElement.style.setProperty('--grid-columns', clampedValue);
        } else {
            gridState.rows = clampedValue;
            gridState.rowValues = gridState.rowValues.slice(0, clampedValue);
            while (gridState.rowValues.length < clampedValue) {
                gridState.rowValues.push('1fr');
            }
            // Set CSS variable for rows
            document.documentElement.style.setProperty('--grid-rows', clampedValue);
        }
        
        initGrid();
        updateAreaPositions();
    }
    
    // Update grid inputs
    function updateGridInputs() {
        const topLabelsGrid = document.querySelector('.top-labels-grid');
        const rowLabelsContainer = document.querySelector('.left-labels-container');
        
        // Update column inputs
        topLabelsGrid.innerHTML = '';
        topLabelsGrid.style.gridTemplateColumns = `repeat(${gridState.cols}, 1fr)`;
        
        for (let i = 0; i < gridState.cols; i++) {
            const colLabel = document.createElement('div');
            colLabel.className = 'col-label';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'col-fr-input';
            input.value = gridState.colValues[i] || '1fr';
            
            colLabel.appendChild(input);
            topLabelsGrid.appendChild(colLabel);
            
            input.addEventListener('input', () => {
                gridState.colValues[i] = input.value || '1fr';
                gridContainer.style.gridTemplateColumns = gridState.colValues.join(' ');
            });
        }
        
        // Update row inputs
        rowLabelsContainer.innerHTML = '';
        
        // Set CSS variable for rows to ensure proper spacing
        document.documentElement.style.setProperty('--grid-rows', gridState.rows);
        
        // Calculate the height for each row label based on the grid height and number of rows
        const gridHeight = 450; // Match the height in CSS
        const rowSpacing = 8; // Match margin-bottom in CSS
        const totalSpacing = (gridState.rows - 1) * rowSpacing;
        const rowHeight = (gridHeight - totalSpacing) / gridState.rows;
        
        for (let i = 0; i < gridState.rows; i++) {
            const rowLabel = document.createElement('div');
            rowLabel.className = 'row-label';
            
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'row-fr-input';
            input.value = gridState.rowValues[i] || '1fr';
            
            rowLabel.appendChild(input);
            rowLabelsContainer.appendChild(rowLabel);
            
            input.addEventListener('input', () => {
                gridState.rowValues[i] = input.value || '1fr';
                gridContainer.style.gridTemplateRows = gridState.rowValues.join(' ');
            });
        }
    }
    
    // Reset grid to default state
    function resetGrid() {
        // Clean up event listeners before resetting
        gridState.areas.forEach(area => {
            if (area.element && area.element._dragHandlers) {
                document.removeEventListener('mousemove', area.element._dragHandlers.move);
                document.removeEventListener('mouseup', area.element._dragHandlers.up);
            }
        });
        
        gridState.cols = 5;
        gridState.rows = 5;
        gridState.colValues = Array(5).fill('1fr');
        gridState.rowValues = Array(5).fill('1fr');
        gridState.columnGap = 0;
        gridState.rowGap = 0;
        
        columnsInput.value = 5;
        rowsInput.value = 5;
        columnGapInput.value = 0;
        rowGapInput.value = 0;
        
        clearAllAreas();
        initGrid();
    }
    
    // Update area positions when grid changes
    function updateAreaPositions() {
        const gridRect = gridContainer.getBoundingClientRect();
        
        // Get the actual computed grid template columns and rows
        const computedStyle = window.getComputedStyle(gridContainer);
        const gridTemplateColumns = computedStyle.gridTemplateColumns;
        const gridTemplateRows = computedStyle.gridTemplateRows;
        
        // Parse the computed column and row sizes
        const colSizes = gridTemplateColumns.split(' ').map(size => parseFloat(size));
        const rowSizes = gridTemplateRows.split(' ').map(size => parseFloat(size));
        
        gridState.areas.forEach(area => {
            // Calculate position
            let leftPos = 0;
            for (let i = 0; i < area.startCol - 1; i++) {
                if (i < colSizes.length) {
                    leftPos += colSizes[i];
                    if (i < area.startCol - 2) leftPos += gridState.columnGap;
                }
            }
            
            let topPos = 0;
            for (let i = 0; i < area.startRow - 1; i++) {
                if (i < rowSizes.length) {
                    topPos += rowSizes[i];
                    if (i < area.startRow - 2) topPos += gridState.rowGap;
                }
            }
            
            // Calculate width and height
            let width = 0;
            for (let i = area.startCol - 1; i < area.endCol; i++) {
                if (i < colSizes.length) {
                    width += colSizes[i];
                    if (i < area.endCol - 1) width += gridState.columnGap;
                }
            }
            
            let height = 0;
            for (let i = area.startRow - 1; i < area.endRow; i++) {
                if (i < rowSizes.length) {
                    height += rowSizes[i];
                    if (i < area.endRow - 1) height += gridState.rowGap;
                }
            }
            
            area.element.style.left = leftPos + 'px';
            area.element.style.top = topPos + 'px';
            area.element.style.width = width + 'px';
            area.element.style.height = height + 'px';
        });
    }

    // Modal functions
    function openModal() {
        // Generate CSS code
        generatedCssCode = generateCSSOutput();
        generatedHtmlCode = generateHtmlOutput();
        
        // Apply syntax highlighting
        const highlightedCss = applySyntaxHighlighting(generatedCssCode);
        
        // Set modal content
        modalCssOutput.innerHTML = highlightedCss;
        
        // Reset button text
        modalShowHtmlButton.textContent = "Show HTML";
        showingHtml = false;
        
        // Display modal
        cssModal.style.display = 'flex';
    }
    
    function closeModal() {
        cssModal.style.display = 'none';
    }
    
    // Toggle between HTML and CSS display
    function toggleHtmlCss() {
        if (showingHtml) {
            // Switch to CSS
            modalCssOutput.innerHTML = applySyntaxHighlighting(generatedCssCode);
            modalShowHtmlButton.textContent = "Show HTML";
            showingHtml = false;
        } else {
            // Switch to HTML
            const formattedHtml = generatedHtmlCode
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/&lt;div class="parent"&gt;/g, '<span class="parent">&lt;div class="parent"&gt;</span>')
                .replace(/&lt;div class="div(\d+)"&gt;/g, '<span class="div$1">&lt;div class="div$1"&gt;</span>')
                .replace(/&lt;\/div&gt;/g, '<span class="brace">&lt;/div&gt;</span>');
            
            modalCssOutput.innerHTML = formattedHtml;
            modalShowHtmlButton.textContent = "Show CSS";
            showingHtml = true;
        }
    }
    
    // Event listeners
    columnsInput.addEventListener('change', () => handleGridDimensionChange(columnsInput, true));
    rowsInput.addEventListener('change', () => handleGridDimensionChange(rowsInput, false));
    
    columnGapInput.addEventListener('input', () => {
        gridState.columnGap = parseInt(columnGapInput.value) || 0;
        gridContainer.style.columnGap = gridState.columnGap + 'px';
        updateAreaPositions();
    });
    
    rowGapInput.addEventListener('input', () => {
        gridState.rowGap = parseInt(rowGapInput.value) || 0;
        gridContainer.style.rowGap = gridState.rowGap + 'px';
        updateAreaPositions();
    });
    
    generateCodeBtn.addEventListener('click', openModal);
    
    resetGridBtn.addEventListener('click', resetGrid);
    
    clearAreasBtn.addEventListener('click', clearAllAreas);
    
    // Modal event listeners
    modalCopyButton.addEventListener('click', () => {
        // Get the raw text without HTML tags
        const textToCopy = showingHtml ? generatedHtmlCode : generatedCssCode;
        
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                modalCopyButton.textContent = 'Copied!';
                setTimeout(() => {
                    modalCopyButton.textContent = 'Copy to clipboard!';
                }, 2000);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
            });
    });
    
    modalShowHtmlButton.addEventListener('click', toggleHtmlCss);
    
    modalCloseButton.addEventListener('click', closeModal);
    closeModalX.addEventListener('click', closeModal);
    
    // Close modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === cssModal) {
            closeModal();
        }
    });
    
    // Initialize the grid on page load
    initGrid();
}); 