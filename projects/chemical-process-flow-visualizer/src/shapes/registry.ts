export type ShapeGlyphKind =
  | 'generic'
  | 'source'
  | 'sink'
  | 'vessel-stirred'
  | 'vessel-heated'
  | 'vessel-vacuum'
  | 'tank'
  | 'tubular'
  | 'separator-phase'
  | 'separator-settling'
  | 'separator-solid-liquid'
  | 'condenser'
  | 'metering'
  | 'transfer'
  | 'conveyor'
  | 'slicer'
  | 'hopper'
  | 'dust'
  | 'packaging'
  | 'warehouse';

export interface ShapeDefinition {
  key: string;
  label: string;
  glyph: ShapeGlyphKind;
}

export const SHAPE_DEFINITIONS: ShapeDefinition[] = [
  { key: 'generic.process', label: '通用工艺设备', glyph: 'generic' },
  { key: 'boundary.source', label: '物料来源', glyph: 'source' },
  { key: 'boundary.sink', label: '物料去向', glyph: 'sink' },
  { key: 'vessel.stirred', label: '搅拌釜', glyph: 'vessel-stirred' },
  { key: 'vessel.heated', label: '加热 / 热储釜', glyph: 'vessel-heated' },
  { key: 'vessel.vacuum', label: '真空脱溶釜', glyph: 'vessel-vacuum' },
  { key: 'tank.vertical', label: '立式储罐', glyph: 'tank' },
  { key: 'reactor.tubular', label: '管式反应器', glyph: 'tubular' },
  { key: 'separator.phase', label: '液液分离器', glyph: 'separator-phase' },
  { key: 'separator.settling', label: '沉降分层设备', glyph: 'separator-settling' },
  { key: 'separator.solid-liquid', label: '固液分离设备', glyph: 'separator-solid-liquid' },
  { key: 'heat-exchanger.condenser', label: '冷凝器', glyph: 'condenser' },
  { key: 'machine.metering', label: '计量输送设备', glyph: 'metering' },
  { key: 'machine.transfer', label: '转料设备', glyph: 'transfer' },
  { key: 'conveyor.chain', label: '管链机', glyph: 'conveyor' },
  { key: 'machine.slicer', label: '切片机', glyph: 'slicer' },
  { key: 'hopper', label: '料仓', glyph: 'hopper' },
  { key: 'collector.dust', label: '除尘设备', glyph: 'dust' },
  { key: 'line.packaging', label: '包装线', glyph: 'packaging' },
  { key: 'warehouse', label: '成品库', glyph: 'warehouse' },
];

const shapeRegistry = new Map(SHAPE_DEFINITIONS.map((definition) => [definition.key, definition]));
const genericShape = shapeRegistry.get('generic.process')!;

export function resolveShapeDefinition(shapeKey: string): ShapeDefinition {
  return shapeRegistry.get(shapeKey) ?? genericShape;
}

export function isShapeKeyRegistered(shapeKey: string): boolean {
  return shapeRegistry.has(shapeKey);
}
