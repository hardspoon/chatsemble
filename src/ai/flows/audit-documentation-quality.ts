'use server';
/**
 * @fileOverview A documentation quality auditing AI agent.
 *
 * - auditDocumentationQuality - A function that handles the documentation auditing process.
 * - AuditDocumentationQualityInput - The input type for the auditDocumentationQuality function.
 * - AuditDocumentationQualityOutput - The return type for the auditDocumentationQuality function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {lintDocument, LintingError} from '@/services/style-linter';

const AuditDocumentationQualityInputSchema = z.object({
  documentContent: z.string().describe('The content of the document to audit.'),
  repoName: z.string().describe('The name of the repository the document belongs to.'),
  filePath: z.string().describe('The path to the document within the repository.'),
});
export type AuditDocumentationQualityInput = z.infer<typeof AuditDocumentationQualityInputSchema>;

const AuditDocumentationQualityOutputSchema = z.object({
  findings: z.array(
    z.object({
      type: z.string().describe('The type of finding (e.g., unclear section, broken link, missing example).'),
      description: z.string().describe('A detailed description of the finding.'),
      location: z.string().optional().describe('The location of the finding within the document (e.g., line number, section heading).'),
      suggestion: z.string().optional().describe('A suggestion for how to fix the finding.'),
    })
  ).describe('A list of findings related to the quality of the documentation.'),
});
export type AuditDocumentationQualityOutput = z.infer<typeof AuditDocumentationQualityOutputSchema>;

export async function auditDocumentationQuality(input: AuditDocumentationQualityInput): Promise<AuditDocumentationQualityOutput> {
  return auditDocumentationQualityFlow(input);
}

const auditDocumentationPrompt = ai.definePrompt({
  name: 'auditDocumentationPrompt',
  input: {
    schema: z.object({
      documentContent: z.string().describe('The content of the document to audit.'),
      repoName: z.string().describe('The name of the repository the document belongs to.'),
      filePath: z.string().describe('The path to the document within the repository.'),
      lintingErrors: z.array(
        z.object({
          lineNumber: z.number(),
          message: z.string(),
          severity: z.string(),
        })
      ).optional().describe('Linting errors found in the document.'),
    }),
  },
  output: {
    schema: AuditDocumentationQualityOutputSchema,
  },
  prompt: `You are a documentation quality auditor. Your job is to review the provided document content and identify any issues that could impact its quality, clarity, or usefulness. Consider things like unclear sections, broken links, missing examples, and overall readability. Also take into account any linting errors that may have been found.

Document Content:
{{documentContent}}

Repository Name: {{repoName}}
File Path: {{filePath}}

{{#if lintingErrors}}
Linting Errors:
{{#each lintingErrors}}
- Line {{this.lineNumber}}: {{this.message}} (Severity: {{this.severity}})
{{/each}}
{{/if}}

Based on your review, please provide a list of findings, including a description of each issue and a suggestion for how to fix it. If a finding is related to a specific location in the document, please include that information as well.

Output should be a JSON array.
`,
});

const auditDocumentationQualityFlow = ai.defineFlow<
  typeof AuditDocumentationQualityInputSchema,
  typeof AuditDocumentationQualityOutputSchema
>(
  {
    name: 'auditDocumentationQualityFlow',
    inputSchema: AuditDocumentationQualityInputSchema,
    outputSchema: AuditDocumentationQualityOutputSchema,
  },
  async input => {
    const lintingErrors: LintingError[] = await lintDocument(input.documentContent);

    const {output} = await auditDocumentationPrompt({
      ...input,
      lintingErrors,
    });
    return output!;
  }
);
