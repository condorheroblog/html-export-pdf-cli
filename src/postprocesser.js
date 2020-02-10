const PDFLib = require("pdf-lib");
const EventEmitter = require("events");

const PDFDocumentWriter = require("./writer");

class PostProcesser extends EventEmitter {
  constructor(pdf) {
    super();

    if (!pdf) {
      throw "Must pass a PDF Buffer to PostProcesser";
    }
    this.pdf = pdf;
    this.pdfDoc = PDFLib.PDFDocumentFactory.load(pdf);
  }

  metadata(meta) {
    if (meta.keywords && typeof meta.keywords === "string") {
      meta.keywords = meta.keywords.split(",");
    }

    if (!meta.keywords) {
      meta.keywords = [];
    }

    // Overwrite Dates
    if (!(meta.creationDate instanceof Date)) {
      meta.creationDate = new Date();
    }
    meta.modDate = new Date();
    meta.metadataDate = new Date();

    // Get the existing Info
    let info = this.getInfoDict();
    if (!meta.creator) {
      meta.creator = info.creator + " + Paged.js";
    }

    if (!meta.producer) {
      meta.producer = info.producer;
    }

    // Add meta
    this.addXmpMetadata(meta);
    this.updateInfoDict(meta);
  }

  getInfoDict(){
    // Info Reference in Skia pdfs is always 1st
    let ref = PDFLib.PDFIndirectReference.forNumbers(1, 0);
    let info = this.pdfDoc.index.lookup(ref);
    return {
      title: info.getMaybe("Title") && info.getMaybe("Title").string,
      subject: info.getMaybe("Subject") && info.getMaybe("Subject").string,
      keywords: info.getMaybe("Keywords") && info.getMaybe("Keywords").string,
      author: info.getMaybe("Author") && info.getMaybe("Author").string,
      creationDate: info.getMaybe("CreationDate") && info.getMaybe("CreationDate").string,
      modDate: info.getMaybe("ModDate") && info.getMaybe("ModDate").string,
      creator: info.getMaybe("Creator") && info.getMaybe("Creator").string,
      producer: info.getMaybe("Producer") && info.getMaybe("Producer").string
    };
  }

  updateInfoDict(meta) {
    // Info Reference in Skia pdfs is always 1st
    let ref = PDFLib.PDFIndirectReference.forNumbers(1, 0);
    let info = this.pdfDoc.index.lookup(ref);

    if (meta.title) {
      info.set("Title", PDFLib.PDFString.fromString(meta.title));
    }

    if (meta.subject) {
      info.set("Subject", PDFLib.PDFString.fromString(meta.subject));
    }

    if (meta.keywords && meta.keywords.length) {
      info.set("Keywords", PDFLib.PDFString.fromString(meta.keywords.join(", ")));
    }

    if (meta.author) {
      info.set("Author", PDFLib.PDFString.fromString(meta.author));
    }

    if (meta.creationDate) {
      info.set("CreationDate", PDFLib.PDFString.fromString(meta.creationDate.toISOString()));
    }

    if (meta.modDate) {
      info.set("ModDate", PDFLib.PDFString.fromString(meta.modDate.toISOString()));
    }

    if (meta.creator) {
      info.set("Creator", PDFLib.PDFString.fromString(meta.creator));
    }

    if (meta.producer) {
      info.set("Producer", PDFLib.PDFString.fromString(meta.producer));
    }
  }

  addXmpMetadata(meta) {
    const charCodes = (str) => str.split("").map((c) => c.charCodeAt(0));
    const typedArrayFor = (str) => new Uint8Array(charCodes(str));
    const whitespacePadding = new Array(20).fill(" ".repeat(100)).join("\n");
    const metadataXML = `
      <?xpacket begin="" id="W5M0MpCehiHzreSzNTczkc9d"?>
        <x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="Adobe XMP Core 5.2-c001 63.139439, 2010/09/27-13:37:26">
          <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">

            <rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/">
              <dc:format>application/pdf</dc:format>
              <dc:creator>
                <rdf:Seq>
                  <rdf:li>${meta.author}</rdf:li>
                </rdf:Seq>
              </dc:creator>
              <dc:title>
                 <rdf:Alt>
                    <rdf:li xml:lang="x-default">${meta.title}</rdf:li>
                 </rdf:Alt>
              </dc:title>
              <dc:subject>
                <rdf:Bag>
                  ${meta.keywords
                    .map((keyword) => `<rdf:li>${keyword}</rdf:li>`)
                    .join("\n")}
                </rdf:Bag>
              </dc:subject>
            </rdf:Description>

            <rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/">
              <xmp:CreatorTool>${meta.creatorTool}</xmp:CreatorTool>
              <xmp:CreateDate>${meta.creationDate.toISOString()}</xmp:CreateDate>
              <xmp:ModifyDate>${meta.modDate.toISOString()}</xmp:ModifyDate>
              <xmp:MetadataDate>${meta.metadataDate.toISOString()}</xmp:MetadataDate>
            </rdf:Description>

            <rdf:Description rdf:about="" xmlns:pdf="http://ns.adobe.com/pdf/1.3/">
              <pdf:Subject>${meta.subject}</pdf:Subject>
              <pdf:Producer>${meta.producer}</pdf:Producer>
            </rdf:Description>

          </rdf:RDF>
        </x:xmpmeta>
        ${whitespacePadding}
      <?xpacket end="w"?>
    `.trim();

    const metadataStreamDict = PDFLib.PDFDictionary.from(
      {
        Type: PDFLib.PDFName.from("Metadata"),
        Subtype: PDFLib.PDFName.from("XML"),
        Length: PDFLib.PDFNumber.fromNumber(metadataXML.length),
      },
      this.pdfDoc.index,
    );

    const metadataStream = PDFLib.PDFRawStream.from(
      metadataStreamDict,
      typedArrayFor(metadataXML),
    );

    const metadataStreamRef = this.pdfDoc.register(metadataStream);

    this.pdfDoc.catalog.set("Metadata", metadataStreamRef);
  }

