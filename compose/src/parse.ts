import { ExternalImport, LocalImport, SYNTAX_REFERENCE } from "./types";
import { getDuplicates } from "./utils";

import Path from "path";

export function parseExternalImports(
  imports: RegExpMatchArray[],
  mutation: boolean
): ExternalImport[] {
  const externalImports: ExternalImport[] = [];

  for (const importStatement of imports) {
    if (importStatement.length !== 4) {
      throw Error(
        `Invalid external import statement found:\n${importStatement[0]}\n` +
          `Please use the following syntax...\n${SYNTAX_REFERENCE}`
      );
    }

    const importedTypes = importStatement[1]
      .split(",")
      .map((str) => str.replace(/\s+/g, "")) // Trim all whitespace
      .filter(Boolean); // Remove empty strings

    const importFromName = importStatement[3];

    // Make sure the developer does not import the same dependency more than once
    const duplicateimportedTypes = getDuplicates(importedTypes);
    if (duplicateimportedTypes.length > 0) {
      throw Error(
        `Duplicate type found: ${duplicateimportedTypes} \nIn import: ${importFromName}`
      );
    }

    // Make sure the developer does not try to import a dependencies dependency
    const index = importedTypes.findIndex((str) => str.indexOf("_") > -1);
    if (index > -1) {
      throw Error(
        `Importing a dependency's imported type is forbidden. Only import types that do not have an '_' in the typename.`
      );
    }

    const namespace = importStatement[2];
    const uri = importStatement[3];

    if (!mutation && importedTypes.indexOf("Mutation") > -1) {
      throw Error(
        `Query modules cannot import Mutations, write operations are prohibited.\nSee import statement for namespace "${namespace}" at uri "${uri}"`
      );
    }

    externalImports.push({
      importedTypes,
      namespace,
      uri,
    });
  }

  // Make sure namespaces are unique
  const namespaces = externalImports.map((extImport) => extImport.namespace);
  const duplicateNamespaces = getDuplicates(namespaces);
  if (duplicateNamespaces.length > 0) {
    throw Error(`Duplicate namespaces found: ${duplicateNamespaces}`);
  }

  // Make sure all uris have the same namespace
  const uriToNamespace: Record<string, string> = {};
  for (const ext of externalImports) {
    if (uriToNamespace[ext.uri]) {
      if (uriToNamespace[ext.uri] !== ext.namespace) {
        throw Error(
          `Imports from a single URI must be imported into the same namespace.\nURI: ${
            ext.uri
          }\nNamespace 1: ${ext.namespace}\nNamespace 2: ${
            uriToNamespace[ext.uri]
          }`
        );
      }
    } else {
      uriToNamespace[ext.uri] = ext.namespace;
    }
  }

  return externalImports;
}

export function parseLocalImports(
  imports: RegExpMatchArray[],
  schemaPath: string
): LocalImport[] {
  const localImports: LocalImport[] = [];

  for (const importStatement of imports) {
    if (importStatement.length !== 3) {
      throw Error(
        `Invalid external import statement found:\n${importStatement[0]}\n` +
          `Please use the following syntax...\n${SYNTAX_REFERENCE}`
      );
    }

    const importTypes = importStatement[1]
      .split(",")
      .map((str) => str.replace(/\s+/g, "")) // Trim all whitespace
      .filter(Boolean); // Remove empty strings
    const importPath = importStatement[2];
    const path = Path.join(Path.dirname(schemaPath), importPath);

    // Make sure the developer does not try to import a dependencies dependency
    const index = importTypes.findIndex((str) => str.indexOf("_") > -1);
    if (index > -1) {
      throw Error(
        `User defined types with '_' in their name are forbidden. This is used for Web3API import namespacing.`
      );
    }

    localImports.push({
      importedTypes: importTypes,
      path,
    });
  }

  // Make sure types are unique
  const localImportNames: string[] = [];
  localImports.forEach((imp) => localImportNames.push(...imp.importedTypes));
  const duplicateImportTypes = getDuplicates(localImportNames);
  if (duplicateImportTypes.length > 0) {
    throw Error(`Duplicate type found: ${duplicateImportTypes}`);
  }

  return localImports;
}
