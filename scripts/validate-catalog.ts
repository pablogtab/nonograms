import { catalog } from "../src/catalog";
import { countSolutions } from "./solver";
let failed = false;
for (const p of catalog) {
  const result = countSolutions(p);
  console.log(
    `${p.width}×${p.height} ${p.title}: ${result.count} solution(s), ${result.nodes} search node(s)`,
  );
  if (result.count !== 1) failed = true;
}
if (failed) throw new Error("Catalog contains ambiguous or invalid puzzles");
