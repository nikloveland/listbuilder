import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'components/common/Button';
import html2pdf from 'html2pdf.js';
import { jsPDF } from 'jspdf';

export const ExportModal = ({ exportElement, pdfTitle, onHide, ...otherProps }) => {

  const [pageSize, setPageSize] = useState(localStorage.pageSize || 'a4');
  const [verticalMargin, setVerticalMargin] = useState((localStorage.verticalMargin && Number(localStorage.verticalMargin)) || 0.5);
  const [horizontalMargin, setHorizontalMargin] = useState((localStorage.horizontalMargin && Number(localStorage.horizontalMargin)) || 0.5);
  const [fileName, setFileName] = useState(pdfTitle);

  // html2pdf's "css" pagebreak mode is a single pass that reads each element's
  // viewport-relative position, then inserts a computed padding div. That math is
  // imprecise, so units can be split across pages and large white gaps appear.
  //
  // Instead we paginate ourselves:
  //   1. Clone the list's displayable blocks (faction headings + each unit, plus
  //      banners) into a temporary, fixed-width container whose width is exactly
  //      html2pdf's render width (page inner width).
  //   2. Greedily pack the blocks into page divs, each div exactly pxPageHeight
  //      tall (html2pdf's own canvas slice height).
  //   3. Because the page divs are contiguous and each is exactly one slice tall,
  //      html2pdf's canvas slicing lands exactly on the div boundaries -> no
  //      mid-unit splits, no oversized white gaps. We run html2pdf with pagebreak
  //      mode "none" so it doesn't add its own pads on top.
  const buildPaginatedElement = () => {
    const jsPdfOpt = { unit: 'in', format: pageSize, orientation: 'portrait' };
    const pageSizeObj = jsPDF.getPageSize(jsPdfOpt);
    const innerWidthIn = pageSizeObj.width - horizontalMargin * 2;
    const innerHeightIn = pageSizeObj.height - verticalMargin * 2;
    const innerRatio = innerHeightIn / innerWidthIn;
    const innerWidthPx = innerWidthIn * 96; // canvas.width == container width == inner width (px)
    const pxPageHeight = Math.floor(innerWidthPx * innerRatio); // == html2pdf's canvas slice height

    const containerEl = document.createElement('div');
    // Keep this in normal document flow (relative, not fixed): html2pdf clones it
    // into its own container, and a fixed-position root would collapse to zero
    // height there. We only need it measurable, so it can sit in-flow off to the side.
    containerEl.style.cssText = `position:relative; width:${innerWidthPx}px; background:#fff;`;
    document.body.appendChild(containerEl);

    // Flatten the list into atomic, displayable blocks. The units are nested inside
    // a per-faction wrapper div, so expand that wrapper into its heading + units.
    // Skip the "Export as PDF" action bar and anything html2canvas is told to ignore.
    const isIgnored = (el) => el.hasAttribute('data-html2canvas-ignore');
    const items = [];
    Array.from(exportElement.children).forEach((child) => {
      if (isIgnored(child)) return;
      if (child.classList.contains('army-list__export')) return; // in-list action bar
      if (child.querySelector('.army-list__header') || child.querySelector('.unit-row')) {
        Array.from(child.children).forEach((sub) => {
          if (isIgnored(sub)) return;
          items.push(sub.cloneNode(true));
        });
      } else {
        items.push(child.cloneNode(true)); // banners / other single blocks
      }
    });

    // Greedy pack into fixed-height page divs, measuring the real rendered bottom
    // of the last block after each insertion so margin/whitespace is exact.
    let current = document.createElement('div');
    current.style.cssText = `height:${pxPageHeight}px; overflow:hidden;`;
    containerEl.appendChild(current);
    items.forEach((item) => {
      current.appendChild(item);
      const itemBottom = item.getBoundingClientRect().bottom - current.getBoundingClientRect().top;
      if (itemBottom > pxPageHeight && current.children.length > 1) {
        // 'item' overflowed this page -> start a fresh page for it.
        current.removeChild(item);
        const fresh = document.createElement('div');
        fresh.style.cssText = `height:${pxPageHeight}px; overflow:hidden;`;
        containerEl.appendChild(fresh);
        fresh.appendChild(item);
        current = fresh;
      }
    });
    return containerEl;
  };

  const exportPdf = async () => {
    localStorage.pageSize = pageSize;
    localStorage.verticalMargin = verticalMargin;
    localStorage.horizontalMargin = horizontalMargin;
    const paginated = buildPaginatedElement();
    try {
      await html2pdf().set({
        pagebreak: { mode: 'none' },
        margin: [verticalMargin, horizontalMargin],
        filename: `${fileName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {},
        jsPDF: { unit: 'in', format: pageSize, orientation: 'portrait' }
      }).from(paginated).save();
    } finally {
      if (paginated && paginated.parentNode) paginated.parentNode.removeChild(paginated);
    }
    onHide();
  }

  return (
    <Modal
      {...otherProps}
      onHide={() => onHide()}
      size="lg"
      aria-labelledby="contained-modal-title-vcenter"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title id="contained-modal-title-vcenter">
          Export as pdf
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group controlId="exportPdfForm.fileName">
            <Form.Label>Filename</Form.Label>
            <Form.Control type="text" value={fileName} onChange={({ target: { value } }) => setFileName(value)}/>
          </Form.Group>
          <Form.Group controlId="exportPdfForm.pageSize">
            <Form.Label>Page size</Form.Label>
            <Form.Control value={pageSize} onChange={({ target: { value } }) => setPageSize(value)} as="select" custom>
              <option value="a4">A4</option>
              <option value="letter">Letter</option>
            </Form.Control>
          </Form.Group>
          <Form.Group controlId="exportPdfForm.verticalMargin">
            <Form.Label>Vertical Margin</Form.Label>
            <Form.Control value={verticalMargin} onChange={({ target: { value } }) => setVerticalMargin(Number(value))} as="select" custom>
              <option value="0.25">0.25"</option>
              <option value="0.5">0.5"</option>
              <option value="1">1"</option>
            </Form.Control>
          </Form.Group>
          <Form.Group controlId="exportPdfForm.horizontalMargin">
            <Form.Label>Horizontal Margin</Form.Label>
            <Form.Control value={horizontalMargin} onChange={({ target: { value } }) => setHorizontalMargin(Number(value))} as="select" custom>
              <option value="0.25">0.25"</option>
              <option value="0.5">0.5"</option>
              <option value="1">1"</option>
            </Form.Control>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button text="Export" onClick={exportPdf}/>
      </Modal.Footer>
    </Modal>
  );
}
