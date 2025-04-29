'use strict';

const { hashPassword } = require('../helpers/bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const users = require('../data/users.json').map(user => {
      delete user.id;
      user.password = hashPassword(user.password);
      user.createdAt = user.updatedAt = new Date();
      return user;
    });

    const categories = require('../data/categories.json').map(category => {
      delete category.id;
      category.createdAt = category.updatedAt = new Date();
      return category;
    });

    const courses = require('../data/courses.json').map(course => {
      delete course.id;
      course.createdAt = course.updatedAt = new Date();
      return course;
    });

    
    await queryInterface.bulkInsert('Users', users, {});
    await queryInterface.bulkInsert('Categories', categories, {});
    await queryInterface.bulkInsert('Courses', courses, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Courses', null, {});
    await queryInterface.bulkDelete('Categories', null, {});
    await queryInterface.bulkDelete('Users', null, {});
  }
};
