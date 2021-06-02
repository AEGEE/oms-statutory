const { startServer, stopServer } = require('../../lib/server');
const { request } = require('../scripts/helpers');
const mock = require('../scripts/mock-core-registry');
const generator = require('../scripts/generator');
const Event = require('../../models/Event');

describe('Events editing', () => {
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

    test('should disallow event editing if user has no rights', async () => {
        mock.mockAll({ mainPermissions: { noPermissions: true } });

        const event = await generator.createEvent();

        const res = await request({
            uri: '/events/' + event.id,
            method: 'PUT',
            headers: { 'X-Auth-Token': 'blablabla' },
            body: {
                name: 'Not updated name.'
            }
        });

        expect(res.statusCode).toEqual(403);
        expect(res.body.success).toEqual(false);
        expect(res.body).toHaveProperty('message');

        const eventFromDb = await Event.findOne({ where: { id: event.id } });
        expect(eventFromDb.name).not.toEqual('Not updated name.');
    });

    test('should allow editing if everything is okay', async () => {
        const event = await generator.createEvent();

        const res = await request({
            uri: '/events/' + event.id,
            method: 'PUT',
            headers: { 'X-Auth-Token': 'blablabla' },
            body: {
                name: 'Not updated name.'
            }
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toEqual(true);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data.name).toEqual('Not updated name.');

        const eventFromDb = await Event.findOne({ where: { id: event.id } });
        expect(eventFromDb.name).toEqual('Not updated name.');
    });

    test('should return 404 if event is not found', async () => {
        const res = await request({
            uri: '/events/notexistant',
            method: 'PUT',
            headers: { 'X-Auth-Token': 'blablabla' },
            body: {
                name: 'Not updated name.'
            }
        });

        expect(res.statusCode).toEqual(404);
        expect(res.body.success).toEqual(false);
        expect(res.body).toHaveProperty('message');
    });

    test('should not update event status', async () => {
        const event = await generator.createEvent();

        const res = await request({
            uri: '/events/' + event.id,
            method: 'PUT',
            headers: { 'X-Auth-Token': 'blablabla' },
            body: {
                status: 'published'
            }
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toEqual(true);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data.status).not.toEqual('published');

        const eventFromDb = await Event.findOne({ where: { id: event.id } });
        expect(eventFromDb.status).not.toEqual('published');
    });

    test('should not update event type', async () => {
        const event = await generator.createEvent({ type: 'epm' });

        const res = await request({
            uri: '/events/' + event.id,
            method: 'PUT',
            headers: { 'X-Auth-Token': 'blablabla' },
            body: {
                type: 'agora'
            }
        });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toEqual(true);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data.status).not.toEqual('agora');

        const eventFromDb = await Event.findOne({ where: { id: event.id } });
        expect(eventFromDb.status).not.toEqual('epm');
    });

    test('should return validation error if something\'s wrong', async () => {
        const event = await generator.createEvent();

        const res = await request({
            uri: '/events/' + event.id,
            method: 'PUT',
            headers: { 'X-Auth-Token': 'blablabla' },
            body: {
                name: '',
                description: ''
            }
        });

        expect(res.statusCode).toEqual(422);
        expect(res.body.success).toEqual(false);
        expect(res.body).toHaveProperty('errors');
        expect(res.body.errors).toHaveProperty('name');
        expect(res.body.errors).toHaveProperty('description');
    });
});
