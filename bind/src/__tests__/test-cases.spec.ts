import { fetchTestCases } from "./index";
import { readDirectory } from "../utils/fs";
import { bindSchema, OutputEntry, TargetLanguage } from "../";

describe("Web3API Binding Test Suite", () => {
  const cases = fetchTestCases();

  for (const test of cases) {
    describe(`Case: ${test.name}`, () => {
      // For each language
      for (const outputLanguage of test.outputLanguages) {
        // Verify it binds correctly
        it(`Binds: ${outputLanguage.name}`, () => {
          const { name, directory } = outputLanguage;
          const expectedOutput = readDirectory(directory);
          const output = bindSchema(name as TargetLanguage, test.inputSchema);

          const alphabetical = (a, b) => {
            if (a.name < b.name) {
              return -1;
            }
            if (a.name > b.name) {
              return 1;
            }
            return 0;
          };

          const sort = (array: OutputEntry[]): OutputEntry[] => {
            array.forEach((entry) => {
              if (typeof entry.data !== "string") entry.data = sort(entry.data);
            });

            return array.sort(alphabetical);
          };

          output.entries = sort(output.entries);

          expect(output).toMatchObject(expectedOutput);
        });
      }
    });
  }
});
