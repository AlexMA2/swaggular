import { generateServices, generateServiceFiles } from '../../src/renderers/generate-service';
import { generateInterfaces } from '../../src/renderers/generate-interface';
import { swaggerState } from '../../src/core/state/swagger-state';
import { serviceState } from '../../src/core/state/service-state';
import { interfaceState } from '../../src/core/state/interface-state';
import { SwaggularConfig } from '../../src/types/config';

describe('Service Generation', () => {
  beforeEach(() => {
    // Reset state
    serviceState.services = {};
    interfaceState.generatedInterfaces = {};
    interfaceState.typeMappings = {};
    // swaggerState mock will be needed or loading a minimal swagger
  });

  it('should use HttpHelper and generic types when configured', () => {
    // Mock Swagger State
    const mockSwagger = {
      openapi: '3.0.0',
      paths: {
        '/api/test': {
          get: {
            parameters: [
              {
                name: 'TestParam',
                in: 'query',
                schema: { type: 'string' },
              },
            ],
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/TestDtoGenericPaged',
                    },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          TestDto: {
            type: 'object',
            properties: {
              id: { type: 'string' },
            },
          },
          TestDtoGenericPaged: {
            type: 'object',
            properties: {
              items: { type: 'array', items: { $ref: '#/components/schemas/TestDto' } },
              totalCount: { type: 'integer' },
            },
          },
        },
      },
    };

    // ... spies ...
    jest.spyOn(swaggerState, 'getPathsGroupedByScope').mockReturnValue({
      TestService: {
        baseUrl: '',
        baseSegments: [],
        groupName: 'TestService',
        paths: ['/api/test'],
      },
    });

    jest.spyOn(swaggerState, 'getPaths').mockReturnValue({
      '/api/test': mockSwagger.paths['/api/test'] as any,
    });
    jest.spyOn(swaggerState, 'getSchemas').mockReturnValue(mockSwagger.components.schemas as any);

    const config: SwaggularConfig = {
      types: {
        generic: [
          {
            name: 'GenericPaged',
            type: 'interface',
            imports: [],
            properties: [
              { name: 'items', type: 'T[]', optional: false, comments: '' },
              { name: 'totalCount', type: 'number', optional: false, comments: '' },
            ],
          },
        ],
      },
    };

    // 1. Generate Interfaces
    generateInterfaces(config);

    // Verify mapping
    expect(interfaceState.getTypeMapping('TestDtoGenericPaged')).toBe('GenericPaged<TestDto>');

    // 2. Generate Services
    generateServices();

    // 3. Generate Service Files
    const templatesConfig = {
      service: {
        path: 'templates/angular-service.template',
        options: {
          hasHttpParamsHandler: true,
          httpParamsHandler: 'const params = HttpHelper.toHttpParams(${params});',
        },
      },
    };

    // Mock renderServiceTemplate
    const templateRenderer = require('../../src/utils/template-renderer');
    jest.spyOn(templateRenderer, 'renderServiceTemplate').mockImplementation((path, params) => {
      // We return the raw params object to easily inspect it in the test
      return JSON.stringify(params);
    });

    const files = generateServiceFiles(undefined, templatesConfig);

    expect(files).toHaveLength(1);
    const params = JSON.parse(files[0].content);

    // Assert Return Type
    expect(params.methods).toContain('GenericPaged<TestDto>');

    // Assert HttpHelper usage logic
    expect(params.methods).toContain('HttpHelper.toHttpParams(queryParams)');
  });
});
