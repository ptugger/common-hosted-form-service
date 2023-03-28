
exports.up = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.alterTable('form', table => {
      table.boolean('schEnabled').notNullable().defaultTo(false).comment('Used to indicate if schedule feature enabled or not');
      table.string('schType').nullable().comment('Shows type of Schedule setting choose by form designed. Could be period,closingDate,manual');
      table.date('schOpenSubmissionDateTime').nullable().comment('Contains open date of form schedule system.');
      table.string('schKeepOpenForTerm').nullable().comment('This contain a value that can be used with combination to another key i.e. schKeepOpenForInterval to calculate a period. Thats tells a form to be keep open for particular period.  40 Days, 3 Weeks, 1 Years etc.');
      table.string('schKeepOpenForInterval').nullable().comment('This contain a value that can be used with combination to another key i.e. schKeepOpenForTerm to calculate a period. Thats tells a form to be keep open for particular period.  40 Days, 3 Weeks, 1 Years etc.');
      table.date('schCloseSubmissionDateTime').nullable().comment('Contains close date of form schedule system.');
      table.boolean('schClosingMessageEnabled').notNullable().defaultTo(false).comment('Set to true when custom closing message is enabled');
      table.string('schClosingMessage').nullable().comment('This string contain custom closing message message set by form designer that shows on frontend when a form is expired for a particular period.');
      
      table.boolean('schRepeatEnabled').notNullable().defaultTo(false).comment('Used to indicate if repeatition of scheduling a form enabled or not');
      table.string('schRepeatEveryTerm').nullable().comment('This contain a value that can be used with combination to another key i.e. schRepeatEveryIntervalType to calculate a period. Thats tells a form to be schedule a form repetition after particular period.  40 Days, 3 Weeks, 1 Years etc.');
      table.string('schRepeatEveryIntervalType').nullable().comment('This contain a value that can be used with combination to another key i.e. schRepeatEveryTerm to calculate a period. Thats tells a form to be schedule a form repetition after particular period.  40 Days, 3 Weeks, 1 Years etc.');
      table.date('schRepeatUntil').nullable().comment('Contains end date for repeatition of form schedule.');

      table.boolean('schLateSubmissionsEnabled').notNullable().defaultTo(false).comment('Used to indicate if late submission allowed on a form or not, Will be true if enabled');
      table.string('schLateSubmissionsForNextTerm').nullable().comment('This contain a value that can be used with combination to another key i.e. schLateSubmissionsForNextInterval to calculate a period. Thats tells a form to be allowed a late submission for particular period.  40 Days, 3 Weeks, 1 Years etc.');
      table.string('schLateSubmissionsForNextInterval').nullable().comment('This contain a value that can be used with combination to another key i.e. schLateSubmissionsForNextTerm to calculate a period. Thats tells a form to be allowed a late submission for particular period.  40 Days, 3 Weeks, 1 Years etc.');
    
    }));
};

exports.down = function (knex) {
  return Promise.resolve()
    .then(() => knex.schema.alterTable('form', table => {
      table.dropColumn('schedule'); //Let's remove JSONB column that used previously

      table.dropColumn('schEnabled');
      table.dropColumn('schType');
      table.dropColumn('schOpenSubmissionDateTime');
      table.dropColumn('schKeepOpenForTerm');
      table.dropColumn('schKeepOpenForInterval');
      table.dropColumn('schCloseSubmissionDateTime');
      table.dropColumn('schClosingMessageEnabled');
      table.dropColumn('schClosingMessage');

      table.dropColumn('schRepeatEnabled');
      table.dropColumn('schRepeatEveryTerm');
      table.dropColumn('schRepeatEveryIntervalType');
      table.dropColumn('schRepeatUntil');

      table.dropColumn('schLateSubmissionsEnabled');
      table.dropColumn('schLateSubmissionsForNextTerm');
      table.dropColumn('schLateSubmissionsForNextInterval');
    }));
};
