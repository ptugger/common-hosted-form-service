const fs = require('fs');
const path = require('path');

const chesService = require('../../components/chesService');
const log = require('../../components/log')(module.filename);
const { EmailProperties, EmailTypes } = require('../common/constants');
const formService = require('../form/service');

/** Helper function used to build the email template based on email type and contents */
const buildEmailTemplate = async (formId, formSubmissionId, emailType, referer, additionalProperties = 0) => {
  const form = await formService.readForm(formId);
  const submission = await formService.readSubmission(formSubmissionId);
  let configData = {};
  let contextToVal = [];
  let userTypePath = '';

  if (emailType === EmailTypes.SUBMISSION_ASSIGNED) {
    contextToVal = [additionalProperties.assignmentNotificationEmail];
    userTypePath = 'user/view';
    configData = {
      bodyTemplate: 'submission-assigned.html',
      title: `Invited to ${form.name} Draft`,
      subject: 'Invited to Submission Draft',
      messageLinkText: `You have been invited to a ${form.name} submission draft. You can review your submission draft details by visiting the following links:`,
      priority: 'normal',
      form,
    };
  } else if (emailType === EmailTypes.STATUS_COMPLETED) {
    contextToVal = [additionalProperties.submissionUserEmail];
    userTypePath = 'user/view';
    configData = {
      bodyTemplate: 'submission-completed.html',
      title: `${form.name} Has Been Completed`,
      subject: 'Form Has Been Completed',
      messageLinkText: `Your submission from ${form.name} has been Completed.`,
      priority: 'normal',
      form,
    };
  } else if (emailType === EmailTypes.SUBMISSION_UNASSIGNED) {
    contextToVal = [additionalProperties.assignmentNotificationEmail];
    userTypePath = 'user/view';
    configData = {
      bodyTemplate: 'submission-unassigned.html',
      title: `Uninvited From ${form.name} Draft`,
      subject: 'Uninvited From Submission Draft',
      messageLinkText: `You have been uninvited from ${form.name} submission draft.`,
      priority: 'normal',
      form,
    };
  } else if (emailType === EmailTypes.STATUS_ASSIGNED) {
    contextToVal = [additionalProperties.assignmentNotificationEmail];
    userTypePath = 'form/view';
    configData = {
      bodyTemplate: 'send-status-assigned-email-body.html',
      title: `${form.name} Submission Assignment`,
      subject: 'Form Submission Assignment',
      messageLinkText: `You have been assigned to a ${form.name} submission. Please login to review it.`,
      priority: 'normal',
      form,
    };
  } else if (emailType === EmailTypes.STATUS_REVISING) {
    contextToVal = [additionalProperties.submissionUserEmail];
    userTypePath = 'user/view';
    configData = {
      bodyTemplate: 'send-status-revising-email-body.html',
      title: `${form.name} Submission Revision Requested`,
      subject: 'Form Submission Revision Request',
      messageLinkText: `You have been asked to revise a ${form.name} submission. Please login to review it.`,
      priority: 'normal',
      form,
    };
  } else if (emailType === EmailTypes.SUBMISSION_RECEIVED) {
    contextToVal = form.submissionReceivedEmails;
    userTypePath = 'form/view';
    configData = {
      body: additionalProperties.body,
      bodyTemplate: 'submission-confirmation.html',
      title: `${form.name} Submission`,
      subject: `${form.name} Submission`,
      messageLinkText: `There is a new ${form.name} submission. Please login to review it.`,
      priority: 'normal',
      form,
    };
  } else if (emailType === EmailTypes.SUBMISSION_CONFIRMATION) {
    contextToVal = [additionalProperties.body.to];
    userTypePath = 'form/success';
    const bodyTemplate = form.identityProviders.length > 0 && form.identityProviders[0].idp === 'public' ? 'submission-received-confirmation-public.html' : 'submission-received-confirmation-login.html';
    configData = {
      bodyTemplate: bodyTemplate,
      title: `${form.name} Accepted`,
      subject: `${form.name} Accepted`,
      priority: 'normal',
      messageLinkText: `Thank you for your ${form.name} submission. You can view your submission details by visiting the following links:`,
      form,
    };
  }

  return {
    configData,
    contexts: [{
      context: {
        allFormSubmissionUrl: `${service._appUrl(referer)}/user/submissions?f=${configData.form.id}`,
        confirmationNumber: submission.confirmationId,
        form: configData.form,
        messageLinkText: configData.messageLinkText,
        messageLinkUrl: `${service._appUrl(referer)}/${userTypePath}?s=${submission.id}`,
        emailContent: additionalProperties.emailContent,
        title: configData.title
      },
      to: contextToVal
    }]
  };
};

