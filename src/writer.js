const PDFLib = require("pdf-lib");

const isFunction = require( "lodash/isFunction" );
const last = require( "lodash/last" );
const sortBy = require( "lodash/sortBy" );
const PDFXRefTableFactory  = require( "pdf-lib/lib/core/pdf-structures/factories/PDFXRefTableFactory" ).default;

const createIndirectObjectsFromIndex = ({ index }) => {
  let catalogRef;

  const streamObjects = [];
  const nonStreamObjects = [];

  index.forEach((object, ref) => {
    if (object instanceof PDFLib.PDFCatalog) catalogRef = ref;
    const array =
      object instanceof PDFLib.PDFStream ? streamObjects : nonStreamObjects;
    array.push(PDFLib.PDFIndirectObject.of(object).setReference(ref));
  });

  return { catalogRef, streamObjects, nonStreamObjects };
};

const computeOffsets = (
  startingOffset,
  indirectObjects,
) =>
  indirectObjects.map((object) => ({
    objectNumber: object.reference.objectNumber,
    generationNumber: object.reference.generationNumber,
    startOffset: startingOffset,
    endOffset: startingOffset += object.bytesSize(),
  }));


class PDFDocumentWriter extends PDFLib.PDFDocumentWriter {
  constructor() {
    super();
  }

  saveToBytesWithXRefTable(pdfDoc) {
    const {
      catalogRef,
      streamObjects,
      nonStreamObjects,
    } = createIndirectObjectsFromIndex(pdfDoc.index);

    if (!catalogRef) console.error("Missing PDFCatalog");
    streamObjects.forEach((streamObj) => {
      if (isFunction(streamObj.pdfObject.encode)) streamObj.pdfObject.encode();
    });

    const merged = [...streamObjects, ...nonStreamObjects];

    const offsets = computeOffsets(pdfDoc.header.bytesSize(), merged);
    const sortedOffsets = sortBy(offsets, "objectNumber");

    /* ===== (2) Create XRefTable and Trailer ===== */
    const table = PDFXRefTableFactory.forOffsets(sortedOffsets);
    const tableOffset = last(offsets).endOffset;
    const trailer = PDFLib.PDFTrailer.from(
      tableOffset,
      PDFLib.PDFDictionary.from(
        {
          Size: PDFLib.PDFNumber.fromNumber(last(sortedOffsets).objectNumber + 1),
          Root: catalogRef,
          Info: PDFLib.PDFIndirectReference.forNumbers(1, 0), // TODO: this is specific to Skia
        },
        pdfDoc.index,
      ),
    );

    /* ===== (3) Create buffer and copy objects into it ===== */
    const bufferSize = tableOffset + table.bytesSize() + trailer.bytesSize();
    const buffer = new Uint8Array(bufferSize);

    /* eslint-disable no-unused-vars */
    // TODO: how is remaining used?
    let remaining = pdfDoc.header.copyBytesInto(buffer);
    remaining = merged.reduce(
      (remBytes, indirectObj) => indirectObj.copyBytesInto(remBytes),
      remaining,
    );
    remaining = table.copyBytesInto(remaining);
    remaining = trailer.copyBytesInto(remaining);
    /* eslint-enable no-unused-vars */

    return buffer;
  }
}

module.exports = PDFDocumentWriter;
