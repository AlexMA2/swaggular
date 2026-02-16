
const fs = require('fs');
const swagger = JSON.parse(fs.readFileSync('swagger.json', 'utf8'));

const schemaName = 'ContractorAdminDtoPagedResultDto';
const schema = swagger.components.schemas[schemaName];

console.log(`Schema ${schemaName}:`, JSON.stringify(schema, null, 2));

const pagedResultDtoProps = [
  'items', 'totalCount', 'pageNumber', 'pageSize', 'totalPages', 'hasPreviousPage', 'hasNextPage'
];

if (schema && schema.properties) {
  const props = Object.keys(schema.properties);
  console.log('Properties:', props);
  const missing = pagedResultDtoProps.filter(p => !props.includes(p));
  console.log('Missing properties for PagedResultDto match:', missing);
} else {
  console.log('Schema properties not found');
}
