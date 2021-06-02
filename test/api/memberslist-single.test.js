const { startServer, stopServer } = require('../../lib/server');
const { request } = require('../scripts/helpers');
const mock = require('../scripts/mock-core-registry');
const generator = require('../scripts/generator');
const regularUser = require('../assets/core-valid.json').data;

describe('Memberslist displaying', () => {
    beforeAll(async () => {
        await startServer();
    });

    afterAll(async () => {
        await stopServer();
    });

    beforeEach(async () => {
        mock.mockAll();
    });

    afterEach(async () => {
        mock.cleanAll();
        await generator.clearAll();
    });

    test('should fail if user has no permissions at all', async () => {
        mock.mockAll({ mainPermissions: { noPermissions: true }, approvePermissions: { noPermissions: true } });

        const event = await generator.createEvent({ type: 'agora' });
        await generator.createMembersList({ body_id: regularUser.bodies[0].id }, event);
        const res = await request({
            uri: '/events/' + event.id + '/memberslists/' + regularUser.bodies[0].id,
            method: 'GET',
            headers: { 'X-Auth-Token': 'blablabla' }
        });

        expect(res.statusCode).toEqual(403);
        expect(res.body.success).toEqual(false);
        expect(res.body).toHaveProperty('message');
        expect(res.body).not.toHaveProperty('data');
    });

    test('should fail if user has local permission for random body', async () => {
        mock.mockAll({ mainPermissions: { noPermissions: true } });

        const event = await generator.createEvent({ type: 'agora' });
        await generator.createMembersList({ body_id: 1337 }, event);
        const res = await request({
            uri: '/events/' + event.id + '/memberslists/1337',
            method: 'GET',
            headers: { 'X-Auth-Token': 'blablabla' }
        });

        expect(res.statusCode).toEqual(403);
        expect(res.body.success).toEqual(false);
        expect(res.body).toHaveProperty('message');
        expect(res.body).not.toHaveProperty('data');
    });

    test('should succeed if user has local permission for his body', async () => {
        mock.mockAll({ mainPermissions: { noPermissions: true } });

        const event = await generator.createEvent({ type: 'agora' });
        await generator.createMembersList({ body_id: regularUser.bodies[0].id }, event);
        const res = await request({
            uri: '/events/' + event.id + '/memberslists/' + regularUser.bodies[0].id,
            method: 'GET',
            headers: { 'X-Auth-Token': 'blablabla' },
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toEqual(true);
        expect(res.body).toHaveProperty('data');
    });

    test('should succeed if user has global permission for random body', async () => {
        mock.mockAll({ approvePermissions: { noPermissions: true } });

        const event = await generator.createEvent({ type: 'agora' });
        await generator.createMembersList({ body_id: 1337 }, event);
        const res = await request({
            uri: '/events/' + event.id + '/memberslists/1337',
            method: 'GET',
            headers: { 'X-Auth-Token': 'blablabla' }
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toEqual(true);
        expect(res.body).toHaveProperty('data');
    });

    test('should fail if the event is not Agora', async () => {
        mock.mockAll({ approvePermissions: { noPermissions: true } });

        const event = await generator.createEvent({ type: 'epm' });
        await generator.createMembersList({ body_id: 1337 }, event);
        const res = await request({
            uri: '/events/' + event.id + '/memberslists/1337',
            method: 'GET',
            headers: { 'X-Auth-Token': 'blablabla' }
        });

        expect(res.statusCode).toEqual(400);
        expect(res.body.success).toEqual(false);
        expect(res.body).toHaveProperty('message');
    });

    test('should fail if members list is not uploaded', async () => {
        const event = await generator.createEvent({ type: 'agora' });
        const res = await request({
            uri: '/events/' + event.id + '/memberslists/1337',
            method: 'GET',
            headers: { 'X-Auth-Token': 'blablabla' }
        });

        expect(res.statusCode).toEqual(404);
        expect(res.body.success).toEqual(false);
        expect(res.body).toHaveProperty('message');
        expect(res.body).not.toHaveProperty('data');
    });

    test('should fail if body_id is invalid', async () => {
        const event = await generator.createEvent({ type: 'agora' });
        const res = await request({
            uri: '/events/' + event.id + '/memberslists/invalid',
            method: 'GET',
            headers: { 'X-Auth-Token': 'blablabla' }
        });

        expect(res.statusCode).toEqual(400);
        expect(res.body.success).toEqual(false);
        expect(res.body).toHaveProperty('message');
        expect(res.body).not.toHaveProperty('data');
    });
});
