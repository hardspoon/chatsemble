/**
 * Represents a change in a Git repository.
 */
export interface GitChange {
  /**
   * The file path that was changed.
   */
  filePath: string;
  /**
   * The type of change (e.g., added, modified, deleted).
   */
  changeType: string;
  /**
   * The diff between the old and new versions of the file.
   */
  diff: string;
}

/**
 * Asynchronously retrieves the changes from a Git commit.
 *
 * @param commitHash The hash of the Git commit to inspect.
 * @returns A promise that resolves to an array of GitChange objects.
 */
export async function getGitChanges(commitHash: string): Promise<GitChange[]> {
  // TODO: Implement this by calling an API.

  return [
    {
      filePath: 'src/index.ts',
      changeType: 'modified',
      diff: '--- a/src/index.ts\n+++ b/src/index.ts\n@@ -1,1 +1,1 @@\n-console.log("Hello, world!");\n+console.log("Hello, DocuMind!");\n'
    }
  ];
}
