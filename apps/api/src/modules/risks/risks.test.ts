import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';

describe('Risks API', () => {
  let projectId: string;
  let riskId: string;

  beforeAll(async () => {
    const project = await prisma.project.create({
      data: { name: 'Risks Test Project', startDate: new Date() }
    });
    projectId = project.id;
  });

  afterAll(async () => {
    await prisma.project.delete({ where: { id: projectId } });
    await prisma.$disconnect();
  });

  it('should create a new risk', async () => {
    const response = await request(app)
      .post(`/api/v1/projects/${projectId}/risks`)
      .send({
        title: 'Atraso de fornecedor',
        description: 'Risco de atraso na entrega dos componentes',
        probability: 'high',
        impact: 'high',
        status: 'active'
      });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Atraso de fornecedor');
    riskId = response.body.id;
  });

  it('should list all risks of a project', async () => {
    const response = await request(app).get(`/api/v1/projects/${projectId}/risks`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
  });

  it('should update a risk status', async () => {
    const response = await request(app)
      .put(`/api/v1/projects/${projectId}/risks/${riskId}`)
      .send({ status: 'resolved' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('resolved');
  });

  it('should delete a risk', async () => {
    const response = await request(app).delete(`/api/v1/projects/${projectId}/risks/${riskId}`);
    expect(response.status).toBe(204);

    const check = await prisma.risk.findUnique({ where: { id: riskId } });
    expect(check).toBeNull();
  });
});
