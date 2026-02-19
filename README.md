# Swaggular

A powerful tool to generate Angular services and models from Swagger/OpenAPI specifications.

You can create a configuration file to customize the generation process.

If you want a more customized version, you are invited to download the project in github and modify the project.

## Features

- 🚀 Automatically generates Angular services.
- 📦 Generates complex model interfaces.
- 📝 Includes JSDoc comments for better developer experience.
- 🛠️ Highly configurable.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

To install the tool globally:

```bash
npm install -g swaggular
```

Or run it directly using `npx`:

```bash
npx swaggular --input=swagger.json
```

### Usage

Run the generator by providing the path to your Swagger/OpenAPI file:

```bash
swaggular --input=path/to/your/swagger.json
```

## Configuration

You can configure Swaggular using CLI arguments or a configuration file (e.g., `swaggular.config.json`).

### CLI Arguments (`ArgsVariables`)

| Argument | Description | Default |
| :--- | :--- | :--- |
| `--input`, `-i` | Path to the Swagger/OpenAPI file or URL. | `swagger.json` |
| `--output`, `-o` | Output directory for generated files. | `results` |
| `--mode` | Grouping mode for services: `tags` or `path`. | `path` |
| `--ignore-segments` | Comma-separated list of URL segments to ignore when generating service names. | `api` |
| `--no-generate` | Parse the Swagger file but do not generate any output files. useful for testing. | `false` |
| `--config` | Path to a configuration file. | `swaggular.config.json` (if exists) |

### Configuration File (`SwaggularConfig`)

You can create a `swaggular.config.json` file in your project root to define advanced configurations. Below is the detailed structure of the configuration object.

#### **Properties**

- **`input`** _(optional)_: `string` - Path to the input Swagger/OpenAPI file (e.g., `swagger.json`). If not specified, defaults to the basic input.
- **`output`** _(optional)_: `string` - Path to the output directory where generated files will be saved. Default: `results`.
- **`groupingMode`** _(optional)_: `'tags' | 'path'` - Strategy for grouping services.
  - `'tags'`: Groups operations based on their Swagger tags.
  - `'path'`: Groups operations based on their URL path segments.
- **`segmentsToIgnore`** _(optional)_: `string[]` - List of URL segments to ignore when generating service names (e.g., `['api', 'v1']`).
- **`types`** _(optional)_: `object` - Configuration for type generation and inheritance.
  - **`extendsFrom`** _(optional)_: `InterfaceData[]` - Defines base classes that generated DTOs should extend if they match the properties.
  - **`generic`** _(optional)_: `InterfaceData[]` - Defines generic types to replace duplicate generated classes (e.g., `PagedResultDto<T>`).
- **`templates`** _(optional)_: `object` - Configuration for templates used in generation.
  - **`service`** _(optional)_: `object` - Service template configuration.
    - **`path`**: `string` - Path to the internal or custom service template file (e.g., `'templates/angular-service.template'`).
    - **`httpParamsHandler`** _(optional)_: `string` - Custom logic to handle HTTP parameters (e.g., `'const params = HttpHelper.toHttpParams(${params} || {});'`). The `${params}` is a placeholder for the query parameters, it MUST exist in the string.
    - **`httpParamsHandlerImport`** _(optional)_: `string` - Import statement for the custom parameters handler (e.g., `'import { HttpHelper } from "@shared/utils";'`).

---

#### **Object Structures**

**`InterfaceData`**

Used in `types.extendsFrom` and `types.generic`.

- **`name`**: `string` - The name of the interface or class.
- **`imports`**: `string[]` - List of imports required for this interface. It has to be the name of other generated interfaces, e.g. `['SomeProperty']`.
- **`type`**: `'interface' | 'enum' | 'type'` - The kind of TypeScript structure.
- **`properties`**: `InterfaceDataProperty[]` - Array of properties belonging to this interface.
- **`extendsFrom`** _(optional)_: `string[]` - Names of other interfaces this one extends. It has to be the name of other generated interfaces, e.g. `['SomeProperty']`.

**`InterfaceDataProperty`**

Used in `InterfaceData.properties`.

- **`name`**: `string` - The name of the property.
- **`type`**: `string` - The TypeScript type of the property (e.g., `'string'`, `'number'`, `'T[]'`).
- **`optional`**: `boolean` - Whether the property is optional (`?`).
- **`comments`**: `string` - JSDoc comments or other annotations for the property. It must be surrounded by the `/** ... */` .

---

#### Example `swaggular.config.json`

```json
{
  "input": "swagger.json",
  "output": "src/app/api",
  "groupingMode": "tags",
  "segmentsToIgnore": ["api", "v1"],
  "types": {
    "extendsFrom": [
      {
        "name": "PagedRequestDto",
        "type": "interface",
        "properties": [
          { "name": "skipCount", "type": "number", "optional": true, "comments": "" },
          { "name": "maxResultCount", "type": "number", "optional": true, "comments": "" }
        ],
        "imports": []
      }
    ],
    "generic": [
      {
        "name": "PagedResultDto",
        "type": "interface",
        "properties": [
          { "name": "items", "type": "T[]", "optional": true, "comments": "" },
          { "name": "totalCount", "type": "number", "optional": true, "comments": "" }
        ],
        "imports": []
      }
    ]
  },
  "templates": {
    "service": {
      "path": "templates/angular-service.template",
      "httpParamsHandlerImport": "import { HttpHelper } from '@shared/utils/http-helper';",
      "httpParamsHandler": "const params = HttpHelper.toHttpParams(${params} || {});"
    }
  }
}
```

This configuration allows you to:

1. **extendsFrom**: Automatically make generated DTOs extend a base class (e.g., `PagedRequestDto`) if they share the same properties.
2. **generic**: Automatically detect and use generic types (e.g., `PagedResultDto<T>`) instead of generating duplicate classes like `PagedResultDtoOfUser`.
3. **templates.service**: Customize how HTTP parameters are handled in generated services, allowing you to use your own helper functions.

## Development

### Scripts

- `npm run build`: Compile TypeScript to JavaScript.
- `npm run start`: Run the compiled project.
- `npm run serve`: Compile and run the project immediately.
- `npm run lint`: Run ESLint to check code style.
- `npm run format`: Format code using Prettier.
- `npm test`: Run tests using Jest.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

### 🚀 Roadmap

- [ ] Add TSDoc comments
- [ ] Add function to identify common properties and generate interfaces without any configuration
- [ ] Add function to generate interfaces and services for just one specific path

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
