import { OpenAPIV3 } from 'openapi-types';
import { GroupedPaths } from '../types/grouped-paths';
import { findCommonBaseUrl, isVariable } from '../utils/path-utils';
import { removeAllWhitespace, toPascalCase } from '../utils/string-utils';

export interface GroupPathsOptions {
  mode: 'tags' | 'path';
  segmentsToIgnore?: string[];
  ignoreVariables?: boolean;
}

export class PathGrouper {
  static groupPaths(
    paths: OpenAPIV3.PathsObject,
    options: GroupPathsOptions = { mode: 'tags' },
  ): GroupedPaths {
    if (options.mode === 'tags') {
      return this.groupByTags(paths, options);
    } else {
      return this.groupByPath(paths, options);
    }
  }

  private static groupByTags(
    paths: OpenAPIV3.PathsObject,
    options: GroupPathsOptions,
  ): GroupedPaths {
    const tagGroups: Record<string, string[]> = {};
    const methods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;

    for (const [pathKey, pathItem] of Object.entries(paths)) {
      if (!pathItem) continue;

      const tags = new Set<string>();
      for (const method of methods) {
        const operation = pathItem[
          method as keyof OpenAPIV3.PathItemObject
        ] as OpenAPIV3.OperationObject;
        if (operation?.tags && operation.tags.length > 0) {
          operation.tags.forEach((tag) => tags.add(removeAllWhitespace(tag)));
        }
      }

      if (tags.size === 0) {
        const groupKey = 'Default';
        if (!tagGroups[groupKey]) tagGroups[groupKey] = [];
        tagGroups[groupKey].push(pathKey);
      } else {
        tags.forEach((tag) => {
          if (!tagGroups[tag]) tagGroups[tag] = [];
          tagGroups[tag].push(pathKey);
        });
      }
    }

    const finalGroups: GroupedPaths = {};
    const sortedTags = Object.keys(tagGroups).sort();

    for (const tagName of sortedTags) {
      const pathKeys = tagGroups[tagName].sort();
      const totalMethods = pathKeys.reduce((sum, pk) => sum + this.getMethodCount(paths[pk]!), 0);

      if (totalMethods <= 8) {
        const groupName = toPascalCase([tagName]);
        finalGroups[groupName] = {
          groupName,
          baseSegments: this.getCommonSegments(pathKeys),
          paths: pathKeys,
          baseUrl: findCommonBaseUrl(pathKeys),
        };
      } else {
        const commonSegs = this.getCommonSegments(pathKeys);
        this.splitRecursively(
          paths,
          pathKeys,
          commonSegs,
          options,
          finalGroups,
          commonSegs.length,
          tagName,
        );
      }
    }

    return finalGroups;
  }

  private static groupByPath(
    paths: OpenAPIV3.PathsObject,
    options: GroupPathsOptions,
  ): GroupedPaths {
    const finalGroups: GroupedPaths = {};
    const pathKeys = Object.keys(paths).filter((k) => !!paths[k]);

    const initialBuckets: Record<string, string[]> = {};
    for (const pk of pathKeys) {
      const normalized = this.getNormalizedSegments(pk, options);
      const first = normalized.length > 0 ? normalized[0] : 'Default';
      if (!initialBuckets[first]) initialBuckets[first] = [];
      initialBuckets[first].push(pk);
    }

    const sortedPrimaryKeys = Object.keys(initialBuckets).sort();
    for (const primaryKey of sortedPrimaryKeys) {
      const pathsInBucket = initialBuckets[primaryKey];
      const prefix = primaryKey === 'Default' ? [] : [primaryKey];
      this.splitRecursively(paths, pathsInBucket, prefix, options, finalGroups, 0);
    }

    const sortedResult: GroupedPaths = {};
    const sortedGroupNames = Object.keys(finalGroups).sort();
    for (const name of sortedGroupNames) {
      sortedResult[name] = finalGroups[name];
    }

    return sortedResult;
  }

