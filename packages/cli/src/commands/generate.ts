import { Command, flags } from '@oclif/command';

import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs";

import { dirname, join as buildPath } from "path";

import { GirXML, parser } from "@gi.ts/parser";

import { resolveLibraries } from "@gi.ts/node-loader";

import * as lib from "@gi.ts/lib";

import { PropertyCase } from '@gi.ts/lib';

export interface DocDescription {
  name: string;
  api_version: string;
  c_prefix?: string;
  path: string;
  id: string;
  slug: string;
  version: string;
}

type Unknown<T> = { [key in keyof T]?: unknown };


type OutputFormat = "file" | "folder";
type Format = "dts" | "json";

export interface GenerationOptions {
  inferGenerics: boolean;
  promisify: boolean;
  propertyCase: PropertyCase;
  withDocs: boolean;
  outputFormat: OutputFormat;
  format: Format;
  versionedOutput: boolean;
  versionedImports: boolean;
  importPrefix: string;
  emitMetadata: boolean;
  noAdvancedVariants: boolean;
}

export interface CLIOptions extends GenerationOptions {
  out: string;
}

export interface LoadOptions {
  loadDocs: boolean;
  propertyCase: PropertyCase;
}

class ConfigurationError extends Error {

}

export default class Generate extends Command {
  static description = 'generate documentation files'

  static examples = [
    `$ gi-ts generate
`,
  ]

  static flags = {
    help: flags.help(),
    out: flags.string({}),
    format: flags.enum<Format | undefined>({ options: ["dts", "json"] }),
    inferGenerics: flags.boolean({}),
    promisify: flags.boolean({}),
    propertyCase: flags.enum<PropertyCase | undefined>({ options: ["both", "underscore", "camel"] }),
    outputFormat: flags.enum<OutputFormat | undefined>({ options: ["file", "folder"] }),
    withDocs: flags.boolean({}),
    versionedOutput: flags.boolean({}),
    versionedImports: flags.boolean({}),
    importPrefix: flags.string({}),
    emitMetadata: flags.boolean({}),
    noAdvancedVariants: flags.boolean({}),
    verbose: flags.boolean({ char: "v", description: "prints detailed per-member generation info " })
  };

  static args = [{ name: 'file' }];