  boxes(pages) {
    const pdfPages = this.pdfDoc.getPages();

    pdfPages.forEach((pdfPage, index) => {
      const page = pages[index];

      if (!page) {
        return; // page was not rendered
      }

      let { boxes } = page;

      if (Object.is(boxes.media, boxes.crop)) {
        return; // No bleed set
      }

      const rectangle = PDFLib.PDFArray.fromArray(
          [
            PDFLib.PDFNumber.fromNumber(boxes.crop.x),
            PDFLib.PDFNumber.fromNumber(boxes.crop.y),
            PDFLib.PDFNumber.fromNumber(boxes.crop.width + boxes.crop.x),
            PDFLib.PDFNumber.fromNumber(boxes.crop.height + boxes.crop.y),
          ],
          pdfPage.index,
        );

        pdfPage.set("TrimBox", rectangle);
    });

  }

  updatePageBoxes(page) {
    console.log(page);
  }

  /**
   * Adds a table of content to the generated PDF
   *
   * Ideally this would not be required if Chromium would add this directly.
   * So if these bugs are closed this can probably be removed again:
   * - https://bugs.chromium.org/p/chromium/issues/detail?id=840455
   * - https://github.com/GoogleChrome/puppeteer/issues/1778
   *
   * This code is heavily based on @Hopding's comment at:
   * https://github.com/Hopding/pdf-lib/issues/127#issuecomment-502450179
   */
  addOutline(outlineSpec) {
    const outline = JSON.parse(JSON.stringify(outlineSpec));


    const pageRefs = [];
    this.pdfDoc.catalog.Pages.traverse((kid, ref) => {
      if (kid instanceof PDFLib.PDFPage)
        pageRefs.push(ref);
    });
    const index = this.pdfDoc.index;

    const outlineReference = index.nextObjectNumber();

    const countOutlineLayer = (layer) => {
      let count = 0;
      for (const outlineEntry of layer) {
        ++count;
        count += countOutlineLayer(outlineEntry.children);
      }
      return count;
    };

    const createItemsForOutlineLayer = (layer, parent) => {
      layer.forEach((outlineItem, i) => {
        let prev = i > 0 ? layer[i - 1].ref : null;
        let next = i < layer.length - 1 ? layer[i + 1].ref : null;
        const pdfItem = createOutlineItem(outlineItem, prev, next, parent);
        index.assign(outlineItem.ref, pdfItem);
      });
    };

    const createOutlineItem = (outlineItem, prev, next, parent) => {
      if (!outlineItem.id) {
        throw new Error(`Cannot generate outline item with title '${outlineItem.title} ` +
                        "without any target anchor. Please specify an 'id' attribute for " +
                        "the relevant HTML element");
      }
      const item = {
        Title: PDFLib.PDFString.fromString(outlineItem.title),
        Parent: parent,
        Dest: PDFLib.PDFName.from(outlineItem.id),
      };
      if (prev) {
        item.Prev = prev;
      }
      if (next) {
        item.Next = next;
      }
      if (outlineItem.children.length > 0) {
        item.First = outlineItem.children[0].ref;
        item.Last = outlineItem.children[outlineItem.children.length - 1].ref;
        item.Count = PDFLib.PDFNumber.fromNumber(countOutlineLayer(outlineItem.children));
        createItemsForOutlineLayer(outlineItem.children, outlineItem.ref);
      }

      return PDFLib.PDFDictionary.from(item, index);
    };

    const createOutlineReferences = (outlineEntry) => {
      outlineEntry.ref = index.nextObjectNumber();
      for (const child of outlineEntry.children) {
        createOutlineReferences(child);
      }
    };

    for (const outlineItem of outline) {
      createOutlineReferences(outlineItem);
    }

    createItemsForOutlineLayer(outline, outlineReference);

    const pdfOutline = PDFLib.PDFDictionary.from(
      {
        First: outline[0].ref,
        Last: outline[outline.length - 1].ref,
        Count: PDFLib.PDFNumber.fromNumber(countOutlineLayer(outline)),
      },
      index,
    );
    index.assign(outlineReference, pdfOutline);
    this.pdfDoc.catalog.set("Outlines", outlineReference);
  }

  save() {
    let writer = new PDFDocumentWriter();
    const pdfBytes = writer.saveToBytesWithXRefTable(this.pdfDoc);
    this.pdf = pdfBytes;
    return this.pdf;
  }
}

module.exports = PostProcesser;
