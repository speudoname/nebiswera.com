import type { CourseEmailTemplate, CourseTemplateVariables } from './types'

export function getExpiration7dKA(vars: CourseTemplateVariables): CourseEmailTemplate {
  return {
    subject: `თქვენი წვდომა ${vars.courseTitle}-ზე 7 დღეში იწურება`,
    previewText: `არ გამოტოვოთ! დაასრულეთ კურსი წვდომის დასრულებამდე.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⏰ წვდომა მალე იწურება</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">გამარჯობა ${vars.firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            თქვენი წვდომა კურსზე <strong>${vars.courseTitle}</strong> იწურება <strong>7 დღეში</strong> (${vars.expiresDate}).
          </p>
          <div style="background-color: #FEE2E2; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #EF4444;">
            <p style="color: #991B1B; font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">
              დრო იწურება!
            </p>
            <p style="color: #991B1B; font-size: 14px; margin: 0;">
              თქვენ ${vars.progressPercent}% დასრულებული გაქვთ, ${vars.lessonsCompleted} გაკვეთილი ${vars.totalLessons}-დან.
            </p>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            <strong>ჯერ კიდევ გაქვთ დრო დასასრულებლად!</strong> აი, როგორ გამოიყენოთ დარჩენილი წვდომა მაქსიმალურად:
          </p>
          <ul style="color: #374151; font-size: 16px; line-height: 1.8;">
            <li>გამოყავით ყოველდღე 30-60 წუთი კურსისთვის</li>
            <li>ჩამოტვირთეთ მასალები, რომლებიც გინდათ შეინახოთ</li>
            <li>დაასრულეთ დარჩენილი ტესტები</li>
            <li>დაასრულეთ ძლიერად და მიიღეთ სერტიფიკატი!</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.continueUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              გააგრძელეთ კურსი ახლა
            </a>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            ნუ დაუშვებთ თქვენი შრომის დაკარგვას—დაასრულეთ ის, რაც დაიწყეთ!
          </p>
        </div>
        <div style="background-color: #F9FAFB; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            თქვენ მიიღეთ ეს შეტყობინება, რადგან თქვენი კურსის წვდომა მალე იწურება Nebiswera-ზე.
          </p>
        </div>
      </div>
    `,
    text: `გამარჯობა ${vars.firstName},

თქვენი წვდომა კურსზე ${vars.courseTitle} იწურება 7 დღეში (${vars.expiresDate}).

დრო იწურება!
თქვენ ${vars.progressPercent}% დასრულებული გაქვთ, ${vars.lessonsCompleted} გაკვეთილი ${vars.totalLessons}-დან.

ჯერ კიდევ გაქვთ დრო დასასრულებლად! აი, როგორ გამოიყენოთ დარჩენილი წვდომა მაქსიმალურად:
- გამოყავით ყოველდღე 30-60 წუთი კურსისთვის
- ჩამოტვირთეთ მასალები, რომლებიც გინდათ შეინახოთ
- დაასრულეთ დარჩენილი ტესტები
- დაასრულეთ ძლიერად და მიიღეთ სერტიფიკატი!

გააგრძელეთ კურსი ახლა: ${vars.continueUrl}

ნუ დაუშვებთ თქვენი შრომის დაკარგვას—დაასრულეთ ის, რაც დაიწყეთ!`,
  }
}