/** Helper function used to build the email template based on email type and contents for reminder */
const buildEmailTemplateFormForReminder = async (form, emailType, user, report, referer) => {
  let configData = {};
  if (emailType === EmailTypes.REMINDER_FORM_OPEN) {
    configData = {
      bodyTemplate: 'reminder-form-open.html',
      title: `Submission Start for ${form.name} `,
      subject: 'Submission open',
      messageLinkText: `Hi,
      You are receiving this message because you are currently identified as a submitter for the form ${ form.name }.
      A new submission period for this form is now starting and you will have until the ${ report.dates.closeDate } to submit your information.
      Please do not hesitate to reach out to the MoH HelpDesk HLTH.Helpdesk@gov.bc.ca
      if you shouldn’t be identified as a submitter or if you run into any issues while submitting your data.
      Thank you.
      `,
      priority: 'normal',
      form,
    };
  } else if (emailType === EmailTypes.REMINDER_FORM_NOT_FILL) {
    configData = {
      bodyTemplate: 'reminder-form-not-fill.html',
      title: `Submission Reminder for ${form.name}`,
      subject: 'Submission Reminder',
      messageLinkText: `Hi,
      You are receiving this message because you are currently identified as a submitter for the form ${form.name}.
      This message is to remind you to submit the data before the end of the submission period on ${ report.dates.closeDate }.
      Please do not hesitate to reach out to the MoH HelpDesk HLTH.Helpdesk@gov.bc.ca if you shouldn’t be identified as a submitter or if you run into any issues while submitting your data.

      Thank you.
      `,
      priority: 'normal',
      form,
    };
  } else if (emailType === EmailTypes.REMINDER_FORM_WILL_CLOSE) {
    configData = {
      bodyTemplate: 'reminder-form-will-close.html',
      title: `Submission Closing for ${form.name}`,
      subject: 'Submission Closing',
      messageLinkText: `Hi,
      You are receiving this message because you are currently identified as a submitter for the form ${form.name} and that you have until ${ report.dates.closeDate } midnight to submit your data.
      Please do not hesitate to reach out to the MoH HelpDesk HLTH.Helpdesk@gov.bc.ca if you shouldn’t be identified as a submitter or if you run into any issues while submitting your data.
      Thank you.
      `,
      priority: 'normal',
      form,
    };

  }

  let  messageLinkUrl = `${service._appUrl(referer)}/form/submit?f=${configData.form.id}`;
  // this line will be remove in prod
  // eslint-disable-next-line no-console
  console.log('CUSTOM LINK : ',messageLinkUrl);

  return {
    configData,
    contexts: [{
      context: {
        allFormSubmissionUrl: '',
        form: configData.form,
        report: report,
        messageLinkText: configData.messageLinkText,
        messageLinkUrl,
        title: configData.title
      },
      to: [user.email]
    }]
  };
};

