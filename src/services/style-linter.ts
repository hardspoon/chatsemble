/**
 * Represents a linting error.
 */
export interface LintingError {
  /**
   * The line number where the error occurred.
   */
  lineNumber: number;
  /**
   * The error message.
   */
  message: string;
  /**
   * The severity of the error (e.g., warning, error).
   */
  severity: string;
}

/**
 * Asynchronously lints a document for style issues.
 *
 * @param documentContent The content of the document to lint.
 * @returns A promise that resolves to an array of LintingError objects.
 */
export async function lintDocument(documentContent: string): Promise<LintingError[]> {
  // TODO: Implement this by calling an API.

  return [
    {
      lineNumber: 5,
      message: 'Consider using a more descriptive heading.',
      severity: 'warning'
    }
  ];
}
