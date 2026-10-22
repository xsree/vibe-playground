import type { ProcessFlowDocument } from './types';

export interface GraphIssue {
  severity: 'error' | 'warning';
  message: string;
}

export function checkGraph(document: ProcessFlowDocument): GraphIssue[] {
  const issues: GraphIssue[] = [];
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const portsByNode = new Map<string, Map<string, 'in' | 'out' | 'bidirectional'>>();

  for (const node of document.nodes) {
    if (nodeIds.has(node.id)) {
      issues.push({ severity: 'error', message: `节点 ID 重复：${node.id}` });
    }
    nodeIds.add(node.id);

    const ports = new Map<string, 'in' | 'out' | 'bidirectional'>();
    for (const port of node.ports) {
      if (ports.has(port.id)) {
        issues.push({ severity: 'error', message: `节点 ${node.id} 的端口 ID 重复：${port.id}` });
      }
      ports.set(port.id, port.direction);
    }
    portsByNode.set(node.id, ports);
  }

  for (const edge of document.edges) {
    if (edgeIds.has(edge.id)) {
      issues.push({ severity: 'error', message: `管线 ID 重复：${edge.id}` });
    }
    edgeIds.add(edge.id);

    const sourcePorts = portsByNode.get(edge.source.nodeId);
    const targetPorts = portsByNode.get(edge.target.nodeId);
    if (!sourcePorts) {
      issues.push({ severity: 'error', message: `管线 ${edge.id} 引用了不存在的源节点 ${edge.source.nodeId}` });
    } else if (!sourcePorts.has(edge.source.portId)) {
      issues.push({ severity: 'error', message: `管线 ${edge.id} 引用了不存在的源端口 ${edge.source.portId}` });
    } else if (sourcePorts.get(edge.source.portId) === 'in') {
      issues.push({ severity: 'error', message: `管线 ${edge.id} 的源端口不能是纯输入端口` });
    }

    if (!targetPorts) {
      issues.push({ severity: 'error', message: `管线 ${edge.id} 引用了不存在的目标节点 ${edge.target.nodeId}` });
    } else if (!targetPorts.has(edge.target.portId)) {
      issues.push({ severity: 'error', message: `管线 ${edge.id} 引用了不存在的目标端口 ${edge.target.portId}` });
    } else if (targetPorts.get(edge.target.portId) === 'out') {
      issues.push({ severity: 'error', message: `管线 ${edge.id} 的目标端口不能是纯输出端口` });
    }
  }

  const areaIds = new Set<string>();
  const areaByNode = new Map<string, string>();
  for (const area of document.functionalAreas) {
    if (areaIds.has(area.id)) {
      issues.push({ severity: 'error', message: `工艺功能区 ID 重复：${area.id}` });
    }
    areaIds.add(area.id);
    for (const nodeId of area.nodeIds) {
      if (!nodeIds.has(nodeId)) {
        issues.push({ severity: 'error', message: `工艺功能区 ${area.id} 引用了不存在的节点 ${nodeId}` });
        continue;
      }
      const previousArea = areaByNode.get(nodeId);
      if (previousArea) {
        issues.push({ severity: 'error', message: `节点 ${nodeId} 同时属于工艺功能区 ${previousArea} 和 ${area.id}` });
      } else {
        areaByNode.set(nodeId, area.id);
      }
    }
  }
  for (const nodeId of nodeIds) {
    if (!areaByNode.has(nodeId)) {
      issues.push({ severity: 'warning', message: `节点 ${nodeId} 尚未归入工艺功能区` });
    }
  }

  return issues;
}