const service = {
  /**
   * @function _appUrl
   * Attempts to parse out the base application url
   * @param {string} referer
   * @returns base url for the application
   */
  _appUrl: (referer) => {
    try {
      const url = new URL(referer);
      const p = url.pathname.split('/')[1];
      const u = url.href.substring(0, url.href.indexOf(`/${p}`));
      return `${u}/${p}`;
    } catch (err) {
      log.error(err.message, {
        function: '_appUrl',
        referer: referer
      });
      throw err;
    }
  },

  /**
   * @function _mergeEmailTemplate
   * Merges the template and body HTML files to allow dynamic content in the emails
   * @param {*} bodyTemplate
   * @returns joined template files
   */
  _mergeEmailTemplate: (bodyTemplate) => {
    const template = fs.readFileSync(
      `${path.join(
        __dirname,
        'assets'
      )}/triggered-notification-email-template.html`,
      'utf8'
    );
    const body = fs.readFileSync(
      `${path.join(__dirname, 'assets', 'bodies')}/${bodyTemplate}`,
      'utf8'
    );
    const bodyInsertIndex = template.search('<!-- BODY END -->');
    const result = [
      template.substring(0, bodyInsertIndex),
      body,
      template.substring(bodyInsertIndex, template.length),
    ].join('');
    return result;
  },

  /**
   * @function _sendEmailTemplate
   * Sends email using chesService.merge
   * @param {string} configData
   * @param {string} contexts
   * @returns The result of the email merge operation
   */
  _sendEmailTemplate: (configData, contexts) => {
    try {
      const mergedHtml = service._mergeEmailTemplate(configData.bodyTemplate);
      const data = {
        body: mergedHtml,
        bodyType: 'html',
        contexts: contexts,
        from: EmailProperties.FROM_EMAIL,
        subject: configData.subject,
        title: configData.title,
        priority: configData.priority,
        messageLinkText: configData.messageLinkText,
      };
      return chesService.merge(data);
    } catch (err) {
      log.error(err.message, { function: '_sendEmailTemplate' });
      throw err;
    }
  },

  /**
   * @function submissionAssigned
   * Assigning user to Submission Draft
   * @param {string} formId
   * @param {string} currentStatus
   * @param {string} assignmentNotificationEmail
   * @param {string} referer
   * @returns The result of the email merge operation
   */
  submissionAssigned: async (formId, currentStatus, assignmentNotificationEmail, referer) => {
    try {
      const { configData, contexts } = await buildEmailTemplate(formId, currentStatus.formSubmissionId, EmailTypes.SUBMISSION_ASSIGNED, referer, { assignmentNotificationEmail });

      return service._sendEmailTemplate(configData, contexts);
    } catch (e) {
      log.error(e.message, {
        function: EmailTypes.SUBMISSION_ASSIGNED,
        status: currentStatus,
        referer: referer
      });
      throw e;
    }
  },

  /**
   * @function submissionUnassigned
   * Unassigning user from Submission Draft
   * @param {string} formId
   * @param {string} currentStatus
   * @param {string} assignmentNotificationEmail
   * @param {string} referer
   * @returns The result of the email merge operation
   */
  submissionUnassigned: async (formId, currentStatus, assignmentNotificationEmail, referer) => {
    try {
      const { configData, contexts } = await buildEmailTemplate(formId, currentStatus.formSubmissionId, EmailTypes.SUBMISSION_UNASSIGNED, referer, { assignmentNotificationEmail });

      return service._sendEmailTemplate(configData, contexts);
    } catch (e) {
      log.error(e.message, {
        function: EmailTypes.SUBMISSION_UNASSIGNED,
        status: currentStatus,
        referer: referer
      });
      throw e;
    }
  },

  /**
   * @function statusAssigned
   * Setting Assigned status to user on Submission
   * @param {string} formId
   * @param {string} currentStatus
   * @param {string} assignmentNotificationEmail
   * @param {string} emailContent
   * @param {string} referer
   * @returns The result of the email merge operation
   */
  statusAssigned: async (formId, currentStatus, assignmentNotificationEmail, emailContent, referer) => {
    try {
      const { configData, contexts } = await buildEmailTemplate(formId, currentStatus.submissionId, EmailTypes.STATUS_ASSIGNED, referer, { assignmentNotificationEmail, emailContent });

      return service._sendEmailTemplate(configData, contexts);
    } catch (e) {
      log.error(e.message, {
        function: EmailTypes.STATUS_ASSIGNED,
        status: currentStatus,
        referer: referer
      });
      throw e;
    }
  },

  /**
   * @function statusCompleted
   * Setting Completed status to user on Submission
   * @param {string} formId
   * @param {string} currentStatus
   * @param {string} submissionUserEmail The email address to send to
   * @param {string} emailContent
   * @param {string} referer
   * @returns {object} The result of the email merged from operation
   */
  statusCompleted: async (formId, currentStatus, submissionUserEmail, emailContent, referer) => {
    try {
      const { configData, contexts } = await buildEmailTemplate(formId, currentStatus.submissionId, EmailTypes.STATUS_COMPLETED, referer, { submissionUserEmail, emailContent });
      return service._sendEmailTemplate(configData, contexts);
    } catch (e) {
      log.error(e.message, {
        function: EmailTypes.STATUS_COMPLETED,
        status: currentStatus,
        referer: referer
      });
      throw e;
    }
  },

  /**
   * @function statusRevising
   * Revising status to submission form owner
   * @param {string} formId The form id
   * @param {string} currentStatus The current status
   * @param {string} submissionUserEmail The email address to send to
   * @param {string} emailContent The optional content to send as a comment
   * @param {string} referer The currently logged in user
   * @returns The result of the email merge operation
   */
  statusRevising: async (formId, currentStatus, submissionUserEmail, emailContent, referer) => {
    try {
      const { configData, contexts } = await buildEmailTemplate(formId, currentStatus.submissionId, EmailTypes.STATUS_REVISING, referer, { submissionUserEmail, emailContent });

      return service._sendEmailTemplate(configData, contexts);
    } catch (e) {
      log.error(e.message, e, {
        function: EmailTypes.STATUS_REVISING,
        status: currentStatus,
        referer: referer
      });
      throw e;
    }
  },

  /**
   * @function submissionReceived
   * Completing submission of a form
   * @param {string} formId
   * @param {string} submissionId
   * @param {string} body
   * @param {string} referer
   * @returns The result of the email merge operation
   */
  submissionReceived: async (formId, submissionId, body, referer) => {
    try {
      const { configData, contexts } = await buildEmailTemplate(formId, submissionId, EmailTypes.SUBMISSION_RECEIVED, referer, { body });
      if (contexts[0].to.length) {
        return service._sendEmailTemplate(configData, contexts);
      } else {
        return {};
      }
    } catch (e) {
      log.error(e.message, {
        function: EmailTypes.SUBMISSION_RECEIVED,
        formId: formId,
        submissionId: submissionId,
        body: body,
        referer: referer
      });
      throw e;
    }
  },

  /**
   * @function submissionConfirmation
   * Manual email confirmation after form has been submitted
   * @param {string} formId
   * @param {string} submissionId
   * @param {string} body
   * @param {string} referer
   * @returns The result of the email merge operation
   */
  submissionConfirmation: async (formId, submissionId, body, referer) => {
    try {
      const { configData, contexts } = await buildEmailTemplate(formId, submissionId, EmailTypes.SUBMISSION_CONFIRMATION, referer, { body: body });

      return service._sendEmailTemplate(configData, contexts);
    } catch (e) {
      log.error(e.message, {
        function: EmailTypes.SUBMISSION_CONFIRMATION,
        formId: formId,
        submissionId: submissionId,
        body: body,
        referer: referer
      });
      throw e;
    }
  },
  /**
   * @function formOpen
   * Manual email confirmation after form has been submitted
   * @param {object} information about the submitter and the form
   * @returns The result of the email merge operation
   */
  initReminder: async (obj) => {
    try {
      const { configData, contexts } = await buildEmailTemplateFormForReminder(obj.form, obj.state, obj.submiter, obj.report, obj.referer);
      return service._sendEmailTemplate(configData, contexts);
    } catch (e) {
      log.error(e.message, {
        function: obj.state,
        formId: obj.form.id,
      });
      throw e;
    }
  },

};

module.exports = service;
