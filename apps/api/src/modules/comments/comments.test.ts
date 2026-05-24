import request from 'supertest';
import app from '../../app';
import { prisma } from '../../lib/prisma';

describe('Comments API', () => {
  let projectId: string;
  let stageId: string;
  let topicId: string;
  let subtopicId: string;
  let commentId: string;

  beforeAll(async () => {
    const project = await prisma.project.create({
      data: { name: 'Comments Test Project', startDate: new Date() }
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
  });

  afterAll(async () => {
    await prisma.project.delete({ where: { id: projectId } });
    await prisma.$disconnect();
  });

  it('should post a new comment to a subtopic', async () => {
    const response = await request(app)
      .post(`/api/v1/projects/${projectId}/stages/${stageId}/topics/${topicId}/subtopics/${subtopicId}/comments`)
      .send({
        authorName: 'John Doe',
        content: 'Este é um comentário de teste'
      });

    expect(response.status).toBe(201);
    expect(response.body.authorName).toBe('John Doe');
    expect(response.body.content).toBe('Este é um comentário de teste');
    commentId = response.body.id;
  });

  it('should list all comments of a subtopic', async () => {
    const response = await request(app)
      .get(`/api/v1/projects/${projectId}/stages/${stageId}/topics/${topicId}/subtopics/${subtopicId}/comments`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
  });

  it('should delete a comment', async () => {
    const response = await request(app)
      .delete(`/api/v1/projects/${projectId}/stages/${stageId}/topics/${topicId}/subtopics/${subtopicId}/comments/${commentId}`);
    
    expect(response.status).toBe(204);

    const check = await prisma.subtopicComment.findUnique({ where: { id: commentId } });
    expect(check).toBeNull();
  });
});
