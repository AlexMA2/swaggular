import { ServiceData } from '../../types/service-data';

class ServiceState {
  services: Record<string, ServiceData> = {};

  addService(name: string, content: ServiceData): void {
    this.services[name] = content;
  }

  addServices(services: ServiceData[]): void {
    services.forEach((service) => {
      this.services[service.name] = service;
    });
  }

  getService(name: string): ServiceData | undefined {
    return this.services[name];
  }
}

export const serviceState = new ServiceState();
