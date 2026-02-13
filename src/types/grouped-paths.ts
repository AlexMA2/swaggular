export type GroupedPaths = Record<string, GroupedPath>;

export interface GroupedPath {
  groupName: string;
  baseSegments: string[];
  paths: string[];
  baseUrl: string;
}
