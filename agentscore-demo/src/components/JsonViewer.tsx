import CodeBlock from "./CodeBlock";

interface JsonViewerProps {
  value: unknown;
  testId?: string;
}

// Simplified relative to production's collapsible/searchable JsonViewer:
// a pretty-printed, copyable block is enough fidelity for a mock output
// contract or payload.
export default function JsonViewer({ value, testId }: JsonViewerProps) {
  return <CodeBlock testId={testId}>{JSON.stringify(value, null, 2)}</CodeBlock>;
}
