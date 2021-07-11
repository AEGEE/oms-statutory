module.exports = {
    up: (queryInterface) => queryInterface.removeColumn('positions', 'ends_force'),
    down: (queryInterface, Sequelize) => queryInterface.addColumn(
        'positions',
        'ends_force',
        {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('NOW') // so it won't set the deadline for existing positions, as it's in the past
        }
    )
};
