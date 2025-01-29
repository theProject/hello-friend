import pdf from 'pdf-parse';

export async function parseDocument(file: File) {
  try {
    let content = '';
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    switch (file.type) {
      case 'application/pdf':
        const pdfData = await pdf(buffer);
        content = pdfData.text;
        break;
      case 'text/plain':
        content = buffer.toString('utf-8');
        break;
      default:
        content = `Unsupported file type: ${file.type}`;
    }

    return content;
  } catch (error) {
    console.error('Error parsing document:', error);
    throw error;
  }
}