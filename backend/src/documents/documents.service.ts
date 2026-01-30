import { Injectable, BadRequestException } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mammoth = require('mammoth') as {
  convertToHtml: (input: { buffer: Buffer }, options?: object) => Promise<{ value: string; messages: { type: string; message: string }[] }>;
};

@Injectable()
export class DocumentsService {
  async parseDocx(buffer: Buffer): Promise<{ html: string; messages: string[] }> {
    try {
      const result = await mammoth.convertToHtml(
        { buffer },
        {
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
          ],
        },
      );
      const messages = (result.messages || []).map((m) => `${m.type}: ${m.message}`);
      return { html: result.value, messages };
    } catch (e) {
      throw new BadRequestException('Invalid or corrupted Word document');
    }
  }
}
