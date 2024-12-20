import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph } from 'docx';

export const convertToDocx = async (content: string): Promise<Blob> => {
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    text: content
                }),
            ],
        }],
    });

    return await Packer.toBlob(doc);
};

export const convertToPdf = (content: string): Blob => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxWidth = pageWidth - (margin * 2);
    const lineHeight = 7;
    let cursorY = margin;

    // Split text into lines that fit the page width
    const lines = doc.setFontSize(12).splitTextToSize(content, maxWidth);

    // Add lines to pages
    lines.forEach((line: any) => {
        if (cursorY > pageHeight - margin) {
            doc.addPage();
            cursorY = margin;
        }
        doc.text(line, margin, cursorY);
        cursorY += lineHeight;
    });

    return doc.output('blob');
};

export const convertToSrt = (content: string, timestamps: string[]): string => {
    // Assuming timestamps array contains pairs of start and end times
    return timestamps.reduce((srt, timestamp, index) => {
        if (index % 2 === 0 && timestamps[index + 1]) {
            const startTime = timestamp;
            const endTime = timestamps[index + 1];
            const text = content.substring(
                content.indexOf(startTime) + startTime.length,
                content.indexOf(endTime)
            ).trim();

            return srt + `${(index / 2) + 1}\n${startTime} --> ${endTime}\n${text}\n\n`;
        }
        return srt;
    }, '');
};
