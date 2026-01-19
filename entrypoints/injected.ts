import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

export default defineUnlistedScript(() => {
    let isSelectionMode = false;
    let hoveredElement: HTMLElement | null = null;
    let overlay: HTMLDivElement | null = null;
    let toast: HTMLDivElement | null = null;
    
    // Multi-select support
    let selectedElements: Set<HTMLElement> = new Set();
    let selectedOverlays: Map<HTMLElement, HTMLDivElement> = new Map();
    
    // Range selection anchors
    let rangeStartAnchor: HTMLElement | null = null;
    let rangeStartOverlay: HTMLDivElement | null = null;

    // Performance: Throttle function
    function throttle<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
      let lastCall = 0;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      return ((...args: unknown[]) => {
        const now = Date.now();
        const remaining = delay - (now - lastCall);
        if (remaining <= 0) {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          lastCall = now;
          fn(...args);
        } else if (!timeoutId) {
          timeoutId = setTimeout(() => {
            lastCall = Date.now();
            timeoutId = null;
            fn(...args);
          }, remaining);
        }
      }) as T;
    }

    // Async content parsing using requestIdleCallback
    function parseContentAsync(html: string): Promise<string | null> {
      return new Promise((resolve) => {
        const idleCallback = window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 1));
        idleCallback(() => {
          try {
            const markdown = turndownService.turndown(html);
            resolve(markdown.trim() || null);
          } catch (error) {
            console.error('Feed2AI parse error:', error);
            // Fallback to plain text
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            resolve(tempDiv.textContent?.trim() || null);
          }
        }, { timeout: 2000 });
      });
    }



    function createOverlay() {
      overlay = document.createElement('div');
      overlay.id = 'feed2ai-overlay';
      overlay.style.cssText = `
        position: fixed;
        pointer-events: none;
        border: 2px solid #4CAF50;
        background-color: rgba(76, 175, 80, 0.1);
        z-index: 2147483647;
        transition: all 0.1s ease;
        display: none;
      `;
      document.body.appendChild(overlay);
    }

    function createSelectedOverlay(element: HTMLElement, color: string = '#2196F3'): HTMLDivElement {
      const selectedOverlay = document.createElement('div');
      selectedOverlay.className = 'feed2ai-selected-overlay';
      const bgColor = color === '#FF9800' ? 'rgba(255, 152, 0, 0.2)' 
                    : color === '#9C27B0' ? 'rgba(156, 39, 176, 0.2)'
                    : 'rgba(33, 150, 243, 0.15)';
      selectedOverlay.style.cssText = `
        position: fixed;
        pointer-events: none;
        border: 2px solid ${color};
        background-color: ${bgColor};
        z-index: 2147483646;
      `;
      const rect = element.getBoundingClientRect();
      selectedOverlay.style.top = `${rect.top}px`;
      selectedOverlay.style.left = `${rect.left}px`;
      selectedOverlay.style.width = `${rect.width}px`;
      selectedOverlay.style.height = `${rect.height}px`;
      document.body.appendChild(selectedOverlay);
      return selectedOverlay;
    }

    function updateSelectedOverlays() {
      selectedOverlays.forEach((overlay, element) => {
        const rect = element.getBoundingClientRect();
        overlay.style.top = `${rect.top}px`;
        overlay.style.left = `${rect.left}px`;
        overlay.style.width = `${rect.width}px`;
        overlay.style.height = `${rect.height}px`;
      });
      // Update range start anchor overlay
      if (rangeStartAnchor && rangeStartOverlay) {
        const rect = rangeStartAnchor.getBoundingClientRect();
        rangeStartOverlay.style.top = `${rect.top}px`;
        rangeStartOverlay.style.left = `${rect.left}px`;
        rangeStartOverlay.style.width = `${rect.width}px`;
        rangeStartOverlay.style.height = `${rect.height}px`;
      }
    }

    function createToast() {
      toast = document.createElement('div');
      toast.id = 'feed2ai-toast';
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        background-color: #333;
        color: white;
        border-radius: 8px;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        opacity: 0;
        transition: opacity 0.3s ease;
      `;
      document.body.appendChild(toast);
    }

    function showToast(message: string, isSuccess: boolean = true, persistent: boolean = false) {
      if (!toast) createToast();
      if (toast) {
        toast.textContent = message;
        toast.style.backgroundColor = isSuccess ? '#4CAF50' : '#f44336';
        toast.style.opacity = '1';
        if (!persistent) {
          setTimeout(() => {
            if (toast) toast.style.opacity = '0';
          }, 2000);
        }
      }
    }

    function updateOverlay(element: HTMLElement) {
      if (!overlay) createOverlay();
      if (overlay) {
        const rect = element.getBoundingClientRect();
        overlay.style.top = `${rect.top}px`;
        overlay.style.left = `${rect.left}px`;
        overlay.style.width = `${rect.width}px`;
        overlay.style.height = `${rect.height}px`;
        overlay.style.display = 'block';
      }
    }

    function hideOverlay() {
      if (overlay) {
        overlay.style.display = 'none';
      }
    }

    function clearRangeAnchors() {
      if (rangeStartOverlay) {
        rangeStartOverlay.remove();
        rangeStartOverlay = null;
      }
      rangeStartAnchor = null;
    }

    function clearSelectedElements() {
      selectedOverlays.forEach((overlay) => overlay.remove());
      selectedOverlays.clear();
      selectedElements.clear();
      clearRangeAnchors();
    }

    function addToSelection(element: HTMLElement) {
      if (!selectedElements.has(element)) {
        selectedElements.add(element);
        const overlay = createSelectedOverlay(element, '#2196F3');
        selectedOverlays.set(element, overlay);
      }
    }

    // Async batch add for range selection - prevents UI freeze
    async function addElementsToSelectionAsync(elements: HTMLElement[]): Promise<void> {
      const BATCH_SIZE = 50;
      for (let i = 0; i < elements.length; i += BATCH_SIZE) {
        const batch = elements.slice(i, i + BATCH_SIZE);
        for (const el of batch) {
          addToSelection(el);
        }
        const progress = Math.min(i + BATCH_SIZE, elements.length);
        showToast(`Selecting ${progress}/${elements.length}...`, true, true);
        // Yield to main thread
        await new Promise(r => setTimeout(r, 0));
      }
    }

    function removeFromSelection(element: HTMLElement) {
      if (selectedElements.has(element)) {
        selectedElements.delete(element);
        const overlay = selectedOverlays.get(element);
        if (overlay) {
          overlay.remove();
          selectedOverlays.delete(element);
        }
      }
    }

    function getElementsBetween(start: HTMLElement, end: HTMLElement): HTMLElement[] {
      let ancestor: Node | null = start;
      const startAncestors = new Set<Node>();
      while (ancestor) {
        startAncestors.add(ancestor);
        ancestor = ancestor.parentNode;
      }
      
      ancestor = end;
      while (ancestor && !startAncestors.has(ancestor)) {
        ancestor = ancestor.parentNode;
      }
      
      const commonAncestor = ancestor as HTMLElement || document.body;
      
      const walker = document.createTreeWalker(
        commonAncestor,
        NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: (node) => {
            const el = node as HTMLElement;
            if (el.id === 'feed2ai-overlay' || 
                el.id === 'feed2ai-toast' ||
                el.classList.contains('feed2ai-selected-overlay')) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );
      
      const elements: HTMLElement[] = [];
      let startIndex = -1;
      let endIndex = -1;
      let index = 0;
      
      let node: Node | null = walker.currentNode;
      // Performance: limit total elements scanned
      const MAX_SCAN = 10000;
      while (node && index < MAX_SCAN) {
        if (node === start) startIndex = index;
        if (node === end) endIndex = index;
        elements.push(node as HTMLElement);
        index++;
        node = walker.nextNode();
      }
      
      if (startIndex === -1 || endIndex === -1) {
        return [end];
      }
      
      const minIndex = Math.min(startIndex, endIndex);
      const maxIndex = Math.max(startIndex, endIndex);
      
      return elements.slice(minIndex, maxIndex + 1);
    }

    function updateSelectionToast() {
      if (selectedElements.size > 0) {
        showToast(`Selected: ${selectedElements.size} item(s) (Enter: copy, ⇧Enter: raw HTML, ESC: cancel)`, true, true);
      } else if (rangeStartAnchor) {
        showToast('Range start set. Shift+click to select range', true, true);
      } else {
        showToast('Click to select (⌘: toggle, ⇧: range)', true, true);
      }
    }

    function handleMouseOver(e: MouseEvent) {
      if (!isSelectionMode) return;
      const target = e.target as HTMLElement;
      if (target && target !== hoveredElement && 
          target.id !== 'feed2ai-overlay' && 
          target.id !== 'feed2ai-toast' &&
          !target.classList.contains('feed2ai-selected-overlay')) {
        hoveredElement = target;
        updateOverlay(target);
      }
    }

    function handleMouseOut() {
      if (!isSelectionMode) return;
      hoveredElement = null;
      hideOverlay();
    }

    async function handleClick(e: MouseEvent) {
      if (!isSelectionMode) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const target = e.target as HTMLElement;
      if (target.id === 'feed2ai-overlay' || 
          target.id === 'feed2ai-toast' ||
          target.classList.contains('feed2ai-selected-overlay')) return;

      const isCtrlCmd = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;

      if (isShift) {
        if (!rangeStartAnchor) {
          // Set start anchor
          rangeStartAnchor = target;
          rangeStartOverlay = createSelectedOverlay(target, '#FF9800');
          updateSelectionToast();
        } else {
          // Set end anchor and select range
          const elementsInRange = getElementsBetween(rangeStartAnchor, target);
          clearRangeAnchors();
          // Use async batch add to prevent UI freeze
          await addElementsToSelectionAsync(elementsInRange);
          updateSelectionToast();
        }
      } else if (isCtrlCmd) {
        // Cancel range start if exists
        if (rangeStartAnchor) {
          clearRangeAnchors();
        }
        // Toggle selection
        if (selectedElements.has(target)) {
          removeFromSelection(target);
        } else {
          addToSelection(target);
        }
        updateSelectionToast();
      } else {
        // Cancel range start if exists
        if (rangeStartAnchor) {
          clearRangeAnchors();
        }
        // Single select: immediate copy and exit
        exitSelectionMode();
        showToast('Processing...', true, true);
        try {
          const html = target.outerHTML;
          const cleanedContent = await parseContentAsync(html);
          
          if (cleanedContent) {
            await navigator.clipboard.writeText(cleanedContent);
            showToast('Content copied to clipboard!', true);
          } else {
            showToast('Failed to extract content', false);
          }
        } catch (error) {
          console.error('Feed2AI error:', error);
          showToast('Failed to copy content', false);
        }
      }
    }

    async function handleKeyDown(e: KeyboardEvent) {
      if (!isSelectionMode) return;
      
      if (e.key === 'Escape') {
        exitSelectionMode();
        showToast('Selection cancelled', false);
      } else if (e.key === 'Enter' && e.shiftKey && selectedElements.size > 0) {
        // Shift+Enter: Copy raw HTML
        e.preventDefault();
        
        const count = selectedElements.size;
        
        try {
          const sortedElements = Array.from(selectedElements).sort((a, b) => {
            const position = a.compareDocumentPosition(b);
            if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
            if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
            return 0;
          });
          
          const filteredElements = sortedElements.filter(el => {
            return !sortedElements.some(other => other !== el && other.contains(el));
          });
          
          const rawHtml = filteredElements.map(el => el.outerHTML).join('\n\n');
          
          exitSelectionMode();
          
          await navigator.clipboard.writeText(rawHtml);
          showToast(`${count} item(s) raw HTML copied!`, true);
        } catch (error) {
          console.error('Feed2AI error:', error);
          exitSelectionMode();
          showToast('Failed to copy raw HTML', false);
        }
      } else if (e.key === 'Enter' && !e.shiftKey && selectedElements.size > 0) {
        e.preventDefault();
        
        const count = selectedElements.size;
        showToast(`Processing ${count} item(s)...`, true, true);
        
        try {
          const sortedElements = Array.from(selectedElements).sort((a, b) => {
            const position = a.compareDocumentPosition(b);
            if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
            if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
            return 0;
          });
          
          // Filter out elements that are contained by other selected elements
          const filteredElements = sortedElements.filter(el => {
            return !sortedElements.some(other => other !== el && other.contains(el));
          });
          
          // Process elements in chunks to avoid blocking UI
          const contents: string[] = [];
          const chunkSize = 500;
          for (let i = 0; i < filteredElements.length; i += chunkSize) {
            const chunk = filteredElements.slice(i, i + chunkSize);
            const chunkResults = await Promise.all(
              chunk.map(el => parseContentAsync(el.outerHTML))
            );
            for (const content of chunkResults) {
              if (content) contents.push(content);
            }
            // Update progress
            const processed = Math.min(i + chunkSize, filteredElements.length);
            showToast(`Processing ${processed}/${filteredElements.length}...`, true, true);
            // Yield to main thread
            await new Promise(r => setTimeout(r, 0));
          }
          
          const mergedContent = contents.join('\n\n');
          
          exitSelectionMode();
          
          if (mergedContent) {
            await navigator.clipboard.writeText(mergedContent);
            showToast(`${count} item(s) copied to clipboard!`, true);
          } else {
            showToast('Failed to extract content', false);
          }
        } catch (error) {
          console.error('Feed2AI error:', error);
          exitSelectionMode();
          showToast('Failed to copy content', false);
        }
      }
    }

    // Initialize Turndown service with GFM support
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
    });
    
    // Helper function to convert a table element to markdown
    function tableToMarkdown(table: HTMLTableElement): string {
      const rows = Array.from(table.rows);
      if (rows.length === 0) return '';

      const markdownRows: string[] = [];

      rows.forEach((row, rowIndex) => {
        const cells = Array.from(row.cells);
        const cellTexts = cells.map(cell => {
          let text = (cell.textContent || '')
            .replace(/[\u200B-\u200D\uFEFF]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          return text.replace(/\|/g, '\\|');
        });

        markdownRows.push('| ' + cellTexts.join(' | ') + ' |');

        if (rowIndex === 0) {
          markdownRows.push('| ' + cells.map(() => '---').join(' | ') + ' |');
        }
      });

      return '\n\n' + markdownRows.join('\n') + '\n\n';
    }

    // Rule for container divs that wrap tables (e.g., Feishu docx-table-block)
    turndownService.addRule('table-container', {
      filter: (node) => {
        if (node.nodeName !== 'DIV') return false;
        // Only match Feishu table block containers specifically
        return node.classList?.contains('docx-table-block') ||
               node.classList?.contains('docx-table-inner-wrapper');
      },
      replacement: (_content, node) => {
        const element = node as HTMLElement;
        const table = element.querySelector('table');
        if (!table) return _content;
        return tableToMarkdown(table as HTMLTableElement);
      }
    });

    // Add table rule BEFORE gfm to handle tables without <th> (e.g., Feishu/Lark docs)
    // This must be added before gfm because gfm's keep() rule would otherwise preserve them as HTML
    turndownService.addRule('table-all', {
      filter: 'table',
      replacement: (_content, node) => {
        return tableToMarkdown(node as HTMLTableElement);
      }
    });
    
    // Use gfm for other features (strikethrough, task lists, etc.) but our table rule takes precedence
    turndownService.use(gfm);

    // Rule for Feishu/Lark docx-code-block
    turndownService.addRule('feishu-code-block', {
      filter: (node) => {
        return node.classList?.contains('docx-code-block') ||
               (node.classList?.contains('code-block') && 
                node.querySelector('.ace-line') !== null);
      },
      replacement: (_content, node) => {
        const element = node as HTMLElement;
        const lines: string[] = [];
        
        // Extract language from header if available
        const langBtn = element.querySelector('.code-block-header-btn span');
        const lang = langBtn?.textContent?.toLowerCase() || '';
        
        // Extract code lines from ace-line elements
        element.querySelectorAll('.ace-line').forEach(line => {
          const lineWrapper = line.querySelector('.code-line-wrapper');
          if (lineWrapper) {
            // Get text content, excluding fold controllers
            let text = '';
            lineWrapper.childNodes.forEach(child => {
              const el = child as Element;
              if (child.nodeType === Node.TEXT_NODE) {
                text += child.textContent || '';
              } else if (el.tagName === 'SPAN' && 
                         !el.classList?.contains('code-block-fold-controller--wrapper')) {
                text += el.textContent || '';
              }
            });
            // Remove zero-width spaces and trailing markers
            lines.push(text.replace(/[\u200B-\u200D\uFEFF]/g, ''));
          }
        });
        
        const code = lines.join('\n').trim();
        return code ? '\n```' + lang + '\n' + code + '\n```\n' : '';
      }
    });

    // Custom rule for CodeMirror code blocks
    turndownService.addRule('codemirror', {
      filter: (node) => {
        return node.classList?.contains('CodeMirror') || 
               node.classList?.contains('CodeMirror-code');
      },
      replacement: (_content, node) => {
        const element = node as HTMLElement;
        
        // Try to get original code from adjacent textarea (CodeMirror usually preserves it)
        const codeMirror = element.closest('.CodeMirror');
        const textarea = codeMirror?.parentElement?.querySelector('textarea');
        if (textarea && (textarea as HTMLTextAreaElement).value) {
          return '\n```\n' + (textarea as HTMLTextAreaElement).value.trim() + '\n```\n';
        }
        
        // Otherwise extract text from CodeMirror-line elements
        const lines: string[] = [];
        element.querySelectorAll('.CodeMirror-line').forEach(line => {
          lines.push(line.textContent || '');
        });
        
        const code = lines.join('\n').trim();
        return code ? '\n```\n' + code + '\n```\n' : '';
      }
    });

    // Remove line numbers from output
    turndownService.addRule('codemirror-linenumber', {
      filter: (node) => {
        return node.classList?.contains('CodeMirror-linenumber') ||
               node.classList?.contains('CodeMirror-gutter');
      },
      replacement: () => ''
    });

    // Throttled scroll handler for better performance
    const throttledUpdateOverlays = throttle(updateSelectedOverlays, 16); // ~60fps

    function enterSelectionMode() {
      if (isSelectionMode) return;
      isSelectionMode = true;
      
      if (!overlay) createOverlay();
      if (!toast) createToast();
      
      document.body.style.cursor = 'crosshair';
      
      document.addEventListener('mouseover', handleMouseOver, true);
      document.addEventListener('mouseout', handleMouseOut, true);
      document.addEventListener('click', handleClick, true);
      document.addEventListener('keydown', handleKeyDown, true);
      document.addEventListener('scroll', throttledUpdateOverlays, true);
      
      showToast('Click to select (⌘: toggle, ⇧: range)', true, true);
    }

    function exitSelectionMode() {
      if (!isSelectionMode) return;
      isSelectionMode = false;
      
      document.body.style.cursor = '';
      hideOverlay();
      clearSelectedElements();
      
      document.removeEventListener('mouseover', handleMouseOver, true);
      document.removeEventListener('mouseout', handleMouseOut, true);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('scroll', throttledUpdateOverlays, true);
      
    }

    browser.runtime.onMessage.addListener((message) => {
      if (message.action === 'startSelection') {
        enterSelectionMode();
        return Promise.resolve({ success: true });
      }
      if (message.action === 'stopSelection') {
        exitSelectionMode();
        return Promise.resolve({ success: true });
      }
    });
});
