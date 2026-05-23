import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';

describe('Subtopic Assignments API', () => {
  let projectId: string;
  let stageId: string;
  let topicId: string;
  let subtopicId: string;
  let memberId: string;

  beforeAll(async () => {
    // Setup hierarchy
    const project = await prisma.project.create({
      data: { name: 'Assignment Test', startDate: new Date() }
    });
    projectId = project.id;

    const stage = await prisma.stage.create({
      data: { name: 'Stage 1', order: 1, projectId }
    });
    stageId = stage.id;

    const topic = await prisma.topic.create({
      data: { name: 'Topic 1', order: 1, stageId }
    });
    topicId = topic.id;

    const subtopic = await prisma.subtopic.create({
      data: { name: 'Task 1', durationHours: 8, order: 1, topicId }
    });
    subtopicId = subtopic.id;

    const member = await prisma.teamMember.create({
      data: { name: 'Member 1', initials: 'M1', role: 'Dev', projectId }
    });
    memberId = member.id;
  });

  afterAll(async () => {
    await prisma.project.delete({ where: { id: projectId } });
    await prisma.$disconnect();
  });

  it('should assign a member to a subtopic', async () => {
    const response = await request(app)
      .post(`/api/v1/projects/${projectId}/stages/${stageId}/topics/${topicId}/subtopics/${subtopicId}/assignments`)
      .send({ memberId });

    expect(response.status).toBe(201);
    expect(response.body.memberId).toBe(memberId);
    expect(response.body.subtopicId).toBe(subtopicId);
  });

  it('should include assignments when fetching subtopics', async () => {
    const response = await request(app)
      .get(`/api/v1/projects/${projectId}/stages/${stageId}/topics/${topicId}/subtopics/${subtopicId}`);
    
    expect(response.status).toBe(200);
    expect(response.body.assignments).toBeDefined();
    expect(response.body.assignments.length).toBe(1);
    expect(response.body.assignments[0].member.name).toBe('Member 1');
  });

  it('should unassign a member from a subtopic', async () => {
    const response = await request(app)
      .delete(`/api/v1/projects/${projectId}/stages/${stageId}/topics/${topicId}/subtopics/${subtopicId}/assignments/${memberId}`);

    expect(response.status).toBe(204);

    const check = await prisma.subtopicAssignment.findFirst({
      where: { subtopicId, memberId }
    });
    expect(check).toBeNull();
  });
});
