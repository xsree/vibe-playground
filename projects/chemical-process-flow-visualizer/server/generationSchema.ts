export const PROCESS_FLOW_GENERATION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['schemaVersion', 'title', 'description', 'functionalAreas', 'nodes', 'edges'],
  properties: {
    schemaVersion: { type: 'string', const: '1.0' },
    title: { type: 'string' },
    description: { type: ['string', 'null'] },
    functionalAreas: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'name', 'description', 'nodeIds'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          nodeIds: { type: 'array', minItems: 1, items: { type: 'string' } },
        },
      },
    },
    nodes: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'kind', 'tag', 'name', 'equipmentType', 'shapeKey', 'quantity', 'ports', 'attributes'],
        properties: {
          id: { type: 'string' },
          kind: { type: 'string', enum: ['equipment', 'source', 'sink', 'junction'] },
          tag: { type: ['string', 'null'] },
          name: { type: 'string' },
          equipmentType: { type: ['string', 'null'] },
          shapeKey: { type: 'string' },
          quantity: { type: 'integer' },
          ports: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['id', 'direction', 'role', 'label'],
              properties: {
                id: { type: 'string' },
                direction: { type: 'string', enum: ['in', 'out', 'bidirectional'] },
                role: { type: 'string' },
                label: { type: ['string', 'null'] },
              },
            },
          },
          attributes: { type: 'object', properties: {}, additionalProperties: false },
        },
      },
    },
    edges: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'source', 'target', 'label', 'streamType', 'material', 'attributes'],
        properties: {
          id: { type: 'string' },
          source: {
            type: 'object',
            additionalProperties: false,
            required: ['nodeId', 'portId'],
            properties: {
              nodeId: { type: 'string' },
              portId: { type: 'string' },
            },
          },
          target: {
            type: 'object',
            additionalProperties: false,
            required: ['nodeId', 'portId'],
            properties: {
              nodeId: { type: 'string' },
              portId: { type: 'string' },
            },
          },
          label: { type: 'string' },
          streamType: { type: 'string' },
          material: {
            type: 'object',
            additionalProperties: false,
            required: ['name', 'phase', 'components'],
            properties: {
              name: { type: 'string' },
              phase: { type: ['string', 'null'] },
              components: { type: 'array', items: { type: 'string' } },
            },
          },
          attributes: { type: 'object', properties: {}, additionalProperties: false },
        },
      },
    },
  },
} as const;
