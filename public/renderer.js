// DOM Elements
const openFolderBtn = document.getElementById('open-folder-btn');
const foldersContainer = document.getElementById('folders-container');
const combinedContainer = document.getElementById('combined-container');
const combinedContent = document.querySelector('.combined-content');
const closeDetailsBtn = document.getElementById('close-details-btn');
const detailsPanel = document.getElementById('details-panel');
const detailsContent = document.getElementById('details-content');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const folderViewBtn = document.getElementById('folder-view-btn');
const combinedViewBtn = document.getElementById('combined-view-btn');
const showImagesOnlyCheckbox = document.getElementById('show-images-only');

// Modal elements
const imageModal = document.getElementById('image-modal');
const modalImage = document.getElementById('modal-image');
const modalImageName = document.getElementById('modal-image-name');
const closeModalBtn = document.getElementById('close-modal-btn');
const prevImageBtn = document.getElementById('prev-image-btn');
const nextImageBtn = document.getElementById('next-image-btn');
const imageCounter = document.getElementById('image-counter');

// Context menu
let contextMenu = null;
let contextMenuItem = null;

// State
const openFolders = new Map(); // Map of folder paths to folder data
let selectedItem = null;
const itemTags = new Map(); // Map of item paths to tags array
let currentView = 'folder'; // 'folder' or 'combined'
let showImagesOnly = true;

// Image viewer state
let currentImages = []; // Array of all image items
let currentImageIndex = -1; // Index of the current image in the array