  private static splitRecursively(
    allPaths: OpenAPIV3.PathsObject,
    currentPaths: string[],
    currentPrefix: string[],
    options: GroupPathsOptions,
    finalGroups: GroupedPaths,
    initialDepth: number,
    customNamePrefix?: string,
  ) {
    const totalMethods = currentPaths.reduce(
      (sum, pk) => sum + this.getMethodCount(allPaths[pk]!),
      0,
    );

    const depth = currentPrefix.length;

    if (totalMethods <= 8) {
      this.addToFinalGroups(
        currentPaths,
        currentPrefix,
        finalGroups,
        initialDepth,
        customNamePrefix,
      );
      return;
    }

    const stayers: string[] = [];
    const branchMap: Record<string, string[]> = {};

    for (const pk of currentPaths) {
      const normalized = this.getNormalizedSegments(pk, options);
      if (normalized.length > depth) {
        const next = normalized[depth];
        if (!branchMap[next]) branchMap[next] = [];
        branchMap[next].push(pk);
      } else {
        stayers.push(pk);
      }
    }

    const nextSegs = Object.keys(branchMap);

    if (nextSegs.length === 0) {
      this.addToFinalGroups(
        currentPaths,
        currentPrefix,
        finalGroups,
        initialDepth,
        customNamePrefix,
      );
      return;
    }

    const movingBranches: { seg: string; paths: string[] }[] = [];
    const remainingToStay: string[] = [...stayers];

    for (const seg of nextSegs) {
      const paths = branchMap[seg];
      const count = paths.reduce((sum, pk) => sum + this.getMethodCount(allPaths[pk]!), 0);
      if (count >= 2) {
        movingBranches.push({ seg, paths });
      } else {
        remainingToStay.push(...paths);
      }
    }

    if (movingBranches.length === 0) {
      this.addToFinalGroups(
        currentPaths,
        currentPrefix,
        finalGroups,
        initialDepth,
        customNamePrefix,
      );
      return;
    }

    if (movingBranches.length === 1 && remainingToStay.length === 0) {
      this.splitRecursively(
        allPaths,
        currentPaths,
        [...currentPrefix, movingBranches[0].seg],
        options,
        finalGroups,
        initialDepth,
        customNamePrefix,
      );
      return;
    }

    if (remainingToStay.length > 0) {
      this.addToFinalGroups(
        remainingToStay,
        currentPrefix,
        finalGroups,
        initialDepth,
        customNamePrefix,
      );
    }

    for (const branch of movingBranches.sort((a, b) => a.seg.localeCompare(b.seg))) {
      this.splitRecursively(
        allPaths,
        branch.paths,
        [...currentPrefix, branch.seg],
        options,
        finalGroups,
        initialDepth,
        customNamePrefix,
      );
    }
  }

  private static addToFinalGroups(
    paths: string[],
    prefix: string[],
    finalGroups: GroupedPaths,
    initialDepth: number,
    customNamePrefix?: string,
  ) {
    let groupName: string;
    if (customNamePrefix) {
      const trailing = prefix.slice(initialDepth);
      groupName = toPascalCase([customNamePrefix, ...trailing]);
    } else {
      groupName = prefix.length > 0 ? toPascalCase(prefix) : 'Default';
    }

    if (finalGroups[groupName]) {
      const existing = finalGroups[groupName];
      existing.paths = [...new Set([...existing.paths, ...paths])].sort();
      existing.baseSegments = this.getCommonSegments(existing.paths);
      existing.baseUrl = findCommonBaseUrl(existing.paths);
    } else {
      finalGroups[groupName] = {
        groupName,
        baseSegments: this.getCommonSegments(paths),
        paths: paths.sort(),
        baseUrl: findCommonBaseUrl(paths),
      };
    }
  }

  private static getNormalizedSegments(path: string, options: GroupPathsOptions): string[] {
    const segments = path.split('/').filter((s) => s);
    const result: string[] = [];

    for (const segment of segments) {
      if (options.segmentsToIgnore?.includes(segment)) continue;
      if (options.ignoreVariables && isVariable(segment)) continue;
      result.push(segment);
    }

    return result;
  }

  private static getMethodCount(pathItem: OpenAPIV3.PathItemObject): number {
    const methods = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;
    let count = 0;
    for (const method of methods) {
      if (pathItem[method as keyof OpenAPIV3.PathItemObject]) {
        count++;
      }
    }
    return count;
  }

  private static getCommonSegments(paths: string[]): string[] {
    if (paths.length === 0) return [];

    const pathSegments = paths.map((p) =>
      p
        .replace(/^\/+api\/+/, '')
        .split('/')
        .filter((s) => s),
    );

    const firstPath = pathSegments[0];
    const common: string[] = [];

    for (let i = 0; i < firstPath.length; i++) {
      const segment = firstPath[i];
      if (isVariable(segment)) break;
      if (pathSegments.every((ps) => ps[i] === segment)) {
        common.push(segment);
      } else {
        break;
      }
    }
    return common;
  }
}
