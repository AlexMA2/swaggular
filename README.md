# Swaggular

A powerful tool to generate Angular services and models from Swagger/OpenAPI specifications.
Note: Currently, it does not detects generic types or common interfaces. If you want a more
customized version, please download the project in github and modify the templates folder.

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

#### Options

- `--input`: Path to the swagger.json file (required).
- `--ignore-segments`: Path segments to ignore when generating service names. (comma separated)
- `--mode`: Grouping mode. (tags or path) Default: path
- `--no-generate`: Parse the file but don't generate the output. (For testing purposes)
- `--output`: Path to the output folder. Default: results

The generated files will be available in the `results` folder.

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
- [ ] Add function to identify common properties and generate interfaces
- [ ] Add function to generate interfaces and services for just one path

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
