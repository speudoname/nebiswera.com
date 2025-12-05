import type { CourseEmailTemplate, CourseTemplateVariables } from './types'

export function getEnrollmentWelcomeKA(vars: CourseTemplateVariables): CourseEmailTemplate {
  return {
    subject: `კეთილი იყოს თქვენი მობრძანება კურსზე: ${vars.courseTitle}!`,
    previewText: `თქვენი მოგზაურობა იწყება ახლა. დაიწყეთ სწავლა დღესვე!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">კეთილი იყოს თქვენი მობრძანება!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">გამარჯობა ${vars.firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            გილოცავთ! თქვენ დარეგისტრირდით კურსზე <strong>${vars.courseTitle}</strong>.
          </p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            თქვენი სასწავლო მოგზაურობა იწყება ახლა. გადადგით პირველი ნაბიჯი და ჩაეფლით კონტენტში.
          </p>
          <div style="background-color: #F3F4F6; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #6B7280; font-size: 14px; margin: 0 0 5px 0;">კურსი:</p>
            <p style="color: #1F2937; font-size: 18px; font-weight: 600; margin: 0;">${vars.courseTitle}</p>
            <p style="color: #6B7280; font-size: 14px; margin: 15px 0 5px 0;">გაკვეთილების რაოდენობა:</p>
            <p style="color: #1F2937; font-size: 16px; margin: 0;">${vars.totalLessons} გაკვეთილი</p>
            ${vars.expiresDate ? `
            <p style="color: #6B7280; font-size: 14px; margin: 15px 0 5px 0;">წვდომა აქტიურია:</p>
            <p style="color: #1F2937; font-size: 16px; margin: 0;">${vars.expiresDate}-მდე</p>
            ` : ''}
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.courseUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              დაიწყეთ სწავლა
            </a>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            <strong>წარმატების რჩევები:</strong>
          </p>
          <ul style="color: #374151; font-size: 16px; line-height: 1.8;">
            <li>გამოყავით დრო ყოველდღე სწავლისთვის</li>
            <li>გაკვეთილების პროცესში აკეთეთ ჩანაწერები</li>
            <li>შეასრულეთ ტესტები თქვენი ცოდნის შესამოწმებლად</li>
          </ul>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">წარმატებებს გისურვებთ!</p>
        </div>
        <div style="background-color: #F9FAFB; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            თქვენ მიიღეთ ეს შეტყობინება, რადგან დარეგისტრირდით კურსზე Nebiswera-ზე.
          </p>
        </div>
      </div>
    `,
    text: `გამარჯობა ${vars.firstName},

გილოცავთ! თქვენ დარეგისტრირდით კურსზე ${vars.courseTitle}.

თქვენი სასწავლო მოგზაურობა იწყება ახლა. გადადგით პირველი ნაბიჯი და ჩაეფლით კონტენტში.

კურსი: ${vars.courseTitle}
გაკვეთილების რაოდენობა: ${vars.totalLessons} გაკვეთილი
${vars.expiresDate ? `წვდომა აქტიურია: ${vars.expiresDate}-მდე\n` : ''}
დაიწყეთ სწავლა: ${vars.courseUrl}

წარმატების რჩევები:
- გამოყავით დრო ყოველდღე სწავლისთვის
- გაკვეთილების პროცესში აკეთეთ ჩანაწერები
- შეასრულეთ ტესტები თქვენი ცოდნის შესამოწმებლად

წარმატებებს გისურვებთ!`,
  }
}
