import { AngularRequestType } from './types';

export interface ServiceData {
  name: string;
  imports: string[];
  baseUrl: string;
  methods: ServiceDataMethod[];
}

export interface ServiceDataMethod {
  name: string;
  path: string;
  method: AngularRequestType;
  parameters: ServiceDataParameter[];
  responseType: string;
  comments: string;
}

export interface ServiceDataParameter {
  name: string;
  in: string; // path, query, body
  required: boolean;
  type: string;
}
