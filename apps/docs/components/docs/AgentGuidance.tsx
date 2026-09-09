import {
  REPOSITORY_FILES,
  SOURCE_OF_TRUTH_ORDER,
  SOURCE_OF_TRUTH_RULE,
  STOP_CONDITIONS,
  STOP_RULE,
} from "@/lib/agent-guidance";
import { repositoryFileUrl } from "@/lib/shared";

interface AgentGuidanceProps {
  section: "source-of-truth" | "stop-conditions" | "repository-files";
}

/**
 * The agent guidance lists, rendered from the same constants `/llms.txt`
 * prints, so the page and the entry point cannot disagree. The Markdown form
 * for `/llms-full.txt` is in `lib/llm-markdown.ts`.
 */
export function AgentGuidance({ section }: AgentGuidanceProps) {
  switch (section) {
    case "source-of-truth":
      return (
        <>
          <ol>
            {SOURCE_OF_TRUTH_ORDER.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <p>{SOURCE_OF_TRUTH_RULE}</p>
        </>
      );
    case "stop-conditions":
      return (
        <>
          <ul>
            {STOP_CONDITIONS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>{STOP_RULE}</p>
        </>
      );
    case "repository-files":
      return (
        <table>
          <thead>
            <tr>
              <th>Path</th>
              <th>Holds</th>
            </tr>
          </thead>
          <tbody>
            {REPOSITORY_FILES.map((file) => (
              <tr key={file.path}>
                <td>
                  <a href={repositoryFileUrl(file.path)}>
                    <code>{file.path}</code>
                  </a>
                </td>
                <td>{file.holds}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
  }
}