// Initialize UI
function initUI() {
  openFolderBtn.addEventListener('click', handleOpenFolder);
  closeDetailsBtn.addEventListener('click', closeDetails);
  
  // Set up search
  searchBtn.addEventListener('click', performSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });

  // Set up view switching
  folderViewBtn.addEventListener('click', () => switchView('folder'));
  combinedViewBtn.addEventListener('click', () => switchView('combined'));

  // Set up image filter
  showImagesOnlyCheckbox.addEventListener('change', () => {
    showImagesOnly = showImagesOnlyCheckbox.checked;
    refreshCombinedView();
  });
  
  // Set up image modal
  closeModalBtn.addEventListener('click', closeImageModal);
  prevImageBtn.addEventListener('click', showPreviousImage);
  nextImageBtn.addEventListener('click', showNextImage);
  
  // Set up context menu
  setupContextMenu();
  
  // Close modal when clicking outside the image
  imageModal.addEventListener('click', (e) => {
    if (e.target === imageModal) {
      closeImageModal();
    }
  });
  
  // Keyboard navigation and shortcuts
  document.addEventListener('keydown', (e) => {
    // Modal navigation
    if (imageModal.style.display === 'block') {
      switch(e.key) {
        case 'Escape':
          closeImageModal();
          break;
        case 'ArrowLeft':
          showPreviousImage();
          break;
        case 'ArrowRight':
          showNextImage();
          break;
      }
    }
    
    // Copy shortcut (Ctrl+C)
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault(); // Prevent default copy behavior
      
      // Determine which image to copy based on current context
      let itemToCopy = null;
      
      // If modal is open, copy the current modal image
      if (imageModal.style.display === 'block' && currentImages[currentImageIndex]) {
        itemToCopy = currentImages[currentImageIndex];
      }
      // Otherwise copy the currently selected item if it's an image
      else if (selectedItem && selectedItem.isImage) {
        itemToCopy = selectedItem;
      }
      // If nothing is explicitly selected, try to find a selected file card
      else {
        const selectedFileCard = document.querySelector('.file-card.selected');
        if (selectedFileCard) {
          const itemPath = selectedFileCard.dataset.path;
          for (const [folderPath, folderData] of openFolders.entries()) {
            const item = folderData.items.find(item => item.path === itemPath);
            if (item && item.isImage) {
              itemToCopy = item;
              break;
            }
          }
        }
      }
      
      // Copy the image if found
      if (itemToCopy) {
        copyImageToClipboard(itemToCopy);
        showNotification(`Copied ${itemToCopy.name} to clipboard (Ctrl+C)`);
      }
    }
  });
  
  // Add global event listener for folder item selection
  document.addEventListener('click', (e) => {
    // Close context menu if open
    if (contextMenu && !e.target.closest('.context-menu')) {
      closeContextMenu();
    }
    
    // Handle folder view item clicks
    if (e.target.closest('.folder-item')) {
      const itemElement = e.target.closest('.folder-item');
      const itemPath = itemElement.dataset.path;
      
      // Remove selected class from all items
      document.querySelectorAll('.folder-item').forEach(item => {
        item.classList.remove('selected');
      });
      
      // Add selected class to clicked item
      itemElement.classList.add('selected');
      
      // Find item data
      for (const [folderPath, folderData] of openFolders.entries()) {
        const item = folderData.items.find(item => item.path === itemPath);
        if (item) {
          selectedItem = item;
          showItemDetails(item);
          break;
        }
      }
    }
    
    // Handle combined view item clicks
    if (e.target.closest('.file-card')) {
      const fileCard = e.target.closest('.file-card');
      const itemPath = fileCard.dataset.path;
      
      // Remove selected class from all items
      document.querySelectorAll('.file-card').forEach(card => {
        card.classList.remove('selected');
      });
      
      // Add selected class to clicked item
      fileCard.classList.add('selected');
      
      // Find item data
      for (const [folderPath, folderData] of openFolders.entries()) {
        const item = folderData.items.find(item => item.path === itemPath);
        if (item) {
          selectedItem = item;
          showItemDetails(item);
          break;
        }
      }
    }
    
    // Handle search result clicks
    if (e.target.closest('.search-result-item')) {
      const searchResultItem = e.target.closest('.search-result-item');
      const itemPath = searchResultItem.dataset.path;
      
      // Find item data
      for (const [folderPath, folderData] of openFolders.entries()) {
        const item = folderData.items.find(item => item.path === itemPath);
        if (item) {
          selectedItem = item;
          showItemDetails(item);
          
          // Switch to folder view and highlight the item
          if (currentView !== 'folder') {
            switchView('folder');
          }
          
          // Find and highlight the item in the folder view
          setTimeout(() => {
            const itemElement = document.querySelector(`.folder-item[data-path="${itemPath}"]`);
            if (itemElement) {
              // Remove selected class from all items
              document.querySelectorAll('.folder-item').forEach(item => {
                item.classList.remove('selected');
              });
              
              // Add selected class to found item
              itemElement.classList.add('selected');
              
              // Scroll the item into view
              itemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
          
          break;
        }
      }
    }
    
    // Handle image preview click in details
    if (e.target.closest('.file-preview-container')) {
      const previewContainer = e.target.closest('.file-preview-container');
      const img = previewContainer.querySelector('img');
      
      if (img && selectedItem && selectedItem.isImage) {
        openImageModal(selectedItem);
      }
    }
    
    // Handle image click in combined view
    if (e.target.closest('.file-preview img')) {
      const imgElement = e.target.closest('.file-preview img');
      const fileCard = e.target.closest('.file-card');
      
      if (fileCard) {
        const itemPath = fileCard.dataset.path;
        
        // Find item
        for (const [folderPath, folderData] of openFolders.entries()) {
          const item = folderData.items.find(item => item.path === itemPath);
          if (item && item.isImage) {
            openImageModal(item);
            break;
          }
        }
      }
    }
  });
}

// Set up context menu
function setupContextMenu() {
  // Create context menu
  document.addEventListener('contextmenu', function(e) {
    // Check if right-click is on an image
    const fileCard = e.target.closest('.file-card');
    const filePreviewContainer = e.target.closest('.file-preview-container');
    const modalImageEl = e.target.closest('#modal-image');
    
    let targetItem = null;
    
    if (fileCard) {
      const itemPath = fileCard.dataset.path;
      for (const [folderPath, folderData] of openFolders.entries()) {
        const item = folderData.items.find(item => item.path === itemPath);
        if (item && item.isImage) {
          targetItem = item;
          break;
        }
      }
    } else if (filePreviewContainer && selectedItem && selectedItem.isImage) {
      targetItem = selectedItem;
    } else if (modalImageEl && currentImages[currentImageIndex]) {
      targetItem = currentImages[currentImageIndex];
    }
    
    if (targetItem && targetItem.isImage) {
      e.preventDefault();
      
      // Close existing context menu if open
      closeContextMenu();
      
      // Create new context menu
      contextMenu = document.createElement('div');
      contextMenu.className = 'context-menu';
      contextMenuItem = targetItem;
      
      const copyOption = document.createElement('div');
      copyOption.className = 'context-menu-item';
      copyOption.textContent = 'Copy Image';
      copyOption.addEventListener('click', () => {
        copyImageToClipboard(targetItem);
        closeContextMenu();
      });
      
      contextMenu.appendChild(copyOption);
      
      // Position the context menu
      contextMenu.style.left = `${e.pageX}px`;
      contextMenu.style.top = `${e.pageY}px`;
      
      // Add context menu to the body
      document.body.appendChild(contextMenu);
    }
  });
}

// Close context menu
function closeContextMenu() {
  if (contextMenu && contextMenu.parentNode) {
    contextMenu.parentNode.removeChild(contextMenu);
    contextMenu = null;
    contextMenuItem = null;
  }
}

// Copy image to clipboard
async function copyImageToClipboard(item) {
  try {
    // Create img element to hold the image
    const img = new Image();
    img.src = `file://${item.path}`;
    
    // Wait for image to load
    await new Promise(resolve => {
      img.onload = resolve;
    });
    
    // Create canvas to draw the image
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    // Draw image on canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    // Get image as blob
    canvas.toBlob(blob => {
      // Create ClipboardItem
      const data = new ClipboardItem({
        [blob.type]: blob
      });
      
      // Copy to clipboard
      navigator.clipboard.write([data])
        .then(() => {
          console.log('Image copied to clipboard');
          
          // Show notification
          showNotification('Image copied to clipboard');
        })
        .catch(err => {
          console.error('Failed to copy image: ', err);
          
          // Show notification
          showNotification('Failed to copy image');
        });
    });
  } catch (error) {
    console.error('Error copying image to clipboard:', error);
    showNotification('Error copying image to clipboard');
  }
}

// Make image elements draggable
function makeDraggable(imgElement, item) {
  imgElement.draggable = true;
  
  imgElement.addEventListener('dragstart', (e) => {
    e.dataTransfer.effectAllowed = 'copy';
    
    // Create a new image for the drag preview
    const dragImg = new Image();
    dragImg.src = `file://${item.path}`;
    
    // Wait for the image to load
    dragImg.onload = () => {
      const scale = 0.25;
      const width = dragImg.width * scale;
      const height = dragImg.height * scale;
      
      // Create canvas for preview
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      // Draw scaled image
      const ctx = canvas.getContext('2d');
      ctx.drawImage(dragImg, 0, 0, width, height);
      
      // Set the drag image
      e.dataTransfer.setDragImage(canvas, width / 2, height / 2);
    };
    
    // Set the drag data
    e.dataTransfer.setData('text/plain', item.path);
    e.dataTransfer.setData('text/uri-list', `file://${item.path}`);
  });
}

// Show notification
function showNotification(message) {
  // Check if there's an existing notification
  let notification = document.querySelector('.notification');
  
  if (notification) {
    // Update existing notification
    clearTimeout(notification.timeout);
    notification.textContent = message;
  } else {
    // Create new notification
    notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
  }
  
  // Show the notification
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Hide the notification after 3 seconds
  notification.timeout = setTimeout(() => {
    notification.classList.remove('show');
    
    // Remove the notification after the transition
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

// Open image modal
function openImageModal(imageItem) {
  // Get all image items from all folders
  currentImages = [];
  for (const [folderPath, folderData] of openFolders.entries()) {
    const images = folderData.items.filter(item => item.isImage);
    currentImages.push(...images);
  }
  
  // Sort images by name
  currentImages.sort((a, b) => a.name.localeCompare(b.name));
  
  // Find index of current image
  currentImageIndex = currentImages.findIndex(item => item.path === imageItem.path);
  
  if (currentImageIndex !== -1) {
    updateModalImage();
    imageModal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent body scrolling
  }
}

// Close image modal
function closeImageModal() {
  imageModal.style.display = 'none';
  document.body.style.overflow = ''; // Restore body scrolling
}

// Show previous image
function showPreviousImage() {
  if (currentImageIndex > 0) {
    currentImageIndex--;
    updateModalImage();
  }
}

// Show next image
function showNextImage() {
  if (currentImageIndex < currentImages.length - 1) {
    currentImageIndex++;
    updateModalImage();
  }
}

// Update modal image
function updateModalImage() {
  const currentImage = currentImages[currentImageIndex];
  
  // Update image source
  modalImage.src = `file://${currentImage.path}`;
  modalImage.alt = currentImage.name;
  
  // Make the modal image draggable
  makeDraggable(modalImage, currentImage);
  
  // Update image name
  modalImageName.textContent = currentImage.name;
  modalImageName.title = currentImage.path;
  
  // Update counter
  imageCounter.textContent = `${currentImageIndex + 1} of ${currentImages.length}`;
  
  // Update navigation buttons
  prevImageBtn.classList.toggle('disabled', currentImageIndex === 0);
  nextImageBtn.classList.toggle('disabled', currentImageIndex === currentImages.length - 1);
}

// Switch between folder and combined view
function switchView(view) {
  if (view === currentView) return;
  
  currentView = view;
  
  if (view === 'folder') {
    folderViewBtn.classList.add('active');
    combinedViewBtn.classList.remove('active');
    foldersContainer.style.display = 'flex';
    combinedContainer.style.display = 'none';
  } else {
    folderViewBtn.classList.remove('active');
    combinedViewBtn.classList.add('active');
    foldersContainer.style.display = 'none';
    combinedContainer.style.display = 'flex';
    
    // Update the combined view
    refreshCombinedView();
  }
}

// Refresh the combined view with all files
function refreshCombinedView() {
  combinedContent.innerHTML = '';
  
  // Collect all files from all folders
  const allFiles = [];
  
  for (const [folderPath, folderData] of openFolders.entries()) {
    allFiles.push(...folderData.items.filter(item => {
      // Apply filter if showing images only
      if (showImagesOnly) {
        return !item.isDirectory && item.isImage;
      }
      // For the grid view, we only show files, not directories
      return !item.isDirectory;
    }));
  }
  
  if (allFiles.length === 0) {
    combinedContent.innerHTML = '<p class="no-results">No files to display</p>';
    return;
  }
  
  // Sort files by name
  allFiles.sort((a, b) => a.name.localeCompare(b.name));
  
  // Create file cards for each file
  allFiles.forEach(item => {
    const fileCard = document.createElement('div');
    fileCard.className = 'file-card';
    fileCard.dataset.path = item.path;
    
    const filePreview = document.createElement('div');
    filePreview.className = 'file-preview';
    
    // Show image preview if it's an image
    if (item.isImage) {
      const img = document.createElement('img');
      img.src = `file://${item.path}`;
      img.alt = item.name;
      
      // Make the image draggable
      makeDraggable(img, item);
      
      filePreview.appendChild(img);
    } else {
      const icon = document.createElement('div');
      icon.className = 'icon';
      icon.textContent = '📄';
      filePreview.appendChild(icon);
    }
    
    // Add source tooltip that shows on hover
    const sourceTooltip = document.createElement('div');
    sourceTooltip.className = 'file-source-tooltip';
    sourceTooltip.textContent = `${item.name} (${item.sourceFolder.split(/[\\/]/).pop()})`;
    sourceTooltip.title = item.path;
    
    fileCard.appendChild(filePreview);
    fileCard.appendChild(sourceTooltip);
    
    combinedContent.appendChild(fileCard);
  });
}

// Perform search across all folders
function performSearch() {
  const query = searchInput.value.trim().toLowerCase();
  
  if (!query) return;
  
  // Clear previous selection
  clearDetails();
  
  // Create search results container
  detailsContent.innerHTML = '';
  
  const searchResultsContainer = document.createElement('div');
  searchResultsContainer.className = 'search-results';
  
  const searchResultsHeader = document.createElement('div');
  searchResultsHeader.className = 'search-results-header';
  
  const searchResultsTitle = document.createElement('h3');
  searchResultsTitle.textContent = `Search Results for "${query}"`;
  
  searchResultsHeader.appendChild(searchResultsTitle);
  searchResultsContainer.appendChild(searchResultsHeader);
  
  // Search in file names and tags
  let results = [];
  
  for (const [folderPath, folderData] of openFolders.entries()) {
    const folderResults = folderData.items.filter(item => {
      // Check if name matches
      const nameMatch = item.name.toLowerCase().includes(query);
      
      // Check if tags match
      const tags = itemTags.get(item.path) || [];
      const tagMatch = tags.some(tag => tag.toLowerCase().includes(query));
      
      return nameMatch || tagMatch;
    });
    
    results.push(...folderResults);
  }
  
  // Sort results by relevance (exact matches first)
  results.sort((a, b) => {
    const aExactMatch = a.name.toLowerCase() === query;
    const bExactMatch = b.name.toLowerCase() === query;
    
    if (aExactMatch && !bExactMatch) return -1;
    if (!aExactMatch && bExactMatch) return 1;
    
    return a.name.localeCompare(b.name);
  });
  
  if (results.length === 0) {
    const noResults = document.createElement('p');
    noResults.className = 'no-results';
    noResults.textContent = 'No results found';
    searchResultsContainer.appendChild(noResults);
  } else {
    // Create result items
    results.forEach(item => {
      const resultItem = document.createElement('div');
      resultItem.className = 'search-result-item';
      resultItem.dataset.path = item.path;
      
      const icon = document.createElement('span');
      icon.className = `item-icon ${item.isDirectory ? 'folder' : 'file'}`;
      icon.textContent = item.isDirectory ? '📁' : (item.isImage ? '🖼️' : '📄');
      
      const itemDetails = document.createElement('div');
      itemDetails.className = 'item-details';
      
      // Highlight the matching part of the name
      const nameWithHighlight = item.name.replace(
        new RegExp(`(${query})`, 'gi'),
        '<span class="search-match">$1</span>'
      );
      
      const name = document.createElement('div');
      name.className = 'item-name';
      name.innerHTML = nameWithHighlight;
      
      const source = document.createElement('div');
      source.className = 'item-source';
      source.textContent = `From: ${item.sourceFolder.split(/[\\/]/).pop()}`;
      
      itemDetails.appendChild(name);
      itemDetails.appendChild(source);
      
      resultItem.appendChild(icon);
      resultItem.appendChild(itemDetails);
      
      searchResultsContainer.appendChild(resultItem);
    });
  }
  
  detailsContent.appendChild(searchResultsContainer);
  detailsPanel.style.display = 'block';
}

// Handle open folder button click
async function handleOpenFolder() {
  const result = await window.electron.openFolderDialog();
  
  if (!result.canceled && result.folderPaths && result.folderPaths.length > 0) {
    // Load each selected folder
    for (const folderPath of result.folderPaths) {
      await loadFolder(folderPath);
    }
  }
}

// Load folder contents
async function loadFolder(folderPath) {
  if (openFolders.has(folderPath)) {
    // Folder already open, just focus it
    return;
  }
  
  try {
    const result = await window.electron.readFolder(folderPath);
    
    if (result.error) {
      alert(`Error loading folder: ${result.error}`);
      return;
    }
    
    // Store folder data
    openFolders.set(folderPath, {
      items: result.items,
      path: folderPath,
      name: folderPath.split(/[\\/]/).pop() // Get last part of path as folder name
    });
    
    // Add folder view to the UI
    renderFolderView(folderPath);
    
    // Refresh combined view if that's the current view
    if (currentView === 'combined') {
      refreshCombinedView();
    }
  } catch (error) {
    console.error('Error loading folder:', error);
    alert(`Error loading folder: ${error.message}`);
  }
}

// Render folder view
function renderFolderView(folderPath) {
  const folderData = openFolders.get(folderPath);
  
  if (!folderData) return;
  
  const folderElement = document.createElement('div');
  folderElement.className = 'folder-view';
  folderElement.dataset.path = folderPath;
  // Add a unique ID based on the folder path
  const folderId = `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  folderElement.id = folderId;
  folderData.elementId = folderId; // Store the element ID in folder data
  
  const folderHeader = document.createElement('div');
  folderHeader.className = 'folder-header';
  
  const folderTitle = document.createElement('h3');
  folderTitle.textContent = folderData.name;
  folderTitle.title = folderPath; // Show full path on hover
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.title = 'Close folder';
  closeBtn.className = 'close-folder-btn';
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent event from bubbling
    closeFolder(folderPath);
  });
  
  folderHeader.appendChild(folderTitle);
  folderHeader.appendChild(closeBtn);
  
  const folderContent = document.createElement('div');
  folderContent.className = 'folder-content';
  
  // Add items to folder content
  folderData.items.forEach(item => {
    const itemElement = createFolderItemElement(item);
    folderContent.appendChild(itemElement);
  });
  
  folderElement.appendChild(folderHeader);
  folderElement.appendChild(folderContent);
  
  foldersContainer.appendChild(folderElement);
}

// Create folder item element
function createFolderItemElement(item) {
  const itemElement = document.createElement('div');
  itemElement.className = 'folder-item';
  itemElement.dataset.path = item.path;
  
  const icon = document.createElement('span');
  icon.className = `item-icon ${item.isDirectory ? 'folder' : 'file'}`;
  icon.textContent = item.isDirectory ? '📁' : (item.isImage ? '🖼️' : '📄');
  
  const name = document.createElement('span');
  name.className = 'item-name';
  name.textContent = item.name;
  name.title = item.path; // Show full path on hover
  
  itemElement.appendChild(icon);
  itemElement.appendChild(name);
  
  return itemElement;
}

// Close folder
function closeFolder(folderPath) {
  // Get folder data which contains the element ID
  const folderData = openFolders.get(folderPath);
  
  if (folderData && folderData.elementId) {
    // Use the element ID to find the folder element
    const folderElement = document.getElementById(folderData.elementId);
    
    if (folderElement) {
      folderElement.remove();
      openFolders.delete(folderPath);
      
      // If the selected item is from this folder, clear the details
      if (selectedItem && selectedItem.sourceFolder === folderPath) {
        clearDetails();
      }
      
      // Refresh combined view if that's the current view
      if (currentView === 'combined') {
        refreshCombinedView();
      }
      
      console.log(`Closed folder: ${folderPath}`);
    } else {
      console.error(`Folder element not found for ID: ${folderData.elementId}`);
    }
  } else {
    console.error(`No folder data found for path: ${folderPath}`);
  }
}

// Show item details
function showItemDetails(item) {
  // Format size
  const formatSize = (size) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };
  
  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };
  
  // Get tags for this item
  const tags = itemTags.get(item.path) || [];
  
  // Start with empty details content
  detailsContent.innerHTML = '';
  
  // Add image preview if it's an image
  if (item.isImage) {
    const previewContainer = document.createElement('div');
    previewContainer.className = 'file-preview-container';
    
    const img = document.createElement('img');
    img.src = `file://${item.path}`;
    img.alt = item.name;
    
    // Make the image draggable
    makeDraggable(img, item);
    
    previewContainer.appendChild(img);
    detailsContent.appendChild(previewContainer);
  }
  
  // Create basic info section
  const basicInfoGroup = document.createElement('div');
  basicInfoGroup.className = 'details-group';
  basicInfoGroup.innerHTML = `
    <h3>Basic Info</h3>
    <div class="details-item">
      <span class="details-label">Name:</span>
      <span class="details-value">${item.name}</span>
    </div>
    <div class="details-item">
      <span class="details-label">Type:</span>
      <span class="details-value">${item.isDirectory ? 'Folder' : (item.isImage ? 'Image' : 'File')}</span>
    </div>
    <div class="details-item">
      <span class="details-label">Size:</span>
      <span class="details-value">${formatSize(item.size)}</span>
    </div>
  `;
  
  // Create location section
  const locationGroup = document.createElement('div');
  locationGroup.className = 'details-group';
  locationGroup.innerHTML = `
    <h3>Location</h3>
    <div class="details-item">
      <span class="details-label">Path:</span>
      <span class="details-value">${item.path}</span>
    </div>
    <div class="details-item">
      <span class="details-label">Source Folder:</span>
      <span class="details-value">${item.sourceFolder}</span>
    </div>
  `;
  
  // Create dates section
  const datesGroup = document.createElement('div');
  datesGroup.className = 'details-group';
  datesGroup.innerHTML = `
    <h3>Dates</h3>
    <div class="details-item">
      <span class="details-label">Created:</span>
      <span class="details-value">${formatDate(item.createdAt)}</span>
    </div>
    <div class="details-item">
      <span class="details-label">Modified:</span>
      <span class="details-value">${formatDate(item.modifiedAt)}</span>
    </div>
  `;
  
  // Create tags section
  const tagsGroup = document.createElement('div');
  tagsGroup.className = 'details-group';
  
  const tagsHeader = document.createElement('h3');
  tagsHeader.textContent = 'Tags';
  
  const tagsList = document.createElement('div');
  tagsList.className = 'tag-list';
  
  if (tags.length > 0) {
    tags.forEach(tag => {
      const tagElement = document.createElement('span');
      tagElement.className = 'tag';
      tagElement.textContent = tag;
      tagsList.appendChild(tagElement);
    });
  } else {
    const noTags = document.createElement('span');
    noTags.className = 'details-value';
    noTags.textContent = 'No tags added';
    tagsList.appendChild(noTags);
  }
  
  const addTagForm = document.createElement('div');
  addTagForm.className = 'add-tag-form';
  
  const tagInput = document.createElement('input');
  tagInput.type = 'text';
  tagInput.id = 'new-tag-input';
  tagInput.placeholder = 'Add a tag...';
  
  const addTagBtn = document.createElement('button');
  addTagBtn.id = 'add-tag-btn';
  addTagBtn.textContent = 'Add';
  
  addTagForm.appendChild(tagInput);
  addTagForm.appendChild(addTagBtn);
  
  tagsGroup.appendChild(tagsHeader);
  tagsGroup.appendChild(tagsList);
  tagsGroup.appendChild(addTagForm);
  
  // Add all groups to details content
  detailsContent.appendChild(basicInfoGroup);
  detailsContent.appendChild(locationGroup);
  detailsContent.appendChild(datesGroup);
  detailsContent.appendChild(tagsGroup);
  
  // Add event listener for the add tag button
  addTagBtn.addEventListener('click', () => {
    const newTag = tagInput.value.trim();
    
    if (newTag) {
      // Add tag to the item
      if (!itemTags.has(item.path)) {
        itemTags.set(item.path, []);
      }
      
      const itemTagsArray = itemTags.get(item.path);
      if (!itemTagsArray.includes(newTag)) {
        itemTagsArray.push(newTag);
        
        // Update the tag list
        tagsList.innerHTML = '';
        itemTagsArray.forEach(tag => {
          const tagElement = document.createElement('span');
          tagElement.className = 'tag';
          tagElement.textContent = tag;
          tagsList.appendChild(tagElement);
        });
        
        // Clear input
        tagInput.value = '';
      }
    }
  });
  
  // Show the details panel
  detailsPanel.style.display = 'block';
}

// Clear details
function clearDetails() {
  selectedItem = null;
  detailsContent.innerHTML = '<p class="no-selection">Select a file to view details</p>';
  
  // Deselect all items
  document.querySelectorAll('.folder-item').forEach(item => {
    item.classList.remove('selected');
  });
  
  document.querySelectorAll('.file-card').forEach(card => {
    card.classList.remove('selected');
  });
}

// Close details panel
function closeDetails() {
  clearDetails();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', initUI); 