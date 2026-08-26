import { Injectable, inject } from '@angular/core';
import { ServiceRepository } from '../../core/repositories/service.repository';
import type { Service } from '../../domain/models/service';

export type ServiceInput = Pick<Service, 'code' | 'description'>;

@Injectable({ providedIn: 'root' })
export class ServiceService {
  private readonly repository = inject(ServiceRepository);

  async list(query = ''): Promise<readonly Service[]> {
    const services = await this.repository.list({ text: query || undefined });
    await this.ensureSystemServices(services);
    return this.repository.list({ text: query || undefined });
  }

  async create(input: ServiceInput): Promise<Service> {
    this.validate(input);
    const now = new Date().toISOString();
    const service: Service = { id: crypto.randomUUID(), code: input.code.trim().toUpperCase(), description: input.description.trim(), system: false, createdAt: now, updatedAt: now };
    await this.repository.save(service);
    return service;
  }

  async update(id: string, input: ServiceInput): Promise<Service> {
    const existing = await this.repository.getById(id);
    if (!existing) throw new Error('Servizio non trovato.');
    if (existing.system) throw new Error('I servizi di sistema non possono essere modificati.');
    this.validate(input);
    const service: Service = { ...existing, code: input.code.trim().toUpperCase(), description: input.description.trim(), updatedAt: new Date().toISOString() };
    await this.repository.save(service);
    return service;
  }

  async delete(id: string): Promise<void> {
    const service = await this.repository.getById(id);
    if (!service) throw new Error('Servizio non trovato.');
    if (service.system) throw new Error('I servizi di sistema non possono essere eliminati.');
    await this.repository.softDelete(id);
  }

  private validate(input: ServiceInput): void {
    if (!input.code.trim()) throw new Error('Il codice e obbligatorio.');
    if (!input.description.trim()) throw new Error('La descrizione e obbligatoria.');
  }

  private async ensureSystemServices(services: readonly Service[]): Promise<void> {
    const ids = new Set(services.map((service) => service.id));
    const now = new Date().toISOString();
    const systemServices = [
      { id: 'system-service-commission', code: 'COMMISSION', description: 'Commission' },
      { id: 'system-service-sketch', code: 'SKETCH', description: 'Sketch' },
    ].filter((service) => !ids.has(service.id)).map((service) => ({ ...service, system: true, createdAt: now, updatedAt: now } satisfies Service));
    await Promise.all(systemServices.map((service) => this.repository.save(service)));
  }
}