  async run() {
    const { args, flags } = this.parse(Generate);

    let docsPath = "docs.json";

    if (args['file']) {
      docsPath = args['file'];
      this.log(`Loading docs.json from ${docsPath}...`);
    } else {
      this.log("Loading docs.json...");
    }

    const docs: {
      libraries?: { [lib: string]: string | string[] }
      options?: Unknown<CLIOptions>
    } = JSON.parse(
      readFileSync(buildPath(process.cwd(), docsPath), { encoding: "utf-8" })
    );

    // Default options

    // --verbose, -v
    let verbose = false;

    // --outputFormat=file
    let outputFormat: OutputFormat = "file" as const;

    // --withDocs
    let withDocs = false;

    // --inferGenerics
    let inferGenerics = true;

    // --promisify
    let promisify = false;

    // --versionedOutput
    let versionedOutput = false;
    // --versionedOutput
    let versionedImports = false;

    // --importPrefox=@gi.ts/
    let importPrefix = "" as string;

    // --emitMetadata
    let emitMetadata = false;

    // --noAdvancedVariants
    let noAdvancedVariants = false;

    let propertyCase: PropertyCase = "both";
    let format: "dts" | "json" = "dts" as const;
    let file_extension = "d.ts";
    let default_directory = "./types";
    let output_directory: string | null = null;

    function setFormat(format: "dts" | "json") {
      switch (format) {
        case "json":
          file_extension = "json";
          default_directory = "./json";
          break;
        case "dts":
          file_extension = "d.ts";
          default_directory = "./types";
          break;
      }
    }

    // Override default options 

    const { options } = docs;

    function expectsBoolean(flag: string) {
      return (bool: unknown): bool is boolean => {
        if (bool === undefined) {
          return false;
        }

        if (typeof bool === "boolean") {
          return true;
        }

        throw new ConfigurationError(`${flag} expects either true or false.`);
      }
    }

    function expectsString(flag: string) {
      return (str: unknown): str is string => {
        if (str === undefined) {
          return false;
        }

        if (typeof str === "string") {
          return true;
        }

        throw new ConfigurationError(`${flag} expects a string.`);
      }
    }

    function expectsStringType<K extends string>(flag: string, types: readonly K[]) {
      return (type: unknown): type is K => {
        if (type === undefined) {
          return false;
        }

        if (types.includes(type as K)) {
          return true;
        }

        throw new ConfigurationError(`${flag} expects one of ${types.join(', ')}.`);
      };
    }

    const _out = expectsString("out");
    const _format = expectsStringType("format", ["dts", "json"]);
    const _inferGenerics = expectsBoolean("inferGenerics");
    const _promisify = expectsBoolean("promisify");
    const _propertyCase = expectsStringType("propertyCase", ["both", "underscore", "camel"]);
    const _outputFormat = expectsStringType("outputFormat", ["file", "folder"]);
    const _withDocs = expectsBoolean("withDocs");
    const _versionedOutput = expectsBoolean("versionedOutput");
    const _versionedImports = expectsBoolean("versionedImports");
    const _importPrefix = expectsString("importPrefix");
    const _emitMetadata = expectsBoolean("emitMetadata");
    const _noAdvancedVariants = expectsBoolean("noAdvancedVariants");

    if (options) {
      if (_out(options.out)) {
        output_directory = options.out;
      }

      if (_format(options.format)) {
        format = options.format;

        setFormat(format);
      }

      if (_inferGenerics(options.inferGenerics)) {
        inferGenerics = options.inferGenerics;
      }

      if (_outputFormat(options.outputFormat)) {
        outputFormat = options.outputFormat;
      }

      if (_promisify(options.promisify)) {
        promisify = options.promisify;
      }

      if (_propertyCase(options.propertyCase)) {
        propertyCase = options.propertyCase;
      }

      if (_withDocs(options.withDocs)) {
        withDocs = options.withDocs;
      }

      if (_versionedOutput(options.versionedOutput)) {
        versionedOutput = options.versionedOutput;
      }

      if (_versionedImports(options.versionedImports)) {
        versionedImports = options.versionedImports;
      }

      if (_importPrefix(options.importPrefix)) {
        importPrefix = options.importPrefix;
      }

      if (_emitMetadata(options.emitMetadata)) {
        emitMetadata = options.emitMetadata;
      }

      if (_noAdvancedVariants(options.noAdvancedVariants)) {
        noAdvancedVariants = options.noAdvancedVariants;
      }
    }

    emitMetadata ||= flags.emitMetadata;
    versionedOutput ||= flags.versionedOutput;
    versionedImports ||= flags.versionedImports;
    inferGenerics ||= flags.inferGenerics;
    promisify ||= flags.promisify;
    withDocs ||= flags.withDocs;
    noAdvancedVariants ||= flags.noAdvancedVariants;

    // Verbose isn't allowed as a configuration option.
    verbose = flags.verbose;

    if (flags.importPrefix) {
      importPrefix = flags.importPrefix;
    }

    if (flags.format) {
      format = flags.format;

      setFormat(flags.format);
    }

    if (flags.propertyCase) {
      propertyCase = flags.propertyCase;
    }

    if (flags.outputFormat) {
      outputFormat = flags.outputFormat;
    }

    if (flags.out) {
      output_directory = flags.out;
    }

    const output_base = output_directory ?? default_directory;

    const registry = lib.createRegistry();

    type GirMap = Map<string, {
      [version: string]: GirXML
    }>;

    const girs = await resolveLibraries(docs.libraries || {})

    const gir: GirMap = new Map();

    this.log("Loading GIR files...");

    await Promise.all(
      Array.from(girs.entries()).map(async ([name, library]) => {
        for (const version of Object.keys(library)) {
          const doc = library[version];

          const src = await readFileSync(doc.path, { encoding: "utf8" });

          const result = await parser.parseGir(src);

          gir.set(name, {
            ...gir.get(name) ?? {},
            [version]: result
          });
        }
      })
    );

    registry.registerLoader({
      load(namespace, version) {
        if (verbose) {
          console.log(`Loading ${namespace} ${version}...`);
        }

        return gir.get(namespace)?.[version] ?? null;
      }
    }, {
      loadDocs: withDocs,
      propertyCase,
      verbose
    });

    registry.transform({
      inferGenerics,
      verbose
    });

    if (typeof docs.libraries !== 'object') {
      console.error('No libraries selected to generate.');
      return;
    }

    // Generate the content
    for (let [name, versions] of Object.entries(docs.libraries)) {
      for (const version of Array.isArray(versions) ? versions : [versions]) {
        let generated: [string, lib.Metadata] | null = null;

        switch (format) {
          case "json":
            generated = lib.generateJson({
              format,
              promisify,
              withDocs,
              versionedOutput,
              versionedImports,
              noAdvancedVariants,
              importPrefix,
              emitMetadata,
              verbose
            }, registry, name, version);
            break;
          case "dts":
            generated = lib.generateModule({
              format,
              promisify,
              withDocs,
              versionedOutput,
              versionedImports,
              noAdvancedVariants,
              importPrefix,
              emitMetadata,
              verbose
            }, registry, name, version);
            break;
          default:
            throw new Error("Unknown format!");
        }

        if (!generated) {
          console.error(`Failed to generate ${name} ${version}!`);
          continue;
        }

        let [contents, meta] = generated;

        const output = name as string;
        const dir = buildPath(output_base);
        let file: string;

        const output_slug = `${output.toLowerCase()}${versionedOutput ? version.toLowerCase().split('.')[0] : ''}`;

        if (outputFormat === "file") {
          file = buildPath(output_base, `${output_slug}.${file_extension}`);
        } else if (outputFormat === "folder") {
          file = buildPath(output_base, `${output_slug}`, `index.${file_extension}`);
        } else {
          throw new Error(`Unknown output format: ${outputFormat}.`);
        }

        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }

        if (outputFormat === "folder") {
          const directory = dirname(file);

          if (!existsSync(directory)) {
            mkdirSync(directory);
          }
        }

        if (emitMetadata) {
          const metaData = JSON.stringify(meta, null, 4);

          if (outputFormat === "folder") {
            const directory = dirname(file);
            const metaPath = buildPath(directory, "doc.json");

            writeFileSync(metaPath, metaData);
          } else {
            const metaPath = buildPath(output_base, `${output_slug}.doc.json`);

            writeFileSync(metaPath, metaData);
          }
        }

        writeFileSync(file, contents);
      }
    }

    const identifiers = lib.getSanitizedIdentifiers();

    if (identifiers.size > 0) {
      console.error("The following types were prefixed with __ to preserve valid JavaScript identifiers.");
      for (const [sanitized, unsanitized] of identifiers.entries()) {
        console.error(`${unsanitized} = ${sanitized}`);
      }
    }

    this.log("Generated!");
  }
}