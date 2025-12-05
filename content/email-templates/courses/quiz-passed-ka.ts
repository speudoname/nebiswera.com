import type { CourseEmailTemplate, CourseTemplateVariables } from './types'

export function getQuizPassedKA(vars: CourseTemplateVariables): CourseEmailTemplate {
  return {
    subject: `შესანიშნავია! თქვენ ჩააბარეთ ტესტი ${vars.courseTitle}-ში`,
    previewText: `თქვენ დააგროვეთ ${vars.quizScore}%! გააგრძელეთ შესანიშნავი მუშაობა.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✓ ტესტი ჩაბარებულია!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">გამარჯობა ${vars.firstName},</p>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            შესანიშნავი მუშაობა! თქვენ წარმატებით ჩააბარეთ ტესტი <strong>${vars.quizTitle}</strong> კურსში <strong>${vars.courseTitle}</strong>.
          </p>
          <div style="background-color: #ECFDF5; border-radius: 12px; padding: 25px; margin: 20px 0; text-align: center; border: 2px solid #A7F3D0;">
            <p style="color: #065F46; font-size: 14px; margin: 0 0 5px 0;">თქვენი ქულა</p>
            <p style="color: #059669; font-size: 48px; font-weight: bold; margin: 0;">${vars.quizScore}%</p>
            <p style="color: #065F46; font-size: 14px; margin: 10px 0 0 0;">ჩასაბარებელი ქულა: ${vars.passingScore}%</p>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            ეს აჩვენებს, რომ თქვენ ნამდვილად გაიგეთ მასალა. თქვენი შრომა იძლევა შედეგს!
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${vars.continueUrl}"
               style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              გააგრძელეთ შემდეგ გაკვეთილზე
            </a>
          </div>
          <p style="color: #374151; font-size: 16px; line-height: 1.6;">
            შეინარჩუნეთ იმპულსი!
          </p>
        </div>
        <div style="background-color: #F9FAFB; padding: 20px 30px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            თქვენ მიიღეთ ეს შეტყობინება, რადგან დარეგისტრირდით კურსზე Nebiswera-ზე.
          </p>
        </div>
      </div>
    `,
    text: `გამარჯობა ${vars.firstName},

შესანიშნავი მუშაობა! თქვენ წარმატებით ჩააბარეთ ტესტი ${vars.quizTitle} კურსში ${vars.courseTitle}.

თქვენი ქულა: ${vars.quizScore}%
ჩასაბარებელი ქულა: ${vars.passingScore}%

ეს აჩვენებს, რომ თქვენ ნამდვილად გაიგეთ მასალა. თქვენი შრომა იძლევა შედეგს!

გააგრძელეთ შემდეგ გაკვეთილზე: ${vars.continueUrl}

შეინარჩუნეთ იმპულსი!`,
  }
}
