import { ExportMenu } from "cmd500-design-system";
import { fullDeck } from "./_fixtures";

export function Default() {
  return <ExportMenu cards={fullDeck} />;
}
