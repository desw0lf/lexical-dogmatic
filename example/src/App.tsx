import { LexicalRichEditor } from "lexical-dogmatic";
import "lexical-dogmatic/css/main.css";

export function App() {
  return (
    <div style={{ height: "50%", width: "80%", margin: "48px auto" }}>
      <LexicalRichEditor type="editable" />
    </div>
  )
}