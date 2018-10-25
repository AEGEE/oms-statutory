const faker = require('faker');

const { Event, Application, MembersList } = require('../../models');

exports.generateEvent = (options = {}) => {
    if (!options.name) options.name = faker.lorem.sentence();
    if (!options.description) options.description = faker.lorem.paragraph();
    if (!options.application_period_starts) options.application_period_starts = faker.date.future();
    if (!options.application_period_ends) options.application_period_ends = faker.date.future(null, options.application_period_starts);
    if (!options.starts) options.starts = faker.date.future(null, options.application_period_ends);
    if (!options.ends) options.ends = faker.date.future(null, options.starts);
    if (!options.fee) options.fee = faker.random.number({ min: 0, max: 100 });
    if (!options.body_id) options.body_id = faker.random.number(100);
    if (!options.type) options.type = faker.random.arrayElement(['agora', 'epm']);

    if (!options.questions) {
        const questionsCount = Math.round(Math.random() * 5) + 1; // from 1 to 6
        options.questions = Array.from({ length: questionsCount }, () => faker.lorem.sentence());
    }

    if (!options.applications) {
        const applicationsCount = Math.round(Math.random() * 5) + 1; // from 1 to 6
        options.applications = [];

        for (let i = 0; i < applicationsCount; i++) {
            options.applications.push(exports.generateApplication());
        }
    }

    return options;
}

exports.generateApplication = (options = {}, event = null) => {
    if (typeof options.user_id === 'undefined') options.user_id = faker.random.number(100);
    if (typeof options.body_id === 'undefined') options.body_id = faker.random.number(100);
    if (typeof options.board_comment === 'undefined') options.board_comment = faker.lorem.paragraph();
    if (typeof options.participant_type === 'undefined') options.participant_type = faker.random.arrayElement(['delegate', 'visitor', 'observer', 'envoy']);

    if (!options.answers) {
        const answersCount = event ? event.questions.length : Math.round(Math.random() * 5) + 1; // from 1 to 6
        options.answers = Array.from({ length: answersCount }, () => faker.lorem.sentence());
    }

    if (event && event.id) {
        options.event_id = event.id;
    }

    return options;
}

exports.generateMembersList = (options = {}, event = null) => {
    if (typeof options.currency === 'undefined') options.currency = faker.lorem.sentence();
    if (typeof options.user_id === 'undefined') options.user_id = faker.random.number(100);
    if (typeof options.body_id === 'undefined') options.body_id = faker.random.number(100);
    if (typeof options.members === 'undefined') {
        const membersCount = Math.round(Math.random() * 5) + 1; // from 1 to 6
        options.members = Array.from({ length: membersCount }, () => ({
            user_id: faker.random.number(100),
            first_name: faker.name.firstName(),
            last_name: faker.name.lastName(),
            fee: faker.random.number(1000)
        }));
    }

    if (event && event.id) {
        options.event_id = event.id;
    }

  return options;
}

exports.createEvent = (options = {}) => {
    return Event.create(exports.generateEvent(options), { include: [ Application ] });
};

exports.createApplication = (options = {}, event = null) => {
    return Application.create(exports.generateApplication(options, event));
};

exports.createMembersList = (options = {}, event = null) => {
  return MembersList.create(exports.generateMembersList(options, event));
};

exports.clearAll = async () => {
    await MembersList.destroy({ where: {}, truncate: { cascade: true } });
    await Application.destroy({ where: {}, truncate: { cascade: true } });
    await Event.destroy({ where: {}, truncate: { cascade: true } });
};
