const { startServer, stopServer } = require('../../lib/server.js');
const { request } = require('../scripts/helpers');
const mock = require('../scripts/mock-core-registry');
const generator = require('../scripts/generator');
const regularUser = require('../assets/core-valid').data;

describe('Applications boardview list', () => {
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
        await generator.clearAll();
        mock.cleanAll();
    });

    test('should display everything if the user has local permissions on /boardview/:id', async () => {
        mock.mockAll({ mainPermissions: { noPermissions: true } });

        const event = await generator.createEvent({ applications: [] });
        const application = await generator.createApplication({ body_id: regularUser.bodies[0].id }, event);

        const res = await request({
            uri: '/events/' + event.id + '/applications/boardview/' + regularUser.bodies[0].id,
            method: 'GET',
            headers: { 'X-Auth-Token': 'blablabla' }
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toEqual(true);
        expect(res.body).not.toHaveProperty('errors');
        expect(res.body).toHaveProperty('data');

        expect(res.body.data.length).toEqual(1);
        expect(res.body.data[0].id).toEqual(application.id);
    });

    test('should fail if the user doesn\'t have local permissions for the body on /boardview/:id', async () => {
        mock.mockAll({ approvePermissions: { noPermissions: true }, mainPermissions: { noPermissions: true } });
        const event = await generator.createEvent();

        const res = await request({
            uri: '/events/' + event.id + '/applications/boardview/' + regularUser.bodies[0].id,
            method: 'GET',
            headers: { 'X-Auth-Token': 'blablabla' }
        });

        expect(res.statusCode).toEqual(403);
        expect(res.body.success).toEqual(false);
        expect(res.body).toHaveProperty('message');
        expect(res.body).not.toHaveProperty('data');
    });

    test('should succeed if the user has global permissions for his body', async () => {
        mock.mockAll({ approvePermissions: { noPermissions: true } });

        const event = await generator.createEvent({ applications: [] });
        const application = await generator.createApplication({ body_id: regularUser.bodies[0].id }, event);

        const res = await request({
            uri: '/events/' + event.id + '/applications/boardview/' + regularUser.bodies[0].id,
            method: 'GET',
            headers: { 'X-Auth-Token': 'blablabla' }
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toEqual(true);
        expect(res.body).not.toHaveProperty('errors');
        expect(res.body).toHaveProperty('data');

        expect(res.body.data.length).toEqual(1);
        expect(res.body.data[0].id).toEqual(application.id);
    });

    test('should succeed if the user has global permissions for random body', async () => {
        const event = await generator.createEvent({ applications: [] });
        const application = await generator.createApplication({ body_id: 1337 }, event);

        const res = await request({
            uri: '/events/' + event.id + '/applications/boardview/1337',
            method: 'GET',
            headers: { 'X-Auth-Token': 'blablabla' }
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toEqual(true);
        expect(res.body).not.toHaveProperty('errors');
        expect(res.body).toHaveProperty('data');

        expect(res.body.data.length).toEqual(1);
        expect(res.body.data[0].id).toEqual(application.id);
    });

    test('should result in an error if :id is malformed', async () => {
        const event = await generator.createEvent();
        const res = await request({
            uri: '/events/' + event.id + '/applications/boardview/invalid',
            method: 'GET',
            headers: { 'X-Auth-Token': 'blablabla' }
        });

        expect(res.statusCode).toEqual(400);
        expect(res.body.success).toEqual(false);
        expect(res.body).toHaveProperty('message');
        expect(res.body).not.toHaveProperty('data');
    });

    test('should sort applications', async () => {
        mock.mockAll({ mainPermissions: { noPermissions: true } });

        const event = await generator.createEvent({ applications: [] });
        const applications = [
            await generator.createApplication({
                body_id: regularUser.bodies[0].id,
                user_id: 1,
                participant_type: 'delegate',
                participant_order: 1
            }, event),
            await generator.createApplication({
                body_id: regularUser.bodies[0].id,
                user_id: 2,
                participant_type: 'delegate',
                participant_order: 2
            }, event),
            await generator.createApplication({
                body_id: regularUser.bodies[0].id,
                user_id: 3,
                participant_type: 'visitor',
                participant_order: 1
            }, event),
            await generator.createApplication({
                body_id: regularUser.bodies[0].id,
                user_id: 4,
                participant_type: 'visitor',
                participant_order: 2
            }, event),
            await generator.createApplication({
                body_id: regularUser.bodies[0].id,
                user_id: 5,
                participant_type: 'visitor',
                participant_order: 3
            }, event),
            await generator.createApplication({
                body_id: regularUser.bodies[0].id,
                user_id: 6,
                participant_type: null,
                participant_order: null
            }, event),
            await generator.createApplication({
                body_id: regularUser.bodies[0].id,
                user_id: 7,
                participant_type: null,
                participant_order: null
            }, event),
        ];

        const res = await request({
            uri: '/events/' + event.id + '/applications/boardview/' + regularUser.bodies[0].id,
            method: 'GET',
            headers: { 'X-Auth-Token': 'blablabla' }
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toEqual(true);
        expect(res.body).not.toHaveProperty('errors');
        expect(res.body).toHaveProperty('data');

        expect(res.body.data.length).toEqual(7);
        expect(res.body.data[0].id).toEqual(applications[0].id);
        expect(res.body.data[1].id).toEqual(applications[1].id);
        expect(res.body.data[2].id).toEqual(applications[2].id);
        expect(res.body.data[3].id).toEqual(applications[3].id);
        expect(res.body.data[4].id).toEqual(applications[4].id);
        expect(res.body.data[5].id).toEqual(applications[5].id);
        expect(res.body.data[6].id).toEqual(applications[6].id);
    });
});
