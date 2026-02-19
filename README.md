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
swaggular --input=path/to/your/swagger.json```


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

You can create a `swaggular.config.json` file in your project root to define advanced configurations, such as custom templates, base classes for DTOs, or generic types.

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
      "httpParamsHandlerImport": "import { HttpHelper } from '@shared/utils/http-helper';",
      "httpParamsHandler": "const params = HttpHelper.toHttpParams(${params} || {});"
    }
  }
}
```

This configuration allows you to:

1. **extendsFrom**: Automatically make generated DTOs extend a base class (e.g., `PagedRequestDto`) if they share the same properties.
2. **generic**: Automatically detect and use generic types (e.g., `PagedResultDto<T>`) instead of generating duplicate classes like `PagedResultDtoOfUser`.
3. **templates.service.options**: Customize how HTTP parameters are handled in generated services, allowing you to use your own helper functions.

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
