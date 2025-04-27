'use server';
/**
 * @fileOverview An AI agent that suggests documentation improvements or updates based on the code.
 *
 * - generateDocumentationSuggestions - A function that handles the generation of documentation suggestions.
 * - GenerateDocumentationSuggestionsInput - The input type for the generateDocumentationSuggestions function.
 * - GenerateDocumentationSuggestionsOutput - The return type for the generateDocumentationSuggestions function.
 */

import {ai} from '@/ai/ai-instance';
import {getGitChanges} from '@/services/git';
import {lintDocument} from '@/services/style-linter';
import {z} from 'genkit';

const GenerateDocumentationSuggestionsInputSchema = z.object({
  filePath: z.string().describe('The path to the file being documented.'),
  codeContent: z.string().describe('The content of the code file.'),
  commitHash: z.string().optional().describe('The hash of the Git commit, if available.'),
});
export type GenerateDocumentationSuggestionsInput = z.infer<
  typeof GenerateDocumentationSuggestionsInputSchema
>;

const GenerateDocumentationSuggestionsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('An array of documentation suggestions.'),
});
export type GenerateDocumentationSuggestionsOutput = z.infer<
  typeof GenerateDocumentationSuggestionsOutputSchema
>;

export async function generateDocumentationSuggestions(
  input: GenerateDocumentationSuggestionsInput
): Promise<GenerateDocumentationSuggestionsOutput> {
  return generateDocumentationSuggestionsFlow(input);
}

const documentationSuggestionsPrompt = ai.definePrompt({
  name: 'documentationSuggestionsPrompt',
  input: {
    schema: z.object({
      filePath: z.string().describe('The path to the file being documented.'),
      codeContent: z.string().describe('The content of the code file.'),
      gitChanges: z
        .array(
          z.object({
            filePath: z.string(),
            changeType: z.string(),
            diff: z.string(),
          })
        )
        .optional()
        .describe('The changes from the git commit, if available'),
      lintingErrors:
        z
          .array(
            z.object({
              lineNumber: z.number(),
              message: z.string(),
              severity: z.string(),
            })
          )
          .optional()
          .describe('The linting errors in the document, if available'),
    }),
  },
  output: {
    schema: z.object({
      suggestions: z
        .array(z.string())
        .describe('An array of documentation suggestions.'),
    }),
  },
  prompt: `You are a documentation expert. Review the provided code and git changes and suggest improvements to the documentation.

      File Path: {{{filePath}}}
      Code Content: {{{codeContent}}}
      {{#if gitChanges}}
      Git Changes:
      {{#each gitChanges}}
        File Path: {{{filePath}}}
        Change Type: {{{changeType}}}
        Diff: {{{diff}}}
      {{/each}}
      {{/if}}
      {{#if lintingErrors}}
      Linting Errors:
      {{#each lintingErrors}}
        Line Number: {{{lineNumber}}}
        Message: {{{message}}}
        Severity: {{{severity}}}
      {{/each}}
      {{/if}}

      Provide a list of suggestions for improving the documentation. Focus on accuracy, completeness, and relevance.
      Return the suggestions as an array of strings.
      `,
});

const generateDocumentationSuggestionsFlow = ai.defineFlow<
  typeof GenerateDocumentationSuggestionsInputSchema,
  typeof GenerateDocumentationSuggestionsOutputSchema
>(
  {
    name: 'generateDocumentationSuggestionsFlow',
    inputSchema: GenerateDocumentationSuggestionsInputSchema,
    outputSchema: GenerateDocumentationSuggestionsOutputSchema,
  },
  async input => {
    const gitChanges = input.commitHash
      ? await getGitChanges(input.commitHash)
      : undefined;
    const lintingErrors = await lintDocument(input.codeContent);

    const {output} = await documentationSuggestionsPrompt({
      ...input,
      gitChanges,
      lintingErrors,
    });
    return output!;
  }
);
