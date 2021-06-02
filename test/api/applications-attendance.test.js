const { startServer, stopServer } = require('../../lib/server');
const { request } = require('../scripts/helpers');
const mock = require('../scripts/mock-core-registry');
const generator = require('../scripts/generator');
const regularUser = require('../assets/core-valid.json').data;

describe('Applications attendance', () => {
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

    test('should not succeed for current user', async () => {
        mock.mockAll({ mainPermissions: { noPermissions: true } });

        const event = await generator.createEvent();
        await generator.createApplication({ user_id: regularUser.id }, event);

        const res = await request({
            uri: '/events/' + event.id + '/applications/me/attended',
            method: 'PUT',
            headers: { 'X-Auth-Token': 'blablabla' },
            body: { attended: true }
        });

        expect(res.statusCode).toEqual(403);
        expect(res.body.success).toEqual(false);
        expect(res.body).not.toHaveProperty('data');
        expect(res.body).toHaveProperty('message');
    });

    test('should succeed for other user when the permissions are okay', async () => {
        const event = await generator.createEvent();
        const application = await generator.createApplication({ confirmed: true }, event);

        const res = await request({
            uri: '/events/' + event.id + '/applications/' + application.id + '/attended',
            method: 'PUT',
            headers: { 'X-Auth-Token': 'blablabla' },
            body: { attended: true }
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toEqual(true);
        expect(res.body).not.toHaveProperty('errors');
        expect(res.body).toHaveProperty('data');
        expect(res.body.data.id).toEqual(application.id);
        expect(res.body.data.attended).toEqual(true);
    });

    test('should fail if the application is not marked as confirmed', async () => {
        const event = await generator.createEvent();
        const application = await generator.createApplication({ confirmed: false }, event);

        const res = await request({
            uri: '/events/' + event.id + '/applications/' + application.id + '/attended',
            method: 'PUT',
            headers: { 'X-Auth-Token': 'blablabla' },
            body: { attended: true }
        });

        expect(res.statusCode).toEqual(422);
        expect(res.body.success).toEqual(false);
        expect(res.body).not.toHaveProperty('data');
        expect(res.body).toHaveProperty('errors');
        expect(res.body.errors).toHaveProperty('attended');
    });

    test('should return 403 for other user when user does not have permissions', async () => {
        mock.mockAll({ mainPermissions: { noPermissions: true } });

        const event = await generator.createEvent();
        const application = await generator.createApplication({ confirmed: true }, event);

        const res = await request({
            uri: '/events/' + event.id + '/applications/' + application.id + '/attended',
            method: 'PUT',
            headers: { 'X-Auth-Token': 'blablabla' },
            body: { attended: true }
        });

        expect(res.statusCode).toEqual(403);
        expect(res.body.success).toEqual(false);
        expect(res.body).not.toHaveProperty('data');
        expect(res.body).toHaveProperty('message');
    });

    test('should return 404 if the application is not found', async () => {
        const event = await generator.createEvent({ applications: [] });

        const res = await request({
            uri: '/events/' + event.id + '/applications/333/attended',
            method: 'PUT',
            headers: { 'X-Auth-Token': 'blablabla' },
            body: { attended: true }
        });

        expect(res.statusCode).toEqual(404);
        expect(res.body.success).toEqual(false);
        expect(res.body).toHaveProperty('message');
        expect(res.body).not.toHaveProperty('data');
    });

    test('should return 422 if attended is invalid', async () => {
        const event = await generator.createEvent();
        const application = await generator.createApplication({ confirmed: true }, event);

        const res = await request({
            uri: '/events/' + event.id + '/applications/' + application.id + '/attended',
            method: 'PUT',
            headers: { 'X-Auth-Token': 'blablabla' },
            body: { attended: 'lalala' }
        });

        expect(res.statusCode).toEqual(422);
        expect(res.body.success).toEqual(false);
        expect(res.body).toHaveProperty('errors');
        expect(res.body).not.toHaveProperty('data');
    });
});